/**
 * @file sc-3.2.x.js — Multi-page Consistency Checks
 * WCAG SC 3.2.3 Consistent Navigation, 3.2.4 Consistent Identification, 3.2.6 Consistent Help
 * These are synchronous cheerio-based checks (no Puppeteer page needed).
 */
const cheerio = require('cheerio');
const { buildIssue } = require('./shared');

function checkConsistentNavigation(pageSnapshots = []) {
  if (!pageSnapshots.length) {
    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.3',
      message: 'Consistent navigation requires multi-page review',
      description: 'Provide multiple pages to compare navigation consistency.',
      tags: ['wcag2aa', 'wcag323']
    })];
  }

  const signatures = pageSnapshots.map((page) => {
    const $ = cheerio.load(page.html || '');
    const links = $('nav a').map((_, el) => ($(el).text() || '').trim()).get();
    return Array.from(new Set(links)).sort().join('|');
  });

  const base = signatures[0] || '';
  const inconsistent = signatures.some((sig) => sig !== base);
  if (!inconsistent) return [];

  return [buildIssue({
    impact: 'moderate',
    ruleId: 'wcag-3.2.3',
    message: 'Navigation differs between pages',
    description: 'Ensure navigation order and links are consistent across pages.',
    tags: ['wcag2aa', 'wcag323']
  })];
}

function checkConsistentIdentification(pageSnapshots = []) {
  if (!pageSnapshots.length) {
    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.4',
      message: 'Consistent identification requires multi-page review',
      description: 'Provide multiple pages to compare labels and controls.',
      tags: ['wcag2aa', 'wcag324']
    })];
  }

  const map = new Map();
  pageSnapshots.forEach((page) => {
    const $ = cheerio.load(page.html || '');
    $('a').each((_, el) => {
      const text = ($(el).text() || '').trim();
      const href = $(el).attr('href') || '';
      if (!text) return;
      const existing = map.get(text) || new Set();
      existing.add(href);
      map.set(text, existing);
    });
  });

  const inconsistent = Array.from(map.values()).some((hrefs) => hrefs.size > 1);
  if (!inconsistent) return [];

  return [buildIssue({
    impact: 'moderate',
    ruleId: 'wcag-3.2.4',
    message: 'Link text maps to different destinations',
    description: 'Controls with the same label should have consistent behavior.',
    tags: ['wcag2aa', 'wcag324']
  })];
}

function checkConsistentHelp(pageSnapshots = []) {
  if (!pageSnapshots.length) {
    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.2.6',
      message: 'Consistent help requires multi-page review',
      description: 'Provide multiple pages to compare help mechanisms.',
      tags: ['wcag2a', 'wcag326']
    })];
  }

  const signatures = pageSnapshots.map((page) => {
    const $ = cheerio.load(page.html || '');
    const helpLinks = $('a').filter((_, el) => ($(el).text() || '').toLowerCase().includes('help')).length;
    return helpLinks > 0;
  });

  const base = signatures[0] || false;
  const inconsistent = signatures.some((sig) => sig !== base);
  if (!inconsistent) return [];

  return [buildIssue({
    impact: 'moderate',
    ruleId: 'wcag-3.2.6',
    message: 'Help mechanisms differ across pages',
    description: 'Ensure help access is consistent on similar pages.',
    tags: ['wcag2a', 'wcag326']
  })];
}

module.exports = {
  checkConsistentNavigation,
  checkConsistentIdentification,
  checkConsistentHelp
};
