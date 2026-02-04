# Elements with ARIA Roles Must Have Required Children

**Rule ID:** `aria-required-children`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

Certain ARIA roles require specific child roles to be present to create valid accessibility structures. For example, a `listbox` must contain `option` elements, a `tablist` must contain `tab` elements, and a `menu` must contain `menuitem`, `menuitemcheckbox`, or `menuitemradio` elements. Missing required children breaks the accessibility tree and prevents assistive technologies from correctly interpreting the interface.

## Why It Matters

Missing required children causes:
- **Broken accessibility tree** - Assistive technologies cannot build correct object models
- **Lost context** - Screen readers cannot determine parent-child relationships
- **Navigation failures** - Keyboard navigation patterns don't work as expected
- **Incorrect announcements** - Screen readers may not announce the structure properly
- **Non-functional widgets** - Complex widgets like comboboxes and grids break completely

Screen reader users rely on these parent-child relationships to navigate complex widgets. Without proper children, the interface becomes unusable.

## How to Fix

### 1. Ensure Listbox Has Options

**❌ Bad Example - Empty Listbox:**
```html
<!-- Bad: listbox without options -->
<div role="listbox">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**✅ Good Example - Proper Options:**
```html
<!-- Good: listbox with option children -->
<div role="listbox" aria-label="Choose a color">
  <div role="option" aria-selected="false">Red</div>
  <div role="option" aria-selected="true">Blue</div>
  <div role="option" aria-selected="false">Green</div>
</div>
```

### 2. Tab Interface Requires Proper Structure

**❌ Bad Example - Missing Tab Roles:**
```html
<!-- Bad: tablist without tab roles -->
<div role="tablist">
  <button aria-controls="panel1">Tab 1</button>
  <button aria-controls="panel2">Tab 2</button>
</div>
<div id="panel1">Panel 1 content</div>
<div id="panel2">Panel 2 content</div>
```

**✅ Good Example - Complete Tab Structure:**
```html
<!-- Good: tablist with tab children and tabpanel -->
<div role="tablist" aria-label="Content sections">
  <button role="tab" 
          aria-selected="true" 
          aria-controls="panel1" 
          id="tab1">
    Tab 1
  </button>
  <button role="tab" 
          aria-selected="false" 
          aria-controls="panel2" 
          id="tab2">
    Tab 2
  </button>
</div>
<div role="tabpanel" 
     id="panel1" 
     aria-labelledby="tab1">
  Panel 1 content
</div>
<div role="tabpanel" 
     id="panel2" 
     aria-labelledby="tab2" 
     hidden>
  Panel 2 content
</div>
```

### 3. Menus Must Contain Menu Items

**❌ Bad Example - Menu Without Items:**
```html
<!-- Bad: menu without menuitem children -->
<div role="menu">
  <a href="/file">File</a>
  <a href="/edit">Edit</a>
</div>
```

**✅ Good Example - Proper Menu Structure:**
```html
<!-- Good: menu with menuitem children -->
<div role="menu" aria-label="Actions">
  <div role="menuitem" tabindex="0">New File</div>
  <div role="menuitem" tabindex="-1">Open File</div>
  <div role="menuitem" tabindex="-1">Save File</div>
  <div role="separator"></div>
  <div role="menuitem" tabindex="-1">Exit</div>
</div>

<!-- Good: menu with menuitemcheckbox -->
<div role="menu" aria-label="View options">
  <div role="menuitemcheckbox" 
       aria-checked="true" 
       tabindex="0">
    Show Toolbar
  </div>
  <div role="menuitemcheckbox" 
       aria-checked="false" 
       tabindex="-1">
    Show Sidebar
  </div>
</div>

<!-- Good: menu with menuitemradio -->
<div role="menu" aria-label="Font size">
  <div role="menuitemradio" 
       aria-checked="false" 
       tabindex="0">
    Small
  </div>
  <div role="menuitemradio" 
       aria-checked="true" 
       tabindex="-1">
    Medium
  </div>
  <div role="menuitemradio" 
       aria-checked="false" 
       tabindex="-1">
    Large
  </div>
</div>
```

### 4. Lists Must Contain List Items

**❌ Bad Example - List Without Items:**
```html
<!-- Bad: list without listitem children -->
<div role="list">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**✅ Good Example - Proper List Structure:**
```html
<!-- Good: list with listitem children -->
<div role="list">
  <div role="listitem">Item 1</div>
  <div role="listitem">Item 2</div>
  <div role="listitem">Item 3</div>
</div>

<!-- Better: Use native HTML -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### 5. Grid and Table Structures

**❌ Bad Example - Grid Without Rows:**
```html
<!-- Bad: grid without row children -->
<div role="grid">
  <div>Cell 1</div>
  <div>Cell 2</div>
</div>
```

**✅ Good Example - Complete Grid Structure:**
```html
<!-- Good: grid with row and gridcell children -->
<div role="grid" aria-label="Product inventory">
  <div role="row">
    <div role="columnheader">Product</div>
    <div role="columnheader">Price</div>
    <div role="columnheader">Stock</div>
  </div>
  <div role="row">
    <div role="gridcell">Widget</div>
    <div role="gridcell">$10</div>
    <div role="gridcell">50</div>
  </div>
  <div role="row">
    <div role="gridcell">Gadget</div>
    <div role="gridcell">$25</div>
    <div role="gridcell">30</div>
  </div>
