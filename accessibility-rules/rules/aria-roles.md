# ARIA roles must be valid

**Rule ID:** `aria-roles`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

An element has an invalid or non-existent ARIA role. Assistive technologies cannot interpret invalid roles, leading to broken accessibility.

## Why It Matters

### Impact on Users

- **Screen reader users** don't receive correct semantic information
- **Assistive technologies** may ignore elements with invalid roles
- **Keyboard users** lose navigation landmarks and structure
- **All users** relying on AT experience broken interfaces

### Real-World Scenario

A developer creates a custom widget with `role="selectbox"` (which doesn't exist - the correct role is `listbox` or `combobox`). Screen readers ignore the invalid role entirely, so users just hear generic div content with no indication it's interactive or what it does.

## How to Fix

### Solution 1: Use Valid ARIA Roles

Check the ARIA specification for valid role names.

**Bad Example:**
```html
<!-- FAIL - Invalid role names -->
<div role="selectbox">Choose option</div>
<div role="dropdown">Menu</div>
<div role="popup">Alert</div>
<div role="accordion">Expandable</div>
<div role="card">Content</div>
```

**Good Example:**
```html
<!-- PASS - Valid roles -->
<div role="listbox">Choose option</div>
<div role="menu">Menu</div>
<div role="dialog">Alert</div>
<button aria-expanded="false">Expandable</button>
<article>Content</article>
```

### Solution 2: Use Native HTML Elements

Native elements provide semantics without needing ARIA.

**Bad Example:**
```html
<!-- FAIL - Using invalid roles on divs -->
<div role="header">Site Header</div>
<div role="footer">Site Footer</div>
<div role="section">Content</div>
```

**Good Example:**
```html
<!-- PASS - Use native HTML -->
<header>Site Header</header>
<footer>Site Footer</footer>
<section>Content</section>
```

### Solution 3: Common Valid Roles Reference

Use these proven role patterns.

**Document Structure Roles:**
```html
<!-- Valid roles for structure -->
<div role="article">Article content</div>
<div role="banner">Header with logo</div>
<div role="complementary">Sidebar</div>
<div role="contentinfo">Footer</div>
<div role="form">Form content</div>
<div role="main">Primary content</div>
<div role="navigation">Nav links</div>
<div role="region" aria-label="Section name">Section</div>
<div role="search">Search form</div>
```

**Widget Roles:**
```html
<!-- Valid widget roles -->
<div role="button" tabindex="0">Click me</div>
<div role="checkbox" aria-checked="false" tabindex="0">Option</div>
<div role="radio" aria-checked="false" tabindex="-1">Choice</div>
<div role="textbox" contenteditable="true">Text</div>
<div role="slider" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">Slider</div>
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">Progress</div>
<div role="spinbutton" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100">Number</div>
<button role="switch" aria-checked="false">Toggle</button>
```

**Composite Widget Roles:**
```html
<!-- Valid composite roles -->
<div role="combobox" aria-expanded="false" aria-controls="list">
  <input type="text">
</div>
<ul role="listbox">
  <li role="option">Item</li>
</ul>

<div role="menu">
  <div role="menuitem">Action</div>
  <div role="menuitemcheckbox" aria-checked="false">Option</div>
  <div role="menuitemradio" aria-checked="false">Choice</div>
</div>

<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Content 1</div>

<div role="tree">
  <div role="treeitem" aria-expanded="false">Node</div>
</div>

<div role="grid">
  <div role="row">
    <div role="gridcell">Cell</div>
  </div>
</div>
```

**Live Region Roles:**
```html
<!-- Valid live region roles -->
<div role="alert">Error message</div>
<div role="status">Status update</div>
<div role="log">Activity log</div>
<div role="marquee">Rotating content</div>
<div role="timer">Countdown: 10</div>
```

### Solution 4: Framework-Specific Patterns

Correct role usage in common frameworks.

**React:**
```jsx
// FAIL - Invalid roles
<div role="card">Content</div>
<div role="panel">Panel</div>

// PASS - Valid roles
<div role="region" aria-label="Card title">Content</div>
<div role="tabpanel" aria-labelledby="tab-1">Panel</div>

// Custom Select Component
function CustomSelect({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <button
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="listbox-1"
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}>
        {value}
      </button>
      {isOpen && (
        <ul role="listbox" id="listbox-1">
          {options.map(opt => (
            <li 
              role="option" 
              key={opt.id}
              aria-selected={opt.id === value}
              onClick={() => onChange(opt.id)}>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Vue:**
```vue
<template>
  <!-- FAIL - Invalid role -->
  <div role="dropdown" @click="toggle">Menu</div>
  
  <!-- PASS - Valid role -->
  <button 
    :aria-expanded="isOpen"
    aria-haspopup="true"
    @click="toggle">
    Menu
  </button>
  <div v-if="isOpen" role="menu">
    <div role="menuitem" @click="action1">Action 1</div>
    <div role="menuitem" @click="action2">Action 2</div>
  </div>
</template>
```

### Solution 5: Abstract Roles (Don't Use)

Never use abstract roles - they're not for direct use.

**Bad Example:**
```html
<!-- FAIL - Abstract roles (never use these) -->
<div role="widget">Widget</div>
<div role="command">Command</div>
<div role="composite">Composite</div>
<div role="input">Input</div>
<div role="range">Range</div>
<div role="section">Section</div>
<div role="sectionhead">Section Head</div>
<div role="select">Select</div>
<div role="structure">Structure</div>
<div role="window">Window</div>
```

**Good Example:**
```html
<!-- PASS - Use concrete roles instead -->
<button>Widget</button>
<button>Command</button>
<div role="group">Composite</div>
<input type="text">Input</input>
<div role="slider" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">Range</div>
<section>Section</section>
<h2>Section Head</h2>
<select>Select</select>
<div>Structure</div>
<div role="dialog">Window</div>
```

## Rule Description

This rule ensures all ARIA roles used are valid according to the ARIA specification. It checks that roles exist in the spec and are not abstract roles.

### What This Rule Checks

- Role names exist in ARIA specification
- Roles are not abstract (widget, command, composite, etc.)
- Role values are properly spelled and formatted

### Common Invalid Roles

```
Common mistakes (invalid roles):
- selectbox → use "listbox" or "combobox"
- dropdown → use "menu" or "listbox"  
- accordion → use button with aria-expanded
- card → use "article" or "region"
- panel → use "tabpanel" or "region"
- popup → use "dialog" or "alertdialog"
- modal → use "dialog"
- drawer → use "dialog"
- tooltip → use "tooltip" (valid, but often misused)
- header/footer/section → use native HTML or valid roles
```

## Valid ARIA Roles List

### Landmark Roles
```
banner, complementary, contentinfo, form, main, 
navigation, region, search
```

### Document Structure Roles
```
article, definition, directory, document, feed, 
figure, group, heading, img, list, listitem, 
math, none, note, presentation, separator, 
table, term, toolbar
```

### Widget Roles
```
button, checkbox, gridcell, link, menuitem, 
menuitemcheckbox, menuitemradio, option, 
progressbar, radio, scrollbar, searchbox, 
separator (when focusable), slider, spinbutton, 
switch, tab, tabpanel, textbox, treeitem
```

### Composite Widget Roles
```
combobox, grid, listbox, menu, menubar, 
radiogroup, tablist, tree, treegrid
```

### Live Region Roles
```
alert, log, marquee, status, timer
```

### Window Roles
```
alertdialog, dialog
```

### Abstract Roles (NEVER USE)
```
command, composite, input, landmark, range, 
roletype, section, sectionhead, select, 
structure, widget, window
```

## Common Mistakes

### 1. Inventing Roles
```html
<!-- FAIL - Made-up roles -->
<div role="card">...</div>
<div role="accordion">...</div>
<div role="dropdown">...</div>
<div role="modal">...</div>

<!-- PASS - Use valid roles or native HTML -->
<article>...</article>
<details><summary>...</summary></details>
<select>...</select>
<div role="dialog" aria-modal="true">...</div>
```

### 2. Typos in Role Names
```html
<!-- FAIL - Misspelled -->
<div role="buton">Click</div>
<div role="checkBox">Option</div>
<div role="tab-panel">Content</div>

<!-- PASS - Correct spelling -->
<div role="button">Click</div>
<div role="checkbox">Option</div>
<div role="tabpanel">Content</div>
```

### 3. Using Abstract Roles
```html
<!-- FAIL - Abstract roles -->
<div role="widget">Control</div>
<div role="command">Action</div>

<!-- PASS - Concrete roles -->
<button>Control</button>
<button>Action</button>
```

### 4. HTML Element Roles
```html
<!-- FAIL - Using element names as roles -->
<div role="header">Header</div>
<div role="footer">Footer</div>
<div role="aside">Sidebar</div>

<!-- PASS - Use native HTML or valid ARIA roles -->
<header>Header</header>
<footer>Footer</footer>
<aside>Sidebar</aside>

<!-- OR with valid ARIA -->
<div role="banner">Header</div>
<div role="contentinfo">Footer</div>
<div role="complementary">Sidebar</div>
```

## Testing

### Manual Testing
1. Find all elements with role attributes
2. Check each role against ARIA specification
3. Verify no abstract roles are used
4. Check for typos in role names

### Screen Reader Testing
```
NVDA/JAWS: Navigate through page
Expected: Correct roles announced

Invalid roles result in:
- No role announcement
- Element treated as generic div
- Lost semantic meaning
```

### Automated Testing
```javascript
// List of valid ARIA roles
const validRoles = new Set([
  'alert', 'alertdialog', 'application', 'article', 
  'banner', 'button', 'cell', 'checkbox', 'columnheader',
  'combobox', 'complementary', 'contentinfo', 'definition',
  'dialog', 'directory', 'document', 'feed', 'figure',
  'form', 'grid', 'gridcell', 'group', 'heading', 'img',
  'link', 'list', 'listbox', 'listitem', 'log', 'main',
  'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'navigation', 'none',
  'note', 'option', 'presentation', 'progressbar', 'radio',
  'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
  'scrollbar', 'search', 'searchbox', 'separator', 'slider',
  'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
  'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
  'tree', 'treegrid', 'treeitem'
]);

// Check all roles
document.querySelectorAll('[role]').forEach(el => {
  const role = el.getAttribute('role');
  if (!validRoles.has(role)) {
    console.error(`Invalid role "${role}":`, el);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'aria-roles'
);
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA 1.2 Roles](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

## Related Rules

- `aria-allowed-attr` - Attributes must be allowed for role
- `aria-required-attr` - Required attributes must be present
- `aria-allowed-role` - Role must be appropriate for element
- `aria-valid-attr` - Attributes must be valid
