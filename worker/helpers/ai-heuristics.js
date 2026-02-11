const DEFAULT_OPTIONS = {
  maxFindingsPerRule: 10,
  includeScreenshot: false
};

function buildIssue({
  impact,
  message,
  selector,
  ruleId,
  description,
  tags,
  html,
  evidence,
  confidence,
  aiHowToFix
}) {
  return {
    impact: impact || 'moderate',
    message,
    selector: selector || null,
    ruleId: ruleId || null,
    description: description || null,
    tags: tags || [],
    html: html || null,
    evidence: evidence || [],
    confidence: typeof confidence === 'number' ? confidence : 0.5,
    needsReview: true,
    engine: 'ai-heuristics',
    aiHowToFix: aiHowToFix || null
  };
}

class AblelyticsAiHeuristics {
  constructor(page, options = {}) {
    this.page = page;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async runAll() {
    const apiKey = process.env.AI_API_KEY;
    if (apiKey) {
      const modelIssues = await this.runModel();
      if (modelIssues.length > 0) return modelIssues;
    }

    const issues = [];
    issues.push(...await this.checkSensoryCharacteristics());
    issues.push(...await this.checkMultipleWays());
    issues.push(...await this.checkAbbreviations());
    issues.push(...await this.checkReadingLevel());
    issues.push(...await this.checkHelpAvailability());
    issues.push(...await this.checkAccessibleAuthentication());
    return issues;
  }

  async runModel() {
    const context = await this.buildPageContext();
    const screenshotDataUrl = this.options.includeScreenshot
      ? await this.captureScreenshot()
      : null;

    const response = await callOpenAiModel(context, screenshotDataUrl);
    const aiIssues = extractIssuesFromResponse(response);
    const enrichedIssues = enrichIssuesWithContext(aiIssues, context);

    if (!enrichedIssues.length) return [];

    return enrichedIssues.map((issue) => {
      const ruleId = normalizeScToRuleId(issue.sc);
      const tags = buildTagsFromSc(issue.sc);
      return buildIssue({
        impact: issue.impact || 'moderate',
        ruleId,
        message: issue.message,
        description: issue.description || null,
        selector: issue.selector || null,
        html: issue.html || null,
        tags,
        evidence: Array.isArray(issue.evidence) ? issue.evidence : [],
        confidence: typeof issue.confidence === 'number' ? issue.confidence : 0.5,
        aiHowToFix: issue.howToFix || null
      });
    });
  }

  async buildPageContext() {
    return this.page.evaluate(() => {
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

      const text = document.body ? (document.body.innerText || '') : '';
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((el) => ({
        level: el.tagName.toLowerCase(),
        text: (el.textContent || '').trim().slice(0, 200),
        selector: buildSelector(el) || el.tagName.toLowerCase(),
        html: el.outerHTML ? el.outerHTML.slice(0, 300) : null
      }));

      const forms = Array.from(document.querySelectorAll('form')).map((form) => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map((input) => {
          const label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
          return {
            type: input.tagName.toLowerCase(),
            inputType: input.getAttribute('type') || null,
            label: label.trim().slice(0, 120),
            selector: buildSelector(input) || input.tagName.toLowerCase(),
            html: input.outerHTML ? input.outerHTML.slice(0, 300) : null
          };
        });
        return { inputs: inputs.slice(0, 20) };
      });

      const links = Array.from(document.querySelectorAll('a')).map((a) => ({
        text: (a.textContent || '').trim().slice(0, 120),
        href: (a.getAttribute('href') || '').slice(0, 200),
        selector: buildSelector(a) || 'a',
        html: a.outerHTML ? a.outerHTML.slice(0, 300) : null
      })).slice(0, 50);

      const media = Array.from(document.querySelectorAll('audio, video')).map((el) => ({
        tag: el.tagName.toLowerCase(),
        autoplay: el.hasAttribute('autoplay'),
        controls: el.hasAttribute('controls'),
        src: (el.getAttribute('src') || '').slice(0, 200),
        tracks: Array.from(el.querySelectorAll('track')).map((t) => ({
          kind: t.getAttribute('kind') || '',
          srclang: t.getAttribute('srclang') || ''
        }))
      }));

      return {
        pageText: text.slice(0, 8000),
        headings: headings.slice(0, 40),
        forms: forms.slice(0, 10),
        links,
        media: media.slice(0, 10)
      };
    });
  }

