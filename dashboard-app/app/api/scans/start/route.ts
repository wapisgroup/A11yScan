import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

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

      // Ensure project exists
      const projectRef = adminDB.collection('projects').doc(projectId);
      const projectSnap = await projectRef.get();

      if (!projectSnap.exists) {
        await projectRef.set({
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
        }, { merge: true });
      }

      if (includePageCollection) {
        // ---------------------------------------------------------------
        // Pipeline: page_collection (queued) → full_scan (blocked)
        // ---------------------------------------------------------------

        // 1. Page collection run + job
        const pcRunRef = await projectRef.collection('runs').add({
          type: 'page_collection',
          status: 'queued',
          startedAt: FieldValue.serverTimestamp(),
          creatorId: user.uid,
          pagesTotal: 0,
          pagesScanned: 0,
          queuedVia: 'firestore',
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

        // Use the page_collection run ID as the shared pipelineId
        const pipelineId = pcRunRef.id;

        // Tag the page_collection run with pipelineId
        await pcRunRef.update({ pipelineId });

        // 2. Full scan run (blocked until page_collection completes)
        const scanRunRef = await projectRef.collection('runs').add({
          type,
          status: 'blocked',
          startedAt: FieldValue.serverTimestamp(),
          creatorId: user.uid,
          pagesIds: [],
          pagesTotal: 0,
          pagesScanned: 0,
          queuedVia: 'firestore',
          resolvePagesAtStart: true,
          pipelineId,
          dependsOnRunId: pcRunRef.id,
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
        });

        return NextResponse.json({
          ok: true,
          pipelineId,
          pageCollectionRunId: pcRunRef.id,
          pageCollectionJobId: pcJobRef.id,
          scanRunId: scanRunRef.id,
          scanJobId: scanJobRef.id,
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

      const runRef = await projectRef.collection('runs').add({
        type,
        status: 'queued',
        startedAt: FieldValue.serverTimestamp(),
        creatorId: user.uid,
        pagesIds: pageIds,
        pagesTotal: pageIds.length,
        pagesScanned: 0,
        queuedVia: 'firestore',
        resolvePagesAtStart: false,
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
        pagesIds: pageIds,
      });

      return NextResponse.json({
        ok: true,
        runId: runRef.id,
        jobId: jobRef.id,
        pagesCount: pageIds.length,
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
