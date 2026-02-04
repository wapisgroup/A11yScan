# IDs must be unique

**Rule ID:** `duplicate-id`  
**WCAG:** 4.1.1 Parsing (Level A)  
**Severity:** Critical

## Issue Description

Two or more elements on the page have the same `id` attribute value. Duplicate IDs break assistive technologies, form labels, ARIA relationships, and JavaScript functionality.

## Why It Matters

### Impact on Users

- **Screen reader users** may experience incorrect label/input associations
- **Keyboard users** may have focus management issues
- **All users** may experience broken JavaScript interactions
- **Form functionality** may fail to submit or validate correctly
- **ARIA relationships** (`aria-labelledby`, `aria-describedby`) may reference wrong elements

### Real-World Scenario

Two form inputs have `id="email"`. When a user clicks the first `<label for="email">`, focus unexpectedly jumps to the second input instead of the first. Screen readers announce the wrong field. Form validation errors target the wrong element.

## How to Fix

### Solution 1: Use Unique IDs

Ensure every `id` value appears only once on the page.

**Bad Example:**
```html
<!-- FAIL - Duplicate IDs -->
<div id="container">
  <input type="text" id="name">
</div>
<div id="container">
  <input type="text" id="name">
</div>
```

**Good Example:**
```html
<!-- PASS - Unique IDs -->
<div id="container-1">
  <input type="text" id="name-1">
</div>
<div id="container-2">
  <input type="text" id="name-2">
</div>
```

### Solution 2: Use Classes for Styling

Use `class` instead of `id` for styling multiple similar elements.

**Bad Example:**
```html
<!-- FAIL - Using same ID for styling -->
<div id="card" class="product">Product 1</div>
<div id="card" class="product">Product 2</div>
<div id="card" class="product">Product 3</div>

<style>
#card { border: 1px solid #ccc; }
</style>
```

**Good Example:**
```html
<!-- PASS - Use class for styling -->
<div id="card-1" class="card product">Product 1</div>
<div id="card-2" class="card product">Product 2</div>
<div id="card-3" class="card product">Product 3</div>

<style>
.card { border: 1px solid #ccc; }
</style>
```

### Solution 3: Generate Unique IDs Programmatically

For dynamic content, generate unique IDs.

**Good Example (React):**
```jsx
import { useId } from 'react';

function FormField({ label }) {
  const id = useId();
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input type="text" id={id} />
    </div>
  );
}

// Or with custom logic
function ProductCard({ product, index }) {
  const cardId = `product-${product.id}`;
  const titleId = `product-title-${product.id}`;
  
  return (
    <div id={cardId} aria-labelledby={titleId}>
      <h3 id={titleId}>{product.name}</h3>
    </div>
  );
}
```

**Good Example (Vue):**
```vue
<template>
  <div>
    <label :for="inputId">{{ label }}</label>
    <input type="text" :id="inputId" />
  </div>
</template>

<script>
export default {
  props: ['label'],
  data() {
    return {
      inputId: `input-${Math.random().toString(36).substr(2, 9)}`
    }
  }
}
</script>
```

**Good Example (Vanilla JS):**
```javascript
let idCounter = 0;

function createField(label) {
  const id = `field-${++idCounter}`;
  
  return `
    <div>
      <label for="${id}">${label}</label>
      <input type="text" id="${id}">
    </div>
  `;
}

// Or using timestamp
function generateId(prefix = 'elem') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Solution 4: Scoped IDs in Repeated Components

Use prefixes or suffixes to make IDs unique.

**Bad Example:**
```html
<!-- FAIL - Same IDs in multiple forms -->
<form id="form-1">
  <label for="email">Email:</label>
  <input type="email" id="email">
</form>

<form id="form-2">
  <label for="email">Email:</label>
  <input type="email" id="email"> <!-- Duplicate -->
</form>
```

**Good Example:**
```html
<!-- PASS - Scoped IDs -->
<form id="form-1">
  <label for="form-1-email">Email:</label>
  <input type="email" id="form-1-email">
</form>

<form id="form-2">
  <label for="form-2-email">Email:</label>
  <input type="email" id="form-2-email">
</form>
```

### Solution 5: Avoid IDs When Not Needed

Only use IDs when necessary (labels, ARIA, anchors).

**Good Example:**
```html
<!-- No ID needed for styling -->
<button class="btn btn-primary" onclick="handleClick()">
  Click Me
