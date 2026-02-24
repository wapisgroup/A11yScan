const { buildIssue } = require('./shared');

async function checkFocusObscuredCombined(page, options) {
  const max = options.maxFocusableChecks;
  const results = await page.evaluate((limit) => {
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
    const standardOffenders = [];
    const enhancedOffenders = [];
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
        if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
          const blockingStyle = window.getComputedStyle(topEl);
          const isSticky = blockingStyle.position === 'sticky' || blockingStyle.position === 'fixed';
          const isNav = topEl.matches('nav, header, [role="navigation"], [role="banner"]');
          if (isSticky || isNav) return;
          blockedCount += 1;
          if (!blockingHtml && topEl.outerHTML) blockingHtml = topEl.outerHTML.slice(0, 200);
        }
      });
      const item = {
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        html: el.outerHTML.slice(0, 300),
        blockedCount,
        samplePoints: points.length,
        blockingHtml
      };
      // Standard: all points blocked
      if (blockedCount === points.length) standardOffenders.push(item);
      // Enhanced: 2+ points blocked
      if (blockedCount >= 2) enhancedOffenders.push(item);
    });
    return { standardOffenders, enhancedOffenders };
  }, max);

  const issues = [];
  if (results.standardOffenders.length) {
    issues.push(...results.standardOffenders.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.11',
      message: 'Focused element may be obscured',
      description: 'Focused element should not be hidden by overlays or fixed UI.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa'],
      confidence: 0.6,
      needsReview: true,
      evidence: [
        `blockedPoints=${item.blockedCount}/${item.samplePoints}`,
        item.blockingHtml ? `blockingElement=${item.blockingHtml.slice(0, 140)}` : 'blockingElement=unknown'
      ]
    })));
  }
  if (results.enhancedOffenders.length) {
    issues.push(...results.enhancedOffenders.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.12',
      message: 'Focused element may be obscured (enhanced)',
      description: 'Focused element should not be hidden by overlays or fixed UI.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa'],
      confidence: 0.65,
      needsReview: true,
      evidence: [
        `blockedPoints=${item.blockedCount}/${item.samplePoints}`,
        item.blockingHtml ? `blockingElement=${item.blockingHtml.slice(0, 140)}` : 'blockingElement=unknown'
      ]
    })));
  }
  return issues;
}

module.exports = { checkFocusObscuredCombined };
