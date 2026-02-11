const cheerio = require('cheerio');

const DEFAULT_OPTIONS = {
  maxFocusableChecks: 20,
  maxTabSteps: 30,
  maxCodeLength: 500,
  impact: 'moderate',
  includeMultiPageChecks: false
};

function buildIssue({
  impact,
  message,
  selector,
  ruleId,
  description,
  helpUrl,
  tags,
  failureSummary,
  html,
  target,
  engine
}) {
  return {
    impact: impact || 'moderate',
    message,
    selector: selector || null,
    ruleId: ruleId || null,
    helpUrl: helpUrl || null,
    description: description || null,
    tags: tags || [],
    failureSummary: failureSummary || null,
    html: html || null,
    target: target || (selector ? [selector] : []),
    engine: engine || 'ablelytics-core'
  };
}

class AblelyticsCoreTests {
  constructor(page, options = {}) {
    this.page = page;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async runAll(pageSnapshots = []) {
    const issues = [];
    issues.push(...await this.checkKeyboardAccessible());
    issues.push(...await this.checkNoKeyboardTrap());
    issues.push(...await this.checkPauseStopHide());
    issues.push(...await this.checkDraggingMovements());
    issues.push(...await this.checkBypassBlocks());
    issues.push(...await this.checkFocusOrder());
    issues.push(...await this.checkFocusVisible());
    issues.push(...await this.checkFocusNotObscured());
    issues.push(...await this.checkFocusNotObscuredEnhanced());
    issues.push(...await this.checkPointerGestures());
    issues.push(...await this.checkPointerCancellation());
    issues.push(...await this.checkMotionActuation());
    issues.push(...await this.checkConcurrentInputMechanisms());
    if (this.options.includeMultiPageChecks) {
      issues.push(...this.checkConsistentNavigation(pageSnapshots));
      issues.push(...this.checkConsistentIdentification(pageSnapshots));
      issues.push(...this.checkConsistentHelp(pageSnapshots));
    }
    issues.push(...await this.checkAudioControl());
    return issues;
  }

  async checkKeyboardAccessible() {
    const candidates = await this.page.evaluate(() => {
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
        const hasClick = typeof el.onclick === 'function' || el.hasAttribute('onclick');
        const hasRole = el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
        const isFocusable = focusableSelectors.some((sel) => el.matches(sel)) || el.tabIndex >= 0;
        if ((hasClick || hasRole) && !isFocusable) {
          results.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return results.slice(0, 20);
    });

    if (!candidates.length) return [];

    return candidates.map((item, idx) => buildIssue({
      impact: 'serious',
      ruleId: 'wcag-2.1.1',
      message: 'Interactive element may not be keyboard accessible',
      description: 'Element appears clickable but is not focusable via keyboard.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag211']
    }));
  }

  async checkNoKeyboardTrap() {
    const maxTabSteps = this.options.maxTabSteps;
    const stuck = await this.page.evaluate(async (steps) => {
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

      const getActiveSignature = () => {
        const el = document.activeElement;
        if (!el) return 'none';
        return [el.tagName, el.id, el.className].join('|');
      };

      const getActiveInfo = () => {
        const el = document.activeElement;
        if (!el) return { selector: null, html: null };
        return {
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
        };
      };

      let last = getActiveSignature();
      let stableCount = 0;
      let lastInfo = getActiveInfo();
      for (let i = 0; i < steps; i += 1) {
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.dispatchEvent(event);
        await new Promise((resolve) => setTimeout(resolve, 20));
        const current = getActiveSignature();
        if (current === last) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        last = current;
        lastInfo = getActiveInfo();
      }
      return stableCount >= 3 ? lastInfo : null;
    }, maxTabSteps);

    if (!stuck) return [];

    return [buildIssue({
      impact: 'serious',
      ruleId: 'wcag-2.1.2',
      message: 'Possible keyboard trap detected',
      description: 'Focus did not move after repeated Tab attempts.',
      selector: stuck.selector,
      html: stuck.html,
      tags: ['wcag2a', 'wcag212']
    })];
  }

  async checkPauseStopHide() {
    const results = await this.page.evaluate(() => {
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

  async checkDraggingMovements() {
    const results = await this.page.evaluate(() => {
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
      return Array.from(document.querySelectorAll('[draggable="true"]')).map((el) => ({
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        html: el.outerHTML.slice(0, 300)
      }));
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.7',
      message: 'Dragging interaction detected',
      description: 'Drag-only interactions may need an alternative input method.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa', 'wcag257']
    }));
  }

  async checkBypassBlocks() {
    const hasSkip = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="#"]'));
      return links.some((a) => (a.textContent || '').toLowerCase().includes('skip'));
    });

