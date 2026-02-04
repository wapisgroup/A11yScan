# Accessibility Rules Index

Complete reference of all accessibility rules with descriptions, WCAG levels, and severity.

## Quick Reference

| Rule ID | Title | WCAG | Level | Severity |
|---------|-------|------|-------|----------|
| [button-name](#button-name) | Buttons must have discernible text | 4.1.2 | A | Critical |
| [color-contrast](#color-contrast) | Elements must have sufficient color contrast | 1.4.3, 1.4.6 | AA, AAA | Serious |
| [document-title](#document-title) | Documents must have a title element | 2.4.2 | A | Serious |
| [duplicate-id](#duplicate-id) | IDs must be unique | 4.1.1 | A | Critical |
| [frame-title](#frame-title) | Frames must have a title attribute | 4.1.2, 2.4.1 | A | Serious |
| [heading-order](#heading-order) | Heading levels should only increase by one | 1.3.1 | A | Moderate |
| [html-has-lang](#html-has-lang) | HTML element must have a lang attribute | 3.1.1 | A | Serious |
| [image-alt](#image-alt) | Images must have alternate text | 1.1.1 | A | Critical |
| [input-button-name](#input-button-name) | Input buttons must have discernible text | 4.1.2 | A | Critical |
| [label](#label) | Form elements must have labels | 1.3.1, 4.1.2 | A | Critical |
| [landmark-one-main](#landmark-one-main) | Page must contain exactly one main landmark | 1.3.1, 2.4.1 | A | Moderate |
| [link-name](#link-name) | Links must have discernible text | 2.4.4, 4.1.2 | A | Critical |
| [list](#list) | ul and ol must only contain li elements | 1.3.1 | A | Serious |
| [listitem](#listitem) | li elements must be in ul or ol | 1.3.1 | A | Serious |
| [meta-viewport](#meta-viewport) | Zooming and scaling must not be disabled | 1.4.4 | AA | Critical |
| [page-has-heading-one](#page-has-heading-one) | Page must have a level-one heading | 1.3.1, 2.4.6 | A, AA | Moderate |
| [aria-valid-attr-value](#aria-valid-attr-value) | ARIA attribute values must be valid | 4.1.2 | A | Critical |

## Rules by Category

### Critical Issues (Must Fix Immediately)
These rules identify accessibility barriers that prevent users from accessing content.

- **button-name** - Buttons without accessible names cannot be used by screen reader users
- **duplicate-id** - Breaks form labels, ARIA relationships, and assistive technologies
- **image-alt** - Images without alt text are invisible to screen reader users
- **input-button-name** - Input buttons without names cannot be identified
- **label** - Form fields without labels are unusable for screen reader users
- **link-name** - Links without text cannot be activated or understood
- **meta-viewport** - Prevents users from zooming to read content
- **aria-valid-attr-value** - Invalid ARIA values break assistive technology features

### Serious Issues (High Priority)
These rules identify significant accessibility problems that affect many users.

- **color-contrast** - Insufficient contrast makes text unreadable for many users
- **document-title** - Pages without titles are difficult to identify and navigate
- **frame-title** - Frames without titles confuse screen reader users
- **html-has-lang** - Missing language causes incorrect pronunciation and translation
- **list** - Broken list structure confuses navigation and semantic understanding
- **listitem** - Orphaned list items break document structure

### Moderate Issues (Important)
These rules identify issues that reduce usability but don't completely block access.

- **heading-order** - Skipped heading levels confuse document structure
- **landmark-one-main** - Missing main landmark reduces navigation efficiency
- **page-has-heading-one** - Page without H1 lacks clear topic identification

## Rules by WCAG Principle

### Perceivable
Information and user interface components must be presentable to users in ways they can perceive.

- **color-contrast** (1.4.3, 1.4.6)
- **image-alt** (1.1.1)
- **meta-viewport** (1.4.4)

### Operable
User interface components and navigation must be operable.

- **button-name** (4.1.2)
- **document-title** (2.4.2)
- **frame-title** (4.1.2, 2.4.1)
- **input-button-name** (4.1.2)
- **link-name** (2.4.4, 4.1.2)

### Understandable
Information and the operation of user interface must be understandable.

- **heading-order** (1.3.1)
- **html-has-lang** (3.1.1)
- **label** (1.3.1, 4.1.2)
- **landmark-one-main** (1.3.1, 2.4.1)
- **list** (1.3.1)
- **listitem** (1.3.1)
- **page-has-heading-one** (1.3.1, 2.4.6)

### Robust
Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

- **aria-valid-attr-value** (4.1.2)
- **duplicate-id** (4.1.1)

## Rules by Component Type

### Text & Typography
- color-contrast
- heading-order
- page-has-heading-one

### Forms & Inputs
- label
- input-button-name

### Interactive Elements
- button-name
- link-name

### Page Structure
- document-title
- html-has-lang
- landmark-one-main
- meta-viewport

### Lists & Navigation
- list
- listitem

### Images & Media
- image-alt
- frame-title

### Technical
- aria-valid-attr-value
- duplicate-id

## Detailed Rule Descriptions

### button-name
**Severity:** Critical | **WCAG:** 4.1.2 (Level A)

Ensures all `<button>` elements and elements with button roles have accessible names through text content, aria-label, or aria-labelledby.

**Common Fixes:**
- Add text inside button elements
- Use aria-label for icon buttons
- Provide alt text for image buttons

---

### color-contrast
**Severity:** Serious | **WCAG:** 1.4.3 (Level AA), 1.4.6 (Level AAA)

Ensures text has sufficient color contrast against background (4.5:1 for normal text, 3:1 for large text at Level AA).

**Common Fixes:**
- Darken text or lighten background
- Use contrast checking tools
- Test with different color combinations

---

### document-title
**Severity:** Serious | **WCAG:** 2.4.2 (Level A)

Ensures every page has a non-empty `<title>` element that describes the page content.

**Common Fixes:**
- Add descriptive title in document head
- Update title dynamically in SPAs
- Use unique titles for each page

---

### duplicate-id
**Severity:** Critical | **WCAG:** 4.1.1 (Level A)

Ensures all id attribute values are unique to prevent issues with form labels, ARIA relationships, and JavaScript selectors.

**Common Fixes:**
- Use unique IDs for each element
- Generate IDs programmatically for dynamic content
- Use classes instead of IDs for styling

---

### frame-title
**Severity:** Serious | **WCAG:** 4.1.2 (Level A), 2.4.1 (Level A)

Ensures all `<iframe>` and `<frame>` elements have a title attribute describing their content.

**Common Fixes:**
- Add descriptive title to all iframes
- Make titles unique for multiple frames
- Update titles when frame content changes

---

### heading-order
**Severity:** Moderate | **WCAG:** 1.3.1 (Level A)

Ensures heading levels only increase by one (e.g., H1→H2→H3) to maintain document outline structure.

**Common Fixes:**
- Don't skip heading levels
- Use CSS for visual styling, not heading levels
- Follow sequential order when increasing levels

---

### html-has-lang
**Severity:** Serious | **WCAG:** 3.1.1 (Level A)

Ensures the `<html>` element has a lang attribute identifying the page's primary language.

**Common Fixes:**
- Add lang attribute to html element
- Use correct ISO 639-1 language codes
- Update lang dynamically for multi-language sites

---

### image-alt
**Severity:** Critical | **WCAG:** 1.1.1 (Level A)

Ensures all images have alt text that describes their content or purpose.

**Common Fixes:**
- Add descriptive alt text to images
- Use empty alt for decorative images
- Provide context-appropriate descriptions

---

### input-button-name
**Severity:** Critical | **WCAG:** 4.1.2 (Level A)

Ensures input elements with type="button", "submit", or "reset" have accessible names through value or aria-label attributes.

**Common Fixes:**
- Add value attribute to input buttons
- Use alt attribute for input type="image"
- Add aria-label for icon buttons

---

### label
**Severity:** Critical | **WCAG:** 1.3.1 (Level A), 4.1.2 (Level A)

Ensures all form input elements have associated labels for screen reader users.

**Common Fixes:**
- Add `<label>` with for attribute
- Wrap inputs in label elements
- Use aria-label or aria-labelledby

---

### landmark-one-main
**Severity:** Moderate | **WCAG:** 1.3.1 (Level A), 2.4.1 (Level A)

Ensures page has exactly one `<main>` landmark or role="main" to identify primary content.

**Common Fixes:**
- Add single `<main>` element
- Don't nest main in other landmarks
- Remove duplicate main landmarks

---

### link-name
**Severity:** Critical | **WCAG:** 2.4.4 (Level A), 4.1.2 (Level A)

Ensures all links have discernible text so users understand their purpose and destination.

**Common Fixes:**
- Add text inside link elements
- Use aria-label for icon links
- Provide alt text for image links

---

### list
**Severity:** Serious | **WCAG:** 1.3.1 (Level A)

Ensures `<ul>` and `<ol>` elements only contain `<li>`, `<script>`, or `<template>` as direct children.

**Common Fixes:**
- Move wrapper elements inside li
- Only use li as direct children of ul/ol
- Nest sublists inside parent li elements

---

### listitem
**Severity:** Serious | **WCAG:** 1.3.1 (Level A)

Ensures `<li>` elements are only used inside `<ul>`, `<ol>`, or `<menu>` elements.

**Common Fixes:**
- Wrap orphaned li elements in ul or ol
- Fix broken list structures
- Use proper semantic HTML instead of li for styling

---

### meta-viewport
**Severity:** Critical | **WCAG:** 1.4.4 (Level AA)

Ensures viewport meta tag doesn't prevent users from zooming (no user-scalable=no or maximum-scale<2).

**Common Fixes:**
- Remove user-scalable=no
- Remove or increase maximum-scale
- Allow default browser zoom behavior

---

### page-has-heading-one
**Severity:** Moderate | **WCAG:** 1.3.1 (Level A), 2.4.6 (Level AA)

Ensures every page has exactly one `<h1>` element that identifies the page's main topic.

**Common Fixes:**
- Add h1 to page
- Make sure h1 describes page content
- Update h1 dynamically in SPAs

---

### aria-valid-attr-value
**Severity:** Critical | **WCAG:** 4.1.2 (Level A)

Ensures ARIA attribute values conform to valid types (booleans must be "true"/"false", tokens must be from allowed lists, etc).

**Common Fixes:**
- Use string "true"/"false" for boolean attributes
- Verify ID references exist
- Use only valid token values from ARIA spec

---

## Implementation Priority

### Phase 1: Critical Blockers
Fix these first as they completely block access for some users:
1. label
2. button-name
3. input-button-name
4. link-name
5. image-alt
6. duplicate-id
7. meta-viewport
8. aria-valid-attr-value

### Phase 2: High Impact
Fix these next as they significantly affect usability:
1. html-has-lang
2. document-title
3. color-contrast
4. frame-title
5. list
6. listitem

### Phase 3: Structure & Navigation
Improve overall structure:
1. page-has-heading-one
2. landmark-one-main
3. heading-order

## Testing Checklist

✓ All images have appropriate alt text  
✓ All form inputs have labels  
✓ All buttons and links have accessible names  
✓ Page has title and lang attribute  
✓ Color contrast meets WCAG AA (4.5:1 minimum)  
✓ IDs are unique across the page  
✓ Heading levels don't skip  
✓ Page has one H1 and one main landmark  
✓ List structure is semantically correct  
✓ Zooming is not disabled  
✓ All ARIA values are valid  
✓ Frames have descriptive titles  

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Deque University](https://dequeuniversity.com/rules/)
- [WebAIM Resources](https://webaim.org/resources/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Contributing

To add a new rule, create a markdown file in `/accessibility-rules/rules/` following this structure:

1. Title and metadata (Rule ID, WCAG, Severity)
2. Issue Description
3. Why It Matters (with real-world scenario)
4. How to Fix (5+ solutions with code examples)
5. Rule Description
6. Common Mistakes
7. Examples by use case
8. Testing section
9. Resources
10. Related Rules

See existing rules for detailed templates.
