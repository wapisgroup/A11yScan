# Heading levels should only increase by one

**Rule ID:** `heading-order`  
**WCAG:** 1.3.1 Info and Relationships (Level A)  
**Severity:** Moderate

## Issue Description

Heading levels skip one or more levels (e.g., jumping from `<h1>` to `<h3>`, skipping `<h2>`). This breaks the document outline and confuses screen reader users navigating by headings.

## Why It Matters

### Impact on Users

- **Screen reader users** lose document structure context
- **Keyboard navigation users** who jump by heading levels get confused
- **All users** benefit from clear visual hierarchy
- **Users with cognitive disabilities** rely on logical structure
- **SEO** - Search engines use heading hierarchy to understand content importance

### Real-World Scenario

A screen reader user navigates a page by headings using the "H" key:
- "Heading level 1: Products"
- "Heading level 3: Features" ← User thinks: "Where is level 2? Did I miss something?"
- "Heading level 3: Pricing"
- "Heading level 2: About Us" ← Now completely confused about structure

## How to Fix

### Solution 1: Sequential Heading Levels

Ensure headings increase by only one level at a time.

**Bad Example:**
```html
<!-- FAIL - Skips from H1 to H3 -->
<h1>Page Title</h1>
<h3>Section Content</h3>
<h4>Subsection</h4>
```

**Good Example:**
```html
<!-- PASS - Sequential order -->
<h1>Page Title</h1>
<h2>Main Section</h2>
<h3>Subsection</h3>
<h4>Sub-subsection</h4>
```

### Solution 2: Correct Document Outline

Build a logical content hierarchy.

**Bad Example:**
```html
<!-- FAIL - Poor structure -->
<h1>Website Title</h1>
<h4>Navigation</h4>
<h2>Main Content</h2>
<h5>Sidebar</h5>
```

**Good Example:**
```html
<!-- PASS - Logical structure -->
<h1>Website Title</h1>
<h2>Main Content</h2>
<h3>Content Section</h3>
<h4>Content Subsection</h4>
<h2>Sidebar</h2>
<h3>Related Articles</h3>
```

### Solution 3: Decrease by Any Amount, Increase by One

You can go down multiple levels but only up one level.

**Good Example:**
```html
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h4>Sub-subsection</h4>
<!-- Can go back up any amount -->
<h2>Another Section</h2>
<h3>Its Subsection</h3>
<!-- Can skip down to H1 for new article -->
<h1>New Article</h1>
```

### Solution 4: Style vs. Semantic Level

Use CSS to control visual appearance, not heading level.

**Bad Example:**
```html
<!-- FAIL - Using wrong level for visual size -->
<h1>Page Title</h1>
<h4 class="looks-like-h2">Section</h4>
```

**Good Example:**
```html
<!-- PASS - Correct semantic level with custom styling -->
<h1>Page Title</h1>
<h2 class="smaller-heading">Section</h2>

<style>
.smaller-heading {
  font-size: 1.2rem; /* Style it to look smaller */
}
</style>
```

### Solution 5: Multiple Articles

Each article can have its own heading hierarchy.

**Good Example:**
```html
<main>
  <h1>Blog Posts</h1>
  
  <article>
    <h2>First Blog Post</h2>
    <h3>Introduction</h3>
    <h3>Main Points</h3>
    <h4>Point One</h4>
    <h4>Point Two</h4>
  </article>
  
  <article>
    <h2>Second Blog Post</h2>
    <h3>Overview</h3>
    <h3>Details</h3>
  </article>
</main>
```

## Rule Description

This rule checks that heading levels increment by only one (e.g., H1 to H2, H2 to H3) and don't skip levels.

### What This Rule Checks

- Heading elements follow sequential order when increasing
- No levels are skipped (e.g., H1 → H3)
- Document outline is logical

### What This Rule Does Not Check

- Decreasing heading levels (allowed to skip: H4 → H2 is fine)
- Whether headings accurately describe content
- Visual styling of headings
- Multiple H1s (separate check)

### Best Practices

1. **Start with H1** - Every page should have one H1
2. **Increment by one** - Only increase one level at a time
3. **Decrease freely** - Can skip levels going down
4. **Use CSS for styling** - Don't choose heading level for appearance
5. **Think outline** - Headings should create a table of contents

