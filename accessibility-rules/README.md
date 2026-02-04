# Accessibility Rules Documentation

This directory contains comprehensive accessibility rule documentation that can be used across the worker, dashboard, and public website.

## Structure

```
accessibility-rules/
├── rules/              # Markdown files for each accessibility rule
│   ├── link-name.md
│   ├── image-alt.md
│   ├── color-contrast.md
│   └── ...
├── rules-service.js    # Service to read and parse rules
└── README.md          # This file
```

## Rule Format

Each rule is documented in Markdown with the following sections:

1. **Title** - Clear, concise rule name
2. **Metadata** - Rule ID, WCAG criteria, Severity
3. **Issue Description** - What the problem is
4. **Why It Matters** - Impact on users
5. **How to Fix** - Step-by-step solutions with code examples
6. **Rule Description** - Technical details
7. **Common Mistakes** - Examples of what NOT to do
8. **Testing** - How to test for compliance
9. **Resources** - Links to WCAG, WebAIM, etc.
10. **Related Rules** - Connected accessibility rules

## Usage

### In Node.js (Worker, Functions)

```javascript
const rulesService = require('./rules-service');

// Get a single rule
const rule = await rulesService.getRule('link-name');
console.log(rule.title);
console.log(rule.howToFix);

// Get all rules
const allRules = await rulesService.getAllRules();

// Get rules by severity
const criticalRules = await rulesService.getRulesBySeverity('critical');

// Get rules by WCAG level
const levelAARules = await rulesService.getRulesByWCAGLevel('AA');

// Search rules
const linkRules = await rulesService.searchRules('link');

// Get rule as HTML for web display
const html = await rulesService.getRuleAsHTML('link-name');
```

### In Next.js/React (Dashboard, Public Website)

```javascript
// Create an API route
// app/api/rules/[ruleId]/route.ts
import { AccessibilityRulesService } from '@/accessibility-rules/rules-service';
import path from 'path';

const rulesService = new AccessibilityRulesService(
  path.join(process.cwd(), 'accessibility-rules/rules')
);

export async function GET(req, { params }) {
  const rule = await rulesService.getRule(params.ruleId);
  return Response.json(rule);
}
```

```javascript
// Use in a component
'use client';

import { useEffect, useState } from 'react';

export function RuleDisplay({ ruleId }) {
  const [rule, setRule] = useState(null);
  
  useEffect(() => {
    fetch(`/api/rules/${ruleId}`)
      .then(res => res.json())
      .then(setRule);
  }, [ruleId]);
  
  if (!rule) return <div>Loading...</div>;
  
  return (
    <article>
      <h1>{rule.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: rule.howToFix }} />
    </article>
  );
}
```

### Rule Object Structure

```javascript
{
  ruleId: 'link-name',
  title: 'Links must have discernible text',
  wcag: '2.4.4 Link Purpose (In Context) (Level A)',
  severity: 'Critical',
  description: 'Links do not have a discernible text value...',
  whyItMatters: 'Screen reader users cannot determine...',
  howToFix: 'Detailed solutions with code examples...',
  ruleDescription: 'Technical details about what is checked...',
  resources: [
    { title: 'WCAG 2.4.4', url: 'https://...' }
  ],
  relatedRules: [
    { ruleId: 'link-in-text-block', description: '...' }
  ],
  fullMarkdown: '... original markdown content ...'
}
```

## Adding New Rules

1. Create a new `.md` file in `/rules/` directory
2. Follow the template structure (see existing rules)
3. Include code examples for both bad and good practices
4. Add WCAG references and external resources
5. Test that the rule can be loaded via the service

### Template

```markdown
# Rule Title

**Rule ID:** `rule-id`  
**WCAG:** X.X.X Criterion Name (Level A/AA/AAA)  
**Severity:** Critical/Serious/Moderate/Minor

## Issue Description
[What is the problem?]

## Why It Matters
[Impact on users]

## How to Fix
[Solutions with code examples]

## Rule Description
[Technical details]

## Common Mistakes
[Examples of what not to do]

## Testing
[How to test for this issue]

## Resources
- [Link title](URL)

## Related Rules
- `rule-id` - Description
```

## Severity Levels

- **Critical** - Prevents access to content or functionality
- **Serious** - Significant barrier to access
- **Moderate** - Noticeable impact but workarounds available
- **Minor** - Minimal impact on accessibility

## WCAG Levels

- **Level A** - Minimum level of conformance
- **Level AA** - Standard target for most websites
- **Level AAA** - Enhanced accessibility

## Current Rules (29 Total)

### Completed Rules

#### ARIA Rules (9)
- `aria-allowed-attr` - ARIA attributes must be allowed for the element's role
- `aria-allowed-role` - ARIA role must be appropriate for element
- `aria-hidden-focus` - aria-hidden elements must not contain focusable elements
- `aria-required-attr` - Elements with ARIA roles must have all required attributes
- `aria-required-children` - Elements with ARIA roles must have required children
- `aria-required-parent` - Elements with ARIA roles must have required parent
- `aria-roles` - ARIA roles must be valid
- `aria-valid-attr` - ARIA attributes must exist in spec
- `aria-valid-attr-value` - ARIA attribute values must be valid

