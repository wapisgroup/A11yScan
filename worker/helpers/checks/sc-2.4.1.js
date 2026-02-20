/**
 * @file sc-2.4.1.js
 * WCAG 2.4.1 – Bypass Blocks
 * Checks for skip links and main landmarks that allow users to bypass
 * repeated content.
 */

const { buildIssue, pause } = require('./shared');

async function checkBypassBlocks(page, options) {
  const summary = await page.evaluate(() => {
    const buildSelector = (el) => {
      if (!el || !el.tagName) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      return el.tagName.toLowerCase();
    };
    const links = Array.from(document.querySelectorAll('a[href^="#"]'));
    const skipLinks = links
      .filter((a) => (a.textContent || '').toLowerCase().includes('skip'))
      .map((a) => ({
        selector: buildSelector(a) || 'a[href^="#"]',
        href: a.getAttribute('href') || ''
      }));
    const hasSkip = skipLinks.length > 0;
    const hasMainLandmark = Boolean(document.querySelector('main, [role="main"]'));
    const navLinks = Array.from(document.querySelectorAll('nav a, [role="navigation"] a')).length;
    return { hasSkip, hasMainLandmark, navLinks, skipLinks };
  });

  if (summary.hasMainLandmark || summary.hasSkip) return [];

  if (summary.hasSkip && summary.skipLinks.length > 0) {
    const first = summary.skipLinks[0];
    const validation = await page.evaluate((sel, href) => {
      const link = sel ? document.querySelector(sel) : null;
      if (!link) return { validTarget: false, targetId: null, activated: false };
      const targetId = (href || '').replace(/^#/, '');
      const target = targetId ? document.getElementById(targetId) : null;
      return {
        validTarget: !!target,
        targetId: targetId || null,
        activated: false
      };
    }, first.selector, first.href);

    if (!validation.validTarget) {
      return [buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-2.4.1',
        message: 'Skip link target could not be resolved',
        description: 'Skip link exists but its target id was not found on the page.',
        selector: first.selector,
        tags: ['wcag2a', 'wcag241'],
        confidence: 0.8,
        needsReview: false
      })];
    }

    const before = await page.evaluate(() => ({
      scrollY: window.scrollY,
      hash: window.location.hash,
      activeId: document.activeElement && document.activeElement.id ? document.activeElement.id : null
    }));
    await page.focus(first.selector);
    await page.keyboard.press('Enter');
    await pause(100);
    const after = await page.evaluate((targetId) => {
      const target = targetId ? document.getElementById(targetId) : null;
      const active = document.activeElement;
      const focusMoved = !!(target && active && (active === target || target.contains(active)));
      return {
        scrollY: window.scrollY,
        hash: window.location.hash,
        focusMoved
      };
    }, validation.targetId);

    const movedByScroll = Math.abs((after.scrollY || 0) - (before.scrollY || 0)) > 12;
    const movedByHash = after.hash === `#${validation.targetId}` && after.hash !== before.hash;
    if (!after.focusMoved && !movedByScroll && !movedByHash) {
      return [buildIssue({
        impact: 'moderate',
        ruleId: 'wcag-2.4.1',
        message: 'Skip link did not move focus or viewport to target',
        description: 'Skip links should effectively bypass repeated content by moving focus or viewport to main content.',
        selector: first.selector,
        tags: ['wcag2a', 'wcag241'],
        confidence: 0.65,
        needsReview: true
      })];
    }

    return [];
  }

  if (summary.navLinks < 8) return [];

  return [buildIssue({
    impact: 'moderate',
    ruleId: 'wcag-2.4.1',
    message: 'Bypass mechanism not clearly detected',
    description: 'No skip link or main landmark detected on a page with repeated navigation links.',
    tags: ['wcag2a', 'wcag241'],
    confidence: 0.55,
    needsReview: true,
    evidence: [`Navigation links detected: ${summary.navLinks}`]
  })];
}

module.exports = { checkBypassBlocks };
