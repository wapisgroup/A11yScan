import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';
import { withAuth } from '@/utils/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { checkSubscriptionLimit, incrementSubscriptionUsage } from '@/utils/subscription-guard';

/**
 * Validates a URL string (server-side mirror of client validateUrl).
 */
function validateUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const urlToTest =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a project name from a URL hostname.
 * Example: "https://sta.ablelytics.com/" → "Sta Ablelytics Com"
 */
function generateNameFromUrl(url: string): string {
  if (!url) return '';
  try {
    const urlToTest =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    const hostname = new URL(urlToTest).hostname.replace(/^www\./, '');
    return hostname
      .split('.')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}

/**
 * POST /api/projects
 * Creates a new project after checking the activeProjects subscription limit.
 *
 * Body: { name?: string; domain: string; config?: object }
 * Returns: { id: string; name: string | null; domain: string; owner: string }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { name, domain, config } = body as {
        name?: string;
        domain?: string;
        config?: Record<string, unknown>;
      };

      // Validate domain
      if (!domain) {
        return NextResponse.json({ error: 'domain is required' }, { status: 400 });
      }
      if (!validateUrl(domain)) {
        return NextResponse.json(
          { error: 'Invalid URL address. Please provide a valid URL.' },
          { status: 400 }
        );
      }

      // Check subscription limit before doing any work
      const limitError = await checkSubscriptionLimit(user.uid, 'activeProjects');
      if (limitError) return limitError;

      // Check URL uniqueness for this user
      const existingSnap = await adminDB
        .collection('projects')
        .where('owner', '==', user.uid)
        .get();

      const normalizedDomain = domain.toLowerCase().trim();
      const duplicate = existingSnap.docs.some(
        (d) => String(d.data().domain ?? '').toLowerCase().trim() === normalizedDomain
      );
      if (duplicate) {
        return NextResponse.json(
          { error: 'You already have a project with this URL.' },
          { status: 409 }
        );
      }

      // Get organisationId from user doc
      let organisationId: string | null = null;
      try {
        const userSnap = await adminDB.collection('users').doc(user.uid).get();
        if (userSnap.exists) {
          organisationId = (userSnap.data()?.organisationId as string | undefined) ?? null;
        }
      } catch {
        // Non-critical — proceed without organisationId
      }

      const projectName = name?.trim() || generateNameFromUrl(domain);

      const payload: Record<string, unknown> = {
        name: projectName || null,
        domain,
        owner: user.uid,
        organisationId: organisationId ?? null,
        createdAt: FieldValue.serverTimestamp(),
        ...(config ? { config } : {}),
      };

      const ref = await adminDB.collection('projects').add(payload);

      // Increment usage counter server-side (atomic, safe for concurrent requests)
      await incrementSubscriptionUsage(user.uid, 'activeProjects', 1);

      return NextResponse.json({
        id: ref.id,
        name: projectName || null,
        domain,
        owner: user.uid,
        organisationId: organisationId ?? null,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        {
          error: 'Failed to create project',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}
