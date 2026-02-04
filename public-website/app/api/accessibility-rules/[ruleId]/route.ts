import { NextResponse } from 'next/server';
import path from 'path';
// @ts-ignore - JavaScript file
import { AccessibilityRulesService } from '../../../../../accessibility-rules/rules-service.js';

const rulesPath = path.join(process.cwd(), '..', 'accessibility-rules', 'rules');
const rulesService = new AccessibilityRulesService(rulesPath);

export async function GET(
  request: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const rule = await rulesService.getRule(params.ruleId);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule' },
      { status: 500 }
    );
  }
}
