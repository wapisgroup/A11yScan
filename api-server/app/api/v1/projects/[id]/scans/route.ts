/**
 * POST /v1/projects/:id/scans
 * Start a scan. Body: { type: "full" | "pages" | "page-set", pageIds?, pageSetId? }
 * Returns 202 + runId.
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withApi } from '@/lib/with-api';
import type { ApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

type ScanBody = {
  type: 'full' | 'pages' | 'page-set';
  pageIds?: string[];
  pageSetId?: string;
};

async function startScan(req: NextRequest, user: ApiUser, params: Record<string, string>): Promise<Response> {
  const { id } = params;

  const filter = user.organisationId
    ? { organizationId: user.organisationId }
    : { ownerId: user.uid };

  const project = await prisma.project.findFirst({ where: { id, ...filter }, select: { id: true } });
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });

  const body = await req.json() as ScanBody;

  let runType: string;
  let pageIds: string[] = [];

  if (body.type === 'full') {
    runType = 'full_scan';
    // Worker resolves pages from the project at job start.
  } else if (body.type === 'pages') {
    if (!body.pageIds?.length) {
      return Response.json({ error: '`pageIds` required for type "pages".' }, { status: 400 });
    }
    runType = 'scan_pages';
    pageIds = body.pageIds;
  } else if (body.type === 'page-set') {
    if (!body.pageSetId) {
      return Response.json({ error: '`pageSetId` required for type "page-set".' }, { status: 400 });
    }
    runType = 'scan_pages';

    const pageSet = await prisma.pageSet.findFirst({
      where:   { id: body.pageSetId, projectId: id },
      include: { pageSetPages: { select: { pageId: true } } },
    });
    if (!pageSet) return Response.json({ error: 'Page set not found.' }, { status: 404 });

    if (pageSet.pageSetPages.length > 0) {
      pageIds = pageSet.pageSetPages.map((p) => p.pageId);
    } else if (pageSet.regex) {
      const allPages = await prisma.page.findMany({ where: { projectId: id }, select: { id: true, url: true } });
      const re = new RegExp(pageSet.regex);
      pageIds = allPages.filter((p) => re.test(p.url)).map((p) => p.id);
    }
  } else {
    return Response.json({ error: 'Invalid `type`. Use "full", "pages", or "page-set".' }, { status: 400 });
  }

  const run = await prisma.run.create({
    data: {
      projectId:           id,
      type:                runType,
      status:              'queued',
      resolvePagesAtStart: runType === 'full_scan',
    },
  });

  // Link explicit pages to the run.
  if (pageIds.length) {
    await prisma.runPage.createMany({
      data:           pageIds.map((pageId) => ({ runId: run.id, pageId })),
      skipDuplicates: true,
    });
  }

  await prisma.job.create({
    data: {
      projectId:      id,
      runId:          run.id,
      organizationId: user.organisationId ?? undefined,
      createdBy:      user.uid,
      action:         runType === 'full_scan' ? 'full_scan' : 'scan',
      status:         'queued',
    },
  });

  return Response.json({ runId: run.id, status: 'queued', pagesCount: pageIds.length || null }, { status: 202 });
}

export const POST = withApi(startScan);
