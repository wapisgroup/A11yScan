/**
 * @file sc-2.1.1.js — Keyboard Accessible
 * WCAG SC 2.1.1: All functionality is operable through a keyboard interface.
 */
const { buildIssue } = require('./shared');

async function checkKeyboardAccessible(page, options) {
  const candidates = await page.evaluate(() => {
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
      // Detect React synthetic events — check the props object for an actual click handler,
      // not just the presence of __reactProps$ which React attaches to all managed elements.
      const reactPropsKey = Object.keys(el).find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEvents$'));
      const reactProps = reactPropsKey ? el[reactPropsKey] : null;
      const hasReactHandler = !!(reactProps && (reactProps.onClick || reactProps.onClickCapture));
      // Detect Vue event handlers — use specific Vue 3 internal keys to avoid matching unrelated __v* properties.
      const hasVueHandler = !!(el.__vue_app__ || el.__vue__ || el._vnode || (el.__vueParentComponent && el.__vueParentComponent.props && (el.__vueParentComponent.props.onClick || el.__vueParentComponent.props.onClickCapture)));
      // Detect Angular
      const hasAngularHandler = el.hasAttribute('ng-click') || el.hasAttribute('(click)');

      const hasClick = typeof el.onclick === 'function'
        || el.hasAttribute('onclick')
        || hasReactHandler
        || hasVueHandler
        || hasAngularHandler;
      const hasRole = el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
      const isFocusable = focusableSelectors.some((sel) => el.matches(sel)) || el.tabIndex >= 0;
      const isNativeControl = el.matches('button, a[href], input, select, textarea');
      const hasKeyboardHandler = ['onkeydown', 'onkeypress', 'onkeyup'].some((attr) => el.hasAttribute(attr));
      const cursorPointer = window.getComputedStyle(el).cursor === 'pointer';
      const frameworkManagedLikely = Boolean(
        el.hasAttribute('aria-controls')
        || el.hasAttribute('aria-expanded')
        || el.hasAttribute('aria-haspopup')
        || el.hasAttribute('data-radix-collection-item')
        || el.hasAttribute('data-headlessui-state')
        || (el.className && /Mui|chakra|radix|headlessui/i.test(String(el.className)))
        || ((hasReactHandler || hasVueHandler || hasAngularHandler) && cursorPointer)
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

module.exports = { checkKeyboardAccessible };
