# ARIA attributes must be allowed for the element's role

**Rule ID:** `aria-allowed-attr`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

An element has ARIA attributes that are not allowed for its role. This can confuse assistive technologies and provide incorrect information to users.

## Why It Matters

### Impact on Users

- **Screen reader users** receive incorrect or conflicting information
- **Assistive technologies** may ignore invalid attributes
- **Voice control users** may have issues with element identification
- **All users** relying on AT get inconsistent experiences

### Real-World Scenario

A `<div role="button">` has `aria-required="true"`, which is not allowed for buttons. Screen readers ignore this invalid attribute, so users don't know a required field exists. The form validation fails but users have no indication why.

## How to Fix

### Solution 1: Remove Disallowed Attributes

Check the ARIA specification for which attributes are allowed for each role.

**Bad Example:**
```html
<!-- FAIL - aria-placeholder not allowed on button -->
<button aria-placeholder="Click me">Submit</button>

<!-- FAIL - aria-required not allowed on button -->
<div role="button" aria-required="true">Save</div>

<!-- FAIL - aria-checked not allowed on link -->
<a href="#" aria-checked="true">Selected</a>
```

**Good Example:**
```html
<!-- PASS - aria-pressed is allowed on button -->
<button aria-pressed="false">Toggle</button>

<!-- PASS - aria-label is allowed on button -->
<div role="button" aria-label="Save changes">Save</div>

<!-- PASS - aria-current is allowed on link -->
<a href="#" aria-current="page">Home</a>
```

### Solution 2: Use Correct Role for Attributes

Choose a role that supports the attributes you need.

**Bad Example:**
```html
<!-- FAIL - aria-valuenow not allowed on button -->
<button aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  50%
</button>
```

**Good Example:**
```html
<!-- PASS - Use slider role which allows value attributes -->
<div 
  role="slider"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Volume"
  tabindex="0">
  50%
</div>
```

### Solution 3: Use Native HTML Instead

Native HTML elements automatically have the correct attributes.

**Bad Example:**
```html
<!-- FAIL - aria-autocomplete not allowed on div -->
<div 
  role="textbox" 
  contenteditable="true"
  aria-autocomplete="list">
</div>
```

**Good Example:**
```html
<!-- PASS - Use native input with autocomplete -->
<input 
  type="text"
  aria-autocomplete="list"
  list="suggestions">
<datalist id="suggestions">
  <option value="Option 1">
  <option value="Option 2">
</datalist>
```

### Solution 4: Common Role-Attribute Combinations

Use these proven patterns for common use cases.

**Buttons:**
```html
<!-- Allowed: aria-pressed, aria-expanded, aria-label, aria-labelledby, aria-describedby -->
<button aria-pressed="false">Mute</button>
<button aria-expanded="false" aria-controls="menu">Menu</button>
<button aria-label="Close">×</button>
```

**Links:**
```html
<!-- Allowed: aria-label, aria-labelledby, aria-describedby, aria-current -->
<a href="/" aria-current="page">Home</a>
<a href="/download" aria-label="Download PDF report">
  <i class="icon-download"></i>
</a>
```

**Checkboxes:**
```html
<!-- Allowed: aria-checked, aria-label, aria-labelledby, aria-required -->
<div 
  role="checkbox"
  aria-checked="false"
  aria-label="Accept terms"
  aria-required="true"
  tabindex="0">
</div>
```

**Text Inputs:**
```html
<!-- Allowed: aria-placeholder, aria-autocomplete, aria-required, aria-invalid -->
<input 
  type="text"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="hint">
<span id="hint">Enter your email</span>
```

### Solution 5: Check ARIA Specification

Always verify allowed attributes in the ARIA spec.

**Resources for Checking:**
```
ARIA Specification:
https://www.w3.org/TR/wai-aria-1.2/#role_definitions

For each role, see "Supported States and Properties" section
```

## Rule Description

This rule ensures ARIA attributes used on elements are allowed for those elements' roles according to the ARIA specification.

### What This Rule Checks

- ARIA attributes match role's supported states and properties
- Global ARIA attributes (allowed on all elements)
- Role-specific attributes are only on appropriate roles

### Global ARIA Attributes (Allowed Everywhere)

```html
aria-atomic
aria-busy
aria-controls
aria-current
aria-describedby
aria-details
aria-disabled
aria-dropeffect
aria-errormessage
aria-flowto
aria-grabbed
aria-haspopup
aria-hidden
aria-invalid
aria-keyshortcuts
aria-label
aria-labelledby
aria-live
aria-owns
aria-relevant
aria-roledescription
```

### What This Rule Does Not Check

- Whether attributes have valid values (different rule)
- Whether required attributes are present (different rule)
- Semantic appropriateness of the role

## Common Mistakes

### 1. Using Input Attributes on Buttons
```html
<!-- FAIL -->
<button aria-placeholder="Enter text">Submit</button>
<button aria-autocomplete="list">Search</button>

<!-- PASS -->
<button aria-label="Submit form">Submit</button>
```

