# Documents must have a title element

**Rule ID:** `document-title`  
**WCAG:** 2.4.2 Page Titled (Level A)  
**Severity:** Serious

## Issue Description

The document does not have a `<title>` element in the `<head>`, or the title is empty. Users need page titles to identify and navigate between pages.

## Why It Matters

### Impact on Users

- **Screen reader users** rely on titles to identify pages and browser tabs
- **All users** see titles in browser tabs, bookmarks, and search results
- **Users with multiple tabs open** cannot distinguish between pages
- **Search engines** use titles for search results and indexing
- **Browser history** displays page titles for navigation

### Real-World Scenario

A user opens 10 tabs while researching. Without titles, all tabs show "Untitled" or the domain name. They cannot identify which tab contains the shopping cart, account settings, or product details without clicking each one.

## How to Fix

### Solution 1: Add a Title Element

Include a `<title>` element in the document `<head>`.

**Bad Example:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <h1>Welcome</h1>
  </body>
</html>
```

**Good Example:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Welcome to Our Store</title>
  </head>
  <body>
    <h1>Welcome</h1>
  </body>
</html>
```

### Solution 2: Descriptive and Specific Titles

Create titles that clearly identify the page content.

**Bad Examples:**
```html
<title>Page</title>
<title>Untitled</title>
<title>Welcome</title>
<title>Home</title>
```

**Good Examples:**
```html
<!-- Homepage -->
<title>ACME Corporation - Quality Tools Since 1985</title>

<!-- Product page -->
<title>Professional Drill Set - Power Tools - ACME Corp</title>

<!-- Article -->
<title>10 Tips for Home Renovation | ACME Blog</title>

<!-- User account -->
<title>Account Settings - John Doe - ACME Corp</title>
```

### Solution 3: Structured Title Format

Use consistent patterns across your site.

**Recommended Patterns:**
```html
<!-- Pattern: Page Name - Section - Site Name -->
<title>Shipping Policy - Help Center - ACME Corp</title>

<!-- Pattern: Page Name | Site Name -->
<title>Contact Us | ACME Corporation</title>

<!-- Pattern: Action - Context - Site -->
<title>Edit Profile - Account Settings - ACME</title>

<!-- Pattern: Item - Category - Site -->
<title>Blue Widget - Widgets - ACME Store</title>
```

### Solution 4: Dynamic Titles for SPAs

Update titles when content changes in single-page applications.

**Good Example (React):**
```jsx
import { useEffect } from 'react';

function ProductPage({ product }) {
  useEffect(() => {
    document.title = `${product.name} - Products - ACME Corp`;
  }, [product]);
  
  return <div>{product.name}</div>;
}

// Using React Helmet
import { Helmet } from 'react-helmet';

function ProductPage({ product }) {
  return (
    <>
      <Helmet>
        <title>{product.name} - Products - ACME Corp</title>
      </Helmet>
      <div>{product.name}</div>
    </>
  );
}
```

**Good Example (Vue):**
```vue
<script>
export default {
  name: 'ProductPage',
  data() {
    return {
      product: null
    }
  },
  watch: {
    product(newProduct) {
      document.title = `${newProduct.name} - ACME Corp`;
    }
  },
  mounted() {
    if (this.product) {
      document.title = `${this.product.name} - ACME Corp`;
    }
  }
}
</script>
```

**Good Example (Next.js):**
```jsx
import Head from 'next/head';

export default function ProductPage({ product }) {
  return (
    <>
      <Head>
        <title>{product.name} - Products - ACME Corp</title>
      </Head>
      <main>{product.name}</main>
    </>
  );
}
```

### Solution 5: Contextual Information in Titles

Include relevant context for user orientation.

**Good Examples:**
```html
<!-- Shopping cart -->
<title>Shopping Cart (3 items) - ACME Store</title>

<!-- Search results -->
<title>"blue widgets" - Search Results - ACME</title>

<!-- Form with validation -->
<title>Checkout (Step 2 of 4) - ACME Store</title>

<!-- Error pages -->
<title>Page Not Found (404) - ACME Corp</title>

<!-- Authentication -->
<title>Sign In - ACME Account</title>
```

## Rule Description

This rule ensures every HTML document has a non-empty `<title>` element in the `<head>` section.

### What This Rule Checks

- Presence of `<title>` element in `<head>`
- Title element is not empty
- Title contains actual text (not just whitespace)

### What This Rule Does Not Check

- Quality or descriptiveness of title text
- Title length or character count
- Whether title accurately describes content
- Duplicate titles across pages

### Best Practices

1. **Be specific** - Describe the exact page content
2. **Front-load keywords** - Put important info first
3. **Include context** - Add site or section name
4. **Keep concise** - 50-60 characters ideal for search results
5. **Update dynamically** - Change titles when content changes
6. **Avoid duplication** - Each page should have unique title

## Common Mistakes

### 1. Missing Title Element
```html
<!-- FAIL -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
  </head>
  <body>Content</body>
</html>
```

### 2. Empty Title
```html
<!-- FAIL -->
<title></title>
<title>   </title>
<title>&nbsp;</title>
```

### 3. Generic Titles
```html
<!-- FAIL - Too vague -->
<title>Welcome</title>
<title>Home</title>
<title>Page 1</title>
<title>Untitled Document</title>
```

### 4. Same Title on Every Page
```html
<!-- FAIL - All pages have identical title -->
<!-- Page 1 -->
<title>ACME Corporation</title>

<!-- Page 2 -->
<title>ACME Corporation</title>

<!-- Page 3 -->
<title>ACME Corporation</title>
```

