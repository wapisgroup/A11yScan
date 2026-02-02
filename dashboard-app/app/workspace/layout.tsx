// Disable static generation for all workspace routes
// These pages require authentication and dynamic data
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function WorkspaceLayoutConfig({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
