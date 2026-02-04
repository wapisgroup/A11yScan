# Images must have alternate text

**Rule ID:** `image-alt`  
**WCAG:** 1.1.1 Non-text Content (Level A)  
**Severity:** Critical

## Issue Description

Images do not have alternative text (alt attributes). Screen reader users cannot access the information conveyed by images, and if the image fails to load, all users lose context.

## Why It Matters

### Impact on Users

- **Screen reader users** hear the filename or nothing at all, missing important information
- **Users with images disabled** (slow connections, data saving) cannot understand content
- **Search engines** cannot index image content without alt text
- **Users with cognitive disabilities** benefit from text descriptions that reinforce visual information

### Real-World Scenario

An e-commerce site displays product images without alt text. A blind user browsing products hears:
- "Image, IMG_2847.jpg"
- "Image"
- "Link, image"

They cannot determine what products are being sold, their features, or make purchasing decisions.

## How to Fix

### Solution 1: Add Descriptive Alt Text

Provide concise, descriptive alternative text that conveys the same information as the image.

**Bad Example:**
```html
<img src="product.jpg">
<img src="chart.png" alt="">
<img src="photo.jpg" alt="image">
```

**Good Example:**
```html
<img src="product.jpg" alt="Blue wireless headphones with noise cancellation">
<img src="chart.png" alt="Bar chart showing 40% increase in sales from Q1 to Q2">
<img src="photo.jpg" alt="Team celebrating project completion in office">
```

### Solution 2: Decorative Images - Use Empty Alt

For purely decorative images that don't convey information, use `alt=""` to hide them from screen readers.

**Bad Example:**
```html
<img src="decorative-line.png">
<img src="spacer.gif" alt="spacer">
```

**Good Example:**
```html
<img src="decorative-line.png" alt="">
<img src="spacer.gif" alt="">
<!-- Better: Use CSS for decorative elements -->
```

### Solution 3: Complex Images - Provide Detailed Description

For charts, diagrams, or infographics, provide both alt text and a longer description.

**Good Example:**
```html
<!-- Method 1: Using aria-describedby -->
<img 
  src="sales-chart.png" 
  alt="Annual sales chart" 
  aria-describedby="chart-description"
>
<div id="chart-description">
  Detailed breakdown: Q1 sales were $50k, Q2 increased to $70k, 
  Q3 reached $65k, and Q4 peaked at $90k, showing overall growth 
  of 80% year over year.
</div>

<!-- Method 2: Using longdesc (deprecated) or figure/figcaption -->
<figure>
  <img src="sales-chart.png" alt="Annual sales chart">
  <figcaption>
    Quarterly sales data showing progressive growth from $50k in Q1 
    to $90k in Q4, representing 80% annual increase.
  </figcaption>
</figure>
```

### Solution 4: Functional Images - Describe the Function

For images used as buttons or links, describe what happens when clicked.

**Bad Example:**
```html
<a href="/cart">
  <img src="shopping-cart.png" alt="shopping cart icon">
</a>
```

**Good Example:**
```html
<a href="/cart">
  <img src="shopping-cart.png" alt="View shopping cart">
</a>

<!-- Or for image buttons -->
<button type="submit">
  <img src="search-icon.png" alt="Search">
</button>
```

### Solution 5: Text Within Images

If an image contains important text, include that text in the alt attribute.

**Bad Example:**
```html
<img src="sale-banner.png" alt="sale banner">
```

**Good Example:**
```html
<img src="sale-banner.png" alt="50% Off Sale - This Weekend Only">
<!-- Better: Use real text with CSS styling instead of text in images -->
```

## Rule Description

This rule ensures that all `<img>` elements have an `alt` attribute. The `alt` attribute must be:

- Present (not missing)
- Appropriate for the image's purpose
- Concise yet descriptive
- Empty (`alt=""`) only for decorative images

### What This Rule Checks

- All `<img>` elements have an `alt` attribute
- `<input type="image">` elements have alt text
- `<area>` elements in image maps have alt text
- Images with `role="img"` have accessible names

### What This Rule Does Not Check

- Quality or appropriateness of alt text content
- Whether decorative images should have empty alt
- Whether alt text is too long or verbose

## Writing Good Alt Text

### Guidelines

1. **Be concise**: Aim for 150 characters or less
2. **Be specific**: "Golden retriever puppy" not "dog"
3. **Avoid redundancy**: Don't start with "Image of" or "Picture of"
4. **Include text**: If the image contains text, include it
5. **Context matters**: Alt text should fit the context of use
6. **Decorative = empty**: Use `alt=""` for purely decorative images

