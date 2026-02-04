# Headings must have discernible text

**Rule ID:** `empty-heading`  
**WCAG:** 2.4.6 Headings and Labels (Level AA)  
**Severity:** Serious

## Issue Description

A heading element (h1-h6 or role="heading") is empty or has no accessible text. Empty headings confuse screen reader users and break document structure.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "heading level X" with no context
- **Keyboard users** navigating by headings encounter meaningless stops
- **All users** lose document structure and navigation
- **Search engines** can't properly index content

### Real-World Scenario

A blog has `<h2></h2>` placeholders in the template. Screen reader users navigating by headings hear "heading level 2" but get no information about what section they're in. They must read surrounding content to understand the context, wasting time and breaking their reading flow.

## How to Fix

### Solution 1: Add Text Content

Provide meaningful text inside the heading.

**Bad Example:**
```html
<!-- FAIL - Empty headings -->
<h1></h1>
<h2> </h2>
<h3>   </h3>

<!-- FAIL - Only whitespace -->
<h2>
  
</h2>

<!-- FAIL - Only invisible content -->
<h2><span hidden>Title</span></h2>
<h3><span style="display: none;">Section</span></h3>
```

**Good Example:**
```html
<!-- PASS - Has text content -->
<h1>Page Title</h1>
<h2>Section Heading</h2>
<h3>Subsection Title</h3>

<!-- PASS - Text with formatting -->
<h2>
  <strong>Important</strong> Information
</h2>

<!-- PASS - Text with icon -->
<h2>
  <i class="icon-star" aria-hidden="true"></i>
  Featured Products
</h2>
```

### Solution 2: Use aria-label or aria-labelledby

Provide accessible text when visual text isn't possible.

**Bad Example:**
```html
<!-- FAIL - Icon only, no accessible text -->
<h2><i class="icon-settings"></i></h2>

<!-- FAIL - Image only, no alt text -->
<h2><img src="logo.png"></h2>
```

**Good Example:**
```html
<!-- PASS - Icon with aria-label -->
<h2 aria-label="Settings">
  <i class="icon-settings" aria-hidden="true"></i>
</h2>

<!-- PASS - Image with alt text -->
<h2>
  <img src="logo.png" alt="Company Name">
</h2>

<!-- PASS - Using aria-labelledby -->
<h2 aria-labelledby="section-title">
  <i class="icon-info" aria-hidden="true"></i>
</h2>
<span id="section-title" class="visually-hidden">Information</span>
```

### Solution 3: Remove or Hide Unnecessary Headings

If a heading serves no purpose, remove it or hide it from AT.

**Bad Example:**
```html
<!-- FAIL - Empty heading in template -->
<div class="section">
  <h2></h2>
  <p>Content without a heading</p>
</div>

<!-- FAIL - Decorative heading divider -->
<h3></h3>
<hr>
```

**Good Example:**
```html
<!-- PASS - Remove unnecessary heading -->
<div class="section">
  <p>Content without a heading</p>
</div>

<!-- PASS - Use decorative element instead -->
<div role="separator" aria-hidden="true"></div>
<hr>

<!-- OR hide from AT if purely decorative -->
<h3 aria-hidden="true" class="decorative-line"></h3>
```

### Solution 4: Dynamic Content Patterns

Handle headings that are populated dynamically.

**React Example:**
```jsx
// FAIL - Can render empty heading
function Section({ title }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>Content</p>
    </div>
  );
}
<Section /> {/* title is undefined */}

// PASS - Only render heading if title exists
function Section({ title, children }) {
  return (
    <div>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

// PASS - Provide default or required title
function Section({ title = "Untitled Section", children }) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

**Vue Example:**
```vue
<!-- FAIL - Can render empty -->
<template>
  <div>
    <h2>{{ title }}</h2>
    <p>Content</p>
  </div>
</template>

<!-- PASS - Conditional rendering -->
<template>
  <div>
    <h2 v-if="title">{{ title }}</h2>
    <p>Content</p>
  </div>
</template>

<!-- PASS - Default value -->
<template>
  <div>
    <h2>{{ title || 'Default Heading' }}</h2>
    <p>Content</p>
  </div>
</template>
```

### Solution 5: Loading States

Provide meaningful headings during loading.

**Bad Example:**
```jsx
// FAIL - Empty heading while loading
function Article({ id }) {
  const [article, setArticle] = useState(null);
  
  return (
    <article>
      <h1>{article?.title}</h1>
      <p>{article?.content}</p>
    </article>
  );
}
```

**Good Example:**
```jsx
// PASS - Loading state with text
function Article({ id }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  return (
    <article>
      <h1>{loading ? 'Loading...' : article.title}</h1>
      <p>{loading ? 'Please wait...' : article.content}</p>
    </article>
  );
}

