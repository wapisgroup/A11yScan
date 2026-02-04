# ARIA roles must conform to valid values

**Rule ID:** `aria-valid-attr-value`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

An ARIA attribute has an invalid value. Screen readers and assistive technologies cannot interpret invalid ARIA values, breaking accessibility features.

## Why It Matters

### Impact on Users

- **Screen reader users** receive incorrect or no information
- **Assistive technologies** may malfunction or ignore elements
- **Keyboard users** may lose access to interactive elements
- **All users** relying on AT may have broken experiences

### Real-World Scenario

A button has `aria-pressed="active"` instead of `aria-pressed="true"`. Screen readers don't announce the pressed state, so users don't know if the button is active or not. They may press it multiple times or get confused about the UI state.

## How to Fix

### Solution 1: Use Correct Boolean Values

ARIA boolean attributes must be `"true"` or `"false"` (as strings).

**Bad Examples:**
```html
<!-- FAIL - Invalid boolean values -->
<button aria-pressed="yes">Toggle</button>
<button aria-expanded="1">Menu</button>
<button aria-checked="on">Checkbox</button>
<div aria-hidden="true false">Content</div>
```

**Good Examples:**
```html
<!-- PASS - Valid boolean values -->
<button aria-pressed="true">Toggle</button>
<button aria-expanded="false">Menu</button>
<button aria-checked="true">Checkbox</button>
<div aria-hidden="true">Content</div>
```

### Solution 2: Valid ID References

Attributes like `aria-labelledby` and `aria-describedby` must reference existing IDs.

**Bad Examples:**
```html
<!-- FAIL - Referenced IDs don't exist -->
<button aria-labelledby="non-existent-id">Click</button>
<input aria-describedby="missing-hint" type="text">
```

**Good Examples:**
```html
<!-- PASS - Valid ID references -->
<span id="button-label">Save Changes</span>
<button aria-labelledby="button-label">
  <i class="icon-save"></i>
</button>

<label for="email">Email:</label>
<input type="email" id="email" aria-describedby="email-hint">
<span id="email-hint">We'll never share your email</span>
```

### Solution 3: Valid Token Values

Some attributes accept specific predefined tokens.

**aria-live Values:**
```html
<!-- FAIL -->
<div aria-live="medium">Updates</div>
<div aria-live="yes">Notifications</div>

<!-- PASS - Valid values: off, polite, assertive -->
<div aria-live="polite">Updates</div>
<div aria-live="assertive">Error messages</div>
<div aria-live="off">Static content</div>
```

**aria-current Values:**
```html
<!-- FAIL -->
<a href="/about" aria-current="yes">About</a>
<li aria-current="active">Item 1</li>

<!-- PASS - Valid values: page, step, location, date, time, true, false -->
<a href="/about" aria-current="page">About</a>
<li aria-current="step">Step 1</li>
<a href="/location" aria-current="location">New York</a>
<time aria-current="date">Today</time>
```

**aria-autocomplete Values:**
```html
<!-- FAIL -->
<input aria-autocomplete="on" type="text">
<input aria-autocomplete="enabled" type="text">

<!-- PASS - Valid values: inline, list, both, none -->
<input aria-autocomplete="list" type="text">
<input aria-autocomplete="both" type="text">
```

### Solution 4: Valid Number Ranges

Numeric attributes must be within valid ranges.

**aria-valuemin, aria-valuemax, aria-valuenow:**
```html
<!-- FAIL - valuenow outside min/max range -->
<div 
  role="slider" 
  aria-valuemin="0" 
  aria-valuemax="100" 
  aria-valuenow="150">
</div>

<!-- PASS - valuenow within range -->
<div 
  role="slider" 
  aria-valuemin="0" 
  aria-valuemax="100" 
  aria-valuenow="50">
</div>
```

**aria-level (must be positive integer):**
```html
<!-- FAIL -->
<div role="heading" aria-level="0">Title</div>
<div role="heading" aria-level="-1">Title</div>
<div role="heading" aria-level="2.5">Title</div>

<!-- PASS -->
<div role="heading" aria-level="1">Title</div>
<div role="heading" aria-level="2">Subtitle</div>
```

### Solution 5: Valid Token Lists

Some attributes accept space-separated lists of valid tokens.

**aria-dropeffect Values:**
```html
<!-- FAIL -->
<div aria-dropeffect="drag">Drop zone</div>

<!-- PASS - Valid values: copy, execute, link, move, none, popup -->
<div aria-dropeffect="copy move">Drop zone</div>
<div aria-dropeffect="link">Drop zone</div>
```

