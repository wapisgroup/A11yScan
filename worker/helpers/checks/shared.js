/**
 * @file shared.js
 * Shared utilities for ablelytics-core SC check modules.
 */

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
    ruleId: ruleId || null,
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
