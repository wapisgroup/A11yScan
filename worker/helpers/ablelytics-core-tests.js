/**
 * @file ablelytics-core-tests.js — Orchestrator
 * Thin wrapper that imports SC-named check modules and runs them in sequence.
 */
const { BUILD_SELECTOR_SOURCE } = require('./selector-builder');
const { DEFAULT_OPTIONS, buildIssue } = require('./checks/shared');
const { checkKeyboardAccessible } = require('./checks/sc-2.1.1');
const { checkNoKeyboardTrap } = require('./checks/sc-2.1.2');
const { checkPauseStopHide } = require('./checks/sc-2.2.2');
const { checkAudioControl } = require('./checks/sc-1.4.2');
const { checkBypassBlocks } = require('./checks/sc-2.4.1');
const { checkFocusOrder } = require('./checks/sc-2.4.3');
const { checkFocusVisible } = require('./checks/sc-2.4.7');
const { checkFocusObscuredCombined } = require('./checks/sc-2.4.11');
const { checkPointerGestures, checkPointerCancellation, checkMotionActuation, checkConcurrentInputMechanisms } = require('./checks/sc-2.5.x');
const { checkConsistentNavigation, checkConsistentIdentification, checkConsistentHelp } = require('./checks/sc-3.2.x');
const { checkAccessibilityTreeNameRoleValue, checkFrameworkAdapterScenarios } = require('./checks/sc-4.1.2');
const { checkInteractiveComponentScenarios } = require('./checks/sc-interactive');

class AblelyticsCoreTests {
  constructor(page, options = {}) {
    this.page = page;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.frameworks = [];
    this.frameworkSuppressions = [];
    this.lastRunStats = null;
  }

