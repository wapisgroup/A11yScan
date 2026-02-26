/**
 * @file sc-2.1.2.js — No Keyboard Trap
 * WCAG SC 2.1.2: Focus is never trapped; the user can move away using standard keys.
 */
const { buildIssue, pause } = require('./shared');
const { DEFAULT_OPTIONS } = require('./shared');

async function checkNoKeyboardTrap(page, options) {
  const maxTabSteps = Math.max(8, Number(options.maxTabSteps) || DEFAULT_OPTIONS.maxTabSteps);
  const focusableCount = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    return candidates.filter((el) => {
      const style = window.getComputedStyle(el);
      return !el.disabled && style.visibility !== 'hidden' && style.display !== 'none';
    }).length;
  });

  if (focusableCount < 6) return [];

  await page.evaluate(() => {
    const active = document.activeElement;
    if (active && typeof active.blur === 'function') active.blur();
    if (document.body) {
      document.body.setAttribute('tabindex', '-1');
      document.body.focus();
    }
  });

  const getActiveInfo = async () => page.evaluate(() => {
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
      await page.keyboard.press(key, shift ? { shift: true } : undefined);
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
      trapped: stableCount >= 8 && seenSignatures.size <= 2,
      lastInfo
    };
  };

  const forward = await runDirection('Tab', false);
  const backward = await runDirection('Tab', true);
  const likelyTrapped = forward.trapped && backward.trapped;
  if (!likelyTrapped) return [];

  await page.keyboard.press('Escape');
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

module.exports = { checkNoKeyboardTrap };
