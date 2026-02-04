# Pages must have a mechanism to bypass repeated blocks

**Rule ID:** `bypass`  
**WCAG:** 2.4.1 Bypass Blocks (Level A)  
**Severity:** Serious

## Issue Description

The page lacks a way to bypass repetitive content (headers, navigation, sidebars). Users must navigate through the same content on every page to reach the main content.

## Why It Matters

### Impact on Users

- **Keyboard users** must tab through dozens of links to reach content
- **Screen reader users** hear the same navigation on every page
- **Switch device users** experience extreme frustration and fatigue
- **All users** with motor disabilities waste time and energy

### Real-World Scenario

A user navigating with a keyboard visits a news site with 50 navigation links in the header. On the first page, they tab through all 50 links to read an article. When they click to the next article, they must tab through the same 50 links again. After 10 articles, they've tabbed through 500 navigation links just to read content. They give up and leave the site.

## How to Fix

### Solution 1: Skip to Main Content Link

Add a skip link as the first focusable element.

**Bad Example:**
```html
<!-- FAIL - No skip link -->
<!DOCTYPE html>
<html>
<head>
  <title>Page</title>
</head>
<body>
  <header>
    <nav>
      <!-- 50 navigation links -->
    </nav>
  </header>
  <main>
    <h1>Article Title</h1>
    <!-- content -->
  </main>
</body>
</html>
```

**Good Example:**
```html
<!-- PASS - Skip link as first element -->
<!DOCTYPE html>
<html>
<head>
  <title>Page</title>
  <style>
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: white;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  
  <header>
    <nav>
      <!-- Navigation links -->
    </nav>
  </header>
  
  <main id="main-content" tabindex="-1">
    <h1>Article Title</h1>
    <!-- content -->
  </main>
</body>
</html>
```

### Solution 2: Multiple Skip Links

Provide options to skip to different sections.

**Good Example:**
```html
<nav class="skip-links">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <a href="#navigation" class="skip-link">Skip to navigation</a>
  <a href="#search" class="skip-link">Skip to search</a>
  <a href="#footer" class="skip-link">Skip to footer</a>
</nav>

<style>
.skip-links {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 1000;
}

.skip-link {
  position: absolute;
  padding: 8px 12px;
  background: #000;
  color: #fff;
  text-decoration: none;
  border: 1px solid #fff;
}

.skip-link:focus {
  position: static;
  display: block;
}
</style>

<header>
  <div id="search">
    <input type="search" placeholder="Search">
  </div>
  
  <nav id="navigation">
    <!-- Navigation -->
  </nav>
</header>

<main id="main-content" tabindex="-1">
  <h1>Content</h1>
</main>

<footer id="footer">
  <!-- Footer -->
</footer>
```

### Solution 3: Proper Landmark Regions

Use HTML5 landmarks to enable AT navigation.

**Bad Example:**
```html
<!-- FAIL - No semantic structure -->
<div class="header">
  <div class="nav">...</div>
</div>
<div class="content">...</div>
<div class="sidebar">...</div>
<div class="footer">...</div>
```

**Good Example:**
```html
<!-- PASS - Semantic landmarks -->
<a href="#main" class="skip-link">Skip to main content</a>

<header>
  <nav aria-label="Main navigation">
    <!-- Main nav -->
  </nav>
</header>

<main id="main" tabindex="-1">
  <h1>Page Title</h1>
  <!-- Main content -->
</main>

<aside aria-label="Related articles">
  <!-- Sidebar -->
</aside>

<footer>
  <!-- Footer -->
</footer>
```

### Solution 4: Framework Implementations

**React:**
```jsx
// components/SkipLink.jsx
export function SkipLink({ targetId = "main-content", children = "Skip to main content" }) {
  return (
    <a 
      href={`#${targetId}`}
      className="skip-link">
      {children}
    </a>
  );
}

// app/layout.jsx
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        
        <Header />
        
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}

// styles/skip-link.css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

**Next.js:**
```jsx
// components/Layout.js
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      
      <header>
        <nav>
          {/* Navigation */}
        </nav>
      </header>
      
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

**Vue:**
```vue
<!-- components/SkipLink.vue -->
<template>
  <a 
    :href="`#${targetId}`" 
    class="skip-link">
    {{ text }}
  </a>
</template>

<script setup>
defineProps({
  targetId: {
    type: String,
    default: 'main-content'
  },
  text: {
    type: String,
    default: 'Skip to main content'
  }
});
</script>

<!-- App.vue -->
<template>
  <div id="app">
    <SkipLink />
    
    <AppHeader />
    
    <main id="main-content" tabindex="-1">
      <router-view />
    </main>
    
    <AppFooter />
  </div>
