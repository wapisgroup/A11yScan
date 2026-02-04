# Zooming and scaling must not be disabled

**Rule ID:** `meta-viewport`  
**WCAG:** 1.4.4 Resize Text (Level AA)  
**Severity:** Critical

## Issue Description

The `<meta name="viewport">` element disables zooming or sets a maximum scale that prevents users from zooming. This prevents users with low vision from enlarging text to read content.

## Why It Matters

### Impact on Users

- **Users with low vision** cannot enlarge text to read comfortably
- **Users with motor disabilities** who accidentally zoom cannot reset
- **Older users** who need larger text for readability
- **Mobile users** cannot zoom to see details in images or small text
- **All users** benefit from the ability to control zoom level

### Real-World Scenario

A user with low vision visits a website on their phone. They try to pinch-zoom to read small text, but nothing happens because the developer disabled zooming. They cannot read the content and leave the site.

## How to Fix

### Solution 1: Remove Zoom Restrictions

Allow users to zoom freely by removing restrictive viewport settings.

**Bad Examples:**
```html
<!-- FAIL - user-scalable=no prevents zooming -->
<meta name="viewport" content="width=device-width, user-scalable=no">

<!-- FAIL - maximum-scale=1 prevents zooming -->
<meta name="viewport" content="width=device-width, maximum-scale=1">

<!-- FAIL - combination preventing zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

**Good Examples:**
```html
<!-- PASS - allows zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- PASS - allows zooming up to 5x -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">

<!-- PASS - explicit user-scalable=yes -->
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
```

### Solution 2: Allow Sufficient Maximum Scale

If setting a maximum scale, ensure it's at least 2x (200%).

**Bad Example:**
```html
<!-- FAIL - max 1.5x is not enough -->
<meta name="viewport" content="width=device-width, maximum-scale=1.5">
```

**Good Examples:**
```html
<!-- PASS - allows 2x zoom minimum -->
<meta name="viewport" content="width=device-width, maximum-scale=2">

<!-- PASS - allows 5x zoom -->
<meta name="viewport" content="width=device-width, maximum-scale=5">

<!-- BEST - no maximum scale restriction -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Solution 3: Design for Zoom

Instead of preventing zoom, design your site to work well when zoomed.

**Good Practices:**
```html
<!-- Allow natural zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Use responsive design -->
<style>
body {
  font-size: 16px; /* Base readable size */
}

/* Scale with viewport */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
}

/* Support text sizing */
.text-content {
  font-size: 1rem; /* Relative sizing */
  line-height: 1.5;
  max-width: 70ch; /* Readable line length */
}
</style>
```

### Solution 4: Test Zoom Behavior

Ensure your design works at different zoom levels.

**Test Checklist:**
```html
<!-- Meta tag allows zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- CSS supports scaling -->
<style>
/* Use relative units */
.container {
  width: 90%;
  max-width: 1200px;
  padding: 1rem; /* Not fixed pixels */
}

/* Responsive text */
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

/* Scalable spacing */
.section {
  margin: 2em 0; /* em units scale with font size */
}
</style>
```

### Solution 5: Remove user-scalable=no

The most common fix is simply removing the restriction.

**Before:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```

**After:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Rule Description

This rule ensures the viewport meta tag does not prevent users from zooming by setting `user-scalable=no` or `maximum-scale` below 2.

### What This Rule Checks

- `<meta name="viewport">` does not have `user-scalable=no` or `user-scalable=0`
- `maximum-scale` is not set, or is at least 2 (200%)
- Users can zoom to at least 200% magnification

### What This Rule Does Not Check

- Whether the design works well when zoomed
- Visual layout at different zoom levels
- Text readability at base size

### Best Practices

1. **Allow zooming** - Don't disable user-scalable
2. **No max scale** - Don't set maximum-scale at all
3. **Minimum 200%** - If using max-scale, set to 2 or higher
4. **Responsive design** - Design to work at all zoom levels
5. **Test zooming** - Verify usability at 200% zoom

## Common Mistakes

### 1. Disabling User Scaling
```html
<!-- FAIL -->
<meta name="viewport" content="user-scalable=no">
<meta name="viewport" content="user-scalable=0">
```

### 2. Maximum Scale Too Low
```html
<!-- FAIL -->
<meta name="viewport" content="maximum-scale=1">
<meta name="viewport" content="maximum-scale=1.0">
<meta name="viewport" content="maximum-scale=1.5">
```

### 3. Combination of Restrictions
```html
<!-- FAIL -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

