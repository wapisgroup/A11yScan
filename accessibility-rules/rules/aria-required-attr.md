# Elements with ARIA roles must have all required attributes

**Rule ID:** `aria-required-attr`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

An element with an ARIA role is missing one or more required ARIA attributes. Assistive technologies cannot properly interpret the element without these required attributes.

## Why It Matters

### Impact on Users

- **Screen reader users** receive incomplete or incorrect information
- **Assistive technologies** may not recognize element functionality
- **Keyboard users** may not understand element state or value
- **All users** relying on AT experience broken interactions

### Real-World Scenario

A custom slider has `role="slider"` but is missing `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`. Screen readers announce "slider" but don't tell users the current value or range. Users can't determine if it's at 10% or 90%, making it unusable.

## How to Fix

### Solution 1: Add Required Attributes for Role

Each ARIA role has specific required attributes.

**Bad Example:**
```html
<!-- FAIL - slider missing required value attributes -->
<div role="slider" tabindex="0">
  Volume
</div>

<!-- FAIL - checkbox missing aria-checked -->
<div role="checkbox" tabindex="0">
  Accept terms
</div>

<!-- FAIL - progressbar missing value attributes -->
<div role="progressbar">
  Loading...
</div>
```

**Good Example:**
```html
<!-- PASS - slider with all required attributes -->
<div 
  role="slider"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Volume"
  tabindex="0">
  Volume: 50%
</div>

<!-- PASS - checkbox with required aria-checked -->
<div 
  role="checkbox"
  aria-checked="false"
  aria-label="Accept terms"
  tabindex="0">
  Accept terms
</div>

<!-- PASS - progressbar with required attributes -->
<div 
  role="progressbar"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Loading">
  Loading... 50%
</div>
```

### Solution 2: Use Native HTML Elements

Native elements have required attributes built-in.

**Bad Example:**
```html
<!-- FAIL - Custom checkbox missing aria-checked -->
<div role="checkbox" onclick="toggle()">
  Subscribe
</div>
```

**Good Example:**
```html
<!-- PASS - Native checkbox (no ARIA needed) -->
<label>
  <input type="checkbox" name="subscribe">
  Subscribe
</label>

<!-- OR properly implemented custom checkbox -->
<div 
  role="checkbox"
  aria-checked="false"
  aria-labelledby="subscribe-label"
  tabindex="0"
  onclick="toggle()">
</div>
<span id="subscribe-label">Subscribe</span>
```

### Solution 3: Complete Widget Patterns

Follow ARIA Authoring Practices for complete implementations.

**Slider Pattern:**
```html
<div 
  role="slider"
  aria-label="Temperature"
  aria-valuenow="72"
  aria-valuemin="60"
  aria-valuemax="80"
  aria-valuetext="72 degrees Fahrenheit"
  tabindex="0">
  <div class="slider-track">
    <div class="slider-thumb" style="left: 60%"></div>
  </div>
</div>

<script>
// Handle keyboard interaction
slider.addEventListener('keydown', (e) => {
  let value = parseInt(slider.getAttribute('aria-valuenow'));
  if (e.key === 'ArrowRight') value++;
  if (e.key === 'ArrowLeft') value--;
  
  value = Math.max(60, Math.min(80, value));
  slider.setAttribute('aria-valuenow', value);
  slider.setAttribute('aria-valuetext', `${value} degrees Fahrenheit`);
});
</script>
```

**Combobox Pattern:**
```html
<label for="combo">Choose a fruit:</label>
<input 
  type="text"
  id="combo"
  role="combobox"
  aria-autocomplete="list"
  aria-expanded="false"
  aria-controls="listbox"
  aria-activedescendant="">

<ul 
  id="listbox"
  role="listbox"
  hidden>
  <li role="option" id="option-1">Apple</li>
  <li role="option" id="option-2">Banana</li>
  <li role="option" id="option-3">Orange</li>
</ul>
```

**Tab Pattern:**
```html
<div role="tablist" aria-label="Sample Tabs">
  <button 
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1">
    Tab 1
  </button>
  <button 
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    id="tab-2">
    Tab 2
  </button>
</div>

<div 
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1">
  Content 1
</div>
<div 
  role="tabpanel"
  id="panel-2"
  aria-labelledby="tab-2"
  hidden>
  Content 2
</div>
```

### Solution 4: Dynamic Attribute Updates

Update required attributes when state changes.

**Toggle Button:**
```html
<button 
  aria-pressed="false"
  onclick="toggleButton(this)">
  Mute
</button>

<script>
function toggleButton(button) {
  const pressed = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-pressed', String(!pressed));
  button.textContent = pressed ? 'Mute' : 'Unmute';
}
</script>
```

**Expandable Section:**
```html
<button 
  aria-expanded="false"
  aria-controls="section"
  onclick="toggleSection(this)">
  Show Details
</button>

<div id="section" hidden>
  Details content...
</div>

<script>
function toggleSection(button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const section = document.getElementById('section');
  
  button.setAttribute('aria-expanded', String(!expanded));
  section.hidden = expanded;
  button.textContent = expanded ? 'Show Details' : 'Hide Details';
}
</script>
```

## Rule Description

This rule ensures elements with ARIA roles include all required ARIA attributes for that role according to the ARIA specification.

### What This Rule Checks

- Elements with ARIA roles have required attributes
- Required attributes are present (not checking values)
- Role-specific requirements are met

