# ARIA Role Must Be Appropriate for Element

**Rule ID:** `aria-allowed-role`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Serious

## Issue Description

The `role` attribute must be appropriate for the HTML element on which it is used. Some ARIA roles are not allowed on certain HTML elements because the element's native semantics conflict with or override the ARIA role, or because the combination creates invalid or nonsensical accessibility information.

## Why It Matters

Using inappropriate ARIA roles on elements can:
- **Confuse assistive technologies** - Conflicting semantics create unpredictable behavior
- **Override native semantics** - Lose the built-in accessibility of HTML elements
- **Break keyboard interaction** - Expected behaviors may not work as intended
- **Violate ARIA specifications** - Create invalid HTML that browsers handle inconsistently
- **Mislead users** - Screen reader users receive incorrect information about the interface

Screen reader users rely on accurate role information to understand what elements do and how to interact with them. Inappropriate roles break this understanding.

## How to Fix

### 1. Use Appropriate Roles for Elements

Match ARIA roles to elements where they make semantic sense.

**❌ Bad Example - Inappropriate Roles:**
```html
<!-- Bad: role="button" on a link -->
<a href="/page" role="button">Click me</a>

<!-- Bad: role="link" on a button -->
<button role="link" onclick="navigate()">Go</button>

<!-- Bad: role="heading" on interactive element -->
<button role="heading" aria-level="1">Page Title</button>

<!-- Bad: role="list" on a table -->
<table role="list">...</table>

<!-- Bad: role="textbox" on a div with contenteditable -->
<div contenteditable="true" role="textbox">Edit me</div>
```

**✅ Good Example - Appropriate Roles:**
```html
<!-- Good: Use native button element -->
<button>Click me</button>

<!-- Good: Use native link element -->
<a href="/page">Go to page</a>

<!-- Good: Use native heading element -->
<h1>Page Title</h1>

<!-- Good: Use native list elements -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Good: Use semantic HTML when possible -->
<input type="text" />
```

### 2. Know Which Roles Are Allowed

Some HTML elements should never have certain roles.

**Elements That Should Not Have Roles:**

```html
<!-- ❌ Bad: These elements should use native semantics -->
<h1 role="banner">Site Title</h1>  <!-- Headings shouldn't be landmarks -->
<input type="text" role="button">  <!-- Inputs shouldn't be buttons -->
<select role="listbox">...</select>  <!-- Select already has listbox semantics -->
<textarea role="textbox">...</textarea>  <!-- Textarea is already a textbox -->
```

**Valid Role Usage:**

```html
<!-- ✅ Good: Appropriate role additions -->
<nav role="navigation">...</nav>  <!-- Redundant but valid -->
<main role="main">...</main>  <!-- Redundant but valid for older browsers -->
<header role="banner">...</header>  <!-- When it's the page header -->
<footer role="contentinfo">...</footer>  <!-- When it's the page footer -->
```

### 3. Prefer Native HTML Elements

Always use native HTML elements instead of adding roles when possible.

**❌ Bad - Adding Roles Unnecessarily:**
```html
<!-- Don't add roles to native elements that already have them -->
<button role="button">Click</button>
<a href="/" role="link">Home</a>
<nav role="navigation">...</nav>
<article role="article">...</article>
<aside role="complementary">...</aside>
```

**✅ Good - Use Native Elements:**
```html
<!-- Native elements have implicit roles -->
<button>Click</button>
<a href="/">Home</a>
<nav>...</nav>
<article>...</article>
<aside>...</aside>
```

### 4. Custom Components Need Appropriate Roles

When building custom components, use roles that match the intended behavior.

**✅ Good Example - Custom Interactive Elements:**
```html
<!-- Custom button from div -->
<div role="button" tabindex="0" onclick="doAction()">
  Custom Button
</div>

<!-- Custom checkbox -->
<div role="checkbox" 
     aria-checked="false" 
     tabindex="0"
     onclick="toggleCheck()">
  Accept terms
</div>

<!-- Custom tab interface -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel2">Tab 2</button>
</div>
<div role="tabpanel" id="panel1">Content 1</div>
<div role="tabpanel" id="panel2" hidden>Content 2</div>

<!-- Custom listbox -->
<div role="listbox" aria-label="Choose option">
  <div role="option" aria-selected="false">Option 1</div>
  <div role="option" aria-selected="true">Option 2</div>
  <div role="option" aria-selected="false">Option 3</div>
</div>
```

### 5. Invalid Role Combinations to Avoid