## Common Mistakes

### 1. Skipping Levels
```html
<!-- FAIL -->
<h1>Title</h1>
<h3>Section</h3> <!-- Skipped H2 -->

<!-- FAIL -->
<h2>Section</h2>
<h5>Subsection</h5> <!-- Skipped H3 and H4 -->
```

### 2. Using Headings for Styling
```html
<!-- FAIL - Choosing heading for size -->
<h1>Page Title</h1>
<h5>Subtitle (because it looks smaller)</h5>

<!-- PASS - Use correct level with CSS -->
<h1>Page Title</h1>
<h2 class="subtitle">Subtitle</h2>
```

### 3. Wrong Document Structure
```html
<!-- FAIL -->
<h3>Welcome</h3> <!-- No H1 or H2 first -->
<h4>About Us</h4>
<h2>Services</h2>
```

### 4. Multiple H1s Without Structure
```html
<!-- FAIL - Confusing structure -->
<h1>Page Title</h1>
<h1>Section Title</h1> <!-- Should be H2 -->
<h1>Another Section</h1> <!-- Should be H2 -->
```

### 5. Inconsistent Sidebar Headings
```html
<!-- FAIL -->
<main>
  <h1>Main Content</h1>
  <h2>Section</h2>
</main>
<aside>
  <h4>Sidebar</h4> <!-- Should be H2 -->
</aside>
```

## Examples by Page Type

### Article Page
```html
<article>
  <h1>How to Build Accessible Websites</h1>
  
  <h2>Introduction</h2>
  <p>Content...</p>
  
  <h2>Key Principles</h2>
  <h3>Semantic HTML</h3>
  <p>Content...</p>
  <h4>Headings</h4>
  <h4>Lists</h4>
  <h4>Forms</h4>
  
  <h3>ARIA Labels</h3>
  <p>Content...</p>
  <h4>When to Use ARIA</h4>
  <h4>Common Patterns</h4>
  
  <h2>Conclusion</h2>
  <p>Content...</p>
</article>
```

### Product Page
```html
<main>
  <h1>Professional Cordless Drill</h1>
  
  <h2>Product Description</h2>
  <p>Content...</p>
  
  <h2>Specifications</h2>
  <h3>Technical Details</h3>
  <h4>Power</h4>
  <h4>Battery</h4>
  <h3>Dimensions</h3>
  <h4>Size</h4>
  <h4>Weight</h4>
  
  <h2>Customer Reviews</h2>
  <h3>5 Star Reviews</h3>
  <h3>4 Star Reviews</h3>
</main>
```

### Documentation Page
```html
<main>
  <h1>API Documentation</h1>
  
  <h2>Getting Started</h2>
  <h3>Authentication</h3>
  <h4>API Keys</h4>
  <h4>OAuth</h4>
  
  <h3>Rate Limiting</h3>
  
  <h2>Endpoints</h2>
  <h3>Users</h3>
  <h4>GET /users</h4>
  <h4>POST /users</h4>
  
  <h3>Products</h3>
  <h4>GET /products</h4>
  <h4>POST /products</h4>
  
  <h2>Examples</h2>
  <h3>JavaScript</h3>
  <h3>Python</h3>
</main>
```

### Dashboard
```html
<main>
  <h1>Dashboard Overview</h1>
  
  <section>
    <h2>Recent Activity</h2>
    <h3>Today</h3>
    <h3>This Week</h3>
  </section>
  
  <section>
    <h2>Statistics</h2>
    <h3>Users</h3>
    <h4>Active Users</h4>
    <h4>New Signups</h4>
    
    <h3>Revenue</h3>
    <h4>Monthly</h4>
    <h4>Annual</h4>
  </section>
  
  <section>
    <h2>Quick Actions</h2>
  </section>
</main>
```

### Blog Index
```html
<main>
  <h1>Company Blog</h1>
  
  <article>
    <h2>First Blog Post Title</h2>
    <p>Excerpt...</p>
  </article>
  
  <article>
    <h2>Second Blog Post Title</h2>
    <p>Excerpt...</p>
  </article>
  
  <article>
    <h2>Third Blog Post Title</h2>
    <p>Excerpt...</p>
  </article>
</main>
```

