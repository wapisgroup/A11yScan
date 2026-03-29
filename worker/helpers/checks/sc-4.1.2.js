const { buildIssue } = require('./shared');

async function checkAccessibilityTreeNameRoleValue(page, options) {
  if (!options.includeAccessibilityTreeChecks || !page || !page.accessibility || typeof page.accessibility.snapshot !== 'function') {
    return [];
  }
  let tree;
  try {
    tree = await page.accessibility.snapshot({ interestingOnly: false });
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
  return issues.slice(0, options.maxIssuesPerRule);
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
