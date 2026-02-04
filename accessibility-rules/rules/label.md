# Form elements must have labels

**Rule ID:** `label`  
**WCAG:** 1.3.1 Info and Relationships (Level A), 4.1.2 Name, Role, Value (Level A)  
**Severity:** Critical

## Issue Description

Form input elements do not have associated labels. Screen reader users cannot determine what information to enter into form fields, and all users lose the benefit of clickable labels.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "Edit text" or "Checkbox" without knowing what the field is for
- **Motor disability users** cannot click labels to focus small input fields
- **Cognitive disability users** benefit from clear, visible labels explaining field purpose
- **Mobile users** struggle with small touch targets when labels aren't clickable
- **All users** lose context when labels are missing

### Real-World Scenario

A user with motor disabilities visits a contact form. The input fields are small and difficult to click precisely. Without associated labels, they can't click the text "Name" to focus the name field - they must hit the tiny input box exactly, often requiring multiple attempts.

## How to Fix

### Solution 1: Use Explicit Label with `for` Attribute

Link labels to inputs using the `for` attribute and matching `id`.

**Bad Example:**
```html
<!-- No label -->
<input type="text" name="username">

<!-- Label not associated -->
<label>Username</label>
<input type="text" name="username">

<!-- Placeholder is not a label -->
<input type="text" placeholder="Enter your username">
```

**Good Example:**
```html
<!-- Explicit label with for/id -->
<label for="username">Username</label>
<input type="text" id="username" name="username">

<!-- Works with any distance between elements -->
<label for="email">Email Address</label>
<div class="input-wrapper">
  <input type="email" id="email" name="email">
</div>
```

### Solution 2: Wrap Input in Label (Implicit Association)

For simple cases, wrap the input inside the label.

**Good Example:**
```html
<!-- Implicit label (input wrapped) -->
<label>
  Username
  <input type="text" name="username">
</label>

<!-- Checkbox example -->
<label>
  <input type="checkbox" name="subscribe">
  Subscribe to newsletter
</label>

<!-- Radio button example -->
<label>
  <input type="radio" name="size" value="small">
  Small
</label>
<label>
  <input type="radio" name="size" value="large">
  Large
</label>
```

### Solution 3: Use `aria-label` for Icon-Only Buttons

When a visible label isn't desired (icon buttons, search fields), use `aria-label`.

**Bad Example:**
```html
<button>
  <i class="icon-search"></i>
</button>
```

**Good Example:**
```html
<button aria-label="Search">
  <i class="icon-search" aria-hidden="true"></i>
</button>

<!-- Or for search input -->
<input 
  type="search" 
  name="q" 
  aria-label="Search products"
  placeholder="Search..."
>
```

### Solution 4: Use `aria-labelledby` for Complex Labels

When the label content is in a separate element or combined from multiple elements.

**Good Example:**
```html
<!-- Single element -->
<h2 id="billing-heading">Billing Information</h2>
<input 
  type="text" 
  aria-labelledby="billing-heading"
  name="card-number"
>

<!-- Multiple elements -->
<div>
  <span id="first-name-label">First Name</span>
  <span id="required-indicator">(required)</span>
</div>
<input 
  type="text" 
  aria-labelledby="first-name-label required-indicator"
  name="firstName"
>
```

### Solution 5: Fieldsets for Radio/Checkbox Groups

Group related inputs with `<fieldset>` and `<legend>`.

**Bad Example:**
```html
<p>Select your size:</p>
<input type="radio" name="size" value="s" id="size-s">
<label for="size-s">Small</label>
<input type="radio" name="size" value="m" id="size-m">
<label for="size-m">Medium</label>
<input type="radio" name="size" value="l" id="size-l">
<label for="size-l">Large</label>
```

**Good Example:**
```html
<fieldset>
  <legend>Select your size</legend>
  <label>
    <input type="radio" name="size" value="s">
    Small
  </label>
  <label>
    <input type="radio" name="size" value="m">
    Medium
  </label>
  <label>
    <input type="radio" name="size" value="l">
    Large
  </label>
</fieldset>
```

## Rule Description

This rule checks that all form input elements have an accessible name provided through:

1. Associated `<label>` element (via `for`/`id` or wrapping)
2. `aria-label` attribute
3. `aria-labelledby` attribute
4. `title` attribute (not recommended as primary method)

### What This Rule Checks

- `<input>` elements (all types)
- `<textarea>` elements
- `<select>` elements
- Custom form controls with appropriate ARIA roles

### What This Rule Does Not Check

- Quality or clarity of label text
- Whether labels are visible (separate check)
- Whether placeholder text is used instead of labels
- Label positioning or styling

## Common Mistakes

### 1. Using Placeholder as Label
```html
<!-- FAIL - Placeholder disappears when typing -->
<input type="text" placeholder="Email address">

<!-- PASS - Label persists -->
<label for="email">Email address</label>
<input type="text" id="email" placeholder="name@example.com">
```

### 2. Non-Associated Label
```html
<!-- FAIL - Label not connected to input -->
<label>Username</label>
<input type="text" name="username">

<!-- PASS - Connected via for/id -->
<label for="username">Username</label>
<input type="text" id="username" name="username">
```

