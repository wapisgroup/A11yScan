/**
 * Auth middleware for API routes
 * Verifies Firebase ID tokens from Authorization header
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * Verify Firebase ID token from Authorization header
 * Returns user if valid, or error response if invalid
 */
export async function verifyAuth(request: NextRequest): Promise<
  { user: { uid: string; email?: string; [key: string]: any }; error: null } |
  { user: null; error: NextResponse }
> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const adminAuth = getAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...decodedToken,
      },
      error: null,
    };
  } catch (authError) {
    console.error('Token verification failed:', authError);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Convenience wrapper for API routes
 * Usage:
 * 
 * export async function POST(request: NextRequest) {
 *   return withAuth(request, async (req, user) => {
 *     // Your logic here with authenticated user
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: { uid: string; email?: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  
  if (error) {
    return error;
  }
  
  return handler(request, user!);
}
