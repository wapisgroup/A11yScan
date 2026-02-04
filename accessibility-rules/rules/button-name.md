# Buttons must have discernible text

**Rule ID:** `button-name`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

A button element does not have text content or accessible text. Screen reader users cannot understand the button's purpose.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "button" without knowing what it does
- **Voice control users** cannot activate the button by name
- **Users with cognitive disabilities** need clear button labels to understand functionality
- **All users** benefit from clear, descriptive button text

### Real-World Scenario

A screen reader user encounters a form with a search field and a button. The screen reader announces: "Edit text, search. Button." Without button text, they don't know if it's a submit button, clear button, or filter button.

## How to Fix

### Solution 1: Use Text Content

Add descriptive text inside the button element.

**Bad Example:**
```html
<!-- Empty button -->
<button></button>
<button type="submit"></button>
```

**Good Example:**
```html
<button type="submit">Search</button>
<button type="button">Clear Form</button>
<button>Add to Cart</button>
```

### Solution 2: Icon Buttons with aria-label

For icon-only buttons, use `aria-label` to provide text.

**Bad Example:**
```html
<!-- Icon without label -->
<button class="icon-btn">
  <i class="fa fa-trash"></i>
</button>
```

**Good Example:**
```html
<button class="icon-btn" aria-label="Delete item">
  <i class="fa fa-trash" aria-hidden="true"></i>
</button>

<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<button aria-label="Settings">
  <span class="material-icons" aria-hidden="true">settings</span>
</button>
```

### Solution 3: Image Buttons with Alt Text

When using images inside buttons, ensure proper alt text.

**Bad Example:**
```html
<!-- Image without alt -->
<button>
  <img src="search.png">
</button>
```

**Good Example:**
```html
<button>
  <img src="search.png" alt="Search">
</button>

<!-- Better: Use aria-label for consistency -->
<button aria-label="Search">
  <img src="search.png" alt="" aria-hidden="true">
</button>
```

### Solution 4: Icon + Text with Tooltip

Combine visible text with icons for clarity.

**Good Example:**
```html
<button>
  <i class="fa fa-save" aria-hidden="true"></i>
  Save
</button>

<button>
  <svg aria-hidden="true">...</svg>
  <span>Download PDF</span>
</button>

<!-- Icon with visually hidden text -->
<button>
  <i class="fa fa-trash" aria-hidden="true"></i>
  <span class="visually-hidden">Delete</span>
</button>
```

### Solution 5: Using aria-labelledby

Reference existing text on the page.

**Good Example:**
```html
<h2 id="modal-title">Confirm Deletion</h2>
<p>Are you sure you want to delete this item?</p>
<button aria-labelledby="modal-title confirm-btn">
  <span id="confirm-btn">Confirm</span>
</button>

<!-- Better approach -->
<button>Confirm Deletion</button>
```

## Rule Description

This rule checks that all `<button>` elements, elements with `type="button"`, `type="submit"`, or `type="reset"`, and elements with `role="button"` have accessible names.

### What This Rule Checks

- Text content inside the button
- `aria-label` attribute
- `aria-labelledby` attribute
- `alt` attribute on images inside buttons
- `title` attribute (as last resort)

### What This Rule Does Not Check

- Quality or clarity of button text
- Whether button text matches visual design
- Button functionality or behavior

### Best Practices

1. **Prefer visible text** - Use text content when possible
2. **Be specific** - "Delete Comment" not "Delete" or "OK"
3. **Be concise** - Keep labels short but descriptive
4. **Match visual text** - aria-label should match what sighted users see
5. **Hide decorative icons** - Use `aria-hidden="true"` on icon elements

## Common Mistakes

### 1. Empty Button
```html
<!-- FAIL -->
<button></button>
<button type="submit"></button>
<button class="btn-primary"></button>
```

### 2. Icon Without Label
```html
<!-- FAIL -->
<button>
  <i class="icon-close"></i>
</button>

<!-- PASS -->
<button aria-label="Close">
  <i class="icon-close" aria-hidden="true"></i>
</button>
```

### 3. Image Without Alt
```html
<!-- FAIL -->
<button>
  <img src="icons/print.png">
</button>

<!-- PASS -->
<button>
  <img src="icons/print.png" alt="Print">
</button>
```

### 4. Generic Text
```html
<!-- FAIL - Too vague -->
<button>Click Here</button>
<button>Submit</button>
<button>OK</button>

<!-- PASS - Specific -->
<button>Search Products</button>
<button>Submit Application</button>
<button>Confirm Purchase</button>
```

### 5. Whitespace Only
```html
<!-- FAIL -->
<button>   </button>
<button>&nbsp;</button>
```

### 6. Relying on Title Alone
```html
<!-- FAIL - title is not sufficient -->
<button title="Save">
  <i class="icon-save"></i>
</button>

<!-- PASS -->
<button aria-label="Save">
  <i class="icon-save" aria-hidden="true"></i>
</button>
```

## Examples by Button Type

### Submit Buttons
```html
<!-- Forms -->
<form>
  <input type="text" id="search" name="q">
  <button type="submit">Search</button>
</form>

<!-- Login -->
<button type="submit">Sign In</button>
<button type="submit">Create Account</button>

<!-- Checkout -->
<button type="submit">Complete Purchase</button>
```

