import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";

// Disable static generation for all workspace routes —
// these pages require authentication and dynamic data.
// Route protection is handled by middleware.ts (no session → redirect to /auth/login).
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function WorkspaceLayoutConfig({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRoute requireSubscription>
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </PrivateRoute>
  );
}
