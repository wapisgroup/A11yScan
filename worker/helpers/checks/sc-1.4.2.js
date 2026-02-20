/**
 * @file sc-1.4.2.js — Audio Control
 * WCAG SC 1.4.2: Provide a mechanism to pause or stop audio that plays automatically.
 */
const { buildIssue } = require('./shared');

async function checkAudioControl(page, options) {
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

module.exports = { checkAudioControl };