#### Form & Input Rules (3)
- `label` - Form elements must have labels
- `input-button-name` - Input buttons must have accessible names
- `button-name` - Buttons must have accessible names

#### Content & Media Rules (4)
- `image-alt` - Images must have alternate text
- `link-name` - Links must have discernible text
- `video-caption` - Video elements must have captions
- `frame-title` - Frames must have titles

#### Document Structure Rules (7)
- `document-title` - Documents must have titles
- `html-has-lang` - HTML element must have lang attribute
- `html-lang-valid` - HTML lang attribute must have valid value
- `page-has-heading-one` - Pages must have h1
- `heading-order` - Heading levels should not be skipped
- `empty-heading` - Headings must have discernible text
- `duplicate-id` - IDs must be unique

#### Lists & Landmarks (3)
- `list` - Lists must only contain list items
- `listitem` - List items must be in lists
- `landmark-one-main` - Page must have one main landmark

#### Navigation & Interaction (3)
- `bypass` - Pages must have mechanism to bypass repeated blocks
- `tabindex` - Avoid positive tabindex values
- `color-contrast` - Elements must have sufficient color contrast
- `meta-viewport` - Zooming must not be disabled

### Missing Rules (Still to be Created)

#### Form & Input Rules (2)
- `input-image-alt` - Image inputs must have alt text
- `autocomplete-valid` - Autocomplete attribute must have valid value
- `form-field-multiple-labels` - Form fields should not have multiple label elements

#### Table Rules (5)
- `table-duplicate-name` - Tables must not have duplicate names
- `td-headers-attr` - Table data cells with headers attribute must reference valid headers
- `th-has-data-cells` - Table header cells must have data cells they describe
- `scope-attr-valid` - Scope attribute must be used correctly
- `td-has-header` - Non-empty data cells must have table headers

#### Media Rules (3)
- `audio-caption` - Audio-only content must have captions/transcripts
- `area-alt` - Image map areas must have alt text
- `object-alt` - Object elements must have text alternative

#### Landmark & Region Rules (3)
- `region` - All page content must be contained in landmarks
- `landmark-unique` - Landmarks must have unique labels when multiple of same type exist
- `scrollable-region-focusable` - Scrollable regions must be keyboard accessible

#### Language Rules (1)
- `valid-lang` - lang attributes must have valid values (on any element)

#### List Rules (2)
- `definition-list` - Definition lists must only contain dt and dd elements
- `dlitem` - Definition list items must be in definition lists

#### Deprecated Elements (3)
- `blink` - Blinking elements are deprecated
- `marquee` - Marquee elements must not be used
- `meta-refresh` - Pages must not auto-refresh

#### Keyboard & Focus Rules (3)
- `accesskeys` - accesskey attribute values must be unique
- `focus-order-semantics` - Elements in focus order must have appropriate role
- `nested-interactive` - Interactive elements must not be nested

### Rule Coverage Summary

- **Completed**: 24 rules (~42% of common accessibility rules)
- **Remaining**: 33 rules (~58% of common accessibility rules)
- **Total Target**: ~57 common accessibility rules

#### By Priority
- **Critical Priority Missing**: 8 rules (ARIA validation, media, forms)
- **High Priority Missing**: 12 rules (tables, landmarks, language)
- **Medium Priorit9 rules (~51% of common accessibility rules)
- **Remaining**: 28 rules (~49% of common accessibility rules)
- **Total Target**: ~57 common accessibility rules

#### By Priority
- **Critical Priority Missing**: 3 rules (

When the worker detects an accessibility issue, it can enrich the report with rule details:

```javascript
// In worker/handlers/scanPages.js
const rulesService = require('../../accessibility-rules/rules-service');

async function enrichViolation(violation) {
  try {
    const ruleDoc = await rulesService.getRuleSummary(violation.id);
    return {
      ...violation,
      ruleTitle: ruleDoc.title,
      severity: ruleDoc.severity,
      wcag: ruleDoc.wcag,
      learnMoreUrl: `/rules/${violation.id}`,
    };
  } catch (error) {
    console.error(`Rule not found: ${violation.id}`);
    return violation;
  }
}
```

## PDF Report Generation

Include rule documentation in PDF reports:

```javascript
const rulesService = require('./rules-service');

async function generatePDFSection(ruleId) {
  const rule = await rulesService.getRule(ruleId);
  
  return {
    title: rule.title,
    description: rule.description,
    howToFix: rule.howToFix,
    severity: rule.severity,
  };
}
```

## Caching

The service includes built-in caching to avoid re-reading files:

```javascript
// Clear cache if rules are updated
rulesService.clearCache();

// Or create a new instance with custom cache behavior
const { AccessibilityRulesService } = require('./rules-service');
const customService = new AccessibilityRulesService('./custom-rules-path');
```

## Contributing

When adding or updating rules:

1. Ensure consistent formatting
2. Include practical code examples
3. Add proper WCAG references
4. Test with the rules service
5. Update the rules list in this README

## License

These rule descriptions are educational resources. WCAG criteria are referenced from the W3C Web Content Accessibility Guidelines.