### 4. Preventing Pinch Zoom on Mobile
```html
<!-- FAIL - common mobile anti-pattern -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 5. Unnecessary Restrictions
```html
<!-- FAIL - adds restriction for no reason -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

<!-- GOOD - keep it simple -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Recommended Viewport Configurations

### Best Practice (Simple)
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### With Generous Maximum
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

### Explicit Yes to Scaling
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
```

### Progressive Web App (PWA)
```html
<!-- Still allow zooming in PWAs -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## Designing for Zoom

### Responsive Typography
```css
/* Base size */
html {
  font-size: 16px;
}

/* Scalable text */
body {
  font-size: 1rem;
  line-height: 1.5;
}

h1 {
  font-size: 2.5rem; /* 40px at base */
}

/* Responsive scaling */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

/* Fluid typography */
h1 {
  font-size: clamp(1.5rem, 4vw + 1rem, 3rem);
}
```

### Flexible Layouts
```css
/* Container that works when zoomed */
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Grid that reflows when zoomed */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Buttons that stay usable */
button {
  min-height: 44px; /* WCAG minimum touch target */
  padding: 0.75em 1.5em;
  font-size: 1rem;
}
```

### Avoiding Horizontal Scroll
```css
/* Prevent horizontal scroll when zoomed */
img, video {
  max-width: 100%;
  height: auto;
}

.content {
  overflow-wrap: break-word;
  word-wrap: break-word;
}

table {
  width: 100%;
  overflow-x: auto;
  display: block;
}
```

## Testing Zoom Behavior

### Manual Testing
1. On mobile: Pinch to zoom in/out
2. On desktop: Use Ctrl/Cmd + Plus/Minus
3. Test at 200% zoom minimum
4. Verify all content remains accessible
5. Check no horizontal scrolling occurs

### Browser Testing
```
Chrome:
- Ctrl/Cmd + Plus to zoom in
- Ctrl/Cmd + Minus to zoom out
- Ctrl/Cmd + 0 to reset

Firefox:
- Same keyboard shortcuts
- View menu → Zoom

Safari (iOS):
- Pinch to zoom
- Double-tap to zoom
```

### Automated Testing
```javascript
// Check viewport meta tag
const viewport = document.querySelector('meta[name="viewport"]');
const content = viewport?.getAttribute('content') || '';

// Check for user-scalable=no
if (content.includes('user-scalable=no') || content.includes('user-scalable=0')) {
  console.error('Viewport prevents zooming with user-scalable=no');
}

// Check maximum-scale
const maxScaleMatch = content.match(/maximum-scale=([\d.]+)/);
if (maxScaleMatch) {
  const maxScale = parseFloat(maxScaleMatch[1]);
  if (maxScale < 2) {
    console.error(`Maximum scale ${maxScale} is less than 2`);
  }
}

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'meta-viewport' || v.id === 'meta-viewport-large'
);
```

### Browser DevTools
```javascript
// Get viewport meta content
const meta = document.querySelector('meta[name="viewport"]');
console.log('Viewport:', meta?.content);

// Parse viewport settings
const content = meta?.content || '';
const settings = Object.fromEntries(
  content.split(',').map(s => {
    const [key, value] = s.trim().split('=');
    return [key, value];
  })
);
console.log('Settings:', settings);
```

## iOS Specific Considerations

### iOS Input Zoom Prevention
```html
<!-- iOS zooms inputs with font-size < 16px -->
<!-- DON'T disable zooming to prevent this -->

<!-- INSTEAD: Use appropriate font sizes -->
<style>
input, select, textarea {
  font-size: 16px; /* Prevents iOS auto-zoom */
}
</style>
```

### iOS Viewport Fit
```html
<!-- Safe area handling for notches -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<style>
body {
  padding: env(safe-area-inset-top) 
           env(safe-area-inset-right) 
           env(safe-area-inset-bottom) 
           env(safe-area-inset-left);
}
</style>
```

## Resources

- [WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)
- [MDN: Viewport meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
- [A11y Project: Meta Viewport](https://www.a11yproject.com/posts/never-use-maximum-scale/)
- [WebAIM: Zoom and Text Size](https://webaim.org/articles/visual/lowvision#zoom)

## Related Rules

- `resize-text` - Text must be resizable to 200%
- `reflow` - Content must reflow without horizontal scrolling
- `target-size` - Touch targets must be large enough
