# Elements with ARIA Roles Must Have Required Parent

**Rule ID:** `aria-required-parent`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

Certain ARIA roles can only be used as children of specific parent roles. For example, `option` must be contained in a `listbox` or `combobox`, `tab` must be in a `tablist`, and `menuitem` must be in a `menu` or `menubar`. Using these child roles without their required parent roles breaks the accessibility tree and prevents assistive technologies from correctly interpreting the widget structure.

## Why It Matters

Using child roles without required parents causes:
- **Broken widget semantics** - Screen readers cannot understand the relationship
- **Lost navigation context** - Users cannot navigate the widget as intended
- **Keyboard interaction failures** - Expected keyboard patterns don't work
- **Incorrect announcements** - Screen readers provide confusing information
- **Non-functional interfaces** - Complex widgets become completely unusable

Screen reader users rely on these parent-child relationships to understand and navigate complex interactive widgets. Without proper parents, the interface loses all meaning.

## How to Fix

### 1. Options Must Be Inside Listbox or Combobox

**❌ Bad Example - Orphaned Options:**
```html
<!-- Bad: option without listbox parent -->
<div role="option">Option 1</div>
<div role="option">Option 2</div>
<div role="option">Option 3</div>
```

**✅ Good Example - Options in Listbox:**
```html
<!-- Good: options inside listbox -->
<div role="listbox" aria-label="Choose an option">
  <div role="option" aria-selected="false">Option 1</div>
  <div role="option" aria-selected="true">Option 2</div>
  <div role="option" aria-selected="false">Option 3</div>
</div>

<!-- Good: options in combobox popup -->
<div role="combobox" aria-expanded="true" aria-owns="listbox1">
  <input type="text" aria-autocomplete="list" />
</div>
<div role="listbox" id="listbox1">
  <div role="option">Apple</div>
  <div role="option">Banana</div>
  <div role="option">Cherry</div>
</div>
```

### 2. Tabs Must Be Inside Tablist

**❌ Bad Example - Tabs Without Tablist:**
```html
<!-- Bad: tabs without tablist parent -->
<div>
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
```

**✅ Good Example - Tabs in Tablist:**
```html
<!-- Good: tabs inside tablist -->
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
<div role="tabpanel" id="panel1" aria-labelledby="tab1">
  Panel 1 content
</div>
<div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
  Panel 2 content
</div>
```

### 3. Menu Items Must Be Inside Menu or Menubar

**❌ Bad Example - Menu Items Without Menu:**
```html
<!-- Bad: menuitem without menu parent -->
<div>
  <div role="menuitem">New</div>
  <div role="menuitem">Open</div>
  <div role="menuitem">Save</div>
</div>
```

**✅ Good Example - Menu Items in Menu:**
```html
<!-- Good: menuitems inside menu -->
<div role="menu" aria-label="File menu">
  <div role="menuitem" tabindex="0">New File</div>
  <div role="menuitem" tabindex="-1">Open File</div>
  <div role="menuitem" tabindex="-1">Save File</div>
  <div role="separator"></div>
  <div role="menuitem" tabindex="-1">Exit</div>
</div>

<!-- Good: menuitems in menubar -->
<div role="menubar" aria-label="Main menu">
  <div role="menuitem" aria-haspopup="true" aria-expanded="false">
    File
  </div>
  <div role="menuitem" aria-haspopup="true" aria-expanded="false">
    Edit
  </div>
  <div role="menuitem" aria-haspopup="true" aria-expanded="false">
    View
  </div>
</div>

<!-- Good: menuitemcheckbox in menu -->
<div role="menu" aria-label="View options">
  <div role="menuitemcheckbox" aria-checked="true" tabindex="0">
    Show Toolbar
  </div>
  <div role="menuitemcheckbox" aria-checked="false" tabindex="-1">
    Show Sidebar
  </div>
</div>
```

### 4. List Items Must Be Inside Lists

**❌ Bad Example - List Items Without List:**
```html
<!-- Bad: listitem without list parent -->
<div>
  <div role="listitem">Item 1</div>
  <div role="listitem">Item 2</div>
</div>
```

**✅ Good Example - List Items in List:**
```html
<!-- Good: listitems inside list -->
<div role="list" aria-label="Shopping cart">
  <div role="listitem">Product A - $10</div>
  <div role="listitem">Product B - $25</div>
  <div role="listitem">Product C - $15</div>
</div>

<!-- Better: Use native HTML -->
<ul aria-label="Shopping cart">
  <li>Product A - $10</li>
  <li>Product B - $25</li>
  <li>Product C - $15</li>
</ul>
```

### 5. Grid Cells Must Be Inside Rows

**❌ Bad Example - Grid Cells Without Row:**
```html
<!-- Bad: gridcell without row parent -->
<div role="grid">
  <div role="gridcell">Cell 1</div>
  <div role="gridcell">Cell 2</div>
</div>
```

**✅ Good Example - Grid Cells in Rows:**
```html
<!-- Good: gridcells inside rows -->
<div role="grid" aria-label="Product data">
  <div role="row">
    <div role="columnheader">Name</div>
    <div role="columnheader">Price</div>
  </div>
  <div role="row">
    <div role="gridcell">Widget</div>
    <div role="gridcell">$10</div>
  </div>
  <div role="row">
    <div role="gridcell">Gadget</div>
    <div role="gridcell">$25</div>
  </div>
</div>
```

### 6. Tree Items Must Be Inside Tree or Group

