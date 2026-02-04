# Input buttons must have discernible text

**Rule ID:** `input-button-name`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

An `<input>` element with `type="button"`, `type="submit"`, or `type="reset"` does not have discernible text. Screen reader users cannot understand the button's purpose.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "button" without knowing what it does
- **Voice control users** cannot activate the button by name
- **Users with cognitive disabilities** need clear button labels
- **All users** benefit from clear button text for understanding and navigation

### Real-World Scenario

A form has three input buttons: one to submit, one to save draft, and one to cancel. Without proper values, screen readers announce: "Button, Button, Button." Users cannot tell which button does what without visual inspection.

## How to Fix

### Solution 1: Use Value Attribute

Provide descriptive text in the `value` attribute.

**Bad Example:**
```html
<!-- FAIL - No value -->
<input type="submit">
<input type="button">
<input type="reset">
```

**Good Example:**
```html
<!-- PASS - Descriptive values -->
<input type="submit" value="Submit Application">
<input type="button" value="Save Draft">
<input type="reset" value="Reset Form">
```

### Solution 2: Specific Button Types

Use appropriate values for different button types.

**Good Examples:**
```html
<!-- Submit buttons -->
<input type="submit" value="Submit">
<input type="submit" value="Send Message">
<input type="submit" value="Sign Up">
<input type="submit" value="Create Account">
<input type="submit" value="Place Order">

<!-- Button buttons -->
<input type="button" value="Add Item">
<input type="button" value="Calculate Total">
<input type="button" value="Show More">
<input type="button" value="Clear Selection">

<!-- Reset buttons -->
<input type="reset" value="Reset Form">
<input type="reset" value="Clear All Fields">
<input type="reset" value="Start Over">
```

### Solution 3: Using aria-label

For internationalization or dynamic content, use `aria-label`.

**Good Example:**
```html
<!-- aria-label overrides value for screen readers -->
<input 
  type="submit" 
  value="→" 
  aria-label="Submit form">

<input 
  type="button" 
  value="..." 
  aria-label="More options">

<!-- Dynamic button -->
<input 
  type="button" 
  id="toggle-btn"
  value="▶" 
  aria-label="Play video">

<script>
function togglePlayPause() {
  const btn = document.getElementById('toggle-btn');
  const isPlaying = btn.value === '❚❚';
  btn.value = isPlaying ? '▶' : '❚❚';
  btn.setAttribute('aria-label', isPlaying ? 'Play video' : 'Pause video');
}
</script>
```

### Solution 4: Image Input Buttons

For `<input type="image">`, use `alt` attribute.

**Bad Example:**
```html
<!-- FAIL - No alt text -->
<input type="image" src="submit.png">
```

**Good Example:**
```html
<!-- PASS - Descriptive alt text -->
<input 
  type="image" 
  src="submit.png" 
  alt="Submit form">

<input 
  type="image" 
  src="search-icon.png" 
  alt="Search">

<input 
  type="image" 
  src="delete.png" 
  alt="Delete item">
```

### Solution 5: Context-Specific Labels

Provide context in the button label.

**Bad Example:**
```html
<!-- FAIL - Too generic -->
<form id="login">
  <input type="text" name="email">
  <input type="submit" value="Submit">
</form>

<form id="newsletter">
  <input type="email" name="email">
  <input type="submit" value="Submit">
</form>
```

**Good Example:**
```html
<!-- PASS - Context-specific -->
<form id="login">
  <input type="text" name="email">
  <input type="submit" value="Sign In">
</form>

<form id="newsletter">
  <input type="email" name="email">
  <input type="submit" value="Subscribe to Newsletter">
</form>
```

## Rule Description

This rule ensures all input buttons have accessible text through the `value`, `aria-label`, or `alt` (for type="image") attributes.

### What This Rule Checks

- `<input type="submit">` has value or aria-label
- `<input type="button">` has value or aria-label
- `<input type="reset">` has value or aria-label
- `<input type="image">` has alt attribute

### What This Rule Does Not Check

