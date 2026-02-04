# Avoid positive tabindex values

**Rule ID:** `tabindex`  
**WCAG:** 2.4.3 Focus Order (Level A)  
**Severity:** Serious

## Issue Description

Elements have positive `tabindex` values (tabindex="1" or higher). This disrupts the natural tab order and creates an illogical, confusing navigation experience.

## Why It Matters

### Impact on Users

- **Keyboard users** experience unpredictable tab order
- **Screen reader users** encounter illogical navigation flow
- **Switch device users** struggle with unexpected focus jumps
- **All users** navigating by keyboard face cognitive burden

### Real-World Scenario

A form has fields with `tabindex="1"`, `tabindex="2"`, etc. to control order. Later, a developer adds a new field but forgets to update all tabindex values. Now tabbing jumps from the first field to the last field, then to the middle, then back to the second field. Users can't predict where focus will go next and miss required fields.

## How to Fix

### Solution 1: Remove Positive tabindex

Use the natural DOM order instead of manipulating with tabindex.

**Bad Example:**
```html
<!-- FAIL - Positive tabindex values -->
<form>
  <input type="text" name="email" tabindex="2">
  <input type="text" name="name" tabindex="1">
  <input type="tel" name="phone" tabindex="3">
  <button type="submit" tabindex="4">Submit</button>
</form>
```

**Good Example:**
```html
<!-- PASS - Natural DOM order -->
<form>
  <input type="text" name="name">
  <input type="text" name="email">
  <input type="tel" name="phone">
  <button type="submit">Submit</button>
</form>

<!-- OR use tabindex="0" to include in natural order -->
<form>
  <input type="text" name="name" tabindex="0">
  <input type="text" name="email" tabindex="0">
  <input type="tel" name="phone" tabindex="0">
  <button type="submit" tabindex="0">Submit</button>
</form>
```

### Solution 2: Reorder DOM Elements

Change the HTML structure to match the desired tab order.

**Bad Example:**
```html
<!-- FAIL - Using tabindex to fix bad DOM order -->
<div class="layout">
  <div class="sidebar" tabindex="3">
    <input type="search">
  </div>
  <div class="main" tabindex="1">
    <form>
      <input type="text" tabindex="2">
    </form>
  </div>
</div>
```

**Good Example:**
```html
<!-- PASS - DOM order matches desired tab order -->
<div class="layout">
  <div class="main">
    <form>
      <input type="text">
    </form>
  </div>
  <div class="sidebar">
    <input type="search">
  </div>
</div>

<!-- Use CSS to control visual layout -->
<style>
.layout {
  display: flex;
  flex-direction: row-reverse; /* Sidebar appears first visually */
}
</style>
```

### Solution 3: Use CSS for Visual Ordering

Control visual presentation with CSS while maintaining logical DOM order.

**CSS Flexbox:**
```html
<div class="container">
  <!-- DOM order: logical reading order -->
  <div class="item" style="order: 2;">Appears second</div>
  <div class="item" style="order: 1;">Appears first</div>
  <div class="item" style="order: 3;">Appears third</div>
</div>

<style>
.container {
  display: flex;
}
/* Visual order controlled by CSS, tab order follows DOM */
</style>
```

**CSS Grid:**
```html
<div class="grid">
  <!-- DOM order -->
  <header class="header">Header</header>
  <main class="main">Main content</main>
  <aside class="sidebar">Sidebar</aside>
  <footer class="footer">Footer</footer>
</div>

<style>
.grid {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

.header { grid-area: header; }
.main { grid-area: main; }
.sidebar { grid-area: sidebar; }
.footer { grid-area: footer; }
</style>
```

### Solution 4: Valid tabindex Values

Only use `tabindex="0"` and `tabindex="-1"`.

**Valid Uses:**
```html
<!-- tabindex="0" - Add non-interactive element to tab order -->
<div 
  role="button"
  tabindex="0"
  onclick="handleClick()">
  Custom Button
</div>

<!-- tabindex="-1" - Programmatic focus, not keyboard reachable -->
<div id="error-message" tabindex="-1">
  Error: Please fix the issues below
</div>

<script>
// Focus error message programmatically
if (hasErrors) {
  document.getElementById('error-message').focus();
}
</script>

<!-- tabindex="-1" - Skip link target -->
<a href="#main" class="skip-link">Skip to main</a>
<main id="main" tabindex="-1">
  Content
</main>
```

### Solution 5: Framework Examples

**React - Modal Dialog:**
```jsx
// FAIL - Using positive tabindex
function Modal({ isOpen, children }) {
  return isOpen && (
    <div className="modal">
      <button tabindex="1" onClick={close}>Close</button>
      <div tabindex="2">{children}</div>
    </div>
  );
}

// PASS - Natural order with focus trap
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();
  
  useEffect(() => {
    if (isOpen) {
      // Move focus to modal
      modalRef.current?.focus();
      
      // Trap focus within modal
      const handleTab = (e) => {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      };
      
      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);
  
  return isOpen && (
    <div 
      className="modal"
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true">
      <button onClick={onClose}>Close</button>
      <div>{children}</div>
    </div>
  );
}
```

