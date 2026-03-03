import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateWorkerMock = vi.fn();
const unauthorizedMock = vi.fn(() => Response.json({ error: "Unauthorized" }, { status: 401 }));
const notFoundMock = vi.fn((message: string) => Response.json({ error: message }, { status: 404 }));
const incrementSubscriptionUsageMock = vi.fn();

const prismaMock = {
  run: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  runPage: {
    createMany: vi.fn(),
  },
  page: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/worker-auth", () => ({
  authenticateWorker: authenticateWorkerMock,
  unauthorized: unauthorizedMock,
  notFound: notFoundMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/utils/subscription-guard", () => ({
  incrementSubscriptionUsage: incrementSubscriptionUsageMock,
}));

describe("/api/v2/runs/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.run.update.mockResolvedValue({ id: "run_1" });
    prismaMock.page.findMany.mockResolvedValue([]);
    prismaMock.runPage.createMany.mockResolvedValue({ count: 0 });
  });

  it("GET returns 401 when worker auth fails", async () => {
    authenticateWorkerMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const req = new Request("http://localhost:3000/api/v2/runs/run_1");
    const res = await GET(req as any, { params: Promise.resolve({ id: "run_1" }) });

    expect(res.status).toBe(401);
    expect(unauthorizedMock).toHaveBeenCalled();
  });

  it("GET resolves pages at start when configured and runPages are empty", async () => {
    authenticateWorkerMock.mockResolvedValue({ id: "worker_1", organizationId: "org_1" });
    prismaMock.run.findUnique.mockResolvedValue({
      id: "run_1",
      projectId: "project_1",
      resolvePagesAtStart: true,
      runPages: [],
      status: "queued",
    });
    prismaMock.page.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);

    const { GET } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/runs/run_1");
    const res = await GET(req as any, { params: Promise.resolve({ id: "run_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prismaMock.runPage.createMany).toHaveBeenCalledWith({
      data: [
        { runId: "run_1", pageId: "p1" },
        { runId: "run_1", pageId: "p2" },
      ],
      skipDuplicates: true,
    });
    expect(prismaMock.run.update).toHaveBeenCalledWith({
      where: { id: "run_1" },
      data: { pagesTotal: 2 },
    });
    expect(body.pageIds).toEqual(["p1", "p2"]);
  });

  it("PATCH returns 404 when run does not exist", async () => {
    authenticateWorkerMock.mockResolvedValue({ id: "worker_1", organizationId: "org_1" });
    prismaMock.run.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/runs/run_missing", {
      method: "PATCH",
      body: JSON.stringify({ status: "running" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "run_missing" }) });

    expect(res.status).toBe(404);
    expect(notFoundMock).toHaveBeenCalledWith("Run not found");
  });

  it("PATCH updates run with typed fields", async () => {
    authenticateWorkerMock.mockResolvedValue({ id: "worker_1", organizationId: "org_1" });
    prismaMock.run.findUnique.mockResolvedValue({
      id: "run_1",
      project: { ownerId: "owner_1", organizationId: "org_1" },
    });
    prismaMock.run.update.mockResolvedValue({ id: "run_1", status: "running" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/runs/run_1", {
      method: "PATCH",
      body: JSON.stringify({
        status: "running",
        pagesScanned: 3,
        pagesTotal: 10,
        hidden: false,
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "run_1" }) });

    expect(res.status).toBe(200);
    expect(prismaMock.run.update).toHaveBeenCalledWith({
      where: { id: "run_1" },
      data: {
        status: "running",
        pagesTotal: 10,
        pagesScanned: 3,
        hidden: false,
      },
    });
    expect(incrementSubscriptionUsageMock).not.toHaveBeenCalled();
  });

  it("PATCH increments scans usage when run transitions to done", async () => {
    authenticateWorkerMock.mockResolvedValue({ id: "worker_1", organizationId: "org_1" });
    prismaMock.run.findUnique.mockResolvedValue({
      id: "run_1",
      project: { ownerId: "owner_1", organizationId: "org_1" },
    });
    prismaMock.run.update.mockResolvedValue({ id: "run_1", status: "done" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/runs/run_1", {
      method: "PATCH",
      body: JSON.stringify({
        status: "running",
        pagesScanned: 12,
        usageIncrementScans: 1,
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "run_1" }) });

    expect(res.status).toBe(200);
    expect(incrementSubscriptionUsageMock).toHaveBeenCalledWith(
      "owner_1",
      "scansThisMonth",
      1,
      "org_1"
    );
  });

  it("PATCH supports usage-only increments without run field updates", async () => {
    authenticateWorkerMock.mockResolvedValue({ id: "worker_1", organizationId: "org_1" });
    prismaMock.run.findUnique
      .mockResolvedValueOnce({
        id: "run_1",
        project: { ownerId: "owner_1", organizationId: "org_1" },
      })
      .mockResolvedValueOnce({ id: "run_1", status: "running" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost:3000/api/v2/runs/run_1", {
      method: "PATCH",
      body: JSON.stringify({
        usageIncrementScans: 1,
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "run_1" }) });

    expect(res.status).toBe(200);
    expect(prismaMock.run.update).not.toHaveBeenCalled();
    expect(incrementSubscriptionUsageMock).toHaveBeenCalledWith(
      "owner_1",
      "scansThisMonth",
      1,
      "org_1"
    );
  });
});