  async captureScreenshot() {
    try {
      const buffer = await this.page.screenshot({ fullPage: true, type: 'jpeg', quality: 60 });
      const base64 = buffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (err) {
      return null;
    }
  }

  async checkSensoryCharacteristics() {
    const findings = await this.page.evaluate(() => {
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

      const patterns = [
        /\bclick the (red|green|blue|left|right)\b/i,
        /\bsee (above|below|left|right)\b/i,
        /\bto the (left|right)\b/i,
        /\bshown in (red|green|blue)\b/i,
        /\b(use|select) the (circle|square|triangle)\b/i
      ];

      const elements = Array.from(document.querySelectorAll('p, li, label, span, button, a'));
      const matches = [];
      elements.forEach((el) => {
        const text = (el.textContent || '').trim();
        if (!text) return;
        if (patterns.some((p) => p.test(text))) {
          matches.push({
            text: text.slice(0, 240),
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return matches.slice(0, 10);
    });

    if (!findings.length) return [];

    return findings.map((item) => buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-1.3.3',
      message: 'Instruction may rely on sensory characteristics',
      description: 'Instructions should not rely solely on shape, size, visual location, or orientation.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2a', 'wcag133'],
      evidence: [item.text],
      confidence: 0.55
    }));
  }

  async checkMultipleWays() {
    const summary = await this.page.evaluate(() => {
      const hasSearch = !!document.querySelector('input[type="search"], [role="search"], form[role="search"]');
      const hasSitemapLink = Array.from(document.querySelectorAll('a')).some((a) => {
        const text = (a.textContent || '').toLowerCase();
        return text.includes('sitemap') || text.includes('site map');
      });
      return { hasSearch, hasSitemapLink };
    });

    if (summary.hasSearch || summary.hasSitemapLink) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-2.4.5',
      message: 'Multiple ways to locate content not detected',
      description: 'Provide more than one way to locate content (e.g., search or sitemap).',
      tags: ['wcag2aa', 'wcag245'],
      evidence: ['No search form or sitemap link found'],
      confidence: 0.45
    })];
  }

  async checkAbbreviations() {
    const findings = await this.page.evaluate(() => {
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

      const elements = Array.from(document.querySelectorAll('p, li, span, label'));
      const matches = [];
      elements.forEach((el) => {
        if (el.querySelector('abbr[title]')) return;
        const text = (el.textContent || '').trim();
        if (!text) return;
        const abbrev = text.match(/\b[A-Z]{2,}\b/);
        if (abbrev) {
          matches.push({
            abbrev: abbrev[0],
            text: text.slice(0, 240),
            selector: buildSelector(el) || el.tagName.toLowerCase(),
            html: el.outerHTML.slice(0, 300)
          });
        }
      });
      return matches.slice(0, 10);
    });

    if (!findings.length) return [];

    return findings.map((item) => buildIssue({
      impact: 'minor',
      ruleId: 'wcag-3.1.4',
      message: 'Possible abbreviation without expansion',
      description: 'Provide expansions for abbreviations the first time they appear.',
      selector: item.selector,
      html: item.html,
      tags: ['wcag2aaa', 'wcag314'],
      evidence: [item.text],
      confidence: 0.4
    }));
  }

  async checkReadingLevel() {
    const metrics = await this.page.evaluate(() => {
      const text = document.body ? (document.body.innerText || '') : '';
      const words = text.match(/\b[\w']+\b/g) || [];
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

      const countSyllables = (word) => {
        const w = word.toLowerCase();
        if (w.length <= 3) return 1;
        const matches = w.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
      };

      let syllables = 0;
      words.forEach((w) => { syllables += countSyllables(w); });

      const wordCount = words.length || 1;
      const sentenceCount = sentences.length || 1;

      const asl = wordCount / sentenceCount;
      const asw = syllables / wordCount;
      const fleschKincaid = 0.39 * asl + 11.8 * asw - 15.59;

      return { wordCount, sentenceCount, fleschKincaid: Number(fleschKincaid.toFixed(1)) };
    });

    if (metrics.wordCount < 120) return [];

    if (metrics.fleschKincaid <= 12) return [];

    return [buildIssue({
      impact: 'minor',
      ruleId: 'wcag-3.1.5',
      message: 'Reading level may be advanced',
      description: 'Consider providing supplemental content for complex text.',
      tags: ['wcag2aaa', 'wcag315'],
      evidence: [`Estimated grade level: ${metrics.fleschKincaid}`, `Word count: ${metrics.wordCount}`],
      confidence: 0.35
    })];
  }

  async checkHelpAvailability() {
    const summary = await this.page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      if (!forms.length) return { hasForms: false, hasHelp: false };

      const helpTerms = ['help', 'support', 'contact', 'faq'];
      const hasHelp = Array.from(document.querySelectorAll('a, button')).some((el) => {
        const text = (el.textContent || '').toLowerCase();
        return helpTerms.some((t) => text.includes(t));
      });
      return { hasForms: true, hasHelp };
    });

    if (!summary.hasForms || summary.hasHelp) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.3.5',
      message: 'Help option not detected near forms',
      description: 'Provide help or instructions for users who need assistance with forms.',
      tags: ['wcag2aa', 'wcag335'],
      evidence: ['Forms present, no help/support link detected'],
      confidence: 0.4
    })];
  }

  async checkAccessibleAuthentication() {
    const summary = await this.page.evaluate(() => {
      const text = document.body ? (document.body.innerText || '').toLowerCase() : '';
      const hasPassword = !!document.querySelector('input[type="password"]');
      const hasCaptcha = text.includes('captcha') || !!document.querySelector('iframe[src*="captcha"], [class*="captcha"], [id*="captcha"]');
      const hasOtp = text.includes('one-time') || text.includes('otp') || text.includes('verification code');
      const hasSecurityQuestions = text.includes('security question');
      return { hasPassword, hasCaptcha, hasOtp, hasSecurityQuestions };
    });

    if (!summary.hasPassword) return [];

    if (!summary.hasCaptcha && !summary.hasOtp && !summary.hasSecurityQuestions) return [];

    return [buildIssue({
      impact: 'moderate',
      ruleId: 'wcag-3.3.8',
      message: 'Authentication may require cognitive or sensory steps',
      description: 'Ensure accessible authentication with alternatives to memory or sensory tasks.',
      tags: ['wcag2aa', 'wcag338'],
      evidence: [
        summary.hasCaptcha ? 'CAPTCHA detected' : null,
        summary.hasOtp ? 'OTP/verification code detected' : null,
        summary.hasSecurityQuestions ? 'Security question detected' : null
      ].filter(Boolean),
      confidence: 0.4
    })];
  }
}

