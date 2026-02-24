/**
 * @file shared.js
 * Shared utilities for ablelytics-core SC check modules.
 */

/**
 * Maps ablelytics-core WCAG SC rule IDs to the corresponding axe-core rule IDs
 * used by @wapisgroup/accessibility-rules for fix-description lookups.
 */
const WCAG_TO_AXE_RULE_ID = {
  // Direct matches
  'wcag-1.4.2': 'audio-caption',
  'wcag-2.1.1': 'scrollable-region-focusable',
  'wcag-2.2.2': 'blink',
  'wcag-2.4.1': 'bypass',
  'wcag-2.4.3': 'tabindex',
  'wcag-4.1.2': 'aria-required-attr',
  // Closest available match (no exact axe-core equivalent in the rules package)
  'wcag-2.1.2': 'scrollable-region-focusable',  // No Keyboard Trap → keyboard accessibility
  'wcag-2.4.7': 'focus-order-semantics',         // Focus Visible → focus semantics
  'wcag-2.4.11': 'focus-order-semantics',        // Focus Not Obscured (Min) → focus semantics
  'wcag-2.4.12': 'focus-order-semantics',        // Focus Not Obscured (Enhanced) → focus semantics
  'wcag-2.5.1': 'nested-interactive',            // Pointer Gestures → interactive element handling
  'wcag-2.5.2': 'nested-interactive',            // Pointer Cancellation → interactive element handling
  'wcag-2.5.4': 'scrollable-region-focusable',   // Motion Actuation → alternative input methods
  'wcag-2.5.7': 'scrollable-region-focusable',   // Dragging Movements → non-drag alternatives
  'wcag-3.2.3': 'landmark-unique',               // Consistent Navigation → navigation structure
  'wcag-3.2.4': 'label',                         // Consistent Identification → consistent labelling
  'wcag-3.2.6': 'landmark-one-main',             // Consistent Help → page structure consistency
};

const DEFAULT_OPTIONS = {
  maxFocusableChecks: 20,
  maxTabSteps: 30,
  maxCodeLength: 500,
  impact: 'moderate',
  includeMultiPageChecks: false,
  includeExperimentalChecks: false,
  maxIssuesPerRule: 25,
  maxComponentChecks: 8,
  includeAccessibilityTreeChecks: true,
  minConfidenceForAutoRaise: 0.7,
  enableVisualFocusChecks: true,
  visualDiffMinRatio: 0.012,
  suppressions: []
};

function buildIssue({
  impact,
  message,
  selector,
  ruleId,
  description,
  helpUrl,
  tags,
  failureSummary,
  html,
  target,
  engine,
  confidence,
  needsReview,
  evidence,
  decision
}) {
  return {
    impact: impact || 'moderate',
    message,
    selector: selector || null,
    ruleId: WCAG_TO_AXE_RULE_ID[ruleId] || ruleId || null,
    helpUrl: helpUrl || null,
    description: description || null,
    tags: tags || [],
    failureSummary: failureSummary || null,
    html: html || null,
    target: target || (selector ? [selector] : []),
    engine: engine || 'ablelytics-core',
    confidence: typeof confidence === 'number' ? confidence : null,
    needsReview: typeof needsReview === 'boolean' ? needsReview : null,
    evidence: Array.isArray(evidence) ? evidence : [],
    decision: decision || null
  };
}

async function pause(ms = 120) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { DEFAULT_OPTIONS, buildIssue, pause };
