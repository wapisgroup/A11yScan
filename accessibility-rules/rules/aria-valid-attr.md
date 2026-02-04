# ARIA Attributes Must Be Valid

**Rule ID:** `aria-valid-attr`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

ARIA (Accessible Rich Internet Applications) attributes used in HTML elements must be valid attributes that are defined in the ARIA specification. Using invalid or misspelled ARIA attributes can cause assistive technologies to ignore or misinterpret the intended accessibility information.

## Why It Matters

When invalid ARIA attributes are used:
- **Screen readers ignore them** - Invalid attributes are typically ignored by assistive technologies, providing no accessibility benefit
- **Developer confusion** - Developers may think they've added accessibility when they haven't
- **Broken functionality** - Applications relying on ARIA states may not work correctly
- **Validation errors** - HTML validators will flag invalid attributes
- **User experience** - Users with disabilities miss critical information about interactive elements

Assistive technology users depend on valid ARIA attributes to understand the state, properties, and relationships of interface elements. Invalid attributes break this communication channel.

## How to Fix

### 1. Use Only Valid ARIA Attributes

Ensure all ARIA attributes are spelled correctly and exist in the ARIA specification.

**❌ Bad Example - Invalid Attributes:**
```html
<!-- Invalid: aria-labelled (missing "by") -->
<button aria-labelled="save-button">Save</button>

<!-- Invalid: aria-hidden-label (not a real attribute) -->
<div aria-hidden-label="true">Content</div>

<!-- Invalid: role-description (should be aria-roledescription) -->
<div role="region" role-description="Map">...</div>

<!-- Invalid: aria-disable (should be aria-disabled) -->
<button aria-disable="true">Submit</button>
```

**✅ Good Example - Valid Attributes:**
```html
<!-- Correct: aria-labelledby -->
<button aria-labelledby="save-button">Save</button>

<!-- Correct: aria-hidden -->
<div aria-hidden="true">Content</div>

<!-- Correct: aria-roledescription -->
<div role="region" aria-roledescription="Interactive map">...</div>

<!-- Correct: aria-disabled -->
<button aria-disabled="true">Submit</button>
```

### 2. Common Valid ARIA Attributes

**Widget Attributes:**
```html
<!-- Autocomplete -->
<input aria-autocomplete="list" />

<!-- Checked state -->
<div role="checkbox" aria-checked="true">Remember me</div>

<!-- Disabled state -->
<button aria-disabled="true">Submit</button>

<!-- Expanded state -->
<button aria-expanded="false" aria-controls="menu">Menu</button>

<!-- Current state -->
<a href="/home" aria-current="page">Home</a>

<!-- Invalid state -->
<input aria-invalid="true" aria-errormessage="error-msg" />

<!-- Pressed state -->
<button aria-pressed="true">Bold</button>

<!-- Required state -->
<input aria-required="true" />

<!-- Selected state -->
<div role="option" aria-selected="true">Option 1</div>
```

**Live Region Attributes:**
```html
<!-- Atomic regions -->
<div aria-atomic="true" aria-live="polite">Status: Processing...</div>

<!-- Busy state -->
<div aria-busy="true">Loading...</div>

<!-- Live regions -->
<div aria-live="assertive">Error occurred!</div>

<!-- Relevant updates -->
<div aria-relevant="additions text">...</div>
```

**Relationship Attributes:**
```html
<!-- Controls -->
<button aria-controls="panel-1" aria-expanded="true">Expand</button>

<!-- Described by -->
<input aria-describedby="password-requirements" />

<!-- Labeled by -->
<div role="dialog" aria-labelledby="dialog-title">...</div>

<!-- Owns -->
<div role="listbox" aria-owns="option1 option2 option3">...</div>

<!-- Active descendant -->
<div role="combobox" aria-activedescendant="option-2">...</div>

<!-- Flow to -->
<div aria-flowto="next-section">...</div>
```

**Drag and Drop Attributes:**
```html
<!-- Draggable -->
<div aria-grabbed="true" draggable="true">Drag me</div>

<!-- Drop effect -->
<div aria-dropeffect="move">Drop zone</div>
```

### 3. Check Spelling Carefully

Many ARIA attributes look similar but have specific spellings.