**aria-relevant Values:**
```html
<!-- FAIL -->
<div aria-live="polite" aria-relevant="everything">Updates</div>

<!-- PASS - Valid values: additions, removals, text, all -->
<div aria-live="polite" aria-relevant="additions text">Updates</div>
<div aria-live="polite" aria-relevant="all">Updates</div>
```

## Rule Description

This rule ensures all ARIA attribute values conform to their defined value types and ranges according to the ARIA specification.

### What This Rule Checks

- Boolean attributes have `"true"` or `"false"` values
- ID reference attributes point to existing elements
- Token attributes use valid predefined values
- Numeric attributes are within valid ranges
- Token lists contain only valid tokens

### What This Rule Does Not Check

- Whether ARIA attributes are appropriate for the element (different rule)
- Whether required ARIA attributes are present (different rule)
- The semantic correctness of ARIA usage

### Best Practices

1. **Use strings for booleans** - `"true"/"false"`, not `true/false`
2. **Verify ID references** - Ensure referenced elements exist
3. **Check specifications** - Look up valid values for each attribute
4. **Use correct types** - Numbers for numeric, strings for tokens
5. **Test with validators** - Use HTML/ARIA validators

## Common Mistakes

### 1. Boolean Values as Actual Booleans
```javascript
// FAIL - JavaScript boolean, needs string
element.setAttribute('aria-expanded', true);
element.setAttribute('aria-pressed', false);

// PASS - String values
element.setAttribute('aria-expanded', 'true');
element.setAttribute('aria-pressed', 'false');
```

### 2. Invalid ID References
```html
<!-- FAIL - ID doesn't exist -->
<button aria-labelledby="save-label">Save</button>

<!-- PASS - ID exists -->
<span id="save-label">Save Changes</span>
<button aria-labelledby="save-label">Save</button>
```

### 3. Wrong Token Values
```html
<!-- FAIL -->
<div aria-live="immediate">Alert</div>
<div role="button" aria-pressed="on">Toggle</div>
<nav aria-current="active">About</nav>

<!-- PASS -->
<div aria-live="assertive">Alert</div>
<div role="button" aria-pressed="true">Toggle</div>
<nav aria-current="page">About</nav>
```

### 4. Numbers as Strings vs Actual Numbers
```html
<!-- Both work, but string is more explicit -->
<div role="slider" aria-valuenow="50"></div>
<div role="slider" aria-valuenow=50></div>

<!-- FAIL - Invalid number -->
<div role="slider" aria-valuenow="fifty"></div>
```

### 5. Case Sensitivity
```html
<!-- FAIL - Values are case-sensitive -->
<button aria-pressed="True">Toggle</button>
<div aria-live="Polite">Updates</div>

<!-- PASS - Lowercase -->
<button aria-pressed="true">Toggle</button>
<div aria-live="polite">Updates</div>
```

## Attribute Reference

### Boolean Attributes
Values: `"true"` or `"false"`

```html
aria-atomic="true"
aria-busy="false"
aria-checked="true"
aria-disabled="false"
aria-expanded="true"
aria-grabbed="false"
aria-haspopup="true"
aria-hidden="false"
aria-invalid="true"
aria-modal="false"
aria-multiline="true"
aria-multiselectable="false"
aria-pressed="true"
aria-readonly="false"
aria-required="true"
aria-selected="false"
```

### Tristate Attributes
Values: `"true"`, `"false"`, or `"mixed"`

```html
aria-checked="mixed"
aria-pressed="mixed"
```

### ID Reference Attributes
Values: Valid element ID

```html
aria-labelledby="label-id"
aria-describedby="desc-id help-id"
aria-controls="panel-id"
aria-owns="child1 child2"
aria-activedescendant="option-3"
aria-errormessage="error-msg"
```

### Token Attributes

**aria-autocomplete:**
```html
Values: none, inline, list, both
<input aria-autocomplete="list">
```

**aria-current:**
```html
Values: false, true, page, step, location, date, time
<a aria-current="page">Home</a>
```

**aria-dropeffect:**
```html
Values: none, copy, execute, link, move, popup
<div aria-dropeffect="copy move">Drop</div>
```

**aria-haspopup:**
```html
Values: false, true, menu, listbox, tree, grid, dialog
<button aria-haspopup="menu">Options</button>
```

