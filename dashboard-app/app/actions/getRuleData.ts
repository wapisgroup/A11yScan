"use server";

import path from 'path';
import { AccessibilityRulesService } from '@wapisgroup/accessibility-rules';

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

    console.log("Initializing AccessibilityRulesService");
    const rulesService = new AccessibilityRulesService();
    
    console.log("Fetching rule for ID:", ruleId);
    const rule = await rulesService.getRule(ruleId);
    console.log("rule",rule)
    return rule as RuleData;
  } catch (error) {
    console.error('Error fetching rule:', error);
    return null;
  }
}