**✅ Good Example - Tree Items in Tree:**
```html
<!-- Good: treeitems inside tree -->
<div role="tree" aria-label="File system">
  <div role="treeitem" aria-expanded="true" aria-level="1">
    Documents
    <div role="group">
      <div role="treeitem" aria-level="2">Resume.pdf</div>
      <div role="treeitem" aria-level="2">Letter.doc</div>
    </div>
  </div>
  <div role="treeitem" aria-expanded="false" aria-level="1">
    Pictures
  </div>
</div>
```

### 7. Radio Buttons Must Be Inside Radiogroup

**❌ Bad Example - Radios Without Radiogroup:**
```html
<!-- Bad: radio without radiogroup parent -->
<div>
  <div role="radio" aria-checked="true">Small</div>
  <div role="radio" aria-checked="false">Medium</div>
  <div role="radio" aria-checked="false">Large</div>
</div>
```

**✅ Good Example - Radios in Radiogroup:**
```html
<!-- Good: radios inside radiogroup -->
<div role="radiogroup" aria-labelledby="size-label">
  <h3 id="size-label">Choose size</h3>
  <div role="radio" aria-checked="false" tabindex="0">Small</div>
  <div role="radio" aria-checked="true" tabindex="-1">Medium</div>
  <div role="radio" aria-checked="false" tabindex="-1">Large</div>
</div>
```

### 8. Rows Must Be Inside Grid or Table

**✅ Good Example - Rows in Grid:**
```html
<!-- Good: rows inside grid -->
<div role="grid" aria-label="Spreadsheet">
  <div role="row">
    <div role="columnheader">A</div>
    <div role="columnheader">B</div>
  </div>
  <div role="row">
    <div role="gridcell">1</div>
    <div role="gridcell">2</div>
  </div>
</div>

<!-- Good: rows inside table -->
<div role="table" aria-label="Data table">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">Name</div>
      <div role="columnheader">Value</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row">
      <div role="cell">Item 1</div>
      <div role="cell">100</div>
    </div>
  </div>
</div>
```

## Rule Description

This rule validates that elements with the following child roles have the appropriate parent role:

| Child Role | Required Parent Role(s) |
|-----------|------------------------|
| `option` | `listbox`, `combobox` |
| `tab` | `tablist` |
| `menuitem` | `menu`, `menubar` |
| `menuitemcheckbox` | `menu`, `menubar` |
| `menuitemradio` | `menu`, `menubar`, `group` (in menu) |
| `listitem` | `list` |
| `gridcell` | `row` |
| `columnheader` | `row` |
| `rowheader` | `row` |
| `row` | `grid`, `table`, `treegrid`, `rowgroup` |
| `treeitem` | `tree`, `group` (in tree) |
| `radio` | `radiogroup` |

## Common Mistakes

### Mistake 1: Dropdown Without Proper Structure
```html
<!-- ❌ Bad: Custom dropdown without proper roles -->
<div class="dropdown">
  <button>Select option</button>
  <div class="dropdown-menu">
    <div role="option">Option 1</div>
    <div role="option">Option 2</div>
  </div>
</div>

<!-- ✅ Good: Proper combobox structure -->
<div role="combobox" 
     aria-expanded="false" 
     aria-owns="listbox1" 
     aria-haspopup="listbox">
  <button aria-label="Select option">Select option</button>
</div>
<div role="listbox" id="listbox1" hidden>
  <div role="option">Option 1</div>
  <div role="option">Option 2</div>
</div>
```

### Mistake 2: Navigation Using Wrong Roles
```html
<!-- ❌ Bad: Using menuitem for navigation -->
<nav>
  <div role="menuitem">Home</div>
  <div role="menuitem">About</div>
</nav>

<!-- ✅ Good: Use proper navigation -->
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

### Mistake 3: Incomplete Tabpanel Structure
```html
<!-- ❌ Bad: tabpanel without tab parent -->
<div>
  <div role="tabpanel">Content here</div>
</div>

<!-- ✅ Good: Complete tab structure -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
</div>
<div role="tabpanel" id="panel1">Content here</div>
```

## Testing

### Automated Testing

```javascript
// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(v => v.id === 'aria-required-parent');
```

### Manual Testing

1. **Inspect Widget Structure:**
   - Find elements with child roles (option, tab, menuitem, etc.)
   - Trace up the DOM tree
   - Verify required parent role exists

2. **Screen Reader Test:**
   - Navigate to widgets with arrow keys
   - Verify proper announcements of structure
   - Check that navigation works as expected

3. **DevTools Check:**
   ```javascript
   // Check for required parents
   const requiredParents = {
     'option': ['listbox', 'combobox'],
     'tab': ['tablist'],
     'menuitem': ['menu', 'menubar'],
     'listitem': ['list'],
     'gridcell': ['row'],
     'treeitem': ['tree', 'group']
   };
   
   Object.entries(requiredParents).forEach(([child, parents]) => {
     document.querySelectorAll(`[role="${child}"]`).forEach(el => {
       let parent = el.parentElement;
       let foundParent = false;
       
       while (parent && parent !== document.body) {
         const parentRole = parent.getAttribute('role');
         if (parentRole && parents.includes(parentRole)) {
           foundParent = true;
           break;
         }
         parent = parent.parentElement;
       }
       
       if (!foundParent) {
         console.warn(`${child} missing required parent:`, el);
       }
     });
   });
   ```

## Resources

- [ARIA Roles - Required Context - W3C](https://www.w3.org/TR/wai-aria-1.2/#scope)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA Authoring Practices - Design Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [axe-core Rule: aria-required-parent](https://dequeuniversity.com/rules/axe/4.4/aria-required-parent)

## Related Rules

- `aria-required-children` - Elements with ARIA roles must have required children
- `aria-roles` - ARIA roles must be valid
- `aria-allowed-attr` - ARIA attributes must be allowed for the element's role
- `aria-required-attr` - Elements with ARIA roles must have all required attributes
