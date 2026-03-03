import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("worker-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WORKER_SHARED_TOKEN;
  });

  it("authenticates by bearer token in users.apiToken", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      organizationId: "org_1",
      email: "worker@example.com",
    });
    const { authenticateWorker } = await import("./worker-auth");

    const req = new Request("http://localhost/api/v2/jobs", {
      headers: { authorization: "Bearer token_1" },
    });
    const identity = await authenticateWorker(req as any);

    expect(identity).toEqual({
      id: "u1",
      organizationId: "org_1",
      email: "worker@example.com",
      isSystem: false,
    });
  });

  it("authenticates by shared token as system worker", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    process.env.WORKER_SHARED_TOKEN = "shared_123";
    const { authenticateWorker } = await import("./worker-auth");

    const req = new Request("http://localhost/api/v2/jobs", {
      headers: { authorization: "Bearer shared_123" },
    });
    const identity = await authenticateWorker(req as any);

    expect(identity).toEqual({
      id: "__system_worker__",
      organizationId: null,
      email: null,
      isSystem: true,
    });
  });

  it("returns null when token is missing", async () => {
    const { authenticateWorker } = await import("./worker-auth");
    const req = new Request("http://localhost/api/v2/jobs");
    const identity = await authenticateWorker(req as any);
    expect(identity).toBeNull();
  });

  it("returns null when token is invalid", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    process.env.WORKER_SHARED_TOKEN = "shared_123";
    const { authenticateWorker } = await import("./worker-auth");

    const req = new Request("http://localhost/api/v2/jobs", {
      headers: { authorization: "Bearer wrong" },
    });
    const identity = await authenticateWorker(req as any);
    expect(identity).toBeNull();
  });
});