## Required Attributes by Role

### checkbox
**Required:** `aria-checked`

```html
<div 
  role="checkbox"
  aria-checked="false"
  tabindex="0">
  Option
</div>
```

### combobox
**Required:** `aria-controls`, `aria-expanded`

```html
<input 
  type="text"
  role="combobox"
  aria-controls="listbox-id"
  aria-expanded="false">
```

### gridcell (when focusable)
**Required:** (context-dependent)

```html
<div 
  role="gridcell"
  tabindex="-1">
  Cell content
</div>
```

### heading
**Required:** `aria-level`

```html
<div 
  role="heading"
  aria-level="2">
  Section Title
</div>
```

### menuitemcheckbox
**Required:** `aria-checked`

```html
<div 
  role="menuitemcheckbox"
  aria-checked="true"
  tabindex="-1">
  Show toolbar
</div>
```

### menuitemradio
**Required:** `aria-checked`

```html
<div 
  role="menuitemradio"
  aria-checked="false"
  tabindex="-1">
  List view
</div>
```

### option
**Required:** `aria-selected`

```html
<div 
  role="option"
  aria-selected="false">
  Option 1
</div>
```

### progressbar
**Required:** `aria-valuenow` (unless indeterminate)

```html
<!-- Determinate progress -->
<div 
  role="progressbar"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Upload progress">
  50%
</div>

<!-- Indeterminate progress (no valuenow needed) -->
<div 
  role="progressbar"
  aria-label="Loading"
  aria-valuetext="Loading, please wait">
  <div class="spinner"></div>
</div>
```

### radio
**Required:** `aria-checked`

```html
<div 
  role="radio"
  aria-checked="false"
  tabindex="-1">
  Option A
</div>
```

### scrollbar
**Required:** `aria-controls`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

```html
<div 
  role="scrollbar"
  aria-controls="content"
  aria-valuenow="25"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-orientation="vertical"
  tabindex="0">
</div>
```

### separator (when focusable)
**Required:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

```html
<div 
  role="separator"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Resize panels"
  tabindex="0">
</div>
```

### slider
**Required:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

```html
<div 
  role="slider"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Volume"
  tabindex="0">
</div>
```

### spinbutton
**Required:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

```html
<div 
  role="spinbutton"
  aria-valuenow="10"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Quantity"
  tabindex="0">
  10
</div>
```

### switch
**Required:** `aria-checked`

```html
<button 
  role="switch"
  aria-checked="false"
  aria-label="Enable notifications">
  <span class="switch-track">
    <span class="switch-thumb"></span>
  </span>
</button>
```

### tab
**Required:** (part of tablist, needs aria-selected when applicable)

```html
<button 
  role="tab"
  aria-selected="true"
  aria-controls="panel-1">
  Tab 1
</button>
```

### tabpanel
**Required:** (none, but should have aria-labelledby)

```html
<div 
  role="tabpanel"
  aria-labelledby="tab-1"
  id="panel-1">
  Content
</div>
```

### treeitem
**Required:** (part of tree structure)

```html
<div 
  role="treeitem"
  aria-expanded="false"
  aria-level="1"
  tabindex="-1">
  Folder
</div>
```

## Common Mistakes

### 1. Missing aria-checked
```html
<!-- FAIL -->
<div role="checkbox">Accept</div>
<div role="radio">Option A</div>
<button role="switch">Toggle</button>

<!-- PASS -->
<div role="checkbox" aria-checked="false">Accept</div>
<div role="radio" aria-checked="false">Option A</div>
<button role="switch" aria-checked="false">Toggle</button>
```

### 2. Missing Slider Values
```html
<!-- FAIL -->
<div role="slider">Volume</div>

<!-- PASS -->
<div 
  role="slider"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100">
  Volume
</div>
```

### 3. Missing aria-expanded on Combobox
```html
<!-- FAIL -->
<input role="combobox" aria-controls="list">

<!-- PASS -->
<input 
  role="combobox"
  aria-controls="list"
  aria-expanded="false">
```

### 4. Missing aria-level on Heading
```html
<!-- FAIL -->
<div role="heading">Title</div>

<!-- PASS -->
<div role="heading" aria-level="2">Title</div>
```

## Testing

### Manual Testing
1. Find all elements with ARIA roles
2. Check ARIA spec for required attributes
3. Verify all required attributes are present
4. Test with assistive technology

### Screen Reader Testing
```
NVDA/JAWS: Navigate to custom control
Expected: All states and values announced correctly

Missing required attributes result in:
- Incomplete announcements
- Missing state information
- Unusable controls
```

### Automated Testing
```javascript
// Check sliders
document.querySelectorAll('[role="slider"]').forEach(slider => {
  const required = ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'];
  required.forEach(attr => {
    if (!slider.hasAttribute(attr)) {
      console.error(`Slider missing required ${attr}:`, slider);
    }
  });
});

// Check checkboxes
document.querySelectorAll('[role="checkbox"]').forEach(cb => {
  if (!cb.hasAttribute('aria-checked')) {
    console.error('Checkbox missing aria-checked:', cb);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'aria-required-attr'
);
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA 1.2 Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

## Related Rules

- `aria-allowed-attr` - Attributes must be allowed for role
- `aria-valid-attr-value` - Attribute values must be valid
- `aria-valid-attr` - Attributes must exist in spec