- Quality or clarity of button text
- Whether button text matches visual design
- Button functionality or behavior
- `<button>` elements (separate rule)

### Best Practices

1. **Use value attribute** - Primary method for text
2. **Be specific** - "Submit Application" not "Submit"
3. **Add context** - Make purpose clear from label alone
4. **Keep concise** - Short but descriptive
5. **Consider using `<button>`** - More flexible than `<input>`

## Common Mistakes

### 1. Missing Value Attribute
```html
<!-- FAIL -->
<input type="submit">
<input type="button">
<input type="reset">
```

### 2. Empty Value
```html
<!-- FAIL -->
<input type="submit" value="">
<input type="button" value="   ">
```

### 3. Using Placeholder Instead
```html
<!-- FAIL - Placeholder doesn't provide accessible name -->
<input type="button" placeholder="Click here">

<!-- PASS -->
<input type="button" value="Click here">
```

### 4. Generic Labels
```html
<!-- FAIL - Too vague -->
<input type="submit" value="Submit">
<input type="button" value="Click">
<input type="button" value="OK">

<!-- PASS - Specific -->
<input type="submit" value="Submit Contact Form">
<input type="button" value="Add to Cart">
<input type="button" value="Confirm Purchase">
```

### 5. Image Input Without Alt
```html
<!-- FAIL -->
<input type="image" src="button.png">
<input type="image" src="submit.gif" alt="">

<!-- PASS -->
<input type="image" src="button.png" alt="Submit form">
```

## Examples by Use Case

### Form Submission
```html
<!-- Login form -->
<form action="/login" method="post">
  <label for="username">Username:</label>
  <input type="text" id="username" name="username">
  
  <label for="password">Password:</label>
  <input type="password" id="password" name="password">
  
  <input type="submit" value="Sign In">
</form>

<!-- Contact form -->
<form action="/contact" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name">
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email">
  
  <label for="message">Message:</label>
  <textarea id="message" name="message"></textarea>
  
  <input type="submit" value="Send Message">
  <input type="reset" value="Clear Form">
</form>
```

### Action Buttons
```html
<!-- Calculator -->
<input type="button" value="Calculate" onclick="calculate()">
<input type="button" value="Clear" onclick="clear()">

<!-- File operations -->
<input type="button" value="Upload File" onclick="uploadFile()">
<input type="button" value="Download Report" onclick="download()">

<!-- Data operations -->
<input type="button" value="Save Draft" onclick="saveDraft()">
<input type="button" value="Delete" onclick="confirmDelete()">
```

### Search Forms
```html
<!-- Text button -->
<form action="/search" method="get">
  <label for="search-query">Search:</label>
  <input type="text" id="search-query" name="q">
  <input type="submit" value="Search">
</form>

<!-- Image button -->
<form action="/search" method="get">
  <label for="search-query2">Search:</label>
  <input type="text" id="search-query2" name="q">
  <input 
    type="image" 
    src="/icons/search.png" 
    alt="Search"
    width="20" 
    height="20">
</form>
```

### E-commerce
```html
<!-- Add to cart -->
<form action="/cart/add" method="post">
  <input type="hidden" name="product_id" value="123">
  <label for="quantity">Quantity:</label>
  <input type="number" id="quantity" name="quantity" value="1">
  <input type="submit" value="Add to Cart">
</form>

<!-- Checkout -->
<form action="/checkout" method="post">
  <!-- Form fields -->
  <input type="submit" value="Proceed to Checkout">
  <input type="button" value="Continue Shopping" onclick="history.back()">
</form>
```

### Multi-step Forms
```html
<!-- Step 1 -->
<form id="step1">
  <!-- Fields -->
  <input type="button" value="Next: Shipping Information" onclick="nextStep()">
</form>

<!-- Step 2 -->
<form id="step2">
  <!-- Fields -->
  <input type="button" value="Back to Personal Information" onclick="prevStep()">
  <input type="button" value="Next: Payment" onclick="nextStep()">
</form>

<!-- Final step -->
<form id="step3">
  <!-- Fields -->
  <input type="button" value="Back to Shipping" onclick="prevStep()">
  <input type="submit" value="Complete Order">
</form>
```

