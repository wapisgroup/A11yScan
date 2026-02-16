const { buildIssue, pause } = require('./shared');

async function checkFocusVisible(page, options) {
  const max = options.maxFocusableChecks;

  // First, collect focusable element selectors and pre-focus styles
  const candidates = await page.evaluate((limit) => {
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

    // Check if any stylesheet uses :focus-visible rules
    let hasFocusVisibleRules = false;
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.selectorText && rule.selectorText.includes(':focus-visible')) {
              hasFocusVisibleRules = true;
              break;
            }
          }
        } catch (e) { /* cross-origin stylesheet */ }
        if (hasFocusVisibleRules) break;
      }
    } catch (e) {}

    const focusables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'))
      .filter((el) => el.tabIndex >= 0)
      .slice(0, limit);
    return {
      hasFocusVisibleRules,
      elements: focusables.map((el) => ({
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        html: el.outerHTML.slice(0, 300)
      }))
    };
  }, max);

  if (!candidates.elements.length) return [];

  // Use Tab key navigation to trigger :focus-visible heuristic (keyboard focus)
  // This ensures browsers apply :focus-visible styles correctly
  const offenders = [];
  const maxScreenshots = 5;
  let screenshotCount = 0;

  for (const item of candidates.elements) {
    // Navigate to element via Tab to trigger :focus-visible
    await page.keyboard.press('Tab');
    await pause(30);

    // Check CSS-based focus indicator on the currently focused element
    const focusCheck = await page.evaluate((targetSelector) => {
      const parseColor = (color) => {
        const m = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return null;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
      };
      const colorDelta = (c1, c2) => {
        if (!c1 || !c2) return 0;
        return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);
      };

      const active = document.activeElement;
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      // Only check if focus landed on our target element
      if (!active || !target || active !== target) {
        return { matched: false, hasMeaningfulIndicator: false };
      }

      // Capture focused styles
      const post = window.getComputedStyle(active);
      const hasOutline = post.outlineStyle !== 'none' && post.outlineWidth !== '0px';
      const hasBoxShadow = post.boxShadow !== 'none';

      // Blur to compare unfocused styles
      const preSnapshot = {
        outlineWidth: post.outlineWidth,
        outlineStyle: post.outlineStyle,
        outlineColor: parseColor(post.outlineColor),
        boxShadow: post.boxShadow,
        borderColor: parseColor(post.borderColor),
        backgroundColor: parseColor(post.backgroundColor)
      };
      active.blur();
      const pre = window.getComputedStyle(target);
      const outlineChanged = pre.outlineWidth !== preSnapshot.outlineWidth
        || pre.outlineStyle !== preSnapshot.outlineStyle
        || colorDelta(parseColor(pre.outlineColor), preSnapshot.outlineColor) > 30;
      const boxShadowChanged = pre.boxShadow !== preSnapshot.boxShadow;
      const borderChanged = colorDelta(parseColor(pre.borderColor), preSnapshot.borderColor) > 30;
      const bgChanged = colorDelta(parseColor(pre.backgroundColor), preSnapshot.backgroundColor) > 40;
      // Re-focus for next iteration
      target.focus();

      const hasMeaningfulIndicator = hasOutline || hasBoxShadow || outlineChanged || boxShadowChanged || borderChanged || bgChanged;
      return { matched: true, hasMeaningfulIndicator };
    }, item.selector);

    if (!focusCheck.matched) continue;
    if (focusCheck.hasMeaningfulIndicator) continue;

    // CSS check failed — only screenshot up to 5 elements (not 20)
    let visualDiff = null;
    if (options.enableVisualFocusChecks && screenshotCount < maxScreenshots) {
      visualDiff = await getFocusVisualDiffScore(page, item.selector, options);
      screenshotCount++;
    }
    const passesVisual = typeof visualDiff === 'number' && visualDiff >= options.visualDiffMinRatio;
    if (!passesVisual) {
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
      ? (item.visualDiff < (options.visualDiffMinRatio / 2) ? 0.72 : 0.62)
      : 0.6,
    needsReview: true,
    evidence: typeof item.visualDiff === 'number' ? [`focusVisualDiffRatio=${item.visualDiff.toFixed(5)}`] : []
  }));
}

async function getFocusVisualDiffScore(page, selector, options) {
  if (!selector) return null;
  try {
    const clip = await page.evaluate((sel) => {
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

    await page.evaluate(() => {
      const active = document.activeElement;
      if (active && typeof active.blur === 'function') active.blur();
    });
    await pause(30);
    const before = await page.screenshot({ clip, type: 'png' });
    await page.focus(selector);
    await pause(30);
    const after = await page.screenshot({ clip, type: 'png' });
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

module.exports = { checkFocusVisible, getFocusVisualDiffScore };
