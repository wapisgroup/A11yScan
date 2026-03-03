import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const bcryptCompareMock = vi.fn();
const bcryptHashMock = vi.fn();

const prismaMock = {
  user: {
    update: vi.fn(),
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

vi.mock("bcryptjs", () => ({
  default: {
    compare: bcryptCompareMock,
    hash: bcryptHashMock,
  },
}));

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authMock.mockResolvedValue({
      user: { id: "user_1", email: "user@example.com" },
    });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  it("getMyProfile returns normalized profile payload", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      firstName: null,
      lastName: null,
      phone: null,
      apiToken: null,
      password: "hash",
    });
    prismaMock.$queryRaw.mockResolvedValue([{ settings: { language: "fr" } }]);

    const { getMyProfile } = await import("./account");
    const result = await getMyProfile();

    expect(result).toEqual({
      id: "user_1",
      email: "user@example.com",
      firstName: "",
      lastName: "",
      phone: "",
      language: "fr",
      apiToken: null,
      hasPassword: true,
    });
  });

  it("getMyProfile throws when user is not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const { getMyProfile } = await import("./account");
    await expect(getMyProfile()).rejects.toThrow("Not authenticated.");
  });

  it("getMyProfile throws when user row is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const { getMyProfile } = await import("./account");
    await expect(getMyProfile()).rejects.toThrow("User not found.");
  });

  it("updateMyProfile trims values and stores language in user settings", async () => {
    const { updateMyProfile } = await import("./account");

    await updateMyProfile({
      firstName: "  John  ",
      lastName: "  Doe  ",
      phone: "   ",
      language: "  en  ",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        firstName: "John",
        lastName: "Doe",
        phone: null,
      },
    });
    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });

  it("changeMyPassword rejects when account has no password login", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: null });
    const { changeMyPassword } = await import("./account");

    await expect(
      changeMyPassword({ currentPassword: "x", newPassword: "12345678" })
    ).rejects.toThrow("Password login is not enabled for this account.");
  });

  it("changeMyPassword rejects with invalid current password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: "existing_hash" });
    bcryptCompareMock.mockResolvedValue(false);
    const { changeMyPassword } = await import("./account");

    await expect(
      changeMyPassword({ currentPassword: "bad", newPassword: "12345678" })
    ).rejects.toThrow("Current password is incorrect.");
  });

  it("changeMyPassword enforces minimum password length", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: "existing_hash" });
    bcryptCompareMock.mockResolvedValue(true);
    const { changeMyPassword } = await import("./account");

    await expect(
      changeMyPassword({ currentPassword: "ok", newPassword: "short" })
    ).rejects.toThrow("New password must be at least 8 characters.");
  });

  it("changeMyPassword hashes and updates password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: "existing_hash" });
    bcryptCompareMock.mockResolvedValue(true);
    bcryptHashMock.mockResolvedValue("new_hash");
    const { changeMyPassword } = await import("./account");

    await changeMyPassword({
      currentPassword: "correct",
      newPassword: "new-password-123",
    });

    expect(bcryptHashMock).toHaveBeenCalledWith("new-password-123", 12);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { password: "new_hash" },
    });
  });

  it("generateMyApiToken returns and stores a token", async () => {
    const { generateMyApiToken } = await import("./account");
    const result = await generateMyApiToken();

    expect(result.token).toBeTruthy();
    expect(result.token.length).toBeGreaterThan(20);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { apiToken: result.token },
    });
  });
});
