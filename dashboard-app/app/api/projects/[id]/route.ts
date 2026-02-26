import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { getStorage } from 'firebase-admin/storage';
import { getApp } from 'firebase-admin/app';

/**
 * DELETE /api/projects/[id]
 * Deletes a project and all associated Storage files.
 *
 * Storage paths cleaned up:
 *   - scans/{projectId}/**  (scan artifacts, snapshots)
 *
 * Firestore cleaned up:
 *   - projects/{projectId}  (the project document itself)
 *
 * Sub-collections (pages, runs, scans) are NOT deleted here because
 * Firestore does not support recursive deletes from a client or simple
 * Admin SDK call without a loop. They will be orphaned but invisible.
 * Use a Cloud Function / background task for full cleanup if needed.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, _user) => {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Delete Storage files under scans/{projectId}/
    try {
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        'accessibilitychecker-c6585.firebasestorage.app';

      const bucket = getStorage(getApp()).bucket(storageBucket);
      const [files] = await bucket.getFiles({ prefix: `scans/${projectId}/` });

      if (files.length > 0) {
        await Promise.all(files.map((f) => f.delete().catch(() => { /* ignore individual failures */ })));
      }
    } catch (storageErr) {
      // Log but don't fail — storage may be empty or unreachable in dev
      console.warn('[deleteProject] Storage cleanup error:', storageErr);
    }

    // Delete the Firestore project document
    await adminDB.collection('projects').doc(projectId).delete();

    return NextResponse.json({ ok: true });
  });
}