</template>
```

### Solution 5: Advanced Skip Link Patterns

**Multiple regions with headings:**
```html
<nav class="skip-navigation" aria-label="Skip links">
  <ul>
    <li><a href="#main">Skip to main content</a></li>
    <li><a href="#nav">Skip to navigation</a></li>
    <li><a href="#sidebar">Skip to sidebar</a></li>
  </ul>
</nav>

<style>
.skip-navigation {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-navigation:focus-within {
  position: static;
  width: auto;
  height: auto;
  background: #000;
  color: white;
  padding: 1rem;
}

.skip-navigation a:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
```

**Always visible skip link:**
```html
<a href="#main" class="skip-link-visible">
  Skip to content
</a>

<style>
.skip-link-visible {
  display: inline-block;
  padding: 8px 12px;
  background: #0066cc;
  color: white;
  text-decoration: none;
  margin: 10px;
}

.skip-link-visible:focus {
  outline: 3px solid #ffbf47;
  outline-offset: 0;
  background: #003078;
}
</style>
```

## Rule Description

This rule ensures pages have a mechanism to bypass blocks of content that are repeated on multiple pages (navigation, headers, sidebars).

### What This Rule Checks

- Skip link exists and is functional
- Skip link is keyboard accessible
- Target element exists and receives focus
- OR proper landmark structure exists

### Valid Bypass Mechanisms

1. **Skip link** - Link to jump to main content
2. **ARIA landmarks** - `<main>`, `<nav>`, `<aside>`, etc.
3. **Heading structure** - Proper heading hierarchy
4. **Expandable sections** - Collapsible repeated content

## Common Mistakes

### 1. Hidden Skip Link Not Focusable
```html
<!-- FAIL - Skip link completely hidden -->
<a href="#main" style="display: none;">Skip</a>

<!-- PASS - Hidden but reveals on focus -->
<a href="#main" class="skip-link">Skip to main</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
}
.skip-link:focus {
  top: 0;
}
</style>
```

### 2. Target Doesn't Exist
```html
<!-- FAIL - href target doesn't exist -->
<a href="#main-content">Skip to main</a>
<div id="content"><!-- Wrong ID --></div>

<!-- PASS - Matching IDs -->
<a href="#main-content">Skip to main</a>
<main id="main-content">Content</main>
```

### 3. Target Not Focusable
```html
<!-- FAIL - Target can't receive focus -->
<a href="#main">Skip</a>
<main id="main">Content</main>

<!-- PASS - Target can receive focus -->
<a href="#main">Skip</a>
<main id="main" tabindex="-1">Content</main>
```

### 4. Only Decorative Landmarks
```html
<!-- FAIL - Landmarks present but no skip link -->
<!-- (Some users may not know about landmark navigation) -->
<header>...</header>
<main>...</main>

<!-- PASS - Both skip link AND landmarks -->
<a href="#main" class="skip-link">Skip to main</a>
<header>...</header>
<main id="main" tabindex="-1">...</main>
```

## Testing

### Manual Testing
1. Press Tab as first action on page
2. Verify skip link becomes visible and focused
3. Press Enter to activate skip link
4. Verify focus moves to main content
5. Continue tabbing - should be in main content area

### Keyboard Testing
```
1. Load page
2. Press Tab → Skip link appears
3. Press Enter → Focus moves to main
4. Press Tab → Focus on first interactive element in main
```

### Screen Reader Testing
```
NVDA/JAWS:
1. Load page
2. Press Tab → "Skip to main content, link"
3. Press Enter → Focus moves
4. Press H → First heading in main content

Expected: Quick access to main content
```

### Automated Testing
```javascript
// Check for skip link
const skipLink = document.querySelector('a[href^="#"]');
if (skipLink) {
  const targetId = skipLink.getAttribute('href').slice(1);
  const target = document.getElementById(targetId);
  
  if (!target) {
    console.error('Skip link target does not exist:', targetId);
  } else if (!target.hasAttribute('tabindex')) {
    console.warn('Skip link target should have tabindex="-1":', target);
  }
} else {
  // Check for landmarks as alternative
  const main = document.querySelector('main');
  if (!main) {
    console.error('No skip link and no <main> landmark found');
  }
}

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'bypass'
);
```

## Resources

- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html)
- [WebAIM: Skip Navigation Links](https://webaim.org/techniques/skipnav/)
- [W3C: ARIA Landmarks](https://www.w3.org/TR/wai-aria-practices/examples/landmarks/)
- [GOV.UK: Skip Links](https://design-system.service.gov.uk/components/skip-link/)

## Related Rules

- `landmark-one-main` - Page must have main landmark
- `region` - All content should be in landmarks
- `page-has-heading-one` - Pages must have h1
