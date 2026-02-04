# Page must contain a level-one heading

**Rule ID:** `landmark-one-main`  
**WCAG:** 1.3.1 Info and Relationships (Level A), 2.4.1 Bypass Blocks (Level A)  
**Severity:** Moderate

## Issue Description

The page does not have exactly one `<main>` landmark or `role="main"` element. Users need a main landmark to skip directly to the main content and understand page structure.

## Why It Matters

### Impact on Users

- **Screen reader users** use landmarks to navigate quickly to main content
- **Keyboard users** can skip navigation and jump to main content
- **All users** benefit from clear page structure
- **SEO** - Search engines use semantic HTML to understand content

### Real-World Scenario

A screen reader user presses the "M" key to jump to the main landmark. Nothing happens because there's no `<main>` element. They must tab through navigation, sidebars, and other content to find the actual page content, wasting time on every page.

## How to Fix

### Solution 1: Add a `<main>` Element

Use a single `<main>` element to contain the primary page content.

**Bad Example:**
```html
<!-- FAIL - No main element -->
<body>
  <nav>Navigation</nav>
  <div id="content">
    <h1>Page Title</h1>
    <p>Main content...</p>
  </div>
  <aside>Sidebar</aside>
  <footer>Footer</footer>
</body>
```

**Good Example:**
```html
<!-- PASS - Single main element -->
<body>
  <nav>Navigation</nav>
  <main>
    <h1>Page Title</h1>
    <p>Main content...</p>
  </main>
  <aside>Sidebar</aside>
  <footer>Footer</footer>
</body>
```

### Solution 2: Use role="main" for Older Browsers

If you cannot use `<main>`, use `role="main"`.

**Good Example:**
```html
<!-- PASS - role="main" for compatibility -->
<body>
  <div role="banner">Header</div>
  <div role="navigation">Navigation</div>
  <div role="main">
    <h1>Page Title</h1>
    <p>Main content...</p>
  </div>
  <div role="contentinfo">Footer</div>
</body>
```

### Solution 3: Ensure Only One Main Per Page

Each page should have exactly one main landmark.

**Bad Example:**
```html
<!-- FAIL - Multiple main elements -->
<body>
  <main id="content-1">
    <h1>Section 1</h1>
  </main>
  <main id="content-2">
    <h1>Section 2</h1>
  </main>
</body>
```

**Good Example:**
```html
<!-- PASS - Single main contains all primary content -->
<body>
  <header>Site header</header>
  <main>
    <section>
      <h2>Section 1</h2>
      <p>Content...</p>
    </section>
    <section>
      <h2>Section 2</h2>
      <p>Content...</p>
    </section>
  </main>
  <footer>Site footer</footer>
</body>
```

### Solution 4: Don't Nest Main in Other Landmarks

The `<main>` element should not be inside `<article>`, `<aside>`, `<footer>`, `<header>`, or `<nav>`.

**Bad Example:**
```html
<!-- FAIL - main inside article -->
<article>
  <main>
    <h1>Article Title</h1>
    <p>Content...</p>
  </main>
</article>
```

**Good Example:**
```html
<!-- PASS - main contains article -->
<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>
```

### Solution 5: Typical Page Structure

Follow a standard landmark structure.

**Good Example:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Page Title</title>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header>
    <h1>Site Name</h1>
    <nav aria-label="Primary navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>
  
  <main id="main-content">
    <h1>Page Heading</h1>
    <article>
      <h2>Article Title</h2>
      <p>Content...</p>
    </article>
  </main>
  
  <aside aria-label="Related content">
    <h2>Related Articles</h2>
    <ul>...</ul>
  </aside>
  
  <footer>
    <p>&copy; 2026 Company Name</p>
  </footer>
</body>
</html>
```

## Rule Description

This rule ensures the page has exactly one `<main>` element or `role="main"` to identify the primary content.

### What This Rule Checks

- Page contains a `<main>` element or element with `role="main"`
- Only one main landmark exists on the page
- Main landmark is not nested in other landmarks

### What This Rule Does Not Check

- Content quality inside main
- Whether main contains appropriate content
- Other landmark presence (header, footer, nav)

### Best Practices

1. **Use `<main>` element** - Native HTML5 semantic element
2. **One per page** - Exactly one main landmark
3. **Top level** - Not nested in other landmarks
4. **Primary content** - Contains the main page content
5. **Skip link target** - Often targeted by skip navigation links

## Common Mistakes

### 1. No Main Element
```html
<!-- FAIL -->
<body>
  <div id="container">
    <div id="content">
      <h1>Title</h1>
      <p>Content...</p>
    </div>
  </div>
</body>
```

### 2. Multiple Main Elements
```html
<!-- FAIL -->
<body>
  <main>
    <h1>Content 1</h1>
  </main>
  <main>
    <h1>Content 2</h1>
  </main>
</body>
```

### 3. Main Inside Other Landmarks
```html
<!-- FAIL -->
<article>
  <main>
    <h1>Title</h1>
  </main>
</article>

<!-- FAIL -->
<aside>
  <main>Content</main>
</aside>
```

### 4. Using Main for Layout Only
```html
<!-- FAIL - main wraps everything -->
<main>
  <header>Header</header>
  <nav>Navigation</nav>
  <div>Actual content</div>
  <footer>Footer</footer>
</main>

<!-- GOOD - main only wraps primary content -->
<header>Header</header>
<nav>Navigation</nav>
<main>
  <div>Actual content</div>
