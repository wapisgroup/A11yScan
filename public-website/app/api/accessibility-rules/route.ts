import { NextResponse } from 'next/server';
import path from 'path';
// @ts-ignore - JavaScript file
import { AccessibilityRulesService } from '../../../../accessibility-rules/rules-service.js';

// Initialize the service with the rules directory path
const rulesPath = path.join(process.cwd(), '..', 'accessibility-rules', 'rules');
const rulesService = new AccessibilityRulesService(rulesPath);

export async function GET() {
  try {
    const rules = await rulesService.getAllRuleSummaries();
    
    // Sort by severity and title
    const severityOrder = { Critical: 0, Serious: 1, Moderate: 2, Minor: 3 };
    const sortedRules = rules.sort((a: any, b: any) => {
      const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - 
                          severityOrder[b.severity as keyof typeof severityOrder];
      if (severityDiff !== 0) return severityDiff;
      return a.title.localeCompare(b.title);
    });
    
    return NextResponse.json(sortedRules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility rules' },
      { status: 500 }
    );
  }
}
