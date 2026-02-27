-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "config" JSONB,
ADD COLUMN     "projectStats" JSONB,
ADD COLUMN     "sitemapGraphUrl" TEXT,
ADD COLUMN     "sitemapTreeUrl" TEXT,
ADD COLUMN     "sitemapUrl" TEXT;

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT,
    "httpStatus" INTEGER,
    "lastRunId" TEXT,
    "artifactUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_violation_counts" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "critical" INTEGER NOT NULL DEFAULT 0,
    "serious" INTEGER NOT NULL DEFAULT 0,
    "moderate" INTEGER NOT NULL DEFAULT 0,
    "minor" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_violation_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filterText" TEXT,
    "regex" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_set_pages" (
    "id" TEXT NOT NULL,
    "pageSetId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,

    CONSTRAINT "page_set_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_set_rules" (
    "id" TEXT NOT NULL,
    "pageSetId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "matcher" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "page_set_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pages_projectId_idx" ON "pages"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "page_violation_counts_pageId_key" ON "page_violation_counts"("pageId");

-- CreateIndex
CREATE INDEX "page_sets_projectId_idx" ON "page_sets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "page_set_pages_pageSetId_pageId_key" ON "page_set_pages"("pageSetId", "pageId");

-- CreateIndex
CREATE INDEX "page_set_rules_pageSetId_idx" ON "page_set_rules"("pageSetId");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_violation_counts" ADD CONSTRAINT "page_violation_counts_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sets" ADD CONSTRAINT "page_sets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_set_pages" ADD CONSTRAINT "page_set_pages_pageSetId_fkey" FOREIGN KEY ("pageSetId") REFERENCES "page_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_set_pages" ADD CONSTRAINT "page_set_pages_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_set_rules" ADD CONSTRAINT "page_set_rules_pageSetId_fkey" FOREIGN KEY ("pageSetId") REFERENCES "page_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
