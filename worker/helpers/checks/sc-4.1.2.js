const { buildIssue } = require('./shared');

async function checkAccessibilityTreeNameRoleValue(page, options) {
  if (!options.includeAccessibilityTreeChecks) return [];

  const findings = await page.evaluate(() => {
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
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const hasAccessibleName = (el) => {
      if ((el.getAttribute('aria-label') || '').trim()) return true;
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ref = document.getElementById(labelledBy);
        if (ref && (ref.textContent || '').trim()) return true;
      }
      if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label && (label.textContent || '').trim()) return true;
      }
      const wrappingLabel = el.closest('label');
      if (wrappingLabel && (wrappingLabel.textContent || '').trim()) return true;
      if ((el.getAttribute('title') || '').trim()) return true;
      if ((el.getAttribute('placeholder') || '').trim()) return true;
      if ((el.textContent || '').trim()) return true;
      const img = el.querySelector('img[alt]');
      if (img && (img.getAttribute('alt') || '').trim()) return true;
      return false;
    };

    const ROLES_REQUIRING_NAME = ['button', 'link', 'tab', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'checkbox', 'radio', 'switch', 'textbox', 'combobox'];

    const results = [];

    ROLES_REQUIRING_NAME.forEach((role) => {
      document.querySelectorAll(`[role="${role}"]`).forEach((el) => {
        if (hasAccessibleName(el)) return;
        const missing = [];
        if (!el.getAttribute('aria-label')) missing.push('aria-label');
        if (!el.getAttribute('aria-labelledby')) missing.push('aria-labelledby');
        if (!(el.textContent || '').trim()) missing.push('visible text');
        results.push({ role, selector: buildSelector(el) || el.tagName.toLowerCase(), html: el.outerHTML.slice(0, 300), missing });
      });
    });

    // Native combobox (<select>) without a label
    document.querySelectorAll('select').forEach((el) => {
      if (hasAccessibleName(el)) return;
      results.push({ role: 'combobox', selector: buildSelector(el) || 'select', html: el.outerHTML.slice(0, 300), missing: ['aria-label', 'aria-labelledby', '<label>'] });
    });

    return results;
  });

  return findings.slice(0, options.maxIssuesPerRule).map((item) => buildIssue({
    impact: 'serious',
    ruleId: 'wcag-4.1.2',
    message: `Accessibility tree node with role "${item.role}" has no accessible name`,
    description: 'Interactive controls must expose a non-empty accessible name so assistive technologies can identify them.',
    selector: item.selector,
    html: item.html,
    tags: ['wcag2a', 'wcag412'],
    confidence: 0.85,
    needsReview: false,
    evidence: item.missing.length ? [`Missing: ${item.missing.join(', ')}`] : []
  }));
}

async function checkFrameworkAdapterScenarios(page, options, { frameworks }) {
  if (!frameworks.length) return [];
  const issues = [];
  try {
    if (frameworks.includes('radix') || frameworks.includes('headlessui') || frameworks.includes('reachui')) {
      issues.push(...await checkManagedMenuSemantics(page));
    }
    if (frameworks.includes('mui') || frameworks.includes('chakra') || frameworks.includes('bootstrap')) {
      issues.push(...await checkManagedDialogSemantics(page));
    }
  } catch (err) {
    console.warn('[ablelytics-core] framework adapter scenarios failed:', err && err.message ? err.message : err);
  }
  return issues;
}

async function checkManagedMenuSemantics(page) {
  const findings = await page.evaluate(() => {
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

async function checkManagedDialogSemantics(page) {
  const findings = await page.evaluate(() => {
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

module.exports = { checkAccessibilityTreeNameRoleValue, checkFrameworkAdapterScenarios };
