/**
 * TypeScript definitions for @accessibility-checker/rules
 */

export interface Resource {
  title: string;
  url: string;
}

export interface RelatedRule {
  ruleId: string;
  description: string;
}

export interface AccessibilityRule {
  ruleId: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  wcag: string;
  description: string;
  whyItMatters: string;
  howToFix: string;
  ruleDescription: string;
  commonMistakes?: string;
  testing?: string;
  resources: Resource[];
  relatedRules: RelatedRule[];
}

export interface RuleSummary {
  ruleId: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  wcag: string;
  description: string;
}

export class AccessibilityRulesService {
  constructor(rulesDirectory?: string);
  
  /**
   * Get a single rule by ID
   * @param ruleId - The rule identifier (e.g., 'link-name')
   * @returns Parsed rule object
   */
  getRule(ruleId: string): Promise<AccessibilityRule>;
  
  /**
   * Get all available rules
   * @returns Array of all rule objects
   */
  getAllRules(): Promise<AccessibilityRule[]>;
  
  /**
   * Get rules by severity
   * @param severity - 'critical', 'serious', 'moderate', 'minor'
   * @returns Filtered rules
   */
  getRulesBySeverity(severity: string): Promise<AccessibilityRule[]>;
  
  /**
   * Get rules by WCAG level
   * @param level - 'A', 'AA', 'AAA'
   * @returns Filtered rules
   */
  getRulesByWCAGLevel(level: string): Promise<AccessibilityRule[]>;
  
  /**
   * Search rules by keyword
   * @param keyword - Search term
   * @returns Matching rules
   */
  searchRules(keyword: string): Promise<AccessibilityRule[]>;
  
  /**
   * Get rule summary (lightweight version without full content)
   * @param ruleId - The rule identifier
   * @returns Rule summary object
   */
  getRuleSummary(ruleId: string): Promise<RuleSummary>;
  
  /**
   * Clear the cache
   */
  clearCache(): void;
}

declare const rulesService: AccessibilityRulesService;
export default rulesService;
