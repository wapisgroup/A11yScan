import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateWorkerMock = vi.fn();
const unauthorizedMock = vi.fn(() => Response.json({ error: "Unauthorized" }, { status: 401 }));

const prismaMock = {
  job: {
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/worker-auth", () => ({
  authenticateWorker: authenticateWorkerMock,
  unauthorized: unauthorizedMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("/api/v2/jobs GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  it("returns 401 when worker auth fails", async () => {
    authenticateWorkerMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const req = new Request("http://localhost:3000/api/v2/jobs?status=queued&limit=5");
    const res = await GET(req as any);

    expect(res.status).toBe(401);
    expect(unauthorizedMock).toHaveBeenCalled();
  });

  it("filters out jobs referencing missing runs for run-dependent actions", async () => {
    authenticateWorkerMock.mockResolvedValue({
      id: "worker_1",
      organizationId: "org_1",
      isSystem: false,
    });
    prismaMock.job.findMany.mockResolvedValue([
      { id: "j1", action: "page_collection", runId: "r1", projectId: "p1" },
      { id: "j2", action: "scan_pages", runId: "r2", projectId: "p1" },
      { id: "j3", action: "cleanup", runId: null, projectId: "p1" },
    ]);
    prismaMock.$queryRaw.mockResolvedValue([{ id: "r1" }]);

    const { GET } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/jobs?status=queued&limit=10");
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body.map((j: any) => j.id)).toEqual(["j1", "j3"]);
  });
});