### 3. Multiple Inputs, One Label
```html
<!-- FAIL - One label for multiple inputs -->
<label for="name">Full Name</label>
<input type="text" id="name" name="firstName">
<input type="text" name="lastName">

<!-- PASS - Each input has a label -->
<label for="firstName">First Name</label>
<input type="text" id="firstName" name="firstName">
<label for="lastName">Last Name</label>
<input type="text" id="lastName" name="lastName">
```

### 4. Icon Button Without Label
```html
<!-- FAIL -->
<button><i class="icon-close"></i></button>

<!-- PASS -->
<button aria-label="Close">
  <i class="icon-close" aria-hidden="true"></i>
</button>
```

### 5. Duplicate IDs
```html
<!-- FAIL - ID must be unique -->
<label for="email">Email</label>
<input type="email" id="email">
<label for="email">Confirm Email</label>
<input type="email" id="email">

<!-- PASS - Unique IDs -->
<label for="email">Email</label>
<input type="email" id="email">
<label for="confirmEmail">Confirm Email</label>
<input type="email" id="confirmEmail">
```

## Input Types and Labeling

### Text Inputs
```html
<label for="username">Username</label>
<input type="text" id="username" name="username">

<label for="password">Password</label>
<input type="password" id="password" name="password">

<label for="email">Email</label>
<input type="email" id="email" name="email">
```

### Checkboxes
```html
<!-- Single checkbox -->
<label>
  <input type="checkbox" name="terms">
  I agree to the terms and conditions
</label>

<!-- Multiple checkboxes -->
<fieldset>
  <legend>Select your interests</legend>
  <label>
    <input type="checkbox" name="interests" value="sports">
    Sports
  </label>
  <label>
    <input type="checkbox" name="interests" value="music">
    Music
  </label>
</fieldset>
```

### Radio Buttons
```html
<fieldset>
  <legend>Shipping method</legend>
  <label>
    <input type="radio" name="shipping" value="standard">
    Standard (5-7 days)
  </label>
  <label>
    <input type="radio" name="shipping" value="express">
    Express (2-3 days)
  </label>
</fieldset>
```

### Select Dropdowns
```html
<label for="country">Country</label>
<select id="country" name="country">
  <option value="">Choose a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>
```

### Textarea
```html
<label for="message">Message</label>
<textarea id="message" name="message" rows="5"></textarea>
```

### File Upload
```html
<label for="avatar">Upload profile picture</label>
<input type="file" id="avatar" name="avatar" accept="image/*">
```

### Range/Slider
```html
<label for="volume">Volume</label>
<input type="range" id="volume" name="volume" min="0" max="100" value="50">
<output for="volume">50</output>
```

## Advanced Patterns

### Required Field Indicators
```html
<!-- Visual and semantic indication -->
<label for="email">
  Email <abbr title="required" aria-label="required">*</abbr>
</label>
<input 
  type="email" 
  id="email" 
  name="email" 
  required 
  aria-required="true"
>
```

### Error Messages
```html
<label for="email">Email</label>
<input 
  type="email" 
  id="email" 
  name="email"
  aria-describedby="email-error"
  aria-invalid="true"
>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>
```

### Help Text
```html
<label for="password">Password</label>
<input 
  type="password" 
  id="password" 
  name="password"
  aria-describedby="password-hint"
>
<span id="password-hint">
  Must be at least 8 characters with 1 number and 1 special character
</span>
```

### Search Forms
```html
<!-- Option 1: Visible label -->
<form role="search">
  <label for="search">Search</label>
  <input type="search" id="search" name="q">
  <button type="submit">Search</button>
</form>

<!-- Option 2: Visually hidden label -->
<form role="search">
  <label for="search" class="visually-hidden">Search</label>
  <input type="search" id="search" name="q" placeholder="Search...">
  <button type="submit" aria-label="Submit search">
    <i class="icon-search" aria-hidden="true"></i>
  </button>
</form>
```

## Testing

### Manual Testing
1. Tab through all form fields
2. Ensure each field's purpose is announced by screen reader
3. Click labels to verify they focus the correct input
4. Check that all inputs have visible or accessible labels

### Screen Reader Testing
```
Expected announcements:
- Text input: "Username, edit text"
- Checkbox: "Subscribe to newsletter, checkbox, not checked"
- Radio: "Small, radio button, 1 of 3, not selected"
- Select: "Country, combo box, Choose a country"
```

### Automated Testing
```javascript
// Check for inputs without labels
const inputs = document.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
  if (input.type === 'hidden' || input.type === 'submit') return;
  
  const hasLabel = input.labels && input.labels.length > 0;
  const hasAriaLabel = input.getAttribute('aria-label');
  const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
  const hasTitle = input.getAttribute('title');
  
  if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
    console.error('Input without label:', input);
  }
});
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [WebAIM: Creating Accessible Forms](https://webaim.org/techniques/forms/)
- [W3C: Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [MDN: The Label Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)

## Related Rules

- `label-title-only` - Form elements should not rely on title attribute alone
- `label-content-name-mismatch` - Label text should match accessible name
- `duplicate-id` - IDs must be unique to properly associate labels
- `form-field-multiple-labels` - Form fields should not have multiple label elements