### 5. Title Outside Head
```html
<!-- FAIL -->
<html>
  <body>
    <title>My Page</title>
  </body>
</html>
```

### 6. Multiple Title Elements
```html
<!-- FAIL - Only first title is used -->
<head>
  <title>Page Title</title>
  <title>Another Title</title>
</head>
```

## Examples by Page Type

### Homepage
```html
<title>ACME Corporation - Quality Power Tools Since 1985</title>
<title>Shop Online for Electronics | TechStore</title>
<title>Daily News - Breaking News & Latest Updates</title>
```

### Product/Service Pages
```html
<title>Cordless Drill 20V - Power Tools - ACME Corp</title>
<title>Web Design Services - ACME Agency</title>
<title>Blue Cotton T-Shirt - Men's Clothing - Fashion Store</title>
```

### Blog/Article Pages
```html
<title>How to Choose the Right Drill | ACME Blog</title>
<title>10 Web Design Trends for 2026 - Design Blog</title>
<title>Recipe: Chocolate Chip Cookies | Cooking with Chef Jane</title>
```

### Category/Listing Pages
```html
<title>Power Tools - All Products - ACME Store</title>
<title>Men's Shoes - Page 2 of 15 - Shoe Store</title>
<title>JavaScript Tutorials - Web Development</title>
```

### User Account Pages
```html
<title>Account Settings - John Smith - ACME</title>
<title>Order History - My Account - Online Store</title>
<title>Edit Profile - User Dashboard</title>
```

### Forms & Checkout
```html
<title>Contact Form - Get in Touch - ACME Corp</title>
<title>Checkout (Step 2: Shipping) - ACME Store</title>
<title>Sign Up for Newsletter - ACME</title>
```

### Search & Results
```html
<title>"power drill" - Search Results - ACME</title>
<title>Advanced Search - ACME Store</title>
<title>No Results for "xyz" - Search - ACME</title>
```

### Error Pages
```html
<title>Page Not Found (404) - ACME Corporation</title>
<title>Access Denied (403) - ACME</title>
<title>Server Error (500) - ACME</title>
```

### Help & Documentation
```html
<title>Getting Started Guide - Help Center - ACME</title>
<title>FAQ: Shipping & Returns - ACME Support</title>
<title>API Documentation - Developers - ACME</title>
```

## Title Length Guidelines

### Optimal Length
```html
<!-- 50-60 characters (ideal for search results) -->
<title>Professional Cordless Drill 20V | ACME Power Tools</title>

<!-- Too short (not descriptive) -->
<title>Drill</title>

<!-- Too long (truncated in search results) -->
<title>Professional Cordless Drill 20V with Battery Pack, Charger, Carrying Case and Accessories - ACME Corporation Power Tools Division</title>
```

## Internationalization

### Multiple Languages
```html
<!-- English -->
<html lang="en">
  <title>Contact Us - ACME Corporation</title>
</html>

<!-- Spanish -->
<html lang="es">
  <title>Contáctenos - ACME Corporation</title>
</html>

<!-- French -->
<html lang="fr">
  <title>Contactez-nous - ACME Corporation</title>
</html>
```

## Testing

### Manual Testing
1. View page source and locate `<title>` in `<head>`
2. Check browser tab shows meaningful title
3. Verify each page has unique, descriptive title
4. Test that titles update in SPAs when content changes

### Screen Reader Testing
```
NVDA: Insert+T (read title)
Expected: Announces meaningful page title

JAWS: Insert+T (read title)
Expected: Announces page title clearly

On page load:
Expected: Screen reader announces title automatically
```

### Automated Testing
```javascript
// Check for title element
const title = document.querySelector('title');
if (!title) {
  console.error('Missing title element');
} else if (!title.textContent.trim()) {
  console.error('Title element is empty');
}

// Check title text
console.log('Page title:', document.title);

// Using axe-core
const results = await axe.run();
const titleViolations = results.violations.filter(
  v => v.id === 'document-title'
);
```

### Browser DevTools
```javascript
// Get current title
document.title

// Check for title element
document.querySelector('title')?.textContent

// Find all title elements (should be only 1)
document.querySelectorAll('title').length
```

## SEO Considerations

### Title Formula for SEO
```html
<!-- Primary Keyword - Secondary Keyword | Brand -->
<title>Power Drills - Cordless Tools | ACME</title>

<!-- Product - Category - Brand -->
<title>iPhone 15 - Smartphones - TechStore</title>

<!-- Topic - Blog Name -->
<title>10 DIY Home Tips - ACME Home Blog</title>
```

### Avoid Keyword Stuffing
```html
<!-- BAD - Keyword stuffing -->
<title>Drills, Power Drills, Cordless Drills, Electric Drills, Drill Tools, Best Drills</title>

<!-- GOOD - Natural language -->
<title>Cordless Power Drills - Professional Tools - ACME</title>
```

## Resources

- [WCAG 2.4.2 Page Titled](https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html)
- [MDN: The Document Title element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title)
- [Google: Title Link Best Practices](https://developers.google.com/search/docs/appearance/title-link)
- [WebAIM: Page Titles](https://webaim.org/techniques/pagetitle/)

## Related Rules

- `page-has-heading-one` - Page must have H1 heading
- `frame-title` - Frames must have titles
- `html-has-lang` - HTML must have lang attribute
