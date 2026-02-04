# ARIA Hidden Elements Must Not Contain Focusable Elements

**Rule ID:** `aria-hidden-focus`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Severity:** Serious

## Issue Description

Elements with `aria-hidden="true"` must not contain focusable elements. When an element is hidden from assistive technologies using `aria-hidden="true"`, any focusable descendants within it create a confusing experience where keyboard users can focus on elements that screen readers cannot perceive or announce.

## Why It Matters

This creates several critical accessibility problems:
- **Invisible focus trap** - Keyboard users can tab to elements they cannot see or hear
- **Confusion for screen reader users** - Focus moves to elements that aren't announced
- **Lost context** - Users lose track of where they are in the interface
- **Navigation disruption** - Breaks the expected tab order and navigation flow
- **Failed WCAG compliance** - Violates requirements for programmatically determined names and roles

Screen reader users rely on hearing what element has focus. When focus moves to hidden elements, they become disoriented and cannot interact effectively with the interface.

## How to Fix

### 1. Remove Focusable Elements from aria-hidden Containers

Ensure elements hidden with `aria-hidden="true"` don't contain focusable elements.

**❌ Bad Example - Focusable Elements in Hidden Container:**
```html
<!-- Bad: Button inside aria-hidden container -->
<div aria-hidden="true">
  <button>Click me</button>  <!-- ❌ Can be focused but not announced -->
</div>

<!-- Bad: Link inside hidden nav -->
<nav aria-hidden="true">
  <a href="/page">Go to page</a>  <!-- ❌ Focusable but hidden -->
</nav>

<!-- Bad: Form controls in hidden section -->
<section aria-hidden="true">
  <input type="text" placeholder="Search" />  <!-- ❌ Can be focused -->
  <button type="submit">Search</button>  <!-- ❌ Can be focused -->
</section>
```

**✅ Good Example - Proper Hiding:**
```html
<!-- Good: Use hidden attribute instead -->
<div hidden>
  <button>Click me</button>  <!-- Not focusable, not visible -->
</div>

<!-- Good: Make focusable elements unfocusable -->
<div aria-hidden="true">
  <button tabindex="-1">Click me</button>  <!-- Not in tab order -->
</div>

<!-- Good: Use CSS display:none or visibility:hidden -->
<div style="display: none;">
  <button>Click me</button>  <!-- Not focusable, not visible -->
</div>
```

### 2. Use Appropriate Hiding Techniques

Choose the right hiding method based on your needs.

**For Completely Hidden Content:**
```html
<!-- ✅ Option 1: hidden attribute (preferred) -->
<div hidden>
  <button>Hidden Button</button>
</div>

<!-- ✅ Option 2: display: none -->
<div style="display: none;">
  <button>Hidden Button</button>
</div>

<!-- ✅ Option 3: visibility: hidden -->
<div style="visibility: hidden;">
  <button>Hidden Button</button>
</div>
```

