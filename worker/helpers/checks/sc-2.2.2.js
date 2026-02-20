const { buildIssue } = require('./shared');

async function checkPauseStopHide(page, options) {
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

module.exports = { checkPauseStopHide };