**aria-invalid:**
```html
Values: false, true, grammar, spelling
<input aria-invalid="spelling">
```

**aria-live:**
```html
Values: off, polite, assertive
<div aria-live="polite">Status</div>
```

**aria-orientation:**
```html
Values: horizontal, vertical, undefined
<div role="slider" aria-orientation="horizontal">
```

**aria-relevant:**
```html
Values: additions, removals, text, all
<div aria-relevant="additions text">
```

**aria-sort:**
```html
Values: none, ascending, descending, other
<th aria-sort="ascending">Name</th>
```

### Numeric Attributes

```html
aria-colcount="10"
aria-colindex="3"
aria-colspan="2"
aria-level="2"
aria-posinset="3"
aria-rowcount="100"
aria-rowindex="5"
aria-rowspan="2"
aria-setsize="10"
aria-valuemax="100"
aria-valuemin="0"
aria-valuenow="50"
```

### String Attributes

```html
aria-label="Search"
aria-placeholder="Enter email"
aria-roledescription="slide"
aria-valuetext="Medium priority"
```

## Complete Examples

### Toggle Button
```html
<button 
  type="button"
  aria-pressed="false"
  onclick="togglePressed(this)">
  Mute Audio
</button>

<script>
function togglePressed(button) {
  const pressed = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-pressed', String(!pressed));
}
</script>
```

### Expandable Menu
```html
<button 
  aria-expanded="false"
  aria-controls="menu-panel"
  aria-haspopup="true"
  onclick="toggleMenu()">
  Menu
</button>

<div id="menu-panel" hidden>
  <a href="/home">Home</a>
  <a href="/about">About</a>
</div>

<script>
function toggleMenu() {
  const button = document.querySelector('[aria-expanded]');
  const panel = document.getElementById('menu-panel');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  
  button.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
}
</script>
```

### Slider
```html
<div 
  role="slider"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="50"
  aria-valuetext="50%"
  aria-label="Volume"
  tabindex="0">
</div>

<script>
const slider = document.querySelector('[role="slider"]');
slider.addEventListener('keydown', (e) => {
  let value = parseInt(slider.getAttribute('aria-valuenow'));
  
  if (e.key === 'ArrowRight') value = Math.min(100, value + 10);
  if (e.key === 'ArrowLeft') value = Math.max(0, value - 10);
  
  slider.setAttribute('aria-valuenow', String(value));
  slider.setAttribute('aria-valuetext', `${value}%`);
});
</script>
```

### Live Region
```html
<div 
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-relevant="additions text">
  <p id="status-message"></p>
</div>

<script>
function updateStatus(message) {
  document.getElementById('status-message').textContent = message;
}
</script>
```

## Testing

### Manual Testing
1. Inspect elements with ARIA attributes
2. Verify values match specifications
3. Check ID references point to existing elements
4. Test boolean attributes are strings
5. Validate numeric ranges

### Screen Reader Testing
```
NVDA/JAWS: Navigate to elements with ARIA
Expected: Correct states and properties announced

Test button with aria-pressed:
Expected: "Toggle button, pressed" or "Toggle button, not pressed"

Test expandable section:
Expected: "Menu, collapsed" or "Menu, expanded"
```

### Automated Testing
```javascript
// Check aria-pressed values
document.querySelectorAll('[aria-pressed]').forEach(el => {
  const value = el.getAttribute('aria-pressed');
  if (!['true', 'false', 'mixed'].includes(value)) {
    console.error('Invalid aria-pressed value:', value, el);
  }
});

// Check ID references exist
document.querySelectorAll('[aria-labelledby]').forEach(el => {
  const ids = el.getAttribute('aria-labelledby').split(' ');
  ids.forEach(id => {
    if (!document.getElementById(id)) {
      console.error('aria-labelledby references non-existent ID:', id, el);
    }
  });
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'aria-valid-attr-value'
);
```

### Browser DevTools
```javascript
// Find all ARIA attributes
const ariaAttrs = [];
document.querySelectorAll('*').forEach(el => {
  Array.from(el.attributes)
    .filter(attr => attr.name.startsWith('aria-'))
    .forEach(attr => ariaAttrs.push({
      element: el.tagName,
      attribute: attr.name,
      value: attr.value
    }));
});
console.table(ariaAttrs);
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA States and Properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes)

## Related Rules

- `aria-allowed-attr` - ARIA attributes must be allowed
- `aria-required-attr` - Required ARIA attributes must be present
- `aria-valid-attr` - ARIA attributes must exist in specification