### Action Buttons
```html
<!-- CRUD operations -->
<button type="button">Add User</button>
<button type="button" aria-label="Edit profile">
  <i class="fa fa-edit" aria-hidden="true"></i>
</button>
<button type="button" aria-label="Delete item">
  <i class="fa fa-trash" aria-hidden="true"></i>
</button>

<!-- Navigation -->
<button onclick="history.back()">Back</button>
<button>Next Step</button>
<button>Skip to Results</button>
```

### Dialog/Modal Buttons
```html
<!-- Close buttons -->
<button aria-label="Close dialog">
  <span aria-hidden="true">&times;</span>
</button>

<!-- Confirmation -->
<button>Confirm</button>
<button>Cancel</button>
<button>Save Changes</button>
```

### Toggle Buttons
```html
<!-- State toggles -->
<button 
  aria-pressed="false" 
  aria-label="Mute audio">
  <i class="fa fa-volume-up" aria-hidden="true"></i>
</button>

<!-- Visibility toggles -->
<button 
  aria-expanded="false" 
  aria-controls="menu">
  Show Menu
</button>
```

### Social Media Buttons
```html
<!-- Share buttons -->
<button aria-label="Share on Twitter">
  <svg aria-hidden="true">...</svg>
</button>

<button aria-label="Share on Facebook">
  <img src="fb-icon.png" alt="" aria-hidden="true">
</button>

<!-- Like/favorite -->
<button aria-label="Add to favorites" aria-pressed="false">
  <i class="fa fa-heart-o" aria-hidden="true"></i>
</button>
```

### Media Control Buttons
```html
<!-- Video controls -->
<button aria-label="Play video">
  <i class="fa fa-play" aria-hidden="true"></i>
</button>

<button aria-label="Pause video">
  <i class="fa fa-pause" aria-hidden="true"></i>
</button>

<button aria-label="Mute">
  <i class="fa fa-volume-up" aria-hidden="true"></i>
</button>

<button aria-label="Full screen">
  <i class="fa fa-expand" aria-hidden="true"></i>
</button>
```

## Complex Examples

### Button with Loading State
```html
<button id="submit-btn">
  <span class="btn-text">Save Changes</span>
  <span class="spinner" hidden aria-hidden="true"></span>
</button>

<script>
function showLoading() {
  const btn = document.getElementById('submit-btn');
  btn.querySelector('.btn-text').textContent = 'Saving...';
  btn.querySelector('.spinner').hidden = false;
  btn.disabled = true;
}
</script>
```

### Button Group
```html
<div role="group" aria-label="Text formatting">
  <button aria-label="Bold" aria-pressed="false">
    <strong aria-hidden="true">B</strong>
  </button>
  <button aria-label="Italic" aria-pressed="false">
    <em aria-hidden="true">I</em>
  </button>
  <button aria-label="Underline" aria-pressed="false">
    <u aria-hidden="true">U</u>
  </button>
</div>
```

### Pagination Buttons
```html
<nav aria-label="Pagination">
  <button aria-label="Previous page">
    <span aria-hidden="true">&laquo;</span>
  </button>
  
  <button aria-label="Page 1" aria-current="page">1</button>
  <button aria-label="Page 2">2</button>
  <button aria-label="Page 3">3</button>
  
  <button aria-label="Next page">
    <span aria-hidden="true">&raquo;</span>
  </button>
</nav>
```

### Dropdown Button
```html
<button 
  aria-expanded="false" 
  aria-haspopup="true"
  aria-controls="dropdown-menu">
  Options
  <span aria-hidden="true">▼</span>
</button>
```

## Testing

### Manual Testing
1. Tab through all buttons on the page
2. Verify each button has visible or accessible text
3. Check that button purpose is clear
4. Ensure icon buttons have appropriate labels

### Screen Reader Testing
```
NVDA/JAWS: Tab to button
Expected: "Search, button" not just "button"

NVDA: Insert+F7, select Buttons
Expected: All buttons listed with descriptive names
```

### Automated Testing
```javascript
// Check all buttons have accessible names
const buttons = document.querySelectorAll('button, [type="button"], [type="submit"], [role="button"]');

buttons.forEach(button => {
  const accessibleName = getAccessibleName(button);
  if (!accessibleName || accessibleName.trim() === '') {
    console.error('Button without accessible name:', button);
  }
});

// Using axe-core
const results = await axe.run();
const buttonViolations = results.violations.filter(
  v => v.id === 'button-name'
);
```

### Browser DevTools
```javascript
// Find all buttons
$$('button, [type="button"], [type="submit"], [role="button"]')

// Check for accessible names
Array.from(document.querySelectorAll('button')).map(btn => ({
  element: btn,
  text: btn.textContent.trim(),
  ariaLabel: btn.getAttribute('aria-label'),
  ariaLabelledby: btn.getAttribute('aria-labelledby')
}));
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [ARIA: button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)
- [WebAIM: Creating Accessible Forms - Buttons](https://webaim.org/techniques/forms/controls#button)
- [Deque: Button Name Rule](https://dequeuniversity.com/rules/axe/4.10/button-name)

## Related Rules

- `input-button-name` - Input buttons must have text
- `link-name` - Links must have discernible text
- `aria-command-name` - ARIA commands must have accessible names
- `empty-heading` - Headings must not be empty
