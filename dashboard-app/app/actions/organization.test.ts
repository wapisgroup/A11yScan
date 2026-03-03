import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

const prismaMock = {
  organization: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

function extractSqlText(sqlArg: unknown): string {
  if (!sqlArg || typeof sqlArg !== "object") return String(sqlArg);
  const maybeStrings = (sqlArg as { strings?: string[] }).strings;
  if (Array.isArray(maybeStrings)) return maybeStrings.join("");
  return String(sqlArg);
}

describe("organization actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    authMock.mockResolvedValue({
      user: {
        id: "user_1",
        email: "user@example.com",
        organizationId: "org_1",
        firstName: "John",
      },
    });

    prismaMock.organization.findUnique.mockResolvedValue({
      id: "org_1",
      name: "Org",
      ownerId: "user_1",
    });
    prismaMock.organization.update.mockResolvedValue({ id: "org_1" });
    prismaMock.user.findMany.mockResolvedValue([
      { id: "user_2", firstName: "Alice", lastName: "Zed", email: "alice@example.com" },
    ]);
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org_1" });
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.$executeRaw.mockResolvedValue(1);
  });

  it("getOrganizationWorkspaceData returns normalized payload", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ settings: { language: "es" } }]);
    const { getOrganizationWorkspaceData } = await import("./organization");

    const result = await getOrganizationWorkspaceData("org_1");

    expect(result.organizationId).toBe("org_1");
    expect(result.name).toBe("Org");
    expect(result.settings.language).toBe("es");
    expect(result.members).toHaveLength(2);
    expect(result.members[0]?.id).toBe("user_1");
    expect(result.members[0]?.accountType).toBe("Account owner");
  });

  it("getOrganizationWorkspaceData resolves orgId from db user when missing in session", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user_1",
        email: "user@example.com",
        organizationId: null,
        firstName: "John",
      },
    });
    const { getOrganizationWorkspaceData } = await import("./organization");

    await getOrganizationWorkspaceData();

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user_1" },
      select: { organizationId: true },
    });
  });

  it("getOrganizationWorkspaceData throws when no organization is found", async () => {
    prismaMock.organization.findUnique.mockResolvedValue(null);
    const { getOrganizationWorkspaceData } = await import("./organization");

    await expect(getOrganizationWorkspaceData("org_1")).rejects.toThrow(
      "Organization not found."
    );
  });

  it("getOrganizationWorkspaceData throws when session has no user", async () => {
    authMock.mockResolvedValue(null);
    const { getOrganizationWorkspaceData } = await import("./organization");

    await expect(getOrganizationWorkspaceData("org_1")).rejects.toThrow(
      "Not authenticated."
    );
  });

  it("getOrganizationWorkspaceData throws when org id cannot be resolved", async () => {
    authMock.mockResolvedValue({
      user: { id: "user_1", email: "user@example.com", organizationId: null },
    });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: null });
    const { getOrganizationWorkspaceData } = await import("./organization");

    await expect(getOrganizationWorkspaceData()).rejects.toThrow(
      "No organization found for this account."
    );
  });

  it("create-table bootstrap query is executed once per module process", async () => {
    const { getOrganizationWorkspaceData, updateOrganizationGeneral } = await import("./organization");

    await getOrganizationWorkspaceData("org_1");
    await updateOrganizationGeneral({
      organizationId: "org_1",
      name: "Org",
      language: "en",
      industry: "",
      vatNumber: "",
      ipRestrictions: [],
    });

    const createCalls = prismaMock.$executeRaw.mock.calls.filter((args) =>
      extractSqlText(args[0]).includes("CREATE TABLE IF NOT EXISTS \"organization_settings\"")
    );
    expect(createCalls).toHaveLength(1);
  });

  it("updateOrganizationGeneral trims blank org name to default", async () => {
    const { updateOrganizationGeneral } = await import("./organization");

    await updateOrganizationGeneral({
      organizationId: "org_1",
      name: "   ",
      language: "en",
      industry: "Tech",
      vatNumber: "123",
      ipRestrictions: ["10.0.0.0/8"],
    });

    expect(prismaMock.organization.update).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: { name: "Organization" },
    });
    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });

  it("updateOrganizationBranding writes branding settings", async () => {
    const { updateOrganizationBranding } = await import("./organization");

    await updateOrganizationBranding({
      organizationId: "org_1",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      customLogo: "https://example.com/logo.png",
    });

    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });

  it("updateOrganizationIntegrations writes integrations settings", async () => {
    const { updateOrganizationIntegrations } = await import("./organization");

    await updateOrganizationIntegrations({
      organizationId: "org_1",
      slack: {
        enabled: true,
        webhookUrl: "https://hooks.slack.com/services/test",
        channel: "#alerts",
      },
    });

    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });
});