**For Screen Reader Only Content (don't use aria-hidden):**
```html
<!-- ✅ Good: Visually hidden but accessible -->
<span class="sr-only">
  Additional context for screen readers
</span>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

**For Decorative Elements:**
```html
<!-- ✅ Good: Hide decorative non-interactive content -->
<div aria-hidden="true">
  <svg><!-- Decorative icon --></svg>
  <span class="decorative-line"></span>
</div>
```

### 3. Fix Modal Dialogs Properly

Modal dialogs often misuse `aria-hidden` on background content.

**❌ Bad Example - Focus Issues:**
```html
<div aria-hidden="true">
  <!-- Background page content -->
  <nav>
    <a href="/">Home</a>  <!-- ❌ Still focusable -->
    <a href="/about">About</a>  <!-- ❌ Still focusable -->
  </nav>
</div>

<div role="dialog" aria-modal="true">
  <h2>Dialog Title</h2>
  <button>Close</button>
</div>
```

**✅ Good Example - Proper Modal Implementation:**
```html
<!-- Good: Make background unfocusable -->
<div aria-hidden="true" inert>
  <!-- Background page content -->
  <nav>
    <a href="/" tabindex="-1">Home</a>
    <a href="/about" tabindex="-1">About</a>
  </nav>
</div>

<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
  <button>Close</button>
</div>

<script>
// Better: Use inert attribute (when available)
const background = document.querySelector('[aria-hidden]');
background.inert = true;  // Prevents all focus

// Or manage focus trap programmatically
const dialog = document.querySelector('[role="dialog"]');
const focusableElements = dialog.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
// Trap focus within dialog
</script>
```

### 4. Handle Dynamic Content

When showing/hiding content dynamically, manage focus properly.

**✅ Good Example - Toggling Content:**
```html
<!-- Collapsed state -->
<button 
  aria-expanded="false" 
  aria-controls="panel"
  onclick="togglePanel()">
  Show Panel
</button>
<div id="panel" hidden>
  <p>Panel content</p>
  <button>Action in Panel</button>
</div>

<script>
function togglePanel() {
  const button = document.querySelector('[aria-controls="panel"]');
  const panel = document.getElementById('panel');
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  
  if (isExpanded) {
    // Hide panel
    panel.hidden = true;  // Better than aria-hidden
    button.setAttribute('aria-expanded', 'false');
  } else {
    // Show panel
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    // Optionally move focus to panel
    panel.querySelector('button')?.focus();
  }
}
</script>
```

### 5. Use the Inert Attribute

The `inert` attribute is the modern solution for hiding entire subtrees.

**✅ Good Example - Using Inert:**
```html
<!-- Modern approach with inert -->
<div inert>
  <button>Not focusable</button>
  <a href="/page">Not focusable</a>
  <input type="text" />  <!-- Not focusable -->
</div>

<!-- Polyfill for older browsers -->
<script src="https://cdn.jsdelivr.net/npm/wicg-inert@3.1.2/dist/inert.min.js"></script>
```

## Rule Description

This rule checks that:
1. Elements with `aria-hidden="true"` do not contain focusable descendants
2. Focusable elements include: buttons, links, form controls, elements with `tabindex >= 0`
3. The check is recursive through all child elements

Valid exceptions:
- Focusable elements with `tabindex="-1"` (removed from tab order)
- Elements with the `inert` attribute

## Common Mistakes

### Mistake 1: Hiding Modal Backgrounds Incorrectly
```html
<!-- ❌ Bad: Background still focusable -->
<div aria-hidden="true">
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>Content</main>
</div>

<!-- ✅ Good: Use inert or remove from tab order -->
<div aria-hidden="true" inert>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>Content</main>
</div>
```

### Mistake 2: Hiding Skip Links
```html
<!-- ❌ Bad: Skip link inside aria-hidden -->
<div aria-hidden="true">
  <a href="#main" class="skip-link">Skip to main content</a>
</div>

<!-- ✅ Good: Skip link outside aria-hidden -->
<a href="#main" class="skip-link">Skip to main content</a>
<div aria-hidden="true">
  <!-- Decorative header content -->
</div>
```

### Mistake 3: Dropdown Menus
```html
<!-- ❌ Bad: Hidden menu items still focusable -->
<div class="dropdown">
  <button>Menu</button>
  <ul aria-hidden="true" class="menu-closed">
    <li><a href="/option1">Option 1</a></li>
    <li><a href="/option2">Option 2</a></li>
  </ul>
</div>

<!-- ✅ Good: Use hidden attribute or display:none -->
<div class="dropdown">
  <button aria-expanded="false" aria-controls="menu">Menu</button>
  <ul id="menu" hidden>
    <li><a href="/option1">Option 1</a></li>
    <li><a href="/option2">Option 2</a></li>
  </ul>
</div>
```

## Testing

### Automated Testing

```javascript
// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(v => v.id === 'aria-hidden-focus');
```

### Manual Testing

1. **Keyboard Navigation Test:**
   - Press Tab key repeatedly
   - Note each element that receives focus
   - Verify all focused elements are visible and announced
   - If focus disappears, check for aria-hidden parent

2. **Screen Reader Test:**
   - Enable screen reader (NVDA, JAWS, VoiceOver)
   - Navigate with Tab key
   - Verify every focused element is announced
   - Check for silent focus (focus without announcement)

3. **DevTools Inspection:**
   ```javascript
   // Find aria-hidden elements with focusable descendants
   document.querySelectorAll('[aria-hidden="true"]').forEach(hidden => {
     const focusable = hidden.querySelectorAll(
       'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     if (focusable.length > 0) {
       console.warn('aria-hidden contains focusable elements:', hidden, focusable);
     }
   });
   ```

## Resources

- [ARIA Hidden - W3C](https://www.w3.org/TR/wai-aria-1.2/#aria-hidden)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [The Inert Attribute - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)
- [Hiding Content - WebAIM](https://webaim.org/techniques/css/invisiblecontent/)
- [axe-core Rule: aria-hidden-focus](https://dequeuniversity.com/rules/axe/4.4/aria-hidden-focus)

## Related Rules

- `aria-hidden-body` - aria-hidden must not be on document body
- `tabindex` - Avoid positive tabindex values
- `focus-order-semantics` - Elements in focus order must have appropriate role
- `nested-interactive` - Interactive elements must not be nested
