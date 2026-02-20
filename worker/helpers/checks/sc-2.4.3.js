const { buildIssue } = require('./shared');

async function checkFocusOrder(page, options) {
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

module.exports = { checkFocusOrder };
