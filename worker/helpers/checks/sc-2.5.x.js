/**
 * @file sc-2.5.x.js — Pointer/Motion Input (experimental)
 * WCAG SC 2.5.1 Pointer Gestures, 2.5.2 Pointer Cancellation,
 * 2.5.4 Motion Actuation, 2.5.6 Concurrent Input Mechanisms
 */
const { buildIssue } = require('./shared');

async function checkPointerGestures(page, options) {
  const results = await page.evaluate(() => {
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

async function checkPointerCancellation(page, options) {
  const results = await page.evaluate(() => {
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

async function checkMotionActuation(page, options) {
  const hasMotion = await page.evaluate(() => {
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

async function checkConcurrentInputMechanisms(page, options) {
  // Avoid always-on false positives. This SC usually needs task-based manual verification.
  return [];
}

module.exports = {
  checkPointerGestures,
  checkPointerCancellation,
  checkMotionActuation,
  checkConcurrentInputMechanisms
};
