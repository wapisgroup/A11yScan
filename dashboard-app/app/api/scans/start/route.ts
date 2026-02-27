import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import {
  checkSubscriptionLimit,
  getPagesPerScanLimit,
  incrementSubscriptionUsage,
} from '@/utils/subscription-guard';

/**
 * POST /api/scans/start
 * Starts a scan by creating a job in Firestore for the worker to pick up.
 *
 * When includePageCollection=true the flow is:
 *   1. Create a page_collection run + job (status: queued)
 *   2. Create a full_scan run (status: blocked) + job (status: blocked, dependsOnJobId = page_collection job ID)
 *   Both runs share the same pipelineId so they're grouped in the UI.
 *
 * When includePageCollection=false (or not set):
 *   Create a single full_scan run + job using the existing page list.
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { projectId, type = 'full_scan', includePageCollection, pagesIds } = body;

      if (!projectId) {
        return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
      }

      // Resolve organisationId for org-level limit checks
      let organisationId: string | null = null;
      try {
        const userSnap = await adminDB.collection('users').doc(user.uid).get();
        if (userSnap.exists) {
          organisationId = (userSnap.data()?.organisationId as string | undefined) ?? null;
        }
      } catch { /* non-critical */ }

      // Check scans-per-month subscription limit against the org's plan
      const limitError = await checkSubscriptionLimit(user.uid, 'scansThisMonth', organisationId);
      if (limitError) return limitError;

      // Ensure project exists
      const projectRef = adminDB.collection('projects').doc(projectId);
      const projectSnap = await projectRef.get();

      if (!projectSnap.exists) {
        await projectRef.set({
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
        }, { merge: true });
      }

      // Fetch pagesPerScan cap from the org's plan
      const pagesPerScanCap = await getPagesPerScanLimit(user.uid, organisationId);

      if (includePageCollection) {
        // ---------------------------------------------------------------
        // Pipeline: page_collection (queued) → full_scan (blocked)
        // ---------------------------------------------------------------

        // 1. Page collection run + job
        // Pre-generate ID so we can set pipelineId + runId in the initial write
        const pcRunRef = projectRef.collection('runs').doc();
        const pipelineId = pcRunRef.id;
        await pcRunRef.set({
          type: 'page_collection',
          status: 'queued',
          startedAt: FieldValue.serverTimestamp(),
          creatorId: user.uid,
          pagesTotal: 0,
          pagesScanned: 0,
          queuedVia: 'firestore',
          pipelineId,
          runId: pcRunRef.id,
          projectId,
          organisationId: organisationId ?? null,
          stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        });

        const pcJobRef = await adminDB.collection('jobs').add({
          action: 'page_collection',
          projectId,
          runId: pcRunRef.id,
          createdAt: FieldValue.serverTimestamp(),
          startedAt: null,
          doneAt: null,
          status: 'queued',
          createdBy: user.uid,
        });

        // 2. Full scan run (blocked until page_collection completes)
        // Pass pagesPerScanCap so the worker applies it when resolving pages
        const scanRunRef = projectRef.collection('runs').doc();
        await scanRunRef.set({
          type,
          status: 'blocked',
          startedAt: FieldValue.serverTimestamp(),
          creatorId: user.uid,
          pagesIds: [],
          pagesTotal: 0,
          pagesScanned: 0,
          queuedVia: 'firestore',
          resolvePagesAtStart: true,
          ...(pagesPerScanCap !== null ? { pagesPerScanCap } : {}),
          pipelineId,
          dependsOnRunId: pcRunRef.id,
          runId: scanRunRef.id,
          projectId,
          organisationId: organisationId ?? null,
          stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        });

        const scanJobRef = await adminDB.collection('jobs').add({
          action: type,
          projectId,
          runId: scanRunRef.id,
          createdAt: FieldValue.serverTimestamp(),
          startedAt: null,
          doneAt: null,
          status: 'blocked',
          createdBy: user.uid,
          pipelineId,
          dependsOnJobId: pcJobRef.id,
          pagesIds: null,
          ...(pagesPerScanCap !== null ? { pagesPerScanCap } : {}),
        });

        // Increment scans usage
        await incrementSubscriptionUsage(user.uid, 'scansThisMonth', 1, organisationId);

        return NextResponse.json({
          ok: true,
          pipelineId,
          pageCollectionRunId: pcRunRef.id,
          pageCollectionJobId: pcJobRef.id,
          scanRunId: scanRunRef.id,
          scanJobId: scanJobRef.id,
          ...(pagesPerScanCap !== null ? { pagesPerScanCap } : {}),
        });
      }

      // ---------------------------------------------------------------
      // Simple scan (no page collection needed)
      // ---------------------------------------------------------------

      let pageIds: string[] = [];
      if (Array.isArray(pagesIds) && pagesIds.length > 0) {
        pageIds = pagesIds;
      } else {
        const pagesSnapshot = await projectRef.collection('pages').get();
        pageIds = pagesSnapshot.docs.map((d) => d.id);
      }

      if (pageIds.length === 0) {
        return NextResponse.json({
          ok: false,
          noPages: true,
          message: 'No pages found. Collect pages first.',
        }, { status: 400 });
      }

      // Apply pagesPerScan cap — silently truncate to plan limit
      const cappedPageIds =
        pagesPerScanCap !== null ? pageIds.slice(0, pagesPerScanCap) : pageIds;
      const wasCapped = cappedPageIds.length < pageIds.length;

      const runRef = projectRef.collection('runs').doc();
      await runRef.set({
        type,
        status: 'queued',
        startedAt: FieldValue.serverTimestamp(),
        creatorId: user.uid,
        pagesIds: cappedPageIds,
        pagesTotal: cappedPageIds.length,
        pagesScanned: 0,
        queuedVia: 'firestore',
        resolvePagesAtStart: false,
        ...(pagesPerScanCap !== null ? { pagesPerScanCap } : {}),
        runId: runRef.id,
        projectId,
        organisationId: organisationId ?? null,
        stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      });

      const jobRef = await adminDB.collection('jobs').add({
        action: type,
        projectId,
        runId: runRef.id,
        createdAt: FieldValue.serverTimestamp(),
        startedAt: null,
        doneAt: null,
        status: 'queued',
        createdBy: user.uid,
        pagesIds: cappedPageIds,
        ...(pagesPerScanCap !== null ? { pagesPerScanCap } : {}),
      });

      // Increment scans usage
      await incrementSubscriptionUsage(user.uid, 'scansThisMonth', 1, organisationId);

      return NextResponse.json({
        ok: true,
        runId: runRef.id,
        jobId: jobRef.id,
        pagesCount: cappedPageIds.length,
        ...(wasCapped ? { wasCapped: true, totalPages: pageIds.length, pagesPerScanCap } : {}),
      });

    } catch (error) {
      console.error('Error starting scan:', error);
      return NextResponse.json(
        { error: 'Failed to start scan', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}
