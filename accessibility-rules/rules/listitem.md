# `<li>` elements must be contained in a `<ul>` or `<ol>`

**Rule ID:** `listitem`  
**WCAG:** 1.3.1 Info and Relationships (Level A)  
**Severity:** Serious

## Issue Description

An `<li>` element exists outside of a `<ul>`, `<ol>`, or `<menu>` element. This breaks semantic list structure and confuses screen readers.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "list item" without list context
- **Navigation shortcuts** for lists don't work properly
- **Document structure** is broken, reducing content comprehension
- **Semantic meaning** is lost, affecting all assistive technologies

### Real-World Scenario

A screen reader announces: "List item, First item. List item, Second item" without ever announcing a list. Users don't know these items form a group and cannot use list navigation shortcuts (L key) to navigate between lists.

## How to Fix

### Solution 1: Wrap List Items in `<ul>` or `<ol>`

Always place `<li>` elements inside proper list containers.

**Bad Example:**
```html
<!-- FAIL - li without parent list -->
<div>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</div>
```

**Good Example:**
```html
<!-- PASS - li inside ul -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

<!-- Or inside ol -->
<ol>
  <li>Step 1</li>
  <li>Step 2</li>
  <li>Step 3</li>
</ol>
```

### Solution 2: Convert Styled Lists to Proper Lists

Don't use `<li>` for styling without proper list parents.

**Bad Example:**
```html
<!-- FAIL - using li for bullet styling -->
<div class="custom-list">
  <li>Item 1</li>
  <li>Item 2</li>
</div>
```

**Good Example:**
```html
<!-- PASS - proper list structure -->
<ul class="custom-list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Or use proper semantic HTML -->
<div class="custom-list">
  <div class="list-item">Item 1</div>
  <div class="list-item">Item 2</div>
</div>

<style>
.custom-list .list-item::before {
  content: "• ";
}
</style>
```

### Solution 3: Fix Broken List Structure

Ensure lists aren't accidentally broken.

**Bad Example:**
```html
<!-- FAIL - closing ul too early -->
<ul>
  <li>Item 1</li>
</ul>
<li>Item 2</li> <!-- Orphaned -->
<li>Item 3</li> <!-- Orphaned -->
```

**Good Example:**
```html
<!-- PASS - all li in ul -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Solution 4: Proper Nested List Structure

Nest lists correctly inside `<li>` elements.

**Bad Example:**
```html
<!-- FAIL - nested li outside parent li -->
<ul>
  <li>Parent item</li>
</ul>
<li>Orphaned nested item</li>
```

**Good Example:**
```html
<!-- PASS - nested list inside parent li -->
<ul>
  <li>Parent item
    <ul>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ul>
  </li>
</ul>
```

### Solution 5: Choose Appropriate List Type

Use the right list type for your content.

**Good Examples:**
```html
<!-- Unordered list (no specific order) -->
<ul>
  <li>Apples</li>
  <li>Bananas</li>
  <li>Oranges</li>
</ul>

<!-- Ordered list (sequential) -->
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>

<!-- Menu (for toolbars, not common) -->
<menu>
  <li><button>Cut</button></li>
  <li><button>Copy</button></li>
  <li><button>Paste</button></li>
</menu>
```

## Rule Description

This rule ensures all `<li>` elements are contained within valid parent list elements (`<ul>`, `<ol>`, or `<menu>`).

### What This Rule Checks

- Every `<li>` element has a `<ul>`, `<ol>`, or `<menu>` parent
- Direct parent is a list element (not grandparent)

### What This Rule Does Not Check

- Whether the list type is appropriate for the content
- Visual styling of lists
- Content inside `<li>` elements

### Best Practices

1. **Always use proper parent** - `<li>` must be in `<ul>`, `<ol>`, or `<menu>`
2. **Check after modifications** - Ensure lists aren't accidentally broken
3. **Nest properly** - Put nested lists inside parent `<li>`
4. **Use semantic HTML** - Don't use `<li>` just for styling
5. **Validate markup** - Use HTML validators to catch orphaned `<li>`

## Common Mistakes

### 1. Orphaned List Items
```html
<!-- FAIL -->
<div>
  <li>Item 1</li>
  <li>Item 2</li>