**Vue - Form Field Order:**
```vue
<!-- FAIL -->
<template>
  <form>
    <input v-model="email" tabindex="2">
    <input v-model="name" tabindex="1">
    <input v-model="phone" tabindex="3">
  </form>
</template>

<!-- PASS - Reorder DOM -->
<template>
  <form>
    <input v-model="name">
    <input v-model="email">
    <input v-model="phone">
  </form>
</template>
```

## Rule Description

This rule ensures elements do not use positive tabindex values (1 or higher), which disrupt the natural tab order and harm keyboard navigation.

### What This Rule Checks

- No elements have `tabindex="1"` or higher
- Only `tabindex="0"` and `tabindex="-1"` are used
- Tab order follows a logical sequence

### Valid tabindex Values

- **Not specified** - Uses natural DOM order
- **tabindex="0"** - Adds element to natural tab order
- **tabindex="-1"** - Programmatically focusable, not in tab order
- **NEVER use** - tabindex="1" or higher

## Common Mistakes

### 1. Using Positive Values for Order
```html
<!-- FAIL -->
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>

<!-- PASS - Reorder DOM -->
<button>First</button>
<button>Second</button>
<button>Third</button>
```

### 2. Mixing Positive and Natural Order
```html
<!-- FAIL - Tabs 1, 2, then jumps to all tabindex="0" elements, then 3 -->
<input type="text" tabindex="1">
<input type="text"> <!-- Natural order -->
<input type="text"> <!-- Natural order -->
<button tabindex="2">Next</button>
<button tabindex="3">Submit</button>

<!-- PASS - All natural order -->
<input type="text">
<input type="text">
<input type="text">
<button>Next</button>
<button>Submit</button>
```

### 3. Positive tabindex on Custom Widgets
```html
<!-- FAIL -->
<div role="button" tabindex="5" onclick="action()">
  Click Me
</div>

<!-- PASS -->
<div role="button" tabindex="0" onclick="action()">
  Click Me
</div>

<!-- BETTER - Use native button -->
<button onclick="action()">
  Click Me
</button>
```

### 4. Using tabindex Instead of Fixing Layout
```html
<!-- FAIL - Compensating for bad layout -->
<div class="page">
  <aside tabindex="10">Sidebar</aside>
  <main tabindex="1">Content</main>
</div>

<!-- PASS - Fix layout order -->
<div class="page">
  <main>Content</main>
  <aside>Sidebar</aside>
</div>

<style>
.page {
  display: flex;
  flex-direction: row-reverse;
}
</style>
```

## Tab Order Rules

### How Tab Order Works

1. Elements with `tabindex="1+"` (highest to lowest)
2. Elements with `tabindex="0"` or naturally focusable (DOM order)
3. Elements with `tabindex="-1"` are skipped

**Example:**
```html
<!-- Tab order: 1, 2, 3, 4, 5, 6 -->
<input tabindex="2">    <!-- 1st: tabindex 2 -->
<input tabindex="5">    <!-- 2nd: tabindex 5 -->
<input>                 <!-- 3rd: natural order -->
<input tabindex="0">    <!-- 4th: natural order -->
<input tabindex="-1">   <!-- Skipped -->
<input>                 <!-- 5th: natural order -->
<button tabindex="10">  <!-- 6th: tabindex 10 -->

<!-- This is confusing! Don't do this. -->
```

## Testing

### Manual Testing
1. Press Tab key repeatedly through the page
2. Verify focus moves in a logical order
3. Check that focus doesn't jump unexpectedly
4. Ensure all interactive elements are reachable

### Keyboard Testing
```
1. Start at top of page
2. Press Tab repeatedly
3. Observe focus order

Expected: Logical top-to-bottom, left-to-right flow
Failure: Focus jumps around unpredictably
```

### Screen Reader Testing
```
NVDA/JAWS: Tab through page
Expected: Logical progression through content

Positive tabindex causes:
- Unexpected focus jumps
- Skipped content
- Confusion about page structure
```

### Automated Testing
```javascript
// Find all positive tabindex values
const positiveTabindex = document.querySelectorAll('[tabindex]');
positiveTabindex.forEach(el => {
  const value = parseInt(el.getAttribute('tabindex'));
  if (value > 0) {
    console.error(`Positive tabindex found (${value}):`, el);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'tabindex'
);
```

### Visual Indicator for Testing
```css
/* Highlight elements with positive tabindex */
[tabindex="1"], [tabindex="2"], [tabindex="3"],
[tabindex="4"], [tabindex="5"], [tabindex="6"],
[tabindex="7"], [tabindex="8"], [tabindex="9"] {
  outline: 3px solid red !important;
}

[tabindex="1"]::before {
  content: "⚠️ tabindex=" attr(tabindex);
  background: red;
  color: white;
  padding: 2px 4px;
  font-size: 10px;
}
```

## Resources

- [WCAG 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)
- [MDN: tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/tabindex)
- [W3C: Focus Management](https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_focus_mgmt)

## Related Rules

- `focus-order-semantics` - Focus order should be meaningful
- `nested-interactive` - No nested interactive elements