</main>
<footer>Footer</footer>
```

### 5. Wrong Role on Main
```html
<!-- FAIL - conflicting role -->
<main role="complementary">Content</main>

<!-- GOOD - implicit role is main -->
<main>Content</main>

<!-- GOOD - explicit main role (redundant but OK) -->
<main role="main">Content</main>
```

## Page Structure Examples

### Blog Post
```html
<body>
  <header>
    <h1>My Blog</h1>
    <nav aria-label="Main">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  
  <main>
    <article>
      <h1>Blog Post Title</h1>
      <p>Published on <time datetime="2026-02-04">February 4, 2026</time></p>
      <p>Post content...</p>
    </article>
  </main>
  
  <aside aria-label="Related posts">
    <h2>Related Posts</h2>
    <ul>...</ul>
  </aside>
  
  <footer>
    <p>&copy; 2026 My Blog</p>
  </footer>
</body>
```

### Product Page
```html
<body>
  <header>
    <div class="logo">Company Name</div>
    <nav aria-label="Primary">
      <a href="/">Home</a>
      <a href="/products">Products</a>
    </nav>
  </header>
  
  <main>
    <h1>Product Name</h1>
    
    <section aria-labelledby="description-heading">
      <h2 id="description-heading">Description</h2>
      <p>Product details...</p>
    </section>
    
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading">Specifications</h2>
      <dl>...</dl>
    </section>
  </main>
  
  <aside aria-label="Related products">
    <h2>Related Products</h2>
    <div class="products">...</div>
  </aside>
  
  <footer>
    <nav aria-label="Footer">...</nav>
  </footer>
</body>
```

### Dashboard
```html
<body>
  <header>
    <h1>Dashboard</h1>
    <nav aria-label="Main menu">
      <a href="/dashboard">Overview</a>
      <a href="/reports">Reports</a>
      <a href="/settings">Settings</a>
    </nav>
  </header>
  
  <aside aria-label="Filters and options">
    <h2>Filters</h2>
    <form>...</form>
  </aside>
  
  <main>
    <h1>Dashboard Overview</h1>
    
    <section aria-labelledby="stats">
      <h2 id="stats">Statistics</h2>
      <div class="stat-grid">...</div>
    </section>
    
    <section aria-labelledby="recent">
      <h2 id="recent">Recent Activity</h2>
      <table>...</table>
    </section>
  </main>
  
  <footer>
    <p>Last updated: <time datetime="2026-02-04">Today</time></p>
  </footer>
</body>
```

### Documentation Page
```html
<body>
  <header>
    <h1>Documentation</h1>
  </header>
  
  <nav aria-label="Documentation sections">
    <h2>Table of Contents</h2>
    <ul>
      <li><a href="#intro">Introduction</a></li>
      <li><a href="#install">Installation</a></li>
      <li><a href="#usage">Usage</a></li>
    </ul>
  </nav>
  
  <main>
    <h1>Getting Started Guide</h1>
    
    <section id="intro" aria-labelledby="intro-heading">
      <h2 id="intro-heading">Introduction</h2>
      <p>Welcome to...</p>
    </section>
    
    <section id="install" aria-labelledby="install-heading">
      <h2 id="install-heading">Installation</h2>
      <pre><code>npm install package</code></pre>
    </section>
    
    <section id="usage" aria-labelledby="usage-heading">
      <h2 id="usage-heading">Usage</h2>
      <p>To use this package...</p>
    </section>
  </main>
  
  <footer>
    <nav aria-label="Footer navigation">...</nav>
  </footer>
</body>
```

## Skip Navigation Link

Combine with skip link for best accessibility:

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header>...</header>
  <nav>...</nav>
  
  <main id="main-content">
    <h1>Page Content</h1>
    <!-- content -->
  </main>
  
  <footer>...</footer>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

## Testing

### Manual Testing
1. Locate the `<main>` element or `role="main"`
2. Verify there is exactly one
3. Check it contains the primary page content
4. Ensure it's not nested in other landmarks

### Screen Reader Testing
```
NVDA/JAWS: Press M to navigate to main landmark
Expected: Jumps to main content area

NVDA: Insert+F7 (Elements List) → Landmarks
Expected: Shows one "main" landmark

Tab through page:
Expected: Can tab through all content in logical order
```

### Automated Testing
```javascript
// Check for main landmark
const mainElements = document.querySelectorAll('main, [role="main"]');

if (mainElements.length === 0) {
  console.error('No main landmark found');
} else if (mainElements.length > 1) {
  console.error('Multiple main landmarks found:', mainElements);
}

// Check main is not nested
mainElements.forEach(main => {
  const parent = main.closest('article, aside, footer, header, nav');
  if (parent) {
    console.error('Main landmark nested in:', parent.tagName);
  }
});

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'landmark-one-main'
);
```

### Browser DevTools
```javascript
// Find main landmarks
$$('main, [role="main"]')

// Check count
document.querySelectorAll('main, [role="main"]').length

// Inspect structure
console.log('Main element:', document.querySelector('main'));
console.log('Main parent:', document.querySelector('main')?.parentElement?.tagName);
```

## Resources

- [WCAG 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html)
- [MDN: main element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main)
- [ARIA: main role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/main_role)
- [W3C: ARIA Landmarks](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)

## Related Rules

- `region` - Landmarks should be unique
- `bypass` - Page must have bypass blocks
- `page-has-heading-one` - Page must have H1
- `landmark-unique` - Landmark labels must be unique
