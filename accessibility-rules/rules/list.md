# `<ul>` and `<ol>` must only directly contain `<li>`, `<script>` or `<template>` elements

**Rule ID:** `list`  
**WCAG:** 1.3.1 Info and Relationships (Level A)  
**Severity:** Serious

## Issue Description

A `<ul>` or `<ol>` element contains children other than `<li>`, `<script>`, or `<template>` elements. This breaks the semantic list structure and confuses screen readers.

## Why It Matters

### Impact on Users

- **Screen reader users** rely on proper list structure to navigate and understand content
- **Keyboard navigation users** use list shortcuts that may not work correctly
- **All users** benefit from semantic HTML that conveys document structure
- **SEO** - Search engines use list markup to understand content organization

### Real-World Scenario

A screen reader announces: "List with 5 items" but only reads 3 items because div elements break the structure. The user is confused about missing items and cannot navigate the list properly using list shortcuts.

## How to Fix

### Solution 1: Only Use `<li>` as Direct Children

List elements should only directly contain list items.

**Bad Example:**
```html
<!-- FAIL - div directly in ul -->
<ul>
  <div>
    <li>Item 1</li>
    <li>Item 2</li>
  </div>
  <li>Item 3</li>
</ul>
```

**Good Example:**
```html
<!-- PASS - Only li elements -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Solution 2: Move Wrapper Elements Inside `<li>`

Place wrapper elements inside list items, not outside.

**Bad Example:**
```html
<!-- FAIL - span wrapping li -->
<ul>
  <span class="group">
    <li>Item 1</li>
    <li>Item 2</li>
  </span>
</ul>
```

**Good Example:**
```html
<!-- PASS - span inside li -->
<ul>
  <li><span class="group">Item 1</span></li>
  <li><span class="group">Item 2</span></li>
</ul>

<!-- Or wrap content, not li elements -->
<ul class="group">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Solution 3: Complex List Items

Put all content inside `<li>` elements.

**Bad Example:**
```html
<!-- FAIL - heading and p outside li -->
<ul>
  <h3>Section Title</h3>
  <p>Description</p>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

**Good Example:**
```html
<!-- PASS - All content in li -->
<ul>
  <li>
    <h3>Section Title</h3>
    <p>Description</p>
  </li>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Or use proper heading structure -->
<section>
  <h3>Section Title</h3>
  <p>Description</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</section>
```

### Solution 4: Nested Lists

Nest lists inside `<li>` elements.

**Bad Example:**
```html
<!-- FAIL - ul directly in ul -->
<ul>
  <li>Item 1</li>
  <ul>
    <li>Nested 1</li>
    <li>Nested 2</li>
  </ul>
</ul>
```

**Good Example:**
```html
<!-- PASS - Nested ul inside li -->
<ul>
  <li>Item 1
    <ul>
      <li>Nested 1</li>
      <li>Nested 2</li>
    </ul>
  </li>
  <li>Item 2</li>
</ul>
```

### Solution 5: Scripts and Templates are Allowed

`<script>` and `<template>` are valid direct children.

**Good Example:**
```html
<!-- PASS - script and template are allowed -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <script>
    // Analytics or tracking code
  </script>
  <template id="list-item-template">
    <li></li>
  </template>
</ul>
```

## Rule Description

This rule ensures `<ul>` and `<ol>` elements only contain valid children according to HTML specifications.

### What This Rule Checks

- Direct children of `<ul>` are only `<li>`, `<script>`, or `<template>`
- Direct children of `<ol>` are only `<li>`, `<script>`, or `<template>`
- No other elements appear as direct children

### What This Rule Does Not Check

- Content inside `<li>` elements (can be anything)
- Whether list semantics are appropriate for the content
- Visual styling of lists

### Best Practices

1. **Only li elements** - Use `<li>` as direct children
2. **Nest properly** - Put nested lists inside `<li>`
3. **Wrap inside li** - Place divs, spans inside `<li>`, not outside
4. **Semantic structure** - Use lists for actual lists of items
5. **Allowed exceptions** - Only `<script>` and `<template>` besides `<li>`

## Common Mistakes

### 1. Text Directly in List
```html
<!-- FAIL -->
<ul>
  Some text
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- PASS -->
<ul>
  <li>Some text</li>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### 2. Div Wrapper Around List Items
```html
<!-- FAIL -->
<ul>
  <div class="wrapper">
    <li>Item 1</li>
    <li>Item 2</li>
  </div>
</ul>

<!-- PASS -->
<ul class="wrapper">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### 3. Headings in Lists
```html
<!-- FAIL -->
<ul>
  <h4>List Title</h4>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- PASS - Option 1 -->
<section>
  <h4>List Title</h4>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</section>

<!-- PASS - Option 2 -->
<ul>
  <li>
    <h4>List Title</h4>
  </li>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### 4. Links or Buttons Outside List Items