// OR conditional rendering
function Article({ id }) {
  const [article, setArticle] = useState(null);
  
  if (!article) return <p>Loading...</p>;
  
  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  );
}
```

## Rule Description

This rule ensures heading elements contain text that is accessible to assistive technologies. Headings provide document structure and navigation, so they must have meaningful content.

### What This Rule Checks

- `<h1>` through `<h6>` elements have text content
- Elements with `role="heading"` have accessible names
- Text is not only whitespace
- Text is not hidden from assistive technologies

### What Counts as Text

**Valid text sources:**
- Direct text content
- `alt` text on images
- `aria-label` attribute
- `aria-labelledby` reference
- Visually hidden text (screen reader only)

**Not valid:**
- Whitespace only
- Hidden elements (`hidden`, `display: none`)
- Decorative images without alt text
- `aria-hidden="true"` content only

## Common Mistakes

### 1. Template Placeholders
```html
<!-- FAIL - Empty template -->
<h2 class="section-title"></h2>

<!-- PASS - Populated or conditional -->
<h2 class="section-title">Actual Title</h2>
```

### 2. Icon-Only Headings
```html
<!-- FAIL - Icon without accessible text -->
<h2><i class="fas fa-home"></i></h2>

<!-- PASS - Icon with text -->
<h2>
  <i class="fas fa-home" aria-hidden="true"></i>
  Home
</h2>

<!-- OR with aria-label -->
<h2 aria-label="Home">
  <i class="fas fa-home" aria-hidden="true"></i>
</h2>
```

### 3. Image-Only Headings
```html
<!-- FAIL - Image without alt -->
<h1><img src="logo.png"></h1>

<!-- FAIL - Image with empty alt -->
<h1><img src="logo.png" alt=""></h1>

<!-- PASS - Image with alt text -->
<h1><img src="logo.png" alt="Acme Corporation"></h1>
```

### 4. Collapsed/Hidden Content
```html
<!-- FAIL - All content hidden -->
<h2>
  <span style="display: none;">Hidden Title</span>
</h2>

<!-- PASS - Visually hidden but accessible -->
<h2>
  <span class="visually-hidden">Title</span>
  <i class="icon" aria-hidden="true"></i>
</h2>

<style>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### 5. CMS/Dynamic Content Issues
```html
<!-- FAIL - Can be empty if CMS field is blank -->
<h2><?php echo $heading; ?></h2>

<!-- PASS - Fallback value -->
<h2><?php echo $heading ?: 'Untitled Section'; ?></h2>

<!-- PASS - Conditional -->
<?php if ($heading): ?>
  <h2><?php echo $heading; ?></h2>
<?php endif; ?>
```

## Testing

### Manual Testing
1. Review all heading elements in the page
2. Verify each heading has visible or accessible text
3. Check that dynamically loaded headings populate correctly
4. Test loading states and error states

### Screen Reader Testing
```
NVDA/JAWS: 
- Press H to navigate by headings
- Listen to each heading announcement

Expected: "Heading level X, [meaningful text]"

Empty headings announce as:
- "Heading level X" (no text)
- Navigation stops but provides no information
```

### Automated Testing
```javascript
// Check for empty headings
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
headings.forEach(heading => {
  // Get accessible text
  const text = heading.textContent.trim() ||
               heading.getAttribute('aria-label') ||
               getTextFromAriaLabelledby(heading);
  
  if (!text || text.length === 0) {
    console.error('Empty heading found:', heading);
  }
});

function getTextFromAriaLabelledby(el) {
  const id = el.getAttribute('aria-labelledby');
  if (!id) return '';
  const labelEl = document.getElementById(id);
  return labelEl ? labelEl.textContent.trim() : '';
}

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'empty-heading'
);
```

### Visual Testing
```css
/* Highlight empty headings in development */
h1:empty, h2:empty, h3:empty, h4:empty, h5:empty, h6:empty,
[role="heading"]:empty {
  outline: 3px solid red !important;
  min-height: 20px;
}

h1:empty::after, h2:empty::after, h3:empty::after,
h4:empty::after, h5:empty::after, h6:empty::after {
  content: "⚠️ EMPTY HEADING";
  color: red;
  font-size: 12px;
}
```

## Resources

- [WCAG 2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html)
- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WebAIM: Semantic Structure](https://webaim.org/techniques/semanticstructure/)
- [MDN: Heading Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements)

## Related Rules

- `page-has-heading-one` - Page must have h1
- `heading-order` - Heading levels should not be skipped
- `aria-valid-attr-value` - ARIA values must be valid