</div>
```

### 2. Broken List Closing
```html
<!-- FAIL -->
<ul>
  <li>Item 1</li>
</ul>
<li>Item 2</li>
<li>Item 3</li>
```

### 3. Using List Items for Styling
```html
<!-- FAIL - li for bullets without proper list -->
<section>
  <li>Feature 1</li>
  <li>Feature 2</li>
</section>

<!-- PASS -->
<section>
  <ul>
    <li>Feature 1</li>
    <li>Feature 2</li>
  </ul>
</section>
```

### 4. Wrong Parent Element
```html
<!-- FAIL - li in div, not list -->
<div class="list">
  <li>Item 1</li>
  <li>Item 2</li>
</div>

<!-- PASS -->
<div class="list-container">
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
```

### 5. Template/Framework Issues
```javascript
// FAIL - React component rendering li without ul
function ListItem({ item }) {
  return <li>{item.name}</li>;
}

// Usage creates orphaned li
<div>
  <ListItem item={item1} />
  <ListItem item={item2} />
</div>

// PASS - Wrap in ul
<ul>
  <ListItem item={item1} />
  <ListItem item={item2} />
</ul>

// Or better - component includes ul
function List({ items }) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

## Correct Structures

### Unordered Lists
```html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Ordered Lists
```html
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>
```

### Nested Lists
```html
<ul>
  <li>Parent 1
    <ul>
      <li>Child 1.1</li>
      <li>Child 1.2</li>
    </ul>
  </li>
  <li>Parent 2
    <ol>
      <li>Child 2.1</li>
      <li>Child 2.2</li>
    </ol>
  </li>
</ul>
```

### Navigation Lists
```html
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### Menu Element (Rare)
```html
<menu>
  <li><button type="button">New File</button></li>
  <li><button type="button">Open</button></li>
  <li><button type="button">Save</button></li>
</menu>
```

## Framework Examples

### React
```jsx
// GOOD - Component wraps items in ul
function ItemList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// GOOD - Parent component provides ul
function App() {
  return (
    <ul>
      <ListItem text="Item 1" />
      <ListItem text="Item 2" />
    </ul>
  );
}

function ListItem({ text }) {
  return <li>{text}</li>;
}
```

### Vue
```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

### Angular
```html
<ul>
  <li *ngFor="let item of items">
    {{ item.name }}
  </li>
</ul>
```

## Testing

### Manual Testing
1. Find all `<li>` elements on the page
2. Verify each has a `<ul>`, `<ol>`, or `<menu>` parent
3. Check that lists aren't accidentally broken
4. Test with nested lists

### Screen Reader Testing
```
NVDA/JAWS: Navigate to list
Expected: "List with X items" announcement

Press L to navigate by lists:
Expected: Can navigate to all lists

Press I to navigate by list items:
Expected: All items are within announced lists
```

### Automated Testing
```javascript
// Find orphaned list items
const allListItems = document.querySelectorAll('li');

allListItems.forEach(li => {
  const parent = li.parentElement;
  const validParents = ['UL', 'OL', 'MENU'];
  
  if (!validParents.includes(parent?.tagName)) {
    console.error('Orphaned list item:', li, 'Parent:', parent?.tagName);
  }
});

// Using axe-core
const results = await axe.run();
const listitemViolations = results.violations.filter(
  v => v.id === 'listitem'
);
```

### Browser DevTools
```javascript
// Find all orphaned list items
Array.from(document.querySelectorAll('li'))
  .filter(li => {
    const parent = li.parentElement;
    return !['UL', 'OL', 'MENU'].includes(parent?.tagName);
  })
  .forEach(li => {
    console.warn('Orphaned <li>:', li, 'Parent:', li.parentElement);
  });

// Check all li elements
$$('li').forEach(li => {
  const parent = li.parentElement.tagName;
  console.log('LI parent:', parent, parent.match(/UL|OL|MENU/) ? '✓' : '✗');
});
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [MDN: li element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li)
- [HTML Specification: The li element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element)
- [WebAIM: Semantic Structure](https://webaim.org/techniques/semanticstructure/)

## Related Rules

- `list` - `<ul>` and `<ol>` must only contain `<li>`
- `definition-list` - `<dl>` structure
- `dlitem` - `<dt>` and `<dd>` must be in `<dl>`