## Complete Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Accessible Heading Structure Example</title>
</head>
<body>
  <header>
    <!-- Site header doesn't need heading -->
    <nav aria-label="Main navigation">
      <!-- Nav items -->
    </nav>
  </header>
  
  <main>
    <h1>Main Page Title</h1>
    
    <section>
      <h2>First Main Section</h2>
      <p>Content...</p>
      
      <h3>Subsection 1.1</h3>
      <p>Content...</p>
      
      <h4>Sub-subsection 1.1.1</h4>
      <p>Content...</p>
      
      <h4>Sub-subsection 1.1.2</h4>
      <p>Content...</p>
      
      <h3>Subsection 1.2</h3>
      <p>Content...</p>
    </section>
    
    <section>
      <h2>Second Main Section</h2>
      <p>Content...</p>
      
      <h3>Subsection 2.1</h3>
      <p>Content...</p>
    </section>
  </main>
  
  <aside>
    <h2>Related Content</h2>
    <h3>Popular Articles</h3>
    <h3>Categories</h3>
  </aside>
  
  <footer>
    <h2>Footer Information</h2>
    <h3>Contact</h3>
    <h3>Legal</h3>
  </footer>
</body>
</html>
```

## Visualizing Heading Hierarchy

```
H1 Page Title
├─ H2 Section One
│  ├─ H3 Subsection 1.1
│  │  ├─ H4 Detail 1.1.1
│  │  └─ H4 Detail 1.1.2
│  └─ H3 Subsection 1.2
│
├─ H2 Section Two
│  ├─ H3 Subsection 2.1
│  └─ H3 Subsection 2.2
│     ├─ H4 Detail 2.2.1
│     └─ H4 Detail 2.2.2
│
└─ H2 Section Three
   └─ H3 Subsection 3.1
```

## CSS Styling Independence

```html
<!-- Semantic heading levels -->
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

<!-- Custom styling with CSS -->
<style>
/* Make H2 look larger */
h2.featured {
  font-size: 2.5rem;
  font-weight: bold;
}

/* Make H2 look smaller */
h2.compact {
  font-size: 1.2rem;
}

/* Style H3 like H4 */
h3.small {
  font-size: 1rem;
  font-weight: normal;
}
</style>

<h1>Title</h1>
<h2 class="featured">Large Section</h2>
<h2 class="compact">Small Section</h2>
<h3 class="small">Subsection</h3>
```

## Testing

### Manual Testing
1. Use a browser extension (HeadingsMap, WAVE) to view heading outline
2. Check that headings follow sequential order
3. Verify no levels are skipped when increasing
4. Ensure structure makes logical sense

### Screen Reader Testing
```
NVDA/JAWS: Press H to navigate by headings
Expected: Headings announce in logical order

Insert+F6 (JAWS) or Insert+F7 (NVDA): List headings
Expected: Sequential levels (H1 → H2 → H3, not H1 → H3)
```

### Automated Testing
```javascript
// Check heading order
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
let previousLevel = 0;

headings.forEach(heading => {
  const currentLevel = parseInt(heading.tagName.substring(1));
  
  if (currentLevel > previousLevel + 1) {
    console.error(
      `Heading skip: ${heading.tagName} found after H${previousLevel}`,
      heading
    );
  }
  
  previousLevel = currentLevel;
});

// Using axe-core
const results = await axe.run();
const headingViolations = results.violations.filter(
  v => v.id === 'heading-order'
);
```

### Browser DevTools
```javascript
// Get all headings with levels
Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
  .map(h => ({
    level: h.tagName,
    text: h.textContent.trim().substring(0, 50)
  }));

// Check for skipped levels
let prev = 0;
$$('h1,h2,h3,h4,h5,h6').forEach(h => {
  const curr = parseInt(h.tagName[1]);
  if (curr > prev + 1) console.warn('Skip detected:', h);
  prev = curr;
});
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WebAIM: Semantic Structure - Headings](https://webaim.org/techniques/semanticstructure/)
- [W3C: Headings Tutorial](https://www.w3.org/WAI/tutorials/page-structure/headings/)
- [MDN: The HTML Section Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements)

## Related Rules

- `page-has-heading-one` - Page must have H1
- `empty-heading` - Headings must not be empty
- `heading-order` - This rule
- `landmark-one-main` - Page structure
