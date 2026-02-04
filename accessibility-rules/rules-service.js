/**
 * Accessibility Rules Service
 * 
 * Provides a centralized way to access accessibility rule documentation
 * across the worker, dashboard, and public website.
 * 
 * Usage:
 *   const rulesService = require('./rules-service');
 *   const rule = await rulesService.getRule('link-name');
 *   const allRules = await rulesService.getAllRules();
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class AccessibilityRulesService {
  constructor(rulesDirectory) {
    if (rulesDirectory) {
      // Use explicitly provided directory
      this.rulesDirectory = rulesDirectory;
    } else {
      // Try to resolve from __dirname, handling both real paths and npm link symlinks
      let realPath;
      try {
        realPath = fsSync.realpathSync(__dirname);
      } catch (e) {
        realPath = __dirname;
      }
      this.rulesDirectory = path.join(realPath, 'rules');
    }
    this.cache = new Map();
  }

  /**
   * Get a single rule by ID
   * @param {string} ruleId - The rule identifier (e.g., 'link-name')
   * @returns {Promise<Object>} Parsed rule object
   */
  async getRule(ruleId) {
    // Check cache first
    if (this.cache.has(ruleId)) {
      return this.cache.get(ruleId);
    }

    try {
      const filePath = path.join(this.rulesDirectory, `${ruleId}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseMarkdown(content, ruleId);
      
      // Cache the result
      this.cache.set(ruleId, parsed);
      
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Rule not found: ${ruleId}`);
      }
      throw error;
    }
  }

  /**
   * Get all available rules
   * @returns {Promise<Array>} Array of all rule objects
   */
  async getAllRules() {
console.log(this.rulesDirectory);
    const files =  await fs.readdir(this.rulesDirectory);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const rules = await Promise.all(
      mdFiles.map(file => {
        const ruleId = file.replace('.md', '');
        return this.getRule(ruleId);
      })
    );
    
    return rules;
  }

  /**
   * Get rules by severity
   * @param {string} severity - 'critical', 'serious', 'moderate', 'minor'
   * @returns {Promise<Array>} Filtered rules
   */
  async getRulesBySeverity(severity) {
    const allRules = await this.getAllRules();
    return allRules.filter(rule => 
      rule.severity.toLowerCase() === severity.toLowerCase()
    );
  }

  /**
   * Get rules by WCAG level
   * @param {string} level - 'A', 'AA', 'AAA'
   * @returns {Promise<Array>} Filtered rules
   */
  async getRulesByWCAGLevel(level) {
    const allRules = await this.getAllRules();
    return allRules.filter(rule => 
      rule.wcag.includes(`Level ${level}`)
    );
  }

  /**
   * Search rules by keyword
   * @param {string} keyword - Search term
   * @returns {Promise<Array>} Matching rules
   */
  async searchRules(keyword) {
    const allRules = await this.getAllRules();
    const lowerKeyword = keyword.toLowerCase();
    
    return allRules.filter(rule => 
      rule.title.toLowerCase().includes(lowerKeyword) ||
      rule.description.toLowerCase().includes(lowerKeyword) ||
      rule.ruleId.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get rule summary (title, ID, severity only) - useful for listing
   * @param {string} ruleId - The rule identifier
   * @returns {Promise<Object>} Rule summary
   */
  async getRuleSummary(ruleId) {
    const rule = await this.getRule(ruleId);
    return {
      ruleId: rule.ruleId,
      title: rule.title,
      severity: rule.severity,
      wcag: rule.wcag,
    };
  }

  /**
   * Get all rule summaries
   * @returns {Promise<Array>} Array of rule summaries
   */
  async getAllRuleSummaries() {
    const allRules = await this.getAllRules();
    return allRules.map(rule => ({
      ruleId: rule.ruleId,
      title: rule.title,
      severity: rule.severity,
      wcag: rule.wcag,
    }));
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Parse markdown content into structured object
   * @param {string} markdown - The markdown content
   * @param {string} ruleId - The rule identifier
   * @returns {Object} Parsed rule object
   */
  parseMarkdown(markdown, ruleId) {
    const lines = markdown.split('\n');
    const rule = {
      ruleId,
      title: '',
      wcag: '',
      severity: '',
      description: '',
      whyItMatters: '',
      howToFix: '',
      ruleDescription: '',
      examples: [],
      resources: [],
      relatedRules: [],
      fullMarkdown: markdown,
    };

    let currentSection = null;
    let currentContent = [];

    const extractMetadata = (line) => {
      if (line.startsWith('**Rule ID:**')) {
        rule.ruleId = line.replace('**Rule ID:**', '').trim().replace(/`/g, '');
      } else if (line.startsWith('**WCAG:**')) {
        rule.wcag = line.replace('**WCAG:**', '').trim();
      } else if (line.startsWith('**Severity:**')) {
        rule.severity = line.replace('**Severity:**', '').trim();
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract title from first h1
      if (line.startsWith('# ') && !rule.title) {
        rule.title = line.replace('# ', '').trim();
        continue;
      }

      // Extract metadata
      if (line.startsWith('**Rule ID:**') || 
          line.startsWith('**WCAG:**') || 
          line.startsWith('**Severity:**')) {
        extractMetadata(line);
        continue;
      }

      // Detect sections
      if (line.startsWith('## Issue Description')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'description';
        currentContent = [];
        continue;
      } else if (line.startsWith('## Why It Matters')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'whyItMatters';
        currentContent = [];
        continue;
      } else if (line.startsWith('## How to Fix')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'howToFix';
        currentContent = [];
        continue;
      } else if (line.startsWith('## Rule Description')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'ruleDescription';
        currentContent = [];
        continue;
      } else if (line.startsWith('## Resources')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'resources';
        currentContent = [];
        continue;
      } else if (line.startsWith('## Related Rules')) {
        if (currentSection && currentContent.length > 0) {
          rule[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = 'relatedRules';
        currentContent = [];
        continue;
      }

      // Collect content for current section
      if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      rule[currentSection] = currentContent.join('\n').trim();
    }

    // Parse resources into array
    if (rule.resources) {
      rule.resources = rule.resources
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => {
          const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            return { title: match[1], url: match[2] };
          }
          return { title: line.replace('-', '').trim(), url: null };
        });
    }

    // Parse related rules into array
    if (rule.relatedRules) {
      rule.relatedRules = rule.relatedRules
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => {
          const match = line.match(/`([^`]+)`\s*-\s*(.+)/);
          if (match) {
            return { ruleId: match[1], description: match[2] };
          }
          return null;
        })
        .filter(Boolean);
    }

    return rule;
  }

  /**
   * Export rule as HTML (for web display)
   * @param {string} ruleId - The rule identifier
   * @returns {Promise<string>} HTML content
   */
  async getRuleAsHTML(ruleId) {
    const rule = await this.getRule(ruleId);
    
    // Simple markdown to HTML conversion
    // For production, consider using a proper markdown library like 'marked'
    let html = `
      <article class="accessibility-rule">
        <header>
          <h1>${rule.title}</h1>
          <div class="metadata">
            <span class="rule-id">Rule ID: <code>${rule.ruleId}</code></span>
            <span class="severity severity-${rule.severity.toLowerCase()}">${rule.severity}</span>
            <span class="wcag">${rule.wcag}</span>
          </div>
        </header>
        
        <section class="description">
          <h2>Issue Description</h2>
          ${this.markdownToHTML(rule.description)}
        </section>
        
        <section class="why-it-matters">
          <h2>Why It Matters</h2>
          ${this.markdownToHTML(rule.whyItMatters)}
        </section>
        
        <section class="how-to-fix">
          <h2>How to Fix</h2>
          ${this.markdownToHTML(rule.howToFix)}
        </section>
        
        <section class="rule-description">
          <h2>Rule Description</h2>
          ${this.markdownToHTML(rule.ruleDescription)}
        </section>
        
        ${rule.resources && rule.resources.length > 0 ? `
          <section class="resources">
            <h2>Resources</h2>
            <ul>
              ${rule.resources.map(r => 
                `<li><a href="${r.url}" target="_blank" rel="noopener">${r.title}</a></li>`
              ).join('')}
            </ul>
          </section>
        ` : ''}
        
        ${rule.relatedRules && rule.relatedRules.length > 0 ? `
          <section class="related-rules">
            <h2>Related Rules</h2>
            <ul>
              ${rule.relatedRules.map(r => 
                `<li><code>${r.ruleId}</code> - ${r.description}</li>`
              ).join('')}
            </ul>
          </section>
        ` : ''}
      </article>
    `;
    
    return html;
  }

  /**
   * Simple markdown to HTML converter
   * For production, use a proper library like 'marked' or 'markdown-it'
   */
  markdownToHTML(markdown) {
    if (!markdown) return '';
    
    return markdown
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Wrap in paragraph
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }
}

// For backward compatibility and simple usage, create singleton instance
// In Next.js/bundled environments, consumers should create their own instance
// with an explicit path due to __dirname transformation
const rulesService = new AccessibilityRulesService();

// Export singleton as default
module.exports = rulesService;

// Also export the class for custom instances
module.exports.AccessibilityRulesService = AccessibilityRulesService;
// Also export the class for custom instances
module.exports.AccessibilityRulesService = AccessibilityRulesService;