function normalizeScToRuleId(sc) {
  if (!sc) return null;
  const trimmed = String(sc).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('wcag-')) return trimmed;
  return `wcag-${trimmed}`;
}

function buildTagsFromSc(sc) {
  if (!sc) return [];
  const digits = String(sc).replace(/[^0-9]/g, '');
  if (!digits) return [];
  return [`wcag${digits}`];
}

async function callOpenAiModel(context, screenshotDataUrl) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4.1-mini';

  const systemText = [
    'You are an accessibility analyst.',
    'Return only valid JSON with shape: {"issues": [{"sc": "3.1.4", "message": "...", "confidence": 0.7, "evidence": ["..."], "selector": "...", "html": "...", "impact": "moderate", "howToFix": "...", "fixedCode": "..."}] }.',
    'If the issue is tied to a specific element, include selector and html.',
    'Use only the SCs from this list:',
    '1.2.1-1.2.9, 1.3.3, 1.4.7, 1.4.8, 2.4.5, 2.4.8, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.2.5, 3.3.4, 3.3.5, 3.3.6, 3.3.7, 3.3.8, 3.3.9.',
    'If unsure, return an empty issues array.'
  ].join(' ');

  const userPayload = {
    context
  };

  const userContent = [{
    type: 'input_text',
    text: JSON.stringify(userPayload)
  }];

  if (screenshotDataUrl) {
    userContent.push({
      type: 'input_image',
      image_url: screenshotDataUrl
    });
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemText }] },
        { role: 'user', content: userContent }
      ],
      text: { format: { type: 'json_object' } }
    })
  });

  if (!res.ok) {
    let errorDetails = '';
    try {
      const errorText = await res.text();
      errorDetails = errorText ? ` - ${errorText}` : '';
    } catch (err) {
      errorDetails = '';
    }
    throw new Error(`AI API failed: ${res.status}${errorDetails}`);
  }

  return res.json();
}

function extractIssuesFromResponse(response) {
  if (!response) return [];
  const output = response.output || [];
  for (const item of output) {
    const content = item.content || [];
    for (const block of content) {
      if (block.type === 'output_text' && block.text) {
        try {
          const parsed = JSON.parse(block.text);
          return Array.isArray(parsed.issues) ? parsed.issues : [];
        } catch (err) {
          return [];
        }
      }
    }
  }
  return [];
}

function enrichIssuesWithContext(issues, context) {
  if (!Array.isArray(issues) || !context) return issues || [];
  const formInputs = Array.isArray(context.forms)
    ? context.forms.flatMap((form) => Array.isArray(form.inputs) ? form.inputs : [])
    : [];

  return issues.map((issue) => {
    if (issue.selector || issue.html) return issue;
    const sc = String(issue.sc || '');
    const isHelpSc = sc.includes('3.3.5');
    if (isHelpSc && formInputs.length) {
      const emptySubmit = formInputs.find((input) => {
        return (input.inputType || '').toLowerCase() === 'submit' && !input.label;
      });
      if (emptySubmit) {
        return {
          ...issue,
          selector: emptySubmit.selector || null,
          html: emptySubmit.html || null
        };
      }
    }
    return issue;
  });
}

module.exports = { AblelyticsAiHeuristics };