```html
<!-- FAIL -->
<ul>
  <a href="/more">View More</a>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- PASS -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li><a href="/more">View More</a></li>
</ul>

<!-- Or separate from list -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
<a href="/more">View More</a>
```

### 5. Improper Nesting
```html
<!-- FAIL -->
<ul>
  <li>Item 1</li>
  <ol>
    <li>Nested 1</li>
  </ol>
</ul>

<!-- PASS -->
<ul>
  <li>Item 1
    <ol>
      <li>Nested 1</li>
    </ol>
  </li>
</ul>
```

## Correct List Structures

### Simple Unordered List
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

### Simple Ordered List
```html
<ol>
  <li>Step one</li>
  <li>Step two</li>
  <li>Step three</li>
</ol>
```

### Nested Lists
```html
<ul>
  <li>Main item 1
    <ul>
      <li>Sub item 1.1</li>
      <li>Sub item 1.2</li>
    </ul>
  </li>
  <li>Main item 2
    <ul>
      <li>Sub item 2.1</li>
      <li>Sub item 2.2</li>
    </ul>
  </li>
</ul>
```

### Complex List Items
```html
<ul>
  <li>
    <h4>Product Name</h4>
    <p>Product description goes here.</p>
    <a href="/product">View details</a>
  </li>
  <li>
    <h4>Another Product</h4>
    <p>Another description.</p>
    <a href="/product2">View details</a>
  </li>
</ul>
```

### Lists with Icons/Images
```html
<ul>
  <li>
    <img src="icon1.png" alt="Feature icon">
    <span>Feature one</span>
  </li>
  <li>
    <img src="icon2.png" alt="Feature icon">
    <span>Feature two</span>
  </li>
</ul>
```

### Navigation Lists
```html
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a>
      <ul>
        <li><a href="/services/web">Web Design</a></li>
        <li><a href="/services/seo">SEO</a></li>
      </ul>
    </li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### Lists with Scripts
```html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <script>
    // Allowed: tracking, analytics, etc.
    console.log('List rendered');
  </script>
</ul>
```

### Lists with Templates
```html
<ul id="dynamic-list">
  <li>Static item</li>
  <template id="item-template">
    <li class="dynamic-item">
      <span class="title"></span>
      <button class="delete">Delete</button>
    </li>
  </template>
</ul>
```

## Description Lists (Different Rule)

Note: `<dl>` (description lists) have different requirements:

```html
<!-- Definition list - different structure -->
<dl>
  <dt>Term 1</dt>
  <dd>Definition 1</dd>
  <dt>Term 2</dt>
  <dd>Definition 2</dd>
</dl>
```

## Testing

### Manual Testing
1. Inspect list elements in the page
2. Verify only `<li>`, `<script>`, or `<template>` are direct children
3. Check nested lists are inside `<li>` elements
4. Ensure all list content is within `<li>` elements

### Screen Reader Testing
```
NVDA/JAWS: Navigate to list
Expected: "List with X items" (correct count)

Press L to navigate by lists:
Expected: All lists announced with correct item counts

Inside list, press I to navigate by items:
Expected: All items are navigable
```

### Automated Testing
```javascript
// Check list structure
const lists = document.querySelectorAll('ul, ol');

lists.forEach(list => {
  Array.from(list.children).forEach(child => {
    const tagName = child.tagName.toLowerCase();
    if (!['li', 'script', 'template'].includes(tagName)) {
      console.error(
        `Invalid direct child in ${list.tagName}:`,
        tagName,
        child
      );
    }
  });
});

// Using axe-core
const results = await axe.run();
const listViolations = results.violations.filter(
  v => v.id === 'list'
);
```

### Browser DevTools
```javascript
// Find invalid list structures
Array.from(document.querySelectorAll('ul, ol')).forEach(list => {
  const invalidChildren = Array.from(list.children)
    .filter(child => !['LI', 'SCRIPT', 'TEMPLATE'].includes(child.tagName));
  
  if (invalidChildren.length) {
    console.warn('Invalid list structure:', list, invalidChildren);
  }
});

// Get list statistics
$$('ul, ol').forEach(list => {
  console.log({
    type: list.tagName,
    totalChildren: list.children.length,
    liCount: list.querySelectorAll(':scope > li').length,
    invalidCount: Array.from(list.children)
      .filter(c => !['LI', 'SCRIPT', 'TEMPLATE'].includes(c.tagName)).length
  });
});
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [MDN: ul element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul)
- [MDN: ol element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol)
- [MDN: li element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li)
- [HTML Specification: Lists](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element)

## Related Rules

- `listitem` - `<li>` must be in `<ul>` or `<ol>`
- `definition-list` - `<dl>` structure requirements
- `dlitem` - `<dt>` and `<dd>` must be in `<dl>`