  async runAll(pageSnapshots = []) {
    const issues = [];
    const startedAt = Date.now();
    const checkTimings = [];

    // Inject shared buildSelector utility once for all evaluate calls
    try {
      await this.page.evaluate(BUILD_SELECTOR_SOURCE);
    } catch (e) {
      // Non-fatal: individual checks have inline fallback buildSelector
    }

    this.frameworks = await this.detectFrameworks();
    this.frameworkSuppressions = this.getFrameworkSuppressions(this.frameworks);

    // --- Group A: Pure DOM queries (batched into single evaluate) ---
    const groupAStart = Date.now();
    let groupAError = null;
    try {
      const groupAResults = await this.checkGroupABatched();
      if (groupAResults.pauseStopHide && groupAResults.pauseStopHide.length) issues.push(...groupAResults.pauseStopHide);
      if (groupAResults.audioControl && groupAResults.audioControl.length) issues.push(...groupAResults.audioControl);
    } catch (err) {
      groupAError = err && err.message ? err.message : String(err);
      console.warn('[ablelytics-core] groupA batched failed:', groupAError);
    }
    checkTimings.push({
      check: 'groupA_batched(pauseStopHide+audioControl)',
      durationMs: Date.now() - groupAStart,
      issues: issues.length,
      error: groupAError
    });

    // --- Sequential checks ---
    const checks = [
      ['checkAccessibilityTreeNameRoleValue', () => checkAccessibilityTreeNameRoleValue(this.page, this.options)],
      ['checkKeyboardAccessible', () => checkKeyboardAccessible(this.page, this.options)],
      ['checkNoKeyboardTrap', () => checkNoKeyboardTrap(this.page, this.options)],
      ['checkInteractiveComponentScenarios', () => checkInteractiveComponentScenarios(this.page, this.options)],
      ['checkFrameworkAdapterScenarios', () => checkFrameworkAdapterScenarios(this.page, this.options, { frameworks: this.frameworks })],
      ['checkBypassBlocks', () => checkBypassBlocks(this.page, this.options)],
      ['checkFocusOrder', () => checkFocusOrder(this.page, this.options)],
      ['checkFocusVisible', () => checkFocusVisible(this.page, this.options)],
      ['checkFocusObscuredCombined', () => checkFocusObscuredCombined(this.page, this.options)],
    ];

    if (this.options.includeExperimentalChecks) {
      checks.push(['checkPointerGestures', () => checkPointerGestures(this.page, this.options)]);
      checks.push(['checkPointerCancellation', () => checkPointerCancellation(this.page, this.options)]);
      checks.push(['checkMotionActuation', () => checkMotionActuation(this.page, this.options)]);
      checks.push(['checkConcurrentInputMechanisms', () => checkConcurrentInputMechanisms(this.page, this.options)]);
    }

    for (const [name, run] of checks) {
      const checkStartedAt = Date.now();
      let checkIssues = 0;
      let checkError = null;
      try {
        const result = await run();
        if (Array.isArray(result) && result.length) {
          checkIssues = result.length;
          issues.push(...result);
        }
      } catch (err) {
        checkError = err && err.message ? err.message : String(err);
        console.warn(`[ablelytics-core] ${name} failed:`, checkError);
      } finally {
        checkTimings.push({
          check: name,
          durationMs: Date.now() - checkStartedAt,
          issues: checkIssues,
          error: checkError
        });
      }
    }

    if (this.options.includeMultiPageChecks) {
      issues.push(...checkConsistentNavigation(pageSnapshots));
      issues.push(...checkConsistentIdentification(pageSnapshots));
      issues.push(...checkConsistentHelp(pageSnapshots));
    }

    // Dedup
    const seen = new Set();
    const deduped = [];
    for (const issue of issues) {
      const key = [
        issue.ruleId || '',
        issue.message || '',
        issue.selector || '',
        (issue.html || '').slice(0, 120)
      ].join('|||');
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(issue);
    }

    // Cap per rule + normalize + suppress
    const maxPerRule = Math.max(1, Number(this.options.maxIssuesPerRule) || DEFAULT_OPTIONS.maxIssuesPerRule);
    const perRuleCount = new Map();
    const capped = [];
    for (const issue of deduped) {
      const normalized = this.normalizeIssue(issue);
      if (this.shouldSuppress(normalized)) continue;
      const rule = issue.ruleId || 'unknown';
      const count = perRuleCount.get(rule) || 0;
      if (count >= maxPerRule) continue;
      perRuleCount.set(rule, count + 1);
      capped.push(normalized);
    }

    this.lastRunStats = {
      totalDurationMs: Date.now() - startedAt,
      rawIssueCount: issues.length,
      dedupedIssueCount: deduped.length,
      finalIssueCount: capped.length,
      frameworks: this.frameworks.slice(0),
      checks: checkTimings
    };

    return capped;
  }

  getLastRunStats() {
    return this.lastRunStats;
  }

