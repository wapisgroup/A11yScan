-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectDomain" TEXT,
    "type" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "includePageCollection" BOOLEAN NOT NULL DEFAULT false,
    "includeReport" BOOLEAN NOT NULL DEFAULT false,
    "pageSetId" TEXT,
    "pageSetName" TEXT,
    "startDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "runId" TEXT,
    "organizationId" TEXT,
    "createdBy" TEXT,
    "action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_organizationId_idx" ON "schedules"("organizationId");

-- CreateIndex
CREATE INDEX "schedules_createdBy_idx" ON "schedules"("createdBy");

-- CreateIndex
CREATE INDEX "jobs_createdBy_idx" ON "jobs"("createdBy");

-- CreateIndex
CREATE INDEX "jobs_projectId_idx" ON "jobs"("projectId");
