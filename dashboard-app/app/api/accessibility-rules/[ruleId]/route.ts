import { NextResponse } from 'next/server';
import path from 'path';
import { AccessibilityRulesService } from '@wapisgroup/accessibility-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await context.params;

  try {
    const rulesDirectory = path.join(
      process.cwd(),
      'node_modules/@wapisgroup/accessibility-rules/rules'
    );
    const rulesService = new AccessibilityRulesService(rulesDirectory);
    const rule = await rulesService.getRule(ruleId);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching rule:', message);

    if (message.toLowerCase().includes('rule not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