</button>

<!-- ID needed for label association -->
<label for="username">Username:</label>
<input type="text" id="username">

<!-- ID needed for ARIA -->
<button aria-describedby="help-text">Submit</button>
<p id="help-text">Click to submit the form</p>

<!-- ID needed for anchor links -->
<a href="#section-1">Jump to Section 1</a>
<section id="section-1">
  <h2>Section 1</h2>
</section>
```

## Rule Description

This rule ensures all `id` attribute values are unique within the page. Duplicate IDs violate HTML specifications and break accessibility features.

### What This Rule Checks

- All elements with `id` attributes
- ID values are unique across the entire page
- No duplicate IDs exist in the DOM

### What This Rule Does Not Check

- ID naming conventions
- Whether IDs are meaningful
- Unused IDs
- IDs in different documents/iframes

### Best Practices

1. **Use classes for styling** - Reserve IDs for unique references
2. **Generate programmatically** - Create unique IDs for dynamic content
3. **Add prefixes** - Use component/context prefixes (e.g., `modal-title-1`)
4. **Avoid when possible** - Only use IDs when truly needed
5. **Test thoroughly** - Check for duplicates in all page states

## Common Mistakes

### 1. Copy-Paste Duplication
```html
<!-- FAIL -->
<div id="section">Section 1</div>
<div id="section">Section 2</div>
<div id="section">Section 3</div>
```

### 2. Template/Component Reuse
```html
<!-- FAIL - Component used multiple times -->
<div class="modal" id="modal">
  <h2 id="modal-title">Title 1</h2>
</div>

<div class="modal" id="modal"> <!-- Duplicate -->
  <h2 id="modal-title">Title 2</h2> <!-- Duplicate -->
</div>
```

### 3. Form Field Duplication
```html
<!-- FAIL -->
<fieldset>
  <label for="name">First Name:</label>
  <input id="name" type="text">
</fieldset>

<fieldset>
  <label for="name">Last Name:</label>
  <input id="name" type="text"> <!-- Duplicate -->
</fieldset>
```

### 4. Dynamic Content Without Unique IDs
```javascript
// FAIL - All items get same ID
items.forEach(item => {
  const html = `
    <div id="item">
      <h3 id="item-title">${item.name}</h3>
    </div>
  `;
  container.innerHTML += html;
});

// PASS - Generate unique IDs
items.forEach((item, index) => {
  const html = `
    <div id="item-${index}">
      <h3 id="item-title-${index}">${item.name}</h3>
    </div>
  `;
  container.innerHTML += html;
});
```

### 5. Hidden/Visible State Duplicates
```html
<!-- FAIL - Both exist in DOM -->
<div id="content" class="mobile">Mobile content</div>
<div id="content" class="desktop" hidden>Desktop content</div>
```

## Examples by Use Case

### Form Labels
```html
<!-- GOOD - Unique IDs for each field -->
<form>
  <div>
    <label for="first-name">First Name:</label>
    <input type="text" id="first-name" name="firstName">
  </div>
  
  <div>
    <label for="last-name">Last Name:</label>
    <input type="text" id="last-name" name="lastName">
  </div>
  
  <div>
    <label for="email-address">Email:</label>
    <input type="email" id="email-address" name="email">
  </div>
</form>
```

### ARIA Relationships
```html
<!-- GOOD - Unique IDs for ARIA references -->
<button 
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description">
  Open Dialog
</button>

<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirmation</h2>
  <p id="dialog-description">Are you sure you want to proceed?</p>
  <button>Confirm</button>
  <button>Cancel</button>
</div>
```

### Anchor Navigation
```html
<!-- GOOD - Unique section IDs -->
<nav>
  <a href="#introduction">Introduction</a>
  <a href="#features">Features</a>
  <a href="#pricing">Pricing</a>
  <a href="#contact">Contact</a>
</nav>

<main>
  <section id="introduction">
    <h2>Introduction</h2>
  </section>
  
  <section id="features">
    <h2>Features</h2>
  </section>
  
  <section id="pricing">
    <h2>Pricing</h2>
  </section>
  
  <section id="contact">
    <h2>Contact</h2>
  </section>
