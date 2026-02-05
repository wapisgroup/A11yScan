"use server";

import path from 'path';
// @ts-ignore - CommonJS module




export type RuleData = {
  ruleId: string;
  title?: string;
  description?: string;
  severity?: string;
  wcag?: string;
  howToFix?: string;
  fullMarkdown?: string;
};

export async function getRuleData(ruleId: string): Promise<RuleData | null> {
  try {
    const rulesService = new AccessibilityRulesService(
      path.join(process.cwd(), '../accessibility-rules/rules')
    );
    
    const rule = await rulesService.getRule(ruleId);
    return rule as RuleData;
  } catch (error) {
    console.error('Error fetching rule:', error);
    return null;
  }
}