**Never Use These Combinations:**

```html
<!-- ❌ Invalid: Interactive roles on static elements -->
<h1 role="button">Heading Button</h1>
<p role="link">Paragraph Link</p>
<span role="textbox">Span Input</span>

<!-- ❌ Invalid: Structure roles on wrong elements -->
<button role="listitem">Button in List</button>
<div role="option" aria-selected="true">Option</div>  <!-- Missing listbox parent -->
<li role="button">List Item Button</li>

<!-- ❌ Invalid: Landmark roles on inline elements -->
<span role="main">Main Content</span>
<a role="navigation">Nav Link</a>
```

## Rule Description

This rule checks that:
1. ARIA roles used on HTML elements are allowed by the ARIA in HTML specification
2. The role doesn't conflict with the element's native semantics
3. The role makes logical sense for the element type
4. Required parent-child relationships are maintained

The rule validates against the ARIA in HTML specification which defines which roles are allowed on which elements.

## Common Mistakes

### Mistake 1: Adding Roles to Elements That Don't Need Them
```html
<!-- ❌ Bad: Redundant roles -->
<button role="button">Submit</button>
<a href="/" role="link">Home</a>
<input type="checkbox" role="checkbox" />

<!-- ✅ Good: Use implicit roles -->
<button>Submit</button>
<a href="/">Home</a>
<input type="checkbox" />
```

### Mistake 2: Using Presentation Role Incorrectly
```html
<!-- ❌ Bad: Presentation on interactive elements -->
<button role="presentation">Click me</button>
<a href="/" role="presentation">Link</a>

<!-- ✅ Good: Presentation on decorative elements -->
<div role="presentation">
  <img src="decorative.png" alt="" />
</div>
```

### Mistake 3: Conflicting Roles and Element Types
```html
<!-- ❌ Bad: Semantic conflicts -->
<input type="text" role="button" />  <!-- Text input can't be a button -->
<h1 role="listitem">Title</h1>  <!-- Heading can't be a list item -->
<select role="textbox">...</select>  <!-- Select can't be a textbox -->

<!-- ✅ Good: Matching semantics -->
<div role="button" tabindex="0">Custom Button</div>
<div role="heading" aria-level="1">Custom Heading</div>
<div role="textbox" contenteditable="true">Editable Text</div>
```

### Mistake 4: Missing Required Context
```html
<!-- ❌ Bad: Child role without parent -->
<div role="option">Standalone Option</div>
<div role="tab">Standalone Tab</div>
<div role="menuitem">Standalone Menu Item</div>

<!-- ✅ Good: Proper parent-child structure -->
<div role="listbox">
  <div role="option">Option in Listbox</div>
</div>

<div role="tablist">
  <div role="tab">Tab in Tab List</div>
</div>

<div role="menu">
  <div role="menuitem">Menu Item in Menu</div>
</div>
```

## Testing

### Automated Testing

```javascript
// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(v => v.id === 'aria-allowed-role');

// Check specific element
const element = document.querySelector('#my-element');
const results = await axe.run(element);
```

### Manual Testing

1. **Inspect Role Attributes:**
   - Open browser DevTools
   - Find all elements with explicit `role` attributes
   - Verify each role is appropriate for the element

2. **Check Against ARIA in HTML Spec:**
   - For each `role` attribute found
   - Look up the HTML element in ARIA in HTML specification
   - Verify the role is listed as allowed

3. **Test with Screen Reader:**
   - Navigate through the page with a screen reader
   - Listen for roles being announced
   - Verify they match expected behavior

### Browser DevTools Check

```javascript
// Find all elements with explicit roles
const elementsWithRoles = document.querySelectorAll('[role]');
elementsWithRoles.forEach(el => {
  console.log({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role'),
    element: el
  });
});
```

## Resources

- [ARIA in HTML - W3C](https://www.w3.org/TR/html-aria/)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [Using ARIA - First Rule](https://www.w3.org/TR/using-aria/#rule1)
- [ARIA Roles - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [axe-core Rule: aria-allowed-role](https://dequeuniversity.com/rules/axe/4.4/aria-allowed-role)

## Related Rules

- `aria-roles` - ARIA roles must be valid
- `aria-required-attr` - Elements with ARIA roles must have all required attributes
- `aria-allowed-attr` - ARIA attributes must be allowed for the element's role
- `aria-required-parent` - Elements with ARIA roles must have required parent
- `aria-required-children` - Elements with ARIA roles must have required children
