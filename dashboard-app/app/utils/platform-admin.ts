export function isPlatformAdminUser(user: Record<string, any> | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.isPlatformAdmin === true ||
    user.platformAdmin === true ||
    user.role === "platform_admin" ||
    (Array.isArray(user.roles) && user.roles.includes("platform_admin"))
  );
}

