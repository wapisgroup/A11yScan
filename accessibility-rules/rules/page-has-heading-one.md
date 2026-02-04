# Page must have a level-one heading

**Rule ID:** `page-has-heading-one`  
**WCAG:** 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)  
**Severity:** Moderate

## Issue Description

The page does not contain a level-one heading (`<h1>`). Screen reader users rely on heading structure to understand page content and navigate efficiently.

## Why It Matters

### Impact on Users

- **Screen reader users** cannot quickly understand the page's main topic
- **Keyboard navigation users** who use heading navigation shortcuts lose the ability to jump to main content
- **Users with cognitive disabilities** benefit from clear document structure
- **SEO** - Search engines use H1 to understand page content
- **All users** benefit from clear visual hierarchy

### Real-World Scenario

A screen reader user lands on a page and presses the "H" key to navigate by headings. The page has multiple H2 and H3 headings but no H1. The user hears:
- "Heading level 2, Welcome section"
- "Heading level 3, Our services"
- "Heading level 2, Contact us"

Without an H1, they don't know the main purpose of the page. Is this a homepage? A product page? A blog post?

## How to Fix

### Solution 1: Add an H1 to the Page

Every page should have exactly one `<h1>` that describes the page's main content.

**Bad Example:**
```html
<!-- No H1 -->
<body>
  <header>
    <div class="logo">Company Name</div>
  </header>
  <main>
    <h2>Welcome to our site</h2>
    <p>Content here...</p>
  </main>
</body>
```

**Good Example:**
```html
<body>
  <header>
    <div class="logo">Company Name</div>
  </header>
  <main>
    <h1>Welcome to Company Name</h1>
    <h2>Our Services</h2>
    <p>Content here...</p>
  </main>
</body>
```

### Solution 2: Ensure Proper Heading Hierarchy

Headings should follow a logical sequence without skipping levels.

**Bad Example:**
```html
<!-- Skips from H1 to H3 -->
<h1>Main Title</h1>
<h3>Subsection</h3>
<h2>Section Title</h2>
```

**Good Example:**
```html
<!-- Proper hierarchy -->
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection</h3>
<h3>Another Subsection</h3>
<h2>Another Section</h2>
```

### Solution 3: Single H1 Per Page

Use only one H1 per page to establish the main topic.

**Bad Example:**
```html
<!-- Multiple H1s -->
<h1>Company Name</h1>
<nav>
  <h1>Navigation</h1>
</nav>
<main>
  <h1>Main Content</h1>
</main>
```

**Good Example:**
```html
<header>
  <div class="logo">Company Name</div>
  <nav aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>
<main>
  <h1>Main Content Title</h1>
  <h2>Section Heading</h2>
</main>
```

### Solution 4: Visually Hidden H1 (Use Sparingly)

In rare cases where design requires, you can visually hide the H1 while keeping it accessible.

**Use Case Example:**
```html
<!-- Homepage with logo as visual H1 -->
<h1 class="visually-hidden">Company Name - Your Solution Provider</h1>
<div class="logo" aria-hidden="true">
  <img src="logo.png" alt="">
</div>

<!-- CSS for visually-hidden -->
<style>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

### Solution 5: Dynamic Content Pages

For single-page applications or dynamic content, ensure H1 updates with page changes.

**Good Example (React):**
```jsx
function ProductPage({ product }) {
  return (
    <main>
      <h1>{product.name}</h1>
      <h2>Description</h2>
      <p>{product.description}</p>
      <h2>Specifications</h2>
      <ul>...</ul>
    </main>
  );
}
```

**Good Example (Vue):**
```vue
<template>
  <main>
    <h1>{{ pageTitle }}</h1>
    <section>
      <h2>Content</h2>
      <!-- ... -->
    </section>
  </main>
</template>
```

## Rule Description

This rule ensures that every page has exactly one `<h1>` element that clearly identifies the page's main content or purpose.

### What This Rule Checks

- Presence of at least one `<h1>` element
- The `<h1>` is not empty
- The `<h1>` contains actual text content (not just whitespace or hidden characters)

### What This Rule Does Not Check

- Whether there are multiple `<h1>` elements (separate check)
- Quality or appropriateness of the H1 text
- Visual styling of the heading
- Complete heading structure/hierarchy

### Best Practices

1. **One H1 per page** - Establishes the main topic
2. **Descriptive text** - Should clearly describe the page content
3. **Early in the DOM** - Should appear near the top of the page
4. **Visible to all** - Should be visible unless there's a strong design reason
5. **Updates with content** - In SPAs, should change with route/content changes

## Common Mistakes

### 1. No H1 on Page
```html
<!-- FAIL -->
<body>
  <header>
    <img src="logo.png" alt="Company Name">
  </header>
  <main>
    <h2>Welcome</h2>
    <p>Content...</p>
  </main>
</body>
```

### 2. Using Logo Image Instead of H1
```html
<!-- FAIL - Image alone is not a heading -->
<header>
  <img src="logo.png" alt="Company Name">
</header>

<!-- PASS - Logo can complement H1 -->
<header>
  <h1>
    <img src="logo.png" alt="Company Name">
  </h1>
</header>
```

### 3. Empty H1
```html
<!-- FAIL -->
<h1></h1>
<h1>   </h1>
<h1><span></span></h1>
```

### 4. H1 with Only Icon
```html
<!-- FAIL -->
<h1><i class="icon-home"></i></h1>