</div>
```

### 6. Tree Structure Requirements

**✅ Good Example - Tree with Tree Items:**
```html
<!-- Good: tree with treeitem children -->
<div role="tree" aria-label="File system">
  <div role="treeitem" aria-expanded="true">
    Documents
    <div role="group">
      <div role="treeitem">Resume.pdf</div>
      <div role="treeitem">CoverLetter.doc</div>
    </div>
  </div>
  <div role="treeitem" aria-expanded="false">
    Pictures
  </div>
</div>
```

### 7. Radiogroup Requirements

**✅ Good Example - Radiogroup with Radios:**
```html
<!-- Good: radiogroup with radio children -->
<div role="radiogroup" aria-labelledby="size-label">
  <h3 id="size-label">Size</h3>
  <div role="radio" aria-checked="false" tabindex="0">Small</div>
  <div role="radio" aria-checked="true" tabindex="-1">Medium</div>
  <div role="radio" aria-checked="false" tabindex="-1">Large</div>
</div>
```

## Rule Description

This rule validates that elements with the following roles contain their required children:

| Parent Role | Required Child Roles |
|------------|---------------------|
| `listbox` | `option` |
| `menu` | `menuitem`, `menuitemcheckbox`, `menuitemradio` |
| `menubar` | `menuitem`, `menuitemcheckbox`, `menuitemradio` |
| `radiogroup` | `radio` |
| `tablist` | `tab` |
| `tree` | `treeitem` |
| `grid` | `row` |
| `row` | `gridcell`, `columnheader`, `rowheader` |
| `table` | `row` |
| `list` | `listitem` |
| `feed` | `article` |

Some roles allow additional specific descendants or groups.

## Common Mistakes

### Mistake 1: Incomplete Tab Implementation
```html
<!-- ❌ Bad: Missing tabpanel association -->
<div role="tablist">
  <button role="tab">Tab 1</button>
</div>
<!-- Missing tabpanel! -->

<!-- ✅ Good: Complete implementation -->
<div role="tablist">
  <button role="tab" aria-controls="panel1" aria-selected="true">Tab 1</button>
</div>
<div role="tabpanel" id="panel1">Content</div>
```

### Mistake 2: Using Generic Divs in Lists
```html
<!-- ❌ Bad: list with generic children -->
<div role="list">
  <div>Not a listitem</div>
  <span>Also not a listitem</span>
</div>

<!-- ✅ Good: proper listitems -->
<div role="list">
  <div role="listitem">Item 1</div>
  <div role="listitem">Item 2</div>
</div>
```

### Mistake 3: Combobox Without Listbox
```html
<!-- ❌ Bad: combobox without listbox/tree/grid/dialog -->
<div role="combobox" aria-expanded="true">
  <input type="text" />
</div>

<!-- ✅ Good: combobox with listbox -->
<div role="combobox" 
     aria-expanded="true" 
     aria-owns="listbox1" 
     aria-haspopup="listbox">
  <input type="text" aria-autocomplete="list" />
</div>
<div role="listbox" id="listbox1">
  <div role="option">Option 1</div>
  <div role="option">Option 2</div>
</div>
```

### Mistake 4: Row Without Cells
```html
<!-- ❌ Bad: row without gridcell children -->
<div role="grid">
  <div role="row">
    <div>Not a gridcell</div>
  </div>
</div>

<!-- ✅ Good: row with gridcells -->
<div role="grid">
  <div role="row">
    <div role="gridcell">Cell 1</div>
    <div role="gridcell">Cell 2</div>
  </div>
</div>
```

## Testing

### Automated Testing

```javascript
// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(v => v.id === 'aria-required-children');

// Check specific widget
const widget = document.querySelector('[role="listbox"]');
const results = await axe.run(widget);
```

### Manual Testing

1. **Inspect Widget Structure:**
   - Find elements with composite roles (listbox, menu, tablist, etc.)
   - Check their immediate children have appropriate roles
   - Verify required children are present

2. **Screen Reader Test:**
   - Navigate through the widget with arrow keys
   - Verify proper announcements of parent-child relationships
   - Check that navigation patterns work correctly

3. **DevTools Inspection:**
   ```javascript
   // Check for required children
   const requiredChildren = {
     'listbox': ['option'],
     'menu': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
     'tablist': ['tab'],
     'radiogroup': ['radio'],
     'tree': ['treeitem'],
     'grid': ['row'],
     'table': ['row']
   };
   
   Object.entries(requiredChildren).forEach(([parent, children]) => {
     document.querySelectorAll(`[role="${parent}"]`).forEach(el => {
       const hasRequired = children.some(child => 
         el.querySelector(`[role="${child}"]`)
       );
       if (!hasRequired) {
         console.warn(`${parent} missing required children:`, el);
       }
     });
   });
   ```

## Resources

- [ARIA Roles - Required Children - W3C](https://www.w3.org/TR/wai-aria-1.2/#mustContain)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA Authoring Practices - Design Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [axe-core Rule: aria-required-children](https://dequeuniversity.com/rules/axe/4.4/aria-required-children)

## Related Rules

- `aria-required-parent` - Elements with ARIA roles must have required parent
- `aria-roles` - ARIA roles must be valid
- `aria-allowed-attr` - ARIA attributes must be allowed for the element's role
- `aria-required-attr` - Elements with ARIA roles must have all required attributes
