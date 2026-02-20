import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';

/**
 * POST /api/scans/start
 * Starts a scan by creating a job in Firestore for the worker to pick up
 * Replaces: functions/handlers/fullScan.js
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
          createdAt: new Date(),
          createdBy: user.uid,
        }, { merge: true });
      }

      // Resolve page IDs
      let pageIds: string[] = [];
      if (Array.isArray(pagesIds) && pagesIds.length > 0) {
        pageIds = pagesIds;
      } else if (!includePageCollection) {
        const pagesSnapshot = await projectRef.collection('pages').get();
        pageIds = pagesSnapshot.docs.map(doc => doc.id);
      }

      // No pages and not collecting - return error
      if (!includePageCollection && pageIds.length === 0) {
        return NextResponse.json({
          ok: false,
          noPages: true,
          message: 'No pages found. Collect pages first.',
        }, { status: 400 });
      }

      // Create the run document
      const runRef = await projectRef.collection('runs').add({
        type,
        status: includePageCollection ? 'blocked' : 'queued',
        startedAt: new Date(),
        creatorId: user.uid,
        pagesIds: pageIds,
        pagesTotal: pageIds.length,
        pagesScanned: 0,
        queuedVia: 'firestore',
        resolvePagesAtStart: !pageIds.length,
        stats: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      });

      // Create the job for the worker
      const jobRef = await adminDB.collection('jobs').add({
        action: 'full_scan',
        projectId,
        runId: runRef.id,
        createdAt: new Date(),
        startedAt: null,
        doneAt: null,
        status: 'queued',
        createdBy: user.uid,
        pagesIds: pageIds.length > 0 ? pageIds : null,
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
