export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ status: 'ok', version: 'v1', timestamp: new Date().toISOString() });
}
