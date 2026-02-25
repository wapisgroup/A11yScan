import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { checkSubscriptionLimit, incrementSubscriptionUsage } from '@/utils/subscription-guard';
import type { ScheduleCreateInput, ScheduleDoc } from '@/types/schedule';

/**
 * POST /api/schedules
 * Creates a new schedule after checking the scheduledScans subscription limit.
 *
 * Body: ScheduleCreateInput (minus id, createdAt)
 * Returns: ScheduleDoc
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json() as Omit<ScheduleCreateInput, 'createdBy'>;

      if (!body.projectId) {
        return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
      }
      if (!body.type) {
        return NextResponse.json({ error: 'type is required' }, { status: 400 });
      }
      if (!body.cadence) {
        return NextResponse.json({ error: 'cadence is required' }, { status: 400 });
      }

      // Check subscription limit before creating
      const limitError = await checkSubscriptionLimit(user.uid, 'scheduledScans');
      if (limitError) return limitError;

      const payload = {
        organizationId: body.organizationId ?? null,
        projectId: body.projectId,
        projectName: body.projectName ?? '',
        projectDomain: body.projectDomain ?? null,
        type: body.type,
        cadence: body.cadence,
        includePageCollection: Boolean(body.includePageCollection),
        includeReport: Boolean(body.includeReport),
        pageSetId: body.pageSetId ?? null,
        pageSetName: body.pageSetName ?? null,
        startDate: body.startDate ?? null,
        status: body.status ?? 'active',
        createdBy: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      };

      const ref = await adminDB.collection('schedules').add(payload);

      // Increment usage counter server-side
      await incrementSubscriptionUsage(user.uid, 'scheduledScans', 1);

      return NextResponse.json({
        id: ref.id,
        ...payload,
        createdAt: null, // serverTimestamp not serializable; client refreshes via subscription
      } as Partial<ScheduleDoc>);
    } catch (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json(
        {
          error: 'Failed to create schedule',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}
