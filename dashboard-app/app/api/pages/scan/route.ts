import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Scan Specific Pages
 * Creates a run and job for scanning specific pages
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { projectId, pagesIds } = body;

      if (!projectId) {
        return NextResponse.json(
          { message: 'projectId is required' },
          { status: 400 }
        );
      }

      if (!pagesIds || !Array.isArray(pagesIds) || pagesIds.length === 0) {
        return NextResponse.json(
          { message: 'pagesIds array is required' },
          { status: 400 }
        );
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

      // Create run document
      const runRef = await projectRef.collection('runs').add({
        type: 'scan_pages',
        status: 'queued',
        startedAt: FieldValue.serverTimestamp(),
        creatorId: user.uid,
        finishedAt: null,
        pagesIds: pagesIds,
        pagesTotal: pagesIds.length,
        pagesScanned: 0,
        stats: {
          critical: 0,
          minor: 0,
          moderate: 0,
          serious: 0,
        },
      });

      const runId = runRef.id;

      // Create job for worker
      await adminDB.collection('jobs').add({
        action: 'scan_pages',
        projectId,
        runId,
        createdAt: FieldValue.serverTimestamp(),
        status: 'queued',
        createdBy: user.uid
      });

      // Update run status
      await runRef.update({ 
        status: 'queued', 
        queuedVia: 'api' 
      });

      return NextResponse.json({
        ok: true,
        runId,
        via: 'api',
      });
    } catch (error) {
      console.error('Error scanning pages:', error);
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