### Alt Text Decision Tree

```
Does the image contain information?
├─ NO → Use alt=""
└─ YES → Does it contain text?
    ├─ YES → Include the text in alt
    └─ NO → Describe the information conveyed
        ├─ Is it simple? → Brief description in alt
        └─ Is it complex? → Brief alt + detailed description
```

## Common Mistakes

### 1. Missing Alt Attribute Entirely
```html
<!-- FAIL -->
<img src="product.jpg">
```

### 2. Using Filename or "image" as Alt
```html
<!-- FAIL -->
<img src="IMG_1234.jpg" alt="IMG_1234">
<img src="photo.png" alt="image">
<img src="pic.jpg" alt="picture">
```

### 3. Redundant Alt Text
```html
<!-- FAIL -->
<img src="sunset.jpg" alt="Image of a sunset">
<img src="chart.png" alt="Picture of a chart">

<!-- PASS -->
<img src="sunset.jpg" alt="Sunset over mountain range">
<img src="chart.png" alt="Sales growth chart for 2024">
```

### 4. Decorative Images with Descriptive Alt
```html
<!-- FAIL - Decorative elements shouldn't have alt text -->
<img src="decorative-swoosh.png" alt="decorative swoosh">

<!-- PASS -->
<img src="decorative-swoosh.png" alt="">
```

### 5. Alt Text Too Long
```html
<!-- FAIL - Too verbose -->
<img src="team.jpg" alt="This is a photograph of our team members 
standing in the office on a sunny Tuesday afternoon wearing casual 
business attire and smiling at the camera with our company logo 
visible in the background on the wall behind them">

<!-- PASS - Concise but descriptive -->
<img src="team.jpg" alt="Company team photo in office">
```

## Examples by Image Type

### Informative Images
```html
<!-- Product images -->
<img src="laptop.jpg" alt="15-inch MacBook Pro with Retina display">

<!-- Data visualization -->
<img src="graph.png" alt="Line graph showing temperature increase over time">

<!-- Logos (when they link) -->
<a href="/">
  <img src="logo.png" alt="Acme Corporation home">
</a>
```

### Functional Images
```html
<!-- Icon buttons -->
<button>
  <img src="print.png" alt="Print this page">
</button>

<!-- Social media links -->
<a href="https://twitter.com/company">
  <img src="twitter-icon.png" alt="Follow us on Twitter">
</a>
```

### Decorative Images
```html
<!-- Pure decoration -->
<img src="border-decoration.png" alt="">

<!-- Redundant with adjacent text -->
<h2>
  <img src="star.png" alt="">
  Featured Products
</h2>
```

### Complex Images
```html
<figure>
  <img 
    src="org-chart.png" 
    alt="Company organizational chart"
    aria-describedby="org-description"
  >
  <figcaption id="org-description">
    The organizational structure shows the CEO at the top, 
    with three VP positions reporting directly: VP of Engineering, 
    VP of Sales, and VP of Operations. Each VP oversees 3-5 
    department managers.
  </figcaption>
</figure>
```

## Testing

### Manual Testing
1. Turn off images in your browser
2. Verify that content is still understandable
3. Use a screen reader to navigate through images
4. Check that alt text is concise and descriptive
5. Ensure decorative images are ignored by screen reader

### Automated Testing
```javascript
// Check for images without alt attributes
const images = document.querySelectorAll('img');
images.forEach(img => {
  if (!img.hasAttribute('alt')) {
    console.error('Missing alt attribute:', img.src);
  }
});

// Using axe-core
const results = await axe.run();
const imageAltViolations = results.violations.filter(
  v => v.id === 'image-alt'
);
```

### Browser DevTools
```javascript
// Find all images without alt
$$('img:not([alt])')

// Find all images with empty src and non-empty alt (potential issues)
$$('img[alt]:not([alt=""])[src=""]')
```

## Resources

- [WCAG 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [W3C Alt Text Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)
- [WebAIM: Alternative Text](https://webaim.org/techniques/alttext/)
- [HTML5 Requirements for Alt](https://html.spec.whatwg.org/multipage/images.html#alt)

## Related Rules

- `image-redundant-alt` - Alt text should not contain redundant words
- `input-image-alt` - Image buttons must have alt text
- `area-alt` - Active area elements must have alt text
- `svg-img-alt` - SVG elements with img role must have alt text