### 2. Using Widget Attributes on Text
```html
<!-- FAIL -->
<div aria-valuenow="50">Progress: 50%</div>
<span aria-checked="true">Selected</span>

<!-- PASS -->
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  Progress: 50%
</div>
<span role="checkbox" aria-checked="true">Selected</span>
```

### 3. Confusing Similar Attributes
```html
<!-- FAIL - aria-pressed only on button/toggle -->
<a href="#" aria-pressed="true">Active Link</a>

<!-- PASS - Use aria-current for links -->
<a href="#" aria-current="page">Active Link</a>

<!-- PASS - aria-pressed on button -->
<button aria-pressed="true">Muted</button>
```

### 4. Wrong Attributes for Custom Controls
```html
<!-- FAIL - aria-selected not allowed on button -->
<button aria-selected="true">Tab 1</button>

<!-- PASS - Use proper tab role -->
<button role="tab" aria-selected="true">Tab 1</button>
```

## Allowed Attributes by Role

### Button Role
```html
<button>
  <!-- Allowed -->
  aria-pressed="false"
  aria-expanded="false"
  aria-label="Close"
  aria-describedby="help"
</button>

<!-- NOT allowed: aria-placeholder, aria-required, aria-checked, aria-selected -->
```

### Checkbox Role
```html
<div role="checkbox">
  <!-- Allowed -->
  aria-checked="false"
  aria-required="true"
  aria-readonly="false"
  aria-label="Accept terms"
</div>

<!-- NOT allowed: aria-pressed, aria-expanded, aria-valuenow -->
```

### Link Role
```html
<a href="/">
  <!-- Allowed -->
  aria-current="page"
  aria-label="Homepage"
  aria-describedby="desc"
</a>

<!-- NOT allowed: aria-pressed, aria-checked, aria-expanded -->
```

### Textbox Role
```html
<input type="text">
  <!-- Allowed -->
  aria-placeholder="Enter email"
  aria-autocomplete="email"
  aria-required="true"
  aria-invalid="false"
  aria-multiline="false"
</input>

<!-- NOT allowed: aria-pressed, aria-checked, aria-valuenow -->
```

### Slider Role
```html
<div role="slider">
  <!-- Allowed -->
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="50 percent"
  aria-orientation="horizontal"
  aria-label="Volume"
</div>

<!-- NOT allowed: aria-placeholder, aria-autocomplete, aria-checked -->
```

### Progressbar Role
```html
<div role="progressbar">
  <!-- Allowed -->
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="50% complete"
</div>

<!-- NOT allowed: aria-pressed, aria-placeholder, aria-orientation -->
```

### Tab Role
```html
<button role="tab">
  <!-- Allowed -->
  aria-selected="true"
  aria-controls="panel-1"
  aria-label="First tab"
</button>

<!-- NOT allowed: aria-pressed, aria-checked, aria-valuenow -->
```

### Menu/Menuitem Roles
```html
<div role="menu">
  <div role="menuitem">
    <!-- Allowed on menuitem -->
    aria-disabled="false"
    aria-label="Save file"
  </div>
  
  <div role="menuitemcheckbox">
    <!-- Allowed on menuitemcheckbox -->
    aria-checked="true"
    aria-label="Show toolbar"
  </div>
  
  <div role="menuitemradio">
    <!-- Allowed on menuitemradio -->
    aria-checked="false"
    aria-label="View: List"
  </div>
</div>
```

## Testing

### Manual Testing
1. Identify all elements with ARIA attributes
2. Check element's role (implicit or explicit)
3. Verify each ARIA attribute is allowed for that role
4. Consult ARIA specification for role definitions

### Screen Reader Testing
```
NVDA/JAWS: Navigate to element
Expected: Correct role and states announced
No unexpected silence or incorrect information

Invalid attributes may be:
- Ignored completely
- Cause role to be ignored
- Produce unexpected behavior
```

### Automated Testing
```javascript
// Check common violations
const buttons = document.querySelectorAll('button, [role="button"]');
buttons.forEach(btn => {
  if (btn.hasAttribute('aria-placeholder')) {
    console.error('Button has aria-placeholder (not allowed):', btn);
  }
  if (btn.hasAttribute('aria-required')) {
    console.error('Button has aria-required (not allowed):', btn);
  }
});

// Check links
const links = document.querySelectorAll('a, [role="link"]');
links.forEach(link => {
  if (link.hasAttribute('aria-pressed')) {
    console.error('Link has aria-pressed (not allowed):', link);
  }
  if (link.hasAttribute('aria-checked')) {
    console.error('Link has aria-checked (not allowed):', link);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'aria-allowed-attr'
);
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA 1.2 Specification - Role Definitions](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA States and Properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes)

## Related Rules

- `aria-valid-attr` - ARIA attributes must exist in spec
- `aria-valid-attr-value` - ARIA attribute values must be valid
- `aria-required-attr` - Required ARIA attributes must be present
- `aria-allowed-role` - ARIA role must be appropriate for element