<!-- PASS -->
<h1>
  <i class="icon-home" aria-hidden="true"></i>
  Home Page
</h1>
```

### 5. Wrong Semantic Level
```html
<!-- FAIL - Using H2 styled to look like H1 -->
<h2 class="h1-styled">Main Title</h2>

<!-- PASS - Use actual H1 and style it -->
<h1>Main Title</h1>
```

## Examples by Page Type

### Homepage
```html
<body>
  <header>
    <img src="logo.png" alt="Company Logo">
    <nav>...</nav>
  </header>
  <main>
    <h1>Welcome to [Company Name] - [Main Value Proposition]</h1>
    <section>
      <h2>Our Services</h2>
      <!-- ... -->
    </section>
  </main>
</body>
```

### Product Page
```html
<main>
  <h1>Product Name - Professional Widget 3000</h1>
  <section>
    <h2>Product Description</h2>
    <p>...</p>
  </section>
  <section>
    <h2>Specifications</h2>
    <h3>Technical Details</h3>
    <h3>Dimensions</h3>
  </section>
</main>
```

### Blog Post
```html
<article>
  <header>
    <h1>How to Build Accessible Web Applications</h1>
    <p class="meta">Published on January 15, 2024</p>
  </header>
  <section>
    <h2>Introduction</h2>
    <p>...</p>
  </section>
  <section>
    <h2>Key Principles</h2>
    <h3>Semantic HTML</h3>
    <h3>ARIA Labels</h3>
  </section>
</article>
```

### Dashboard/Application
```html
<body>
  <header>
    <nav>...</nav>
  </header>
  <main>
    <h1>Dashboard Overview</h1>
    <section>
      <h2>Recent Activity</h2>
      <!-- ... -->
    </section>
    <section>
      <h2>Statistics</h2>
      <h3>This Month</h3>
      <h3>This Year</h3>
    </section>
  </main>
</body>
```

### Contact/Form Page
```html
<main>
  <h1>Contact Us</h1>
  <form>
    <fieldset>
      <legend>Your Information</legend>
      <!-- form fields -->
    </fieldset>
    <h2>How can we help?</h2>
    <textarea>...</textarea>
  </form>
</main>
```

## Heading Structure Best Practices

### Outline Structure
```html
<body>
  <header>
    <!-- Site-wide header, no heading needed -->
  </header>
  
  <main>
    <h1>Page Title</h1>              <!-- Level 1 -->
    
    <section>
      <h2>Main Section</h2>           <!-- Level 2 -->
      <p>Content...</p>
      
      <h3>Subsection</h3>             <!-- Level 3 -->
      <p>Content...</p>
      
      <h3>Another Subsection</h3>     <!-- Level 3 -->
      <p>Content...</p>
    </section>
    
    <section>
      <h2>Another Main Section</h2>   <!-- Level 2 -->
      <p>Content...</p>
    </section>
  </main>
  
  <aside>
    <h2>Related Content</h2>          <!-- Level 2 -->
  </aside>
  
  <footer>
    <!-- Footer content -->
  </footer>
</body>
```

### Landmark Regions with Headings
```html
<body>
  <header role="banner">
    <img src="logo.png" alt="Company">
    <nav role="navigation" aria-labelledby="main-nav-heading">
      <h2 id="main-nav-heading" class="visually-hidden">Main Navigation</h2>
      <!-- nav items -->
    </nav>
  </header>
  
  <main role="main">
    <h1>Page Main Title</h1>
    <!-- main content -->
  </main>
  
  <aside role="complementary" aria-labelledby="sidebar-heading">
    <h2 id="sidebar-heading">Related Articles</h2>
    <!-- sidebar content -->
  </aside>
  
  <footer role="contentinfo">
    <h2>Company Information</h2>
    <!-- footer content -->
  </footer>
</body>
```

## Testing

### Manual Testing
1. View the page outline using a browser extension (HeadingsMap, WAVE)
2. Navigate using heading shortcuts (H key in screen readers)
3. Verify one H1 exists and describes the page
4. Check that heading levels don't skip (1→2→3, not 1→3)

### Screen Reader Testing
```
NVDA/JAWS: Press H to navigate by headings
Expected: First heading should be H1 announcing page title

Insert+F6: List all headings
Expected: H1 at top of list
```

### Automated Testing
```javascript
// Check for H1
const h1Elements = document.querySelectorAll('h1');
if (h1Elements.length === 0) {
  console.error('No H1 found on page');
} else if (h1Elements.length > 1) {
  console.warn('Multiple H1 elements found');
}

// Check H1 has content
h1Elements.forEach(h1 => {
  if (!h1.textContent.trim()) {
    console.error('Empty H1 element');
  }
});

// Using axe-core
const results = await axe.run();
const h1Violations = results.violations.filter(
  v => v.id === 'page-has-heading-one'
);
```

### Browser DevTools
```javascript
// Find all heading elements
$$('h1, h2, h3, h4, h5, h6')

// Generate heading outline
Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  .map(h => ({
    level: h.tagName,
    text: h.textContent.trim()
  }));
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WCAG 2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html)
- [WebAIM: Semantic Structure](https://webaim.org/techniques/semanticstructure/)
- [W3C: Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/)
- [MDN: The HTML Section Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements)

## Related Rules

- `heading-order` - Heading levels should increase by one
- `empty-heading` - Headings must have discernible text
- `duplicate-id` - IDs used in aria-labelledby must be unique
- `landmark-one-main` - Page must have one main landmark
