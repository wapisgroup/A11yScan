-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "startedAt" TIMESTAMP(3),
    "pagesTotal" INTEGER,
    "pagesScanned" INTEGER,
    "pipelineId" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_pages" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,

    CONSTRAINT "run_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pageId" TEXT,
    "runId" TEXT,
    "type" TEXT,
    "artifactPath" TEXT,
    "summary" JSONB,
    "issues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "runs_projectId_idx" ON "runs"("projectId");

-- CreateIndex
CREATE INDEX "runs_projectId_type_idx" ON "runs"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "run_pages_runId_pageId_key" ON "run_pages"("runId", "pageId");

-- CreateIndex
CREATE INDEX "scans_projectId_idx" ON "scans"("projectId");

-- CreateIndex
CREATE INDEX "scans_pageId_idx" ON "scans"("pageId");

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_pages" ADD CONSTRAINT "run_pages_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_pages" ADD CONSTRAINT "run_pages_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