**❌ Common Misspellings:**
```html
<!-- Wrong -->
<div aria-labelled-by="title">...</div>
<button aria-disable="true">...</button>
<input aria-require="true" />
<div aria-role-description="Map">...</div>
```

**✅ Correct Spellings:**
```html
<!-- Correct -->
<div aria-labelledby="title">...</div>
<button aria-disabled="true">...</button>
<input aria-required="true" />
<div aria-roledescription="Interactive map">...</div>
```

### 4. Validate Attribute Names

Use the official ARIA specification as reference for valid attributes.

**Valid State Attributes:**
- `aria-busy`, `aria-checked`, `aria-disabled`, `aria-expanded`, `aria-grabbed`, `aria-hidden`, `aria-invalid`, `aria-pressed`, `aria-selected`

**Valid Property Attributes:**
- `aria-atomic`, `aria-autocomplete`, `aria-controls`, `aria-describedby`, `aria-dropeffect`, `aria-haspopup`, `aria-label`, `aria-labelledby`, `aria-level`, `aria-live`, `aria-multiline`, `aria-multiselectable`, `aria-orientation`, `aria-owns`, `aria-readonly`, `aria-relevant`, `aria-required`, `aria-sort`, `aria-valuemax`, `aria-valuemin`, `aria-valuenow`, `aria-valuetext`

## Rule Description

This rule checks that all ARIA attributes used on HTML elements are:
1. Spelled correctly
2. Defined in the WAI-ARIA specification
3. Properly formatted with the `aria-` prefix

The rule validates against the official ARIA 1.2 specification attribute names.

## Common Mistakes

### Mistake 1: Using Non-Existent ARIA Attributes
```html
<!-- ❌ Bad: Making up attributes -->
<div aria-tooltip="Click for help">...</div>
<button aria-action="submit">Save</button>
<input aria-validation="true" />
```

### Mistake 2: Misspelling Common Attributes
```html
<!-- ❌ Bad: Common spelling errors -->
<button aria-labelled="submit-btn">Submit</button>  <!-- Missing "by" -->
<div aria-hidden-focus="true">...</div>  <!-- Not a real attribute -->
<input aria-require="true" />  <!-- Should be aria-required -->
```

### Mistake 3: Confusing ARIA with HTML Attributes
```html
<!-- ❌ Bad: Mixing ARIA and HTML attributes -->
<button aria-disabled="true" disabled>Submit</button>  <!-- Redundant but valid -->
<input aria-readonly="true" readonly />  <!-- Better to use just readonly -->

<!-- ✅ Good: Use ARIA when HTML doesn't exist -->
<div role="button" aria-disabled="true">Custom Button</div>
```

### Mistake 4: Using Attributes on Wrong Elements
```html
<!-- ❌ Bad: Valid attribute, wrong context -->
<div aria-checked="true">Not a checkbox</div>  <!-- No checkbox role -->

<!-- ✅ Good: Attribute matches role -->
<div role="checkbox" aria-checked="true" tabindex="0">Custom checkbox</div>
```

## Testing

### Automated Testing

```javascript
// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(v => v.id === 'aria-valid-attr');
```

### Manual Testing

1. **Inspect ARIA Attributes:**
   - Open browser DevTools
   - Search for elements with `aria-` attributes
   - Verify each attribute exists in ARIA spec

2. **Check Spelling:**
   - Common mistakes: `aria-labelled` (should be `aria-labelledby`)
   - Verify hyphenation and capitalization

3. **Validate with Tools:**
   - Use HTML validator (W3C Validator)
   - Use WAVE browser extension
   - Use axe DevTools extension

### Browser DevTools Check

```javascript
// In browser console - find all ARIA attributes
const ariaAttrs = new Set();
document.querySelectorAll('*').forEach(el => {
  Array.from(el.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-')) {
      ariaAttrs.add(attr.name);
    }
  });
});
console.log('ARIA attributes used:', Array.from(ariaAttrs).sort());
```

## Resources

- [ARIA Attributes - W3C](https://www.w3.org/TR/wai-aria-1.2/#state_prop_def)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [Using ARIA - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Rule: aria-valid-attr](https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr)

## Related Rules

- `aria-valid-attr-value` - ARIA attribute values must be valid
- `aria-allowed-attr` - ARIA attributes must be allowed for the element's role
- `aria-required-attr` - Elements with ARIA roles must have all required attributes
- `aria-roles` - ARIA roles must be valid