    if (hasSkip) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.1',
      message: 'No skip link detected',
      description: 'Provide a mechanism to bypass repeated blocks of content.',
      tags: ['wcag2a', 'wcag241']
    })];
  }

  async checkFocusOrder() {
    const results = await this.page.evaluate(() => {
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

  async checkFocusVisible() {
    const max = this.options.maxFocusableChecks;
    const results = await this.page.evaluate((limit) => {
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
      const offenders = [];
      focusables.forEach((el) => {
        el.focus();
        const style = window.getComputedStyle(el);
        const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
        const hasBoxShadow = style.boxShadow !== 'none';
        if (!hasOutline && !hasBoxShadow) {
          offenders.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return offenders;
    }, max);

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'serious',
      ruleId: 'wcag-2.4.7',
      message: 'Focus indicator may be missing',
      description: 'Focused elements should have a visible indicator.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa', 'wcag247']
    }));
  }

  async checkFocusNotObscured() {
    return this.checkFocusObscured('wcag-2.4.11', 'Focused element may be obscured');
  }

  async checkFocusNotObscuredEnhanced() {
    return this.checkFocusObscured('wcag-2.4.12', 'Focused element may be obscured (enhanced)');
  }

  async checkFocusObscured(ruleId, message) {
    const max = this.options.maxFocusableChecks;
    const results = await this.page.evaluate((limit) => {
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
      const offenders = [];
      focusables.forEach((el) => {
        el.focus();
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(x, y);
        if (topEl && topEl !== el && !el.contains(topEl)) {
          offenders.push({
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return offenders;
    }, max);

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId,
      message,
      description: 'Focused element should not be hidden by overlays or fixed UI.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aa']
    }));
  }

  async checkPointerGestures() {
    const results = await this.page.evaluate(() => {
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
      return Array.from(document.querySelectorAll('[ontouchstart], [onpointerdown], [style*="touch-action"]'))
        .map((el) => ({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        }));
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.1',
      message: 'Pointer gesture interaction detected',
      description: 'Provide a single-pointer alternative where possible.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag251']
    }));
  }

  async checkPointerCancellation() {
    const results = await this.page.evaluate(() => {
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
      return Array.from(document.querySelectorAll('[onmousedown]'))
        .filter((el) => !el.hasAttribute('onclick') && !el.hasAttribute('onmouseup'))
        .map((el) => ({
          selector: buildSelector(el) || el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 300)
        }));
    });

    if (!results.length) return [];

    return results.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.2',
      message: 'Pointer cancellation may not be supported',
      description: 'Ensure pointer interactions can be cancelled before completion.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag252']
    }));
  }

  async checkMotionActuation() {
    const hasMotion = await this.page.evaluate(() => {
      return !!(window.ondeviceorientation || window.ondevicemotion);
    });

    if (!hasMotion) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.4',
      message: 'Motion-based input detected',
      description: 'Provide a non-motion alternative for device motion input.',
      tags: ['wcag2a', 'wcag254']
    })];
  }

  async checkConcurrentInputMechanisms() {
    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.5.6',
      message: 'Concurrent input mechanisms require review',
      description: 'Verify content supports multiple input mechanisms without interference.',
      tags: ['wcag2aaa', 'wcag256']
    })];
  }

  checkConsistentNavigation(pageSnapshots = []) {
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

  checkConsistentIdentification(pageSnapshots = []) {
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

  checkConsistentHelp(pageSnapshots = []) {
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

  async checkAudioControl() {
    const results = await this.page.evaluate(() => {
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
}

module.exports = { AblelyticsCoreTests };
