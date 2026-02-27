import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Start Page Collection
 * Creates a run and job for the worker to crawl and collect pages from a project
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { projectId } = body;

      if (!projectId) {
        return NextResponse.json(
          { message: 'projectId is required' },
          { status: 400 }
        );
      }

      // Ensure the project document exists
      const projectRef = adminDB.collection('projects').doc(projectId);
      const projectSnap = await projectRef.get();

      if (!projectSnap.exists) {
        // Create minimal project document
        await projectRef.set({
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
        }, { merge: true });
      }

      const organisationId = (projectSnap.exists ? projectSnap.data()?.organisationId as string | undefined : undefined) ?? null;

      // Create run document in projects/{projectId}/runs subcollection
      const runRef = projectRef.collection('runs').doc();
      const runId = runRef.id;
      await runRef.set({
        type: 'page_collection',
        status: 'queued',
        startedAt: FieldValue.serverTimestamp(),
        creatorId: user.uid,
        pagesTotal: 0,
        pagesScanned: 0,
        queuedVia: 'api',
        runId,
        projectId,
        organisationId,
        stats: {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0
        }
      });

      // Create job document for worker to process
      await adminDB.collection('jobs').add({
        action: 'page_collection',
        projectId,
        runId,
        createdAt: FieldValue.serverTimestamp(),
        status: 'queued',
        createdBy: user.uid
      });

      return NextResponse.json({
        ok: true,
        runId,
        via: 'api',
      });
    } catch (error) {
      console.error('Error starting page collection:', error);
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
