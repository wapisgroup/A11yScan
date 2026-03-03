import { describe, expect, it } from "vitest";

type RouteModule = Partial<
  Record<"GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "OPTIONS" | "HEAD", unknown>
>;

describe("API route module smoke tests", () => {
  const routeModules = import.meta.glob("./**/route.ts");
  const entries = Object.entries(routeModules).filter(
    ([path]) => !path.includes("/auth/[...nextauth]/route.ts")
  );

  it("loads all route modules", async () => {
    expect(entries.length).toBeGreaterThan(0);

    for (const [path, loadModule] of entries) {
      const mod = (await loadModule()) as RouteModule;
      const hasHttpHandler = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"].some(
        (method) => typeof mod[method as keyof RouteModule] === "function"
      );
      expect(
        hasHttpHandler,
        `Route module ${path} should export at least one HTTP method handler`
      ).toBe(true);
    }
  });
});