  /**
   * Group A: Batched pure DOM queries — pauseStopHide + audioControl in a single evaluate round-trip.
   */
  async checkGroupABatched() {
    const raw = await this.page.evaluate(() => {
      const buildSelector = (el) => {
        if (!el || !el.tagName) return null;
        if (el.id) return `#${CSS.escape(el.id)}`;
        const parts = [];
        let node = el;
        while (node && node.tagName && parts.length < 4) {
          let part = node.tagName.toLowerCase();
          if (node.classList && node.classList.length > 0) {
            const classes = Array.from(node.classList).slice(0, 2).map((c) => CSS.escape(c));
            if (classes.length) part += `.${classes.join('.')}`;
          }
          const parent = node.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((s) => s.tagName === node.tagName);
            if (siblings.length > 1) {
              part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
            }
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };

      // pauseStopHide
      const pauseItems = [];
      document.querySelectorAll('marquee, blink').forEach((el) => {
        pauseItems.push({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        });
      });

      // audioControl
      const audioItems = [];
      document.querySelectorAll('audio, video').forEach((el) => {
        if (el.hasAttribute('autoplay') && !el.hasAttribute('controls')) {
          audioItems.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });

      return { pauseItems: pauseItems.slice(0, 10), audioItems };
    });

    return {
      pauseStopHide: (raw.pauseItems || []).map((item) => buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-2.2.2',
        message: 'Moving content may not be pausable',
        description: 'Found legacy moving content elements that may lack pause/stop controls.',
        selector: item.selector,
        html: item.html,
        tags: ['wcag2a', 'wcag222']
      })),
      audioControl: (raw.audioItems || []).map((item) => buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-1.4.2',
        message: 'Autoplaying media may lack controls',
        description: 'Provide a mechanism to pause or stop audio that plays automatically.',
        selector: item.selector,
        html: item.html,
        tags: ['wcag2a', 'wcag142']
      }))
    };
  }

  async detectFrameworks() {
    try {
      return await this.page.evaluate(() => {
        const detected = new Set();
        const has = (selector) => !!document.querySelector(selector);
        if (has('[data-radix-popper-content-wrapper], [data-radix-collection-item], [data-state][data-side]')) detected.add('radix');
        if (has('.MuiButtonBase-root, [class*="Mui"], [data-mui-color-scheme]')) detected.add('mui');
        if (has('[data-headlessui-state], [id^="headlessui-"]')) detected.add('headlessui');
        if (has('[data-reach-menu-button], [data-reach-dialog-content]')) detected.add('reachui');
        if (has('[data-bs-toggle], .modal, .dropdown-menu, .carousel')) detected.add('bootstrap');
        if (has('[data-testid*="chakra"], [class*="chakra-"]')) detected.add('chakra');
        return Array.from(detected);
      });
    } catch (err) {
      return [];
    }
  }

  getFrameworkSuppressions(frameworks = []) {
    const suppressions = [];
    if (frameworks.includes('radix') || frameworks.includes('headlessui') || frameworks.includes('reachui')) {
      suppressions.push({
        ruleId: 'wcag-2.1.1',
        messageIncludes: 'Custom interactive role may miss keyboard activation handling',
        selectorPattern: /(radix|headlessui|reach|menu|listbox|combobox)/i
      });
    }
    if (frameworks.includes('mui') || frameworks.includes('chakra')) {
      suppressions.push({
        ruleId: 'wcag-2.1.1',
        messageIncludes: 'Custom interactive role may miss keyboard activation handling',
        selectorPattern: /(mui|chakra|listbox|menu|tabpanel)/i
      });
    }
    return suppressions;
  }

  shouldSuppress(issue) {
    const allSuppressions = []
      .concat(Array.isArray(this.options.suppressions) ? this.options.suppressions : [])
      .concat(this.frameworkSuppressions);
    if (!allSuppressions.length) return false;
    return allSuppressions.some((s) => {
      if (!s || typeof s !== 'object') return false;
      if (s.ruleId && s.ruleId !== issue.ruleId) return false;
      if (s.messageIncludes && !(issue.message || '').includes(s.messageIncludes)) return false;
      if (s.selectorPattern) {
        try {
          const re = s.selectorPattern instanceof RegExp ? s.selectorPattern : new RegExp(String(s.selectorPattern), 'i');
          if (!re.test(issue.selector || '')) return false;
        } catch (err) {
          return false;
        }
      }
      return true;
    });
  }

  normalizeIssue(issue) {
    const normalized = { ...issue };
    const base = {
      critical: 0.9,
      serious: 0.75,
      moderate: 0.6,
      minor: 0.4
    }[normalized.impact || 'moderate'] || 0.6;
    let confidence = typeof normalized.confidence === 'number' ? normalized.confidence : base;
    if (Array.isArray(normalized.evidence) && normalized.evidence.length >= 2) confidence += 0.05;
    confidence = Math.max(0.05, Math.min(0.98, confidence));
    normalized.confidence = confidence;
    if (typeof normalized.needsReview !== 'boolean') {
      normalized.needsReview = confidence < this.options.minConfidenceForAutoRaise;
    }
    normalized.decision = normalized.needsReview ? 'review' : 'auto';
    return normalized;
  }
}

module.exports = { AblelyticsCoreTests };
