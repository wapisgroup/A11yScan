const cheerio = require('cheerio');

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
    this.frameworks = await this.detectFrameworks();
    this.frameworkSuppressions = this.getFrameworkSuppressions(this.frameworks);
    const checks = [
      ['checkKeyboardAccessible', () => this.checkKeyboardAccessible()],
      ['checkNoKeyboardTrap', () => this.checkNoKeyboardTrap()],
      ['checkInteractiveComponentScenarios', () => this.checkInteractiveComponentScenarios()],
      ['checkFrameworkAdapterScenarios', () => this.checkFrameworkAdapterScenarios()],
      ['checkAccessibilityTreeNameRoleValue', () => this.checkAccessibilityTreeNameRoleValue()],
      ['checkPauseStopHide', () => this.checkPauseStopHide()],
      ['checkDraggingMovements', () => this.checkDraggingMovements()],
      ['checkBypassBlocks', () => this.checkBypassBlocks()],
      ['checkFocusOrder', () => this.checkFocusOrder()],
      ['checkFocusVisible', () => this.checkFocusVisible()],
      ['checkFocusNotObscured', () => this.checkFocusNotObscured()],
      ['checkFocusNotObscuredEnhanced', () => this.checkFocusNotObscuredEnhanced()],
      ['checkAudioControl', () => this.checkAudioControl()]
    ];

    if (this.options.includeExperimentalChecks) {
      checks.push(['checkPointerGestures', () => this.checkPointerGestures()]);
      checks.push(['checkPointerCancellation', () => this.checkPointerCancellation()]);
      checks.push(['checkMotionActuation', () => this.checkMotionActuation()]);
      checks.push(['checkConcurrentInputMechanisms', () => this.checkConcurrentInputMechanisms()]);
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
      issues.push(...this.checkConsistentNavigation(pageSnapshots));
      issues.push(...this.checkConsistentIdentification(pageSnapshots));
      issues.push(...this.checkConsistentHelp(pageSnapshots));
    }

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

  async pause(ms = 120) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkFrameworkAdapterScenarios() {
    if (!this.frameworks.length) return [];
    const issues = [];
    try {
      if (this.frameworks.includes('radix') || this.frameworks.includes('headlessui') || this.frameworks.includes('reachui')) {
        issues.push(...await this.checkManagedMenuSemantics());
      }
      if (this.frameworks.includes('mui') || this.frameworks.includes('chakra') || this.frameworks.includes('bootstrap')) {
        issues.push(...await this.checkManagedDialogSemantics());
      }
    } catch (err) {
      console.warn('[ablelytics-core] framework adapter scenarios failed:', err && err.message ? err.message : err);
    }
    return issues;
  }

  async checkManagedMenuSemantics() {
    const findings = await this.page.evaluate(() => {
      const offenders = [];
      const triggers = Array.from(document.querySelectorAll('[aria-haspopup="menu"], [role="button"][aria-controls], button[aria-controls]'));
      triggers.forEach((trigger) => {
        const controls = (trigger.getAttribute('aria-controls') || '').trim();
        if (!controls) return;
        const menu = document.getElementById(controls);
        if (!menu) return;
        const role = (menu.getAttribute('role') || '').toLowerCase();
        if (role && role !== 'menu' && role !== 'listbox') {
          offenders.push({
            selector: trigger.id ? `#${CSS.escape(trigger.id)}` : trigger.tagName.toLowerCase(),
            html: trigger.outerHTML ? trigger.outerHTML.slice(0, 300) : null
          });
        }
      });
      return offenders.slice(0, 8);
    });
    return findings.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-4.1.2',
      message: 'Managed menu trigger points to element with unexpected role',
      description: 'Framework menu trigger aria-controls should point to a menu/listbox container with synchronized state.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag412'],
      confidence: 0.72,
      needsReview: true
    }));
  }

  async checkManagedDialogSemantics() {
    const findings = await this.page.evaluate(() => {
      const offenders = [];
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]'));
      dialogs.forEach((dlg) => {
        const labelledBy = dlg.getAttribute('aria-labelledby');
        const ariaLabel = dlg.getAttribute('aria-label');
        if (!labelledBy && !ariaLabel) {
          offenders.push({
            selector: dlg.id ? `#${CSS.escape(dlg.id)}` : dlg.tagName.toLowerCase(),
            html: dlg.outerHTML ? dlg.outerHTML.slice(0, 300) : null
          });
        }
      });
      return offenders.slice(0, 8);
    });
    return findings.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-4.1.2',
      message: 'Dialog is missing accessible name',
      description: 'Dialog containers should expose an accessible name via aria-label or aria-labelledby.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag412'],
      confidence: 0.8,
      needsReview: false
    }));
  }

  async checkAccessibilityTreeNameRoleValue() {
    if (!this.options.includeAccessibilityTreeChecks || !this.page || !this.page.accessibility || typeof this.page.accessibility.snapshot !== 'function') {
      return [];
    }
    let tree;
    try {
      tree = await this.page.accessibility.snapshot({ interestingOnly: false });
    } catch (err) {
      return [];
    }
    if (!tree) return [];

    const issues = [];
    const queue = [{ node: tree, path: 'root' }];
    while (queue.length) {
      const { node, path } = queue.shift();
      if (!node || typeof node !== 'object') continue;
      const role = String(node.role || '').toLowerCase();
      const name = (node.name || '').trim();

      const roleRequiresName = new Set(['button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'checkbox', 'radio', 'switch', 'textbox', 'combobox']);
      if (roleRequiresName.has(role) && !name) {
        issues.push(buildIssue({
          impact: 'serious',
          ruleId: 'wcag-4.1.2',
          message: `Accessibility tree node with role "${role}" has no accessible name`,
          description: 'Interactive controls should expose a non-empty accessible name in the accessibility tree.',
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.85,
          needsReview: false,
          evidence: [`Tree path: ${path}`]
        }));
      }

      if (role === 'tab' && node.selected !== undefined && typeof node.selected !== 'boolean') {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-4.1.2',
          message: 'Tab selected state is not exposed consistently in accessibility tree',
          description: 'Tab widgets should expose valid selected state for assistive technologies.',
          tags: ['wcag2a', 'wcag412'],
          confidence: 0.75,
          needsReview: true,
          evidence: [`Tree path: ${path}`]
        }));
      }

      const children = Array.isArray(node.children) ? node.children : [];
      children.forEach((child, idx) => {
        queue.push({ node: child, path: `${path}.${role || 'node'}[${idx}]` });
      });
    }
    return issues.slice(0, this.options.maxIssuesPerRule);
  }

  async checkInteractiveComponentScenarios() {
    const issues = [];
    issues.push(...await this.checkModalInteractionScenario());
    issues.push(...await this.checkMenuInteractionScenario());
    issues.push(...await this.checkTabsInteractionScenario());
    issues.push(...await this.checkDisclosureInteractionScenario());
    issues.push(...await this.checkCarouselInteractionScenario());
    issues.push(...await this.checkDragDropKeyboardAlternativeScenario());
    return issues;
  }

  async checkModalInteractionScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const candidates = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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

      const nodes = Array.from(document.querySelectorAll(
        '[aria-haspopup="dialog"], [data-bs-toggle="modal"], [data-modal-target], [data-dialog-target], [aria-controls]'
      ));
      const dialogIds = new Set(
        Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]'))
          .map((el) => el.id)
          .filter(Boolean)
      );
      const results = [];
      nodes.forEach((el) => {
        if (!isVisible(el)) return;
        const controls = (el.getAttribute('aria-controls') || '').trim();
        const hasDialogHint = el.getAttribute('aria-haspopup') === 'dialog'
          || el.hasAttribute('data-bs-toggle')
          || el.hasAttribute('data-modal-target')
          || el.hasAttribute('data-dialog-target')
          || (controls && dialogIds.has(controls));
        if (!hasDialogHint) return;
        results.push({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          controls: controls || null,
          html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
        });
      });
      return results.slice(0, limit);
    }, maxChecks);

    if (!candidates.length) return [];

    const issues = [];
    for (const candidate of candidates) {
      try {
        const selector = candidate.selector;
        const pre = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const allDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]'));
          const visibleDialogs = allDialogs.filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          return {
            hasTrigger: !!trigger,
            visibleDialogCount: visibleDialogs.length,
            controlledVisible: !!controlled && (() => {
              const style = window.getComputedStyle(controlled);
              const rect = controlled.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            })()
          };
        }, selector, candidate.controls);

        if (!pre.hasTrigger) continue;

        await this.page.focus(selector);
        await this.page.keyboard.press('Enter');
        await this.pause(120);

        let opened = await this.page.evaluate((controlledId, previousCount) => {
          const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const controlledVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return controlledVisible || visibleDialogs.length > previousCount;
        }, candidate.controls, pre.visibleDialogCount);

        if (!opened) {
          await this.page.keyboard.press('Space');
          await this.pause(120);
          opened = await this.page.evaluate((controlledId, previousCount) => {
            const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            });
            const controlled = controlledId ? document.getElementById(controlledId) : null;
            const controlledVisible = !!controlled && (() => {
              const style = window.getComputedStyle(controlled);
              const rect = controlled.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            })();
            return controlledVisible || visibleDialogs.length > previousCount;
          }, candidate.controls, pre.visibleDialogCount);
        }

        if (!opened) continue;

        const focusState = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const active = document.activeElement;
          const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const openDialog = (controlled && visibleDialogs.includes(controlled)) ? controlled : (visibleDialogs[0] || null);
          const focusInsideDialog = !!(openDialog && active && openDialog.contains(active));
          const buildSelector = (el) => {
            if (!el || !el.tagName) return null;
            if (el.id) return `#${CSS.escape(el.id)}`;
            return el.tagName.toLowerCase();
          };
          return {
            focusInsideDialog,
            activeSelector: buildSelector(active),
            activeHtml: active && active.outerHTML ? active.outerHTML.slice(0, 300) : null,
            triggerHtml: trigger && trigger.outerHTML ? trigger.outerHTML.slice(0, 300) : null
          };
        }, selector, candidate.controls);

        if (!focusState.focusInsideDialog) {
          issues.push(buildIssue({
            impact: 'serious',
            ruleId: 'wcag-2.4.3',
            message: 'Dialog opened but focus did not move into it',
            description: 'When a modal opens, keyboard focus should move into the dialog.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag243'],
            confidence: 0.8,
            needsReview: false,
            evidence: [`Active element after open: ${focusState.activeSelector || 'none'}`]
          }));
        }

        await this.page.keyboard.press('Escape');
        await this.pause(120);

        const closeState = await this.page.evaluate((sel, previousCount, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const active = document.activeElement;
          const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog, [aria-modal="true"]')).filter((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const controlledStillVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return {
            dialogClosed: !controlledStillVisible && visibleDialogs.length <= previousCount,
            focusRestored: !!(trigger && active && (trigger === active || trigger.contains(active)))
          };
        }, selector, pre.visibleDialogCount, candidate.controls);

        if (!closeState.dialogClosed) {
          issues.push(buildIssue({
            impact: 'serious',
            ruleId: 'wcag-2.1.2',
            message: 'Dialog did not close on Escape',
            description: 'Keyboard users should be able to dismiss modal dialogs with Escape when supported by the UI pattern.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag212'],
            confidence: 0.7,
            needsReview: true
          }));
        }

        if (closeState.dialogClosed && !closeState.focusRestored) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.4.3',
            message: 'Focus was not restored to dialog trigger after close',
            description: 'After closing a dialog, focus should generally return to the trigger control.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag243'],
            confidence: 0.65,
            needsReview: true
          }));
        }
      } catch (err) {
        console.warn('[ablelytics-core] modal interaction scenario failed:', err && err.message ? err.message : err);
      }
    }

    return issues;
  }

  async checkMenuInteractionScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const candidates = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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
      const nodes = Array.from(document.querySelectorAll('[aria-haspopup="menu"], [aria-controls][aria-expanded], button[aria-expanded], [role="button"][aria-expanded]'));
      const results = [];
      nodes.forEach((el) => {
        if (!isVisible(el)) return;
        results.push({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          controls: (el.getAttribute('aria-controls') || '').trim() || null,
          html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
        });
      });
      return results.slice(0, limit);
    }, maxChecks);

    if (!candidates.length) return [];

    const issues = [];
    for (const candidate of candidates) {
      try {
        const selector = candidate.selector;
        await this.page.focus(selector);

        const pre = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const menuVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return {
            expanded,
            menuVisible,
            hasControlledMenuRole: !!(controlled && controlled.getAttribute('role') === 'menu')
          };
        }, selector, candidate.controls);

        await this.page.keyboard.press('Enter');
        await this.pause(100);

        let opened = await this.page.evaluate((sel, controlledId, preExpanded, preVisible) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const menuVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return expanded === 'true' || (menuVisible && !preVisible) || (preExpanded !== 'true' && expanded === 'true');
        }, selector, candidate.controls, pre.expanded, pre.menuVisible);

        if (!opened) {
          await this.page.keyboard.press('Space');
          await this.pause(100);
          opened = await this.page.evaluate((sel, controlledId) => {
            const trigger = sel ? document.querySelector(sel) : null;
            const controlled = controlledId ? document.getElementById(controlledId) : null;
            const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
            const menuVisible = !!controlled && (() => {
              const style = window.getComputedStyle(controlled);
              const rect = controlled.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            })();
            return expanded === 'true' || menuVisible;
          }, selector, candidate.controls);
        }

        if (!opened) continue;

        if (candidate.controls && !pre.hasControlledMenuRole) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-4.1.2',
            message: 'Menu trigger aria-controls does not reference a role="menu" element',
            description: 'Menu triggers should reference the controlled menu element with correct role/state semantics.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag412'],
            confidence: 0.7,
            needsReview: true
          }));
        }

        await this.page.keyboard.press('ArrowDown');
        await this.pause(80);
        const navState = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const active = document.activeElement;
          const menuItemFocused = !!(active && (
            active.getAttribute('role') === 'menuitem'
            || active.getAttribute('role') === 'menuitemcheckbox'
            || active.getAttribute('role') === 'menuitemradio'
            || (controlled && controlled.contains(active) && active !== trigger)
          ));
          return { menuItemFocused };
        }, selector, candidate.controls);

        if (!navState.menuItemFocused) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.1.1',
            message: 'Menu opened but keyboard navigation did not move focus to an item',
            description: 'After opening a menu, keyboard navigation should allow moving to actionable menu items.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag211'],
            confidence: 0.6,
            needsReview: true
          }));
        }

        await this.page.keyboard.press('Escape');
        await this.pause(100);
        const closeState = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const controlled = controlledId ? document.getElementById(controlledId) : null;
          const active = document.activeElement;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const menuVisible = !!controlled && (() => {
            const style = window.getComputedStyle(controlled);
            const rect = controlled.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return {
            collapsed: expanded !== 'true' && !menuVisible,
            expandedStateAfterClose: expanded,
            focusRestored: !!(trigger && active && (trigger === active || trigger.contains(active)))
          };
        }, selector, candidate.controls);

        if (!closeState.collapsed) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.1.1',
            message: 'Menu did not collapse on Escape',
            description: 'Keyboard users should be able to dismiss an open menu with Escape.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag211'],
            confidence: 0.65,
            needsReview: true
          }));
        }

        if (closeState.collapsed && !closeState.focusRestored) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.4.3',
            message: 'Focus was not restored to menu trigger after close',
            description: 'After closing a menu, focus should return to the control that opened it.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag243'],
            confidence: 0.6,
            needsReview: true
          }));
        }

        if (closeState.expandedStateAfterClose === 'true') {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-4.1.2',
            message: 'Menu aria-expanded state did not synchronize after close',
            description: 'Menu trigger should set aria-expanded to false when menu is closed.',
            selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag412'],
            confidence: 0.75,
            needsReview: true
          }));
        }
      } catch (err) {
        console.warn('[ablelytics-core] menu interaction scenario failed:', err && err.message ? err.message : err);
      }
    }

    return issues;
  }

  async checkTabsInteractionScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const candidates = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };
      const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
      return tablists.map((tablist) => {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')).filter(isVisible);
        if (tabs.length < 2) return null;
        return {
          tablistSelector: buildSelector(tablist) || '[role="tablist"]',
          firstTabSelector: buildSelector(tabs[0]) || '[role="tab"]',
          html: tablist.outerHTML ? tablist.outerHTML.slice(0, 300) : null
        };
      }).filter(Boolean).slice(0, limit);
    }, maxChecks);

    if (!candidates.length) return [];

    const issues = [];
    for (const candidate of candidates) {
      try {
        await this.page.focus(candidate.firstTabSelector);
        const before = await this.page.evaluate((tabSelector) => {
          const active = document.activeElement;
          const activeId = active && active.id ? active.id : null;
          const selectedTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'));
          const selectedTab = selectedTabs[0] || null;
          return {
            activeId,
            selectedId: selectedTab && selectedTab.id ? selectedTab.id : null,
            selectedCount: selectedTabs.length
          };
        }, candidate.firstTabSelector);

        await this.page.keyboard.press('ArrowRight');
        await this.pause(100);

        const after = await this.page.evaluate(() => {
          const active = document.activeElement;
          const activeRole = active ? active.getAttribute('role') : null;
          const selectedTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'));
          const selectedTab = selectedTabs[0] || null;
          const controls = selectedTab ? selectedTab.getAttribute('aria-controls') : null;
          const panel = controls ? document.getElementById(controls) : null;
          const panelVisible = !!panel && (() => {
            const style = window.getComputedStyle(panel);
            const rect = panel.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return {
            activeId: active && active.id ? active.id : null,
            activeRole,
            selectedId: selectedTab && selectedTab.id ? selectedTab.id : null,
            selectedCount: selectedTabs.length,
            hasValidControls: !!(selectedTab && controls && panel),
            panelVisible
          };
        });

        const moved = (after.activeId && before.activeId && after.activeId !== before.activeId)
          || (after.selectedId && before.selectedId && after.selectedId !== before.selectedId)
          || after.activeRole === 'tab';

        if (!moved) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.1.1',
            message: 'Tabs may not support keyboard arrow navigation',
            description: 'Tab interfaces should allow keyboard users to move between tabs with arrow keys.',
            selector: candidate.tablistSelector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag211'],
            confidence: 0.65,
            needsReview: true
          }));
        }

        if (moved && !after.panelVisible) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-4.1.2',
            message: 'Selected tab did not expose a visible tab panel',
            description: 'Tab selection should update and reveal the associated tab panel.',
            selector: candidate.tablistSelector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag412'],
            confidence: 0.55,
            needsReview: true
          }));
        }

        if (after.selectedCount !== 1 || !after.hasValidControls) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-4.1.2',
            message: 'Tab role/state relationship appears inconsistent',
            description: 'Exactly one tab should be aria-selected=true and it should reference a valid panel via aria-controls.',
            selector: candidate.tablistSelector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag412'],
            confidence: 0.75,
            needsReview: true
          }));
        }
      } catch (err) {
        console.warn('[ablelytics-core] tabs interaction scenario failed:', err && err.message ? err.message : err);
      }
    }

    return issues;
  }

  async checkDisclosureInteractionScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const candidates = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };
      const triggers = Array.from(document.querySelectorAll('button[aria-expanded], [role="button"][aria-expanded]'))
        .filter((el) => isVisible(el) && !!el.getAttribute('aria-controls'));
      return triggers.slice(0, limit).map((el) => ({
        selector: buildSelector(el) || 'button[aria-expanded]',
        controls: el.getAttribute('aria-controls'),
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
      }));
    }, maxChecks);

    if (!candidates.length) return [];

    const issues = [];
    for (const candidate of candidates) {
      try {
        await this.page.focus(candidate.selector);
        const before = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const panel = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const panelVisible = !!panel && (() => {
            const style = window.getComputedStyle(panel);
            const rect = panel.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return { expanded, panelVisible };
        }, candidate.selector, candidate.controls);

        await this.page.keyboard.press('Enter');
        await this.pause(90);

        const afterEnter = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const panel = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const panelVisible = !!panel && (() => {
            const style = window.getComputedStyle(panel);
            const rect = panel.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return { expanded, panelVisible };
        }, candidate.selector, candidate.controls);

        const toggled = before.expanded !== afterEnter.expanded || before.panelVisible !== afterEnter.panelVisible;
        if (!toggled) {
          await this.page.keyboard.press('Space');
          await this.pause(90);
        }

        const afterSpace = await this.page.evaluate((sel, controlledId) => {
          const trigger = sel ? document.querySelector(sel) : null;
          const panel = controlledId ? document.getElementById(controlledId) : null;
          const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
          const panelVisible = !!panel && (() => {
            const style = window.getComputedStyle(panel);
            const rect = panel.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })();
          return { expanded, panelVisible };
        }, candidate.selector, candidate.controls);

        const finallyToggled = toggled || before.expanded !== afterSpace.expanded || before.panelVisible !== afterSpace.panelVisible;
        if (!finallyToggled) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.1.1',
            message: 'Disclosure/accordion control may not be keyboard operable',
            description: 'Controls using aria-expanded should toggle state via keyboard (Enter/Space).',
            selector: candidate.selector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag211'],
            confidence: 0.7,
            needsReview: true
          }));
        }
      } catch (err) {
        console.warn('[ablelytics-core] disclosure interaction scenario failed:', err && err.message ? err.message : err);
      }
    }

    return issues;
  }

  async checkCarouselInteractionScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const candidates = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };

      const roots = Array.from(document.querySelectorAll('[aria-roledescription*="carousel" i], [data-carousel], .carousel'));
      const results = [];
      roots.forEach((root) => {
        if (!isVisible(root)) return;
        const nextButton = root.querySelector(
          '[aria-label*="next" i], [title*="next" i], [data-slide="next"], [data-carousel-next], .next, .carousel-control-next'
        );
        if (!nextButton || !isVisible(nextButton)) return;
        const slides = Array.from(root.querySelectorAll(
          '[role="group"], [aria-roledescription*="slide" i], .slide, .carousel-item'
        )).filter(isVisible);
        if (slides.length < 2) return;
        results.push({
          rootSelector: buildSelector(root) || '.carousel',
          nextSelector: buildSelector(nextButton) || 'button',
          html: root.outerHTML ? root.outerHTML.slice(0, 300) : null
        });
      });
      return results.slice(0, limit);
    }, maxChecks);

    if (!candidates.length) return [];

    const issues = [];
    for (const candidate of candidates) {
      try {
        const getSnapshot = async () => this.page.evaluate((rootSel) => {
          const root = rootSel ? document.querySelector(rootSel) : null;
          if (!root) return { activeIndex: -1, activeMarker: null };
          const items = Array.from(root.querySelectorAll('[role="group"], [aria-roledescription*="slide" i], .slide, .carousel-item'));
          if (!items.length) return { activeIndex: -1, activeMarker: null };
          const indexFromPredicate = (predicate) => items.findIndex(predicate);
          const activeByCurrent = indexFromPredicate((el) => el.getAttribute('aria-current') === 'true');
          const activeByClass = indexFromPredicate((el) => el.classList.contains('active') || el.classList.contains('is-active'));
          const activeByHidden = indexFromPredicate((el) => el.getAttribute('aria-hidden') === 'false');
          const activeIndex = activeByCurrent >= 0 ? activeByCurrent : (activeByClass >= 0 ? activeByClass : activeByHidden);
          const activeMarker = activeIndex >= 0 ? (items[activeIndex].id || items[activeIndex].textContent || '').slice(0, 80) : null;
          return { activeIndex, activeMarker };
        }, candidate.rootSelector);

        const before = await getSnapshot();
        await this.page.focus(candidate.nextSelector);
        await this.page.keyboard.press('Enter');
        await this.pause(120);
        const afterEnter = await getSnapshot();
        let changed = (before.activeIndex >= 0 && afterEnter.activeIndex >= 0 && before.activeIndex !== afterEnter.activeIndex)
          || (before.activeMarker && afterEnter.activeMarker && before.activeMarker !== afterEnter.activeMarker);

        if (!changed) {
          await this.page.keyboard.press('Space');
          await this.pause(120);
          const afterSpace = await getSnapshot();
          changed = (before.activeIndex >= 0 && afterSpace.activeIndex >= 0 && before.activeIndex !== afterSpace.activeIndex)
            || (before.activeMarker && afterSpace.activeMarker && before.activeMarker !== afterSpace.activeMarker);
        }

        if (!changed) {
          issues.push(buildIssue({
            impact: 'moderate',
            ruleId: 'wcag-2.1.1',
            message: 'Carousel next control may not be keyboard operable',
            description: 'Using Enter/Space on the carousel next control did not change slide state.',
            selector: candidate.nextSelector,
            html: candidate.html,
            tags: ['wcag2a', 'wcag211'],
            confidence: 0.6,
            needsReview: true
          }));
        }
      } catch (err) {
        console.warn('[ablelytics-core] carousel interaction scenario failed:', err && err.message ? err.message : err);
      }
    }

    return issues;
  }

  async checkDragDropKeyboardAlternativeScenario() {
    const maxChecks = Math.max(1, Number(this.options.maxComponentChecks) || DEFAULT_OPTIONS.maxComponentChecks);
    const findings = await this.page.evaluate((limit) => {
      const isVisible = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
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
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };
      const draggableItems = Array.from(document.querySelectorAll('[draggable="true"]')).filter(isVisible).slice(0, limit);
      const results = [];
      draggableItems.forEach((el) => {
        const region = el.closest('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [data-sortable], [class*="drag"], [class*="sortable"]') || el.parentElement;
        const text = ((region && region.textContent) || '').toLowerCase();
        const hasMoveButtons = !!(region && region.querySelector(
          'button[aria-label*="move" i], button[title*="move" i], button[aria-label*="up" i], button[aria-label*="down" i], [data-action*="move"]'
        ));
        const hasKeyboardHint = /\b(use keyboard|press (arrow|space|enter)|move up|move down)\b/i.test(text);
        const hasFocusable = el.tabIndex >= 0 || el.matches('button, a[href], input, select, textarea, [role="button"]');
        results.push({
          selector: buildSelector(el) || '[draggable="true"]',
          html: el.outerHTML ? el.outerHTML.slice(0, 300) : null,
          hasMoveButtons,
          hasKeyboardHint,
          hasFocusable,
          regionSelector: region ? buildSelector(region) : null
        });
      });
      return results;
    }, maxChecks);

    if (!findings.length) return [];

    const issues = [];
    for (const item of findings) {
      let keyboardInteractionChangedState = false;
      try {
        await this.page.focus(item.selector);
        const before = await this.page.evaluate((sel, regionSel) => {
          const el = sel ? document.querySelector(sel) : null;
          const region = regionSel ? document.querySelector(regionSel) : (el ? el.parentElement : null);
          if (!el || !region) return { idx: -1, ariaGrabbed: null, liveText: '' };
          const items = Array.from(region.querySelectorAll('[draggable="true"]'));
          const idx = items.indexOf(el);
          const live = region.querySelector('[aria-live]');
          return {
            idx,
            ariaGrabbed: el.getAttribute('aria-grabbed'),
            liveText: live ? (live.textContent || '').trim().slice(0, 120) : ''
          };
        }, item.selector, item.regionSelector);

        await this.page.keyboard.press('Space');
        await this.pause(80);
        await this.page.keyboard.press('ArrowDown');
        await this.pause(80);
        await this.page.keyboard.press('ArrowUp');
        await this.pause(80);
        await this.page.keyboard.press('Space');
        await this.pause(80);

        const after = await this.page.evaluate((sel, regionSel) => {
          const el = sel ? document.querySelector(sel) : null;
          const region = regionSel ? document.querySelector(regionSel) : (el ? el.parentElement : null);
          if (!el || !region) return { idx: -1, ariaGrabbed: null, liveText: '' };
          const items = Array.from(region.querySelectorAll('[draggable="true"]'));
          const idx = items.indexOf(el);
          const live = region.querySelector('[aria-live]');
          return {
            idx,
            ariaGrabbed: el.getAttribute('aria-grabbed'),
            liveText: live ? (live.textContent || '').trim().slice(0, 120) : ''
          };
        }, item.selector, item.regionSelector);

        keyboardInteractionChangedState = (
          (before.idx >= 0 && after.idx >= 0 && before.idx !== after.idx)
          || before.ariaGrabbed !== after.ariaGrabbed
          || before.liveText !== after.liveText
        );
      } catch (err) {
        keyboardInteractionChangedState = false;
      }

      const hasAlternative = item.hasMoveButtons || item.hasKeyboardHint;
      if (!item.hasFocusable && !hasAlternative && !keyboardInteractionChangedState) {
        issues.push(buildIssue({
          impact: 'serious',
          ruleId: 'wcag-2.5.7',
          message: 'Drag interaction detected without obvious keyboard alternative',
          description: 'Draggable item is not keyboard focusable and no keyboard move controls/hints were detected.',
          selector: item.selector,
          html: item.html,
          tags: ['wcag2aa', 'wcag257'],
          confidence: 0.75,
          needsReview: true
        }));
        continue;
      }
      if (!hasAlternative && !keyboardInteractionChangedState) {
        issues.push(buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.5.7',
          message: 'Drag interaction may lack keyboard alternative controls',
          description: 'Draggable item found, but explicit keyboard move controls or instructions were not detected.',
          selector: item.selector,
          html: item.html,
          tags: ['wcag2aa', 'wcag257'],
          confidence: 0.5,
          needsReview: true
        }));
      }
    }

    return issues;
  }

  async checkKeyboardAccessible() {
    const candidates = await this.page.evaluate(() => {
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
      const focusableSelectors = [
        'a[href]', 'button', 'input', 'select', 'textarea',
        '[tabindex]', '[role="button"]', '[role="link"]'
      ];
      const nodes = Array.from(document.querySelectorAll('*'));
      const results = [];
      nodes.forEach((el) => {
        const hasClick = typeof el.onclick === 'function' || el.hasAttribute('onclick');
        const hasRole = el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
        const isFocusable = focusableSelectors.some((sel) => el.matches(sel)) || el.tabIndex >= 0;
        const isNativeControl = el.matches('button, a[href], input, select, textarea');
        const hasKeyboardHandler = ['onkeydown', 'onkeypress', 'onkeyup'].some((attr) => el.hasAttribute(attr));
        const frameworkManagedLikely = Boolean(
          el.hasAttribute('aria-controls')
          || el.hasAttribute('aria-expanded')
          || el.hasAttribute('aria-haspopup')
          || el.hasAttribute('data-radix-collection-item')
          || el.hasAttribute('data-headlessui-state')
          || (el.className && /Mui|chakra|radix|headlessui/i.test(String(el.className)))
        );
        if ((hasClick || hasRole) && !isFocusable) {
          results.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300),
            type: 'not-focusable',
            frameworkManagedLikely
          });
        } else if (hasRole && isFocusable && !isNativeControl && !hasKeyboardHandler) {
          results.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300),
            type: 'role-without-keyboard-handler',
            frameworkManagedLikely
          });
        }
      });
      return results.slice(0, 20);
    });

    if (!candidates.length) return [];

    return candidates.map((item) => buildIssue({
      impact: item.type === 'not-focusable' ? 'serious' : 'moderate',
      ruleId: 'wcag-2.1.1',
      message: item.type === 'not-focusable'
        ? 'Interactive element may not be keyboard accessible'
        : 'Custom interactive role may miss keyboard activation handling',
      description: item.type === 'not-focusable'
        ? 'Element appears clickable but is not focusable via keyboard.'
        : 'Element with button/link role is focusable but no explicit keyboard handler was detected.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag211'],
      confidence: item.type === 'not-focusable'
        ? 0.85
        : (item.frameworkManagedLikely ? 0.3 : 0.45),
      needsReview: item.type !== 'not-focusable',
      evidence: item.frameworkManagedLikely ? ['framework-managed-pattern-detected'] : []
    }));
  }

  async checkNoKeyboardTrap() {
    const maxTabSteps = Math.max(8, Number(this.options.maxTabSteps) || DEFAULT_OPTIONS.maxTabSteps);
    const focusableCount = await this.page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ));
      return candidates.filter((el) => {
        const style = window.getComputedStyle(el);
        return !el.disabled && style.visibility !== 'hidden' && style.display !== 'none';
      }).length;
    });

    if (focusableCount < 2) return [];

    await this.page.evaluate(() => {
      const active = document.activeElement;
      if (active && typeof active.blur === 'function') active.blur();
      if (document.body) {
        document.body.setAttribute('tabindex', '-1');
        document.body.focus();
      }
    });

    const getActiveInfo = async () => this.page.evaluate(() => {
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
      const el = document.activeElement;
      if (!el) return { signature: 'none', selector: null, html: null };
      return {
        signature: [el.tagName, el.id, el.className].join('|'),
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
      };
    });

    const runDirection = async (key, shift = false) => {
      let previous = null;
      let stableCount = 0;
      let lastInfo = null;
      const seenSignatures = new Set();
      for (let i = 0; i < maxTabSteps; i += 1) {
        await this.page.keyboard.press(key, shift ? { shift: true } : undefined);
        await new Promise((resolve) => setTimeout(resolve, 30));
        const info = await getActiveInfo();
        lastInfo = info;
        if (info && info.signature) seenSignatures.add(info.signature);
        if (previous && info.signature === previous) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        previous = info.signature;
      }
      return {
        trapped: stableCount >= 6 && seenSignatures.size <= 2,
        lastInfo
      };
    };

    const forward = await runDirection('Tab', false);
    const backward = await runDirection('Tab', true);
    const likelyTrapped = forward.trapped && backward.trapped;
    if (!likelyTrapped) return [];

    await this.page.keyboard.press('Escape');
    await new Promise((resolve) => setTimeout(resolve, 40));
    const postEscape = await getActiveInfo();
    const escapeFreedFocus = postEscape && forward.lastInfo && postEscape.signature !== forward.lastInfo.signature;

    return [buildIssue({
      impact: 'serious',
      ruleId: 'wcag-2.1.2',
      message: 'Possible keyboard trap detected',
      description: escapeFreedFocus
        ? 'Focus appeared trapped in both Tab directions until Escape was pressed.'
        : 'Focus stayed trapped across repeated Tab and Shift+Tab key presses.',
      selector: forward.lastInfo ? forward.lastInfo.selector : null,
      html: forward.lastInfo ? forward.lastInfo.html : null,
      tags: ['wcag2a', 'wcag212'],
      confidence: escapeFreedFocus ? 0.55 : 0.75,
      needsReview: true
    })];
  }

  async checkPauseStopHide() {
    const results = await this.page.evaluate(() => {
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
      const offenders = [];
      document.querySelectorAll('marquee, blink').forEach((el) => {
        offenders.push({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        });
      });
      return offenders.slice(0, 10);
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.2.2',
      message: 'Moving content may not be pausable',
      description: 'Found legacy moving content elements that may lack pause/stop controls.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag222']
    }));
  }

  async checkDraggingMovements() {
    // Replaced by interaction-based `checkDragDropKeyboardAlternativeScenario`.
    return [];
  }

  async checkBypassBlocks() {
    const summary = await this.page.evaluate(() => {
      const buildSelector = (el) => {
        if (!el || !el.tagName) return null;
        if (el.id) return `#${CSS.escape(el.id)}`;
        return el.tagName.toLowerCase();
      };
      const links = Array.from(document.querySelectorAll('a[href^="#"]'));
      const skipLinks = links
        .filter((a) => (a.textContent || '').toLowerCase().includes('skip'))
        .map((a) => ({
          selector: buildSelector(a) || 'a[href^="#"]',
          href: a.getAttribute('href') || ''
        }));
      const hasSkip = skipLinks.length > 0;
      const hasMainLandmark = Boolean(document.querySelector('main, [role="main"]'));
      const navLinks = Array.from(document.querySelectorAll('nav a, [role="navigation"] a')).length;
      return { hasSkip, hasMainLandmark, navLinks, skipLinks };
    });

    if (summary.hasMainLandmark && summary.hasSkip) return [];

    if (summary.hasSkip && summary.skipLinks.length > 0) {
      const first = summary.skipLinks[0];
      const validation = await this.page.evaluate((sel, href) => {
        const link = sel ? document.querySelector(sel) : null;
        if (!link) return { validTarget: false, targetId: null, activated: false };
        const targetId = (href || '').replace(/^#/, '');
        const target = targetId ? document.getElementById(targetId) : null;
        return {
          validTarget: !!target,
          targetId: targetId || null,
          activated: false
        };
      }, first.selector, first.href);

      if (!validation.validTarget) {
        return [buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.4.1',
          message: 'Skip link target could not be resolved',
          description: 'Skip link exists but its target id was not found on the page.',
          selector: first.selector,
          tags: ['wcag2a', 'wcag241'],
          confidence: 0.8,
          needsReview: false
        })];
      }

      const before = await this.page.evaluate(() => ({
        scrollY: window.scrollY,
        hash: window.location.hash,
        activeId: document.activeElement && document.activeElement.id ? document.activeElement.id : null
      }));
      await this.page.focus(first.selector);
      await this.page.keyboard.press('Enter');
      await this.pause(100);
      const after = await this.page.evaluate((targetId) => {
        const target = targetId ? document.getElementById(targetId) : null;
        const active = document.activeElement;
        const focusMoved = !!(target && active && (active === target || target.contains(active)));
        return {
          scrollY: window.scrollY,
          hash: window.location.hash,
          focusMoved
        };
      }, validation.targetId);

      const movedByScroll = Math.abs((after.scrollY || 0) - (before.scrollY || 0)) > 12;
      const movedByHash = after.hash === `#${validation.targetId}` && after.hash !== before.hash;
      if (!after.focusMoved && !movedByScroll && !movedByHash) {
        return [buildIssue({
          impact: 'moderate',
          ruleId: 'wcag-2.4.1',
          message: 'Skip link did not move focus or viewport to target',
          description: 'Skip links should effectively bypass repeated content by moving focus or viewport to main content.',
          selector: first.selector,
          tags: ['wcag2a', 'wcag241'],
          confidence: 0.65,
          needsReview: true
        })];
      }

      return [];
    }

    if (summary.navLinks < 8) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.1',
      message: 'Bypass mechanism not clearly detected',
      description: 'No skip link or main landmark detected on a page with repeated navigation links.',
      tags: ['wcag2a', 'wcag241'],
      confidence: 0.55,
      needsReview: true,
      evidence: [`Navigation links detected: ${summary.navLinks}`]
    })];
  }

  async checkFocusOrder() {
    const results = await this.page.evaluate(() => {
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
      return Array.from(document.querySelectorAll('[tabindex]'))
        .filter((el) => el.tabIndex > 0)
        .map((el) => ({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        }));
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.3',
      message: 'Custom positive tabindex may disrupt focus order',
      description: 'Positive tabindex values can create confusing focus order.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag243']
    }));
  }

  async checkFocusVisible() {
    const max = this.options.maxFocusableChecks;
    const candidates = await this.page.evaluate((limit) => {
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
      const parseColor = (color) => {
        const m = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return null;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
      };
      const colorDelta = (c1, c2) => {
        if (!c1 || !c2) return 0;
        return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);
      };
      const focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'))
        .filter((el) => el.tabIndex >= 0)
        .slice(0, limit);
      return focusables.map((el) => {
        const pre = window.getComputedStyle(el);
        const preOutlineWidth = pre.outlineWidth;
        const preOutlineStyle = pre.outlineStyle;
        const preOutlineColor = parseColor(pre.outlineColor);
        const preBoxShadow = pre.boxShadow;
        const preBorderColor = parseColor(pre.borderColor);
        const preBackgroundColor = parseColor(pre.backgroundColor);
        el.focus();
        const post = window.getComputedStyle(el);
        const hasOutline = post.outlineStyle !== 'none' && post.outlineWidth !== '0px';
        const hasBoxShadow = post.boxShadow !== 'none';
        const outlineChanged = preOutlineWidth !== post.outlineWidth
          || preOutlineStyle !== post.outlineStyle
          || colorDelta(preOutlineColor, parseColor(post.outlineColor)) > 30;
        const boxShadowChanged = preBoxShadow !== post.boxShadow;
        const borderChanged = colorDelta(preBorderColor, parseColor(post.borderColor)) > 30;
        const bgChanged = colorDelta(preBackgroundColor, parseColor(post.backgroundColor)) > 40;
        const hasMeaningfulIndicator = hasOutline || hasBoxShadow || outlineChanged || boxShadowChanged || borderChanged || bgChanged;
        return {
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300),
          hasMeaningfulIndicator
        };
      });
    }, max);

    if (!candidates.length) return [];

    const offenders = [];
    for (const item of candidates) {
      const visualDiff = this.options.enableVisualFocusChecks
        ? await this.getFocusVisualDiffScore(item.selector)
        : null;
      const passesVisual = typeof visualDiff === 'number' && visualDiff >= this.options.visualDiffMinRatio;
      if (!item.hasMeaningfulIndicator && !passesVisual) {
        offenders.push({
          selector: item.selector,
          html: item.html,
          visualDiff
        });
      }
    }

    if (!offenders.length) return [];

    return offenders.map((item) => buildIssue({
      impact: 'serious',
      ruleId: 'wcag-2.4.7',
      message: 'Focus indicator may be missing',
      description: 'Focused elements should have a visible indicator.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa', 'wcag247'],
      confidence: typeof item.visualDiff === 'number'
        ? (item.visualDiff < (this.options.visualDiffMinRatio / 2) ? 0.72 : 0.62)
        : 0.6,
      needsReview: true,
      evidence: typeof item.visualDiff === 'number' ? [`focusVisualDiffRatio=${item.visualDiff.toFixed(5)}`] : []
    }));
  }

  async getFocusVisualDiffScore(selector) {
    if (!selector) return null;
    try {
      const clip = await this.page.evaluate((sel) => {
        const el = sel ? document.querySelector(sel) : null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const pad = 6;
        const x = Math.max(0, Math.floor(rect.left - pad));
        const y = Math.max(0, Math.floor(rect.top - pad));
        const width = Math.max(1, Math.floor(rect.width + (pad * 2)));
        const height = Math.max(1, Math.floor(rect.height + (pad * 2)));
        const maxWidth = Math.max(1, window.innerWidth - x);
        const maxHeight = Math.max(1, window.innerHeight - y);
        return { x, y, width: Math.min(width, maxWidth), height: Math.min(height, maxHeight) };
      }, selector);
      if (!clip) return null;

      await this.page.evaluate(() => {
        const active = document.activeElement;
        if (active && typeof active.blur === 'function') active.blur();
      });
      await this.pause(30);
      const before = await this.page.screenshot({ clip, type: 'png' });
      await this.page.focus(selector);
      await this.pause(30);
      const after = await this.page.screenshot({ clip, type: 'png' });
      if (!before || !after) return null;
      const len = Math.min(before.length, after.length);
      if (!len) return null;
      let diff = 0;
      for (let i = 0; i < len; i += 1) {
        if (before[i] !== after[i]) diff += 1;
      }
      return diff / len;
    } catch (err) {
      return null;
    }
  }

  async checkFocusNotObscured() {
    return this.checkFocusObscured('wcag-2.4.11', 'Focused element may be obscured');
  }

  async checkFocusNotObscuredEnhanced() {
    return this.checkFocusObscured('wcag-2.4.12', 'Focused element may be obscured (enhanced)');
  }

  async checkFocusObscured(ruleId, message) {
    const max = this.options.maxFocusableChecks;
    const strict = ruleId === 'wcag-2.4.12';
    const results = await this.page.evaluate((limit, isStrict) => {
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
      const focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'))
        .filter((el) => el.tabIndex >= 0)
        .slice(0, limit);
      const offenders = [];
      focusables.forEach((el) => {
        try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
        el.focus();
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const points = [
          [rect.left + rect.width / 2, rect.top + rect.height / 2],
          [rect.left + 2, rect.top + 2],
          [rect.right - 2, rect.top + 2],
          [rect.left + 2, rect.bottom - 2],
          [rect.right - 2, rect.bottom - 2]
        ].filter(([x, y]) => x >= 0 && y >= 0 && x <= window.innerWidth - 1 && y <= window.innerHeight - 1);
        if (!points.length) return;
        let blockedCount = 0;
        let blockingHtml = null;
        points.forEach(([x, y]) => {
          const topEl = document.elementFromPoint(x, y);
          if (topEl && topEl !== el && !el.contains(topEl)) {
            blockedCount += 1;
            if (!blockingHtml && topEl.outerHTML) blockingHtml = topEl.outerHTML.slice(0, 200);
          }
        });
        const isObscured = isStrict ? blockedCount >= 2 : blockedCount === points.length;
        if (isObscured) {
          offenders.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300),
            blockedCount,
            samplePoints: points.length,
            blockingHtml
          });
        }
      });
      return offenders;
    }, max, strict);

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId,
      message,
      description: 'Focused element should not be hidden by overlays or fixed UI.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa'],
      confidence: strict ? 0.65 : 0.6,
      needsReview: true,
      evidence: [
        `blockedPoints=${item.blockedCount}/${item.samplePoints}`,
        item.blockingHtml ? `blockingElement=${item.blockingHtml.slice(0, 140)}` : 'blockingElement=unknown'
      ]
    }));
  }

  async checkPointerGestures() {
    const results = await this.page.evaluate(() => {
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
      const gestureTextHint = /\b(pinch|swipe|two fingers|drag to)\b/i;
      const interactive = Array.from(document.querySelectorAll('[ongesturestart], [ongesturechange], [ongestureend], [data-gesture], [aria-label], [title], button, [role="button"]'));
      return interactive
        .filter((el) => {
          const attrText = [
            el.getAttribute('aria-label') || '',
            el.getAttribute('title') || '',
            el.getAttribute('data-gesture') || '',
            el.textContent || ''
          ].join(' ');
          const hasGestureHandler = el.hasAttribute('ongesturestart') || el.hasAttribute('ongesturechange') || el.hasAttribute('ongestureend');
          return hasGestureHandler || gestureTextHint.test(attrText);
        })
        .map((el) => ({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        }))
        .slice(0, 10);
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.1',
      message: 'Pointer gesture interaction detected',
      description: 'Provide a single-pointer alternative where possible.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag251'],
      confidence: 0.4,
      needsReview: true
    }));
  }

  async checkPointerCancellation() {
    const results = await this.page.evaluate(() => {
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
      return Array.from(document.querySelectorAll('[onmousedown], [onpointerdown]'))
        .filter((el) => {
          const hasUpHandler = el.hasAttribute('onmouseup') || el.hasAttribute('onpointerup') || el.hasAttribute('onclick');
          const isInteractive = el.matches('button, a[href], [role="button"], [tabindex]');
          return isInteractive && !hasUpHandler;
        })
        .map((el) => ({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        }))
        .slice(0, 10);
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.2',
      message: 'Pointer cancellation may not be supported',
      description: 'Ensure pointer interactions can be cancelled before completion.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag252'],
      confidence: 0.35,
      needsReview: true
    }));
  }

  async checkMotionActuation() {
    const hasMotion = await this.page.evaluate(() => {
      const inlineMotion = !!document.querySelector('[ondeviceorientation], [ondevicemotion]');
      const scriptText = Array.from(document.querySelectorAll('script'))
        .map((s) => s.textContent || '')
        .join('\n')
        .slice(0, 20000);
      const scriptMentionsMotion = /DeviceMotionEvent|DeviceOrientationEvent|devicemotion|deviceorientation/.test(scriptText);
      return inlineMotion || scriptMentionsMotion;
    });

    if (!hasMotion) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.4',
      message: 'Motion-based interaction signals detected',
      description: 'Detected motion-event patterns; verify non-motion alternatives are available.',
      tags: ['wcag2a', 'wcag254'],
      confidence: 0.35,
      needsReview: true
    })];
  }

  async checkConcurrentInputMechanisms() {
    // Avoid always-on false positives. This SC usually needs task-based manual verification.
    return [];
  }

  checkConsistentNavigation(pageSnapshots = []) {
    if (!pageSnapshots.length) {
      return [buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-3.2.3',
        message: 'Consistent navigation requires multi-page review',
        description: 'Provide multiple pages to compare navigation consistency.',
        tags: ['wcag2aa', 'wcag323']
      })];
    }

    const signatures = pageSnapshots.map((page) => {
      const $ = cheerio.load(page.html || '');
      const links = $('nav a').map((_, el) => ($(el).text() || '').trim()).get();
      return Array.from(new Set(links)).sort().join('|');
    });

    const base = signatures[0] || '';
    const inconsistent = signatures.some((sig) => sig !== base);
    if (!inconsistent) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.3',
      message: 'Navigation differs between pages',
      description: 'Ensure navigation order and links are consistent across pages.',
      tags: ['wcag2aa', 'wcag323']
    })];
  }

  checkConsistentIdentification(pageSnapshots = []) {
    if (!pageSnapshots.length) {
      return [buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-3.2.4',
        message: 'Consistent identification requires multi-page review',
        description: 'Provide multiple pages to compare labels and controls.',
        tags: ['wcag2aa', 'wcag324']
      })];
    }

    const map = new Map();
    pageSnapshots.forEach((page) => {
      const $ = cheerio.load(page.html || '');
      $('a').each((_, el) => {
        const text = ($(el).text() || '').trim();
        const href = $(el).attr('href') || '';
        if (!text) return;
        const existing = map.get(text) || new Set();
        existing.add(href);
        map.set(text, existing);
      });
    });

    const inconsistent = Array.from(map.values()).some((hrefs) => hrefs.size > 1);
    if (!inconsistent) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.4',
      message: 'Link text maps to different destinations',
      description: 'Controls with the same label should have consistent behavior.',
      tags: ['wcag2aa', 'wcag324']
    })];
  }

  checkConsistentHelp(pageSnapshots = []) {
    if (!pageSnapshots.length) {
      return [buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-3.2.6',
        message: 'Consistent help requires multi-page review',
        description: 'Provide multiple pages to compare help mechanisms.',
        tags: ['wcag2a', 'wcag326']
      })];
    }

    const signatures = pageSnapshots.map((page) => {
      const $ = cheerio.load(page.html || '');
      const helpLinks = $('a').filter((_, el) => ($(el).text() || '').toLowerCase().includes('help')).length;
      return helpLinks > 0;
    });

    const base = signatures[0] || false;
    const inconsistent = signatures.some((sig) => sig !== base);
    if (!inconsistent) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.6',
      message: 'Help mechanisms differ across pages',
      description: 'Ensure help access is consistent on similar pages.',
      tags: ['wcag2a', 'wcag326']
    })];
  }

  async checkAudioControl() {
    const results = await this.page.evaluate(() => {
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
      const offenders = [];
      document.querySelectorAll('audio, video').forEach((el) => {
        const isAutoplay = el.hasAttribute('autoplay');
        const hasControls = el.hasAttribute('controls');
        if (isAutoplay && !hasControls) {
          offenders.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return offenders;
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-1.4.2',
      message: 'Autoplaying media may lack controls',
      description: 'Provide a mechanism to pause or stop audio that plays automatically.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag142']
    }));
  }
}

module.exports = { AblelyticsCoreTests };