</main>
```

### Tab Components
```html
<!-- GOOD - Unique IDs per tab -->
<div role="tablist">
  <button role="tab" aria-controls="panel-1" id="tab-1">Tab 1</button>
  <button role="tab" aria-controls="panel-2" id="tab-2">Tab 2</button>
  <button role="tab" aria-controls="panel-3" id="tab-3">Tab 3</button>
</div>

<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Panel 1 content
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2">
  Panel 2 content
</div>
<div role="tabpanel" id="panel-3" aria-labelledby="tab-3">
  Panel 3 content
</div>
```

### Accordion Components
```html
<!-- GOOD - Unique IDs per accordion item -->
<div class="accordion">
  <h3 id="accordion-header-1">
    <button aria-expanded="false" aria-controls="accordion-panel-1">
      Section 1
    </button>
  </h3>
  <div id="accordion-panel-1" aria-labelledby="accordion-header-1">
    Content 1
  </div>
  
  <h3 id="accordion-header-2">
    <button aria-expanded="false" aria-controls="accordion-panel-2">
      Section 2
    </button>
  </h3>
  <div id="accordion-panel-2" aria-labelledby="accordion-header-2">
    Content 2
  </div>
</div>
```

## ID Generation Patterns

### Counter-Based
```javascript
let formIdCounter = 0;

function createFormField(label, type = 'text') {
  const id = `form-field-${++formIdCounter}`;
  return `
    <div>
      <label for="${id}">${label}</label>
      <input type="${type}" id="${id}">
    </div>
  `;
}
```

### UUID/Random
```javascript
function generateUniqueId(prefix = 'elem') {
  return `${prefix}-${crypto.randomUUID()}`;
}

// Or simpler
function simpleUniqueId(prefix = 'elem') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Timestamp-Based
```javascript
function timestampId(prefix = 'elem') {
  return `${prefix}-${Date.now()}-${performance.now()}`;
}
```

### Content-Based
```javascript
function contentBasedId(text, prefix = 'elem') {
  const slug = text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug}-${Date.now()}`;
}

// Usage
contentBasedId('Product Name', 'product'); 
// => "product-product-name-1709567890123"
```

## Testing

### Manual Testing
1. View page source and search for `id="`
2. Check that each ID value appears only once
3. Test dynamic content states (modals, tabs, etc.)
4. Verify form label associations work correctly

### Screen Reader Testing
```
NVDA/JAWS: Tab through form fields
Expected: Correct labels announced for each field

Click labels:
Expected: Focus moves to correct associated input
```

### Automated Testing
```javascript
// Find duplicate IDs
const ids = {};
document.querySelectorAll('[id]').forEach(el => {
  const id = el.id;
  if (ids[id]) {
    console.error(`Duplicate ID found: ${id}`, ids[id], el);
  } else {
    ids[id] = el;
  }
});

// Alternative check
const allIds = Array.from(document.querySelectorAll('[id]'))
  .map(el => el.id);
const duplicates = allIds.filter(
  (id, index) => allIds.indexOf(id) !== index
);
if (duplicates.length) {
  console.error('Duplicate IDs:', [...new Set(duplicates)]);
}

// Using axe-core
const results = await axe.run();
const idViolations = results.violations.filter(
  v => v.id === 'duplicate-id'
);
```

### Browser DevTools
```javascript
// Get all IDs
const ids = Array.from(document.querySelectorAll('[id]'))
  .map(el => el.id);

// Find duplicates
const seen = new Set();
const duplicates = ids.filter(id => {
  if (seen.has(id)) return true;
  seen.add(id);
  return false;
});

console.log('Duplicate IDs:', [...new Set(duplicates)]);

// Find elements with duplicate IDs
duplicates.forEach(id => {
  console.log(`ID "${id}" used by:`, 
    document.querySelectorAll(`[id="${id}"]`)
  );
});
```

## Resources

- [WCAG 4.1.1 Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing.html)
- [MDN: id attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id)
- [HTML Specification: The id attribute](https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute)
- [WebAIM: Skip Navigation Links](https://webaim.org/techniques/skipnav/)

## Related Rules

- `duplicate-id-active` - Active elements must have unique IDs
- `duplicate-id-aria` - ARIA IDs must be unique
- `label` - Form inputs must have labels
- `aria-valid-attr-value` - ARIA attributes must reference valid IDs