### Image Buttons
```html
<!-- Social sharing -->
<input 
  type="image" 
  src="/icons/facebook.png" 
  alt="Share on Facebook"
  onclick="shareOnFacebook()">

<input 
  type="image" 
  src="/icons/twitter.png" 
  alt="Share on Twitter"
  onclick="shareOnTwitter()">

<!-- Actions -->
<input 
  type="image" 
  src="/icons/print.png" 
  alt="Print this page"
  onclick="window.print()">

<input 
  type="image" 
  src="/icons/pdf.png" 
  alt="Download as PDF"
  onclick="downloadPDF()">
```

## Comparison: Input vs Button Element

### Input Button
```html
<!-- Limited flexibility -->
<input type="submit" value="Submit">
<input type="button" value="Click Me">
```

### Button Element (Recommended)
```html
<!-- More flexible, can contain HTML -->
<button type="submit">
  <i class="icon-save" aria-hidden="true"></i>
  Submit
</button>

<button type="button">
  <svg aria-hidden="true">...</svg>
  Click Me
</button>
```

## Dynamic Button Text

```javascript
// Update input button value
function updateButtonText(action) {
  const btn = document.getElementById('action-btn');
  
  if (action === 'save') {
    btn.value = 'Saving...';
    btn.disabled = true;
  } else if (action === 'saved') {
    btn.value = 'Saved!';
    setTimeout(() => {
      btn.value = 'Save Changes';
      btn.disabled = false;
    }, 2000);
  }
}

// Toggle button
function toggleButton() {
  const btn = document.getElementById('toggle');
  const isActive = btn.getAttribute('aria-pressed') === 'true';
  
  btn.value = isActive ? 'Activate' : 'Deactivate';
  btn.setAttribute('aria-pressed', !isActive);
}
```

## Testing

### Manual Testing
1. Find all input buttons on the page
2. Verify each has a value, aria-label, or alt attribute
3. Check that text is descriptive and specific
4. Test with keyboard navigation

### Screen Reader Testing
```
NVDA/JAWS: Tab to input button
Expected: "[Button text], button" not just "button"

Press Enter/Space:
Expected: Button activates correctly

NVDA: Insert+Tab (list form fields)
Expected: All buttons listed with descriptive names
```

### Automated Testing
```javascript
// Check all input buttons have accessible names
const inputButtons = document.querySelectorAll(
  'input[type="submit"], input[type="button"], input[type="reset"], input[type="image"]'
);

inputButtons.forEach(btn => {
  const value = btn.value?.trim();
  const ariaLabel = btn.getAttribute('aria-label')?.trim();
  const alt = btn.alt?.trim();
  const type = btn.type;
  
  const hasAccessibleName = type === 'image' 
    ? (alt || ariaLabel) 
    : (value || ariaLabel);
  
  if (!hasAccessibleName) {
    console.error(`Input button without accessible name:`, btn);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'input-button-name'
);
```

### Browser DevTools
```javascript
// Find all input buttons
$$('input[type="submit"], input[type="button"], input[type="reset"], input[type="image"]')

// Check for missing accessible names
Array.from(document.querySelectorAll('input[type="submit"], input[type="button"], input[type="reset"]'))
  .filter(btn => !btn.value && !btn.getAttribute('aria-label'))
  .forEach(btn => console.log('Missing name:', btn));

// Check image inputs
Array.from(document.querySelectorAll('input[type="image"]'))
  .filter(btn => !btn.alt && !btn.getAttribute('aria-label'))
  .forEach(btn => console.log('Missing alt:', btn));
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [MDN: input type="button"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/button)
- [MDN: input type="submit"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/submit)
- [MDN: input type="image"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/image)
- [WebAIM: Creating Accessible Forms](https://webaim.org/techniques/forms/)

## Related Rules

- `button-name` - Button elements must have accessible names
- `image-alt` - Images must have alt text
- `label` - Form inputs must have labels
- `aria-command-name` - ARIA commands must have names
