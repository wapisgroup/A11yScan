/**
 * POST /api/test/register
 *
 * Test-only endpoint for creating users during integration tests.
 * ONLY available when NODE_ENV !== "production".
 *
 * Body: { email, password, org, firstName }
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { email, password, org, firstName } = body as {
    email?: string;
    password?: string;
    org?: string;
    firstName?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ message: "email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "User already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: { name: org ?? `${email} Org`, ownerId: "placeholder" },
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: firstName ?? "Test",
      organizationId: organization.id,
    },
  });

  await prisma.organization.update({
    where: { id: organization.id },
    data: { ownerId: user.id },
  });

  // Create trial subscription
  await prisma.$executeRaw`
    INSERT INTO "subscriptions" (
      "id", "userId", "organizationId", "packageId", "status",
      "currentUsage", "trialEnd", "createdAt", "updatedAt"
    ) VALUES (
      ${crypto.randomUUID().replace(/-/g, "")},
      ${user.id},
      ${organization.id},
      'basic',
      'trial',
      '{"scansThisMonth":0,"apiCallsToday":0}'::jsonb,
      ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)},
      NOW(), NOW()
    )
  `;

  return NextResponse.json({ userId: user.id, orgId: organization.id });
}
