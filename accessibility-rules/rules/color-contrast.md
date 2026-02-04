# Elements must have sufficient color contrast

**Rule ID:** `color-contrast`  
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA), 1.4.6 Contrast (Enhanced) (Level AAA)  
**Severity:** Serious

## Issue Description

Text and images of text do not have sufficient contrast against their background. Users with low vision, color blindness, or viewing content in bright sunlight cannot read the content.

## Why It Matters

### Impact on Users

- **Users with low vision** struggle to read low-contrast text
- **Users with color blindness** may not perceive color-based contrast
- **Older users** often experience reduced contrast sensitivity
- **Mobile users in bright sunlight** cannot see low-contrast text
- **Users with cognitive disabilities** find high-contrast text easier to process

### Real-World Scenario

A website uses light gray text (#999) on a white background (#FFF). A user with mild vision impairment visits the site on a sunny day using their phone. The text is completely illegible, forcing them to abandon the site and go to a competitor with better contrast.

## How to Fix

### Contrast Ratio Requirements

**WCAG Level AA (Minimum):**
- Normal text (< 24px or < 19px bold): **4.5:1**
- Large text (≥ 24px or ≥ 19px bold): **3:1**
- UI components and graphics: **3:1**

**WCAG Level AAA (Enhanced):**
- Normal text: **7:1**
- Large text: **4.5:1**

### Solution 1: Adjust Text Color

Darken text color or lighten background to meet contrast requirements.

**Bad Example:**
```html
<!-- Light gray on white: 2.8:1 - FAIL -->
<p style="color: #999; background: #FFF;">
  This text is hard to read
</p>

<!-- Blue on blue: 1.5:1 - FAIL -->
<button style="color: #4A90E2; background: #E3F2FD;">
  Click me
</button>
```

**Good Example:**
```html
<!-- Dark gray on white: 7:1 - PASS AAA -->
<p style="color: #595959; background: #FFF;">
  This text is easy to read
</p>

<!-- Dark blue on light blue: 4.6:1 - PASS AA -->
<button style="color: #1565C0; background: #E3F2FD;">
  Click me
</button>

<!-- White on dark blue: 8.6:1 - PASS AAA -->
<button style="color: #FFF; background: #1565C0;">
  Click me
</button>
```

### Solution 2: Use Color Contrast Tools

Leverage tools to find accessible color combinations.

```css
/* Before - FAIL: 3.2:1 */
.button {
  color: #6C63FF;
  background-color: #FFFFFF;
}

/* After - PASS: 4.5:1 */
.button {
  color: #5046E5;
  background-color: #FFFFFF;
}

/* Alternative - PASS: 9.7:1 */
.button {
  color: #FFFFFF;
  background-color: #5046E5;
}
```

### Solution 3: Don't Rely on Color Alone

Use multiple indicators (icons, patterns, text) in addition to color.

**Bad Example:**
```html
<!-- Only color distinguishes error - FAIL -->
<style>
  .error { color: #FF0000; }
</style>
<p class="error">Invalid email address</p>
```

**Good Example:**
```html
<!-- Icon + color + text - PASS -->
<style>
  .error { color: #C62828; }
  .error::before { content: "⚠️ "; }
</style>
<p class="error">Error: Invalid email address</p>

<!-- Or with semantic elements -->
<div role="alert" class="error">
  <svg aria-hidden="true"><use href="#error-icon"/></svg>
  <strong>Error:</strong> Invalid email address
</div>
```

### Solution 4: Handle Text Over Images

Ensure text over background images maintains contrast.

**Bad Example:**
```html
<!-- White text might have poor contrast depending on image -->
<div class="hero" style="background-image: url('light-background.jpg');">
  <h1 style="color: white;">Welcome</h1>
</div>
```

**Good Example:**
```html
<!-- Add dark overlay to ensure contrast -->
<div class="hero" style="
  background-image: 
    linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
    url('light-background.jpg');
">
  <h1 style="color: white;">Welcome</h1>
</div>

<!-- Or use background with sufficient contrast -->
<div class="hero" style="background-image: url('light-background.jpg');">
  <h1 style="color: white; background: rgba(0,0,0,0.8); padding: 1rem;">
    Welcome
  </h1>
</div>
```

### Solution 5: Interactive States

Ensure hover, focus, and active states maintain contrast.

**Bad Example:**
```css
/* FAIL - Hover state has poor contrast */
.link {
  color: #0066CC; /* 4.5:1 - PASS */
  background: white;
}
.link:hover {
  color: #99CCFF; /* 1.9:1 - FAIL */
  background: white;
}
```

**Good Example:**
```css
/* PASS - All states have sufficient contrast */
.link {
  color: #0066CC; /* 4.5:1 - PASS */
  background: white;
}
.link:hover {
  color: #004499; /* 7.4:1 - PASS */
  background: white;
  text-decoration: underline;
}
.link:focus {
  color: #004499; /* 7.4:1 - PASS */
  background: white;
  outline: 3px solid #0066CC;
}
```

## Rule Description

This rule checks that all text and images of text have a contrast ratio that meets WCAG requirements:

### What This Rule Checks

- Text content against its background
- Large text (≥24px regular or ≥19px bold) - minimum 3:1
- Normal text (<24px regular or <19px bold) - minimum 4.5:1
- Text in interactive elements (buttons, links, form fields)
- Placeholder text in form fields
- Text in disabled controls (should ideally still meet contrast)

### What This Rule Does Not Check

- Logos and brand names
- Inactive/disabled UI components (though best practice is to still maintain contrast)
- Text that is pure decoration
- Text within images (though it should still be readable)

### Exceptions

The following are **exempt** from contrast requirements:
- Logos
- Inactive user interface components
- Pure decoration (text not meant to be read)
- Text within images that are not essential to understanding content

## Color Contrast Formulas

### Calculating Contrast Ratio

```javascript
// Formula for relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio
function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Example usage
const white = [255, 255, 255];
const darkGray = [89, 89, 89];
const ratio = getContrastRatio(white, darkGray);
console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`); // 7.00:1
```

## Common Mistakes

### 1. Light Gray on White
```html
<!-- FAIL: 2.8:1 -->
<p style="color: #999; background: #FFF;">
  Light gray text
</p>

<!-- PASS: 7:1 -->
<p style="color: #595959; background: #FFF;">
  Dark gray text
</p>
```

### 2. Low Contrast Buttons
```html
<!-- FAIL: 1.6:1 -->
<button style="color: #5AC8FA; background: #E8F5F9;">
  Submit
</button>

<!-- PASS: 4.7:1 -->
<button style="color: #0277BD; background: #E8F5F9;">
  Submit
</button>
```

### 3. Placeholder Text
```html
<!-- FAIL: Most browsers use #999 which is 2.8:1 -->
<input type="text" placeholder="Enter your email">

<!-- PASS: Custom styling for better contrast -->
<style>
  input::placeholder {
    color: #666; /* 5.7:1 */
  }
</style>
<input type="text" placeholder="Enter your email">
```

### 4. Link Text in Paragraphs
```html
<!-- FAIL: 2.1:1 -->
<p style="color: #333; background: #FFF;">
  Visit our <a href="#" style="color: #9E9E9E;">website</a> for more info.
</p>

<!-- PASS: 4.5:1 + underline for additional distinction -->
<p style="color: #333; background: #FFF;">
  Visit our <a href="#" style="color: #0066CC; text-decoration: underline;">
    website
  </a> for more info.
</p>
```

### 5. Gradient Backgrounds
```html
<!-- FAIL: Parts of the gradient may have poor contrast -->
<div style="background: linear-gradient(to right, #FFF, #F0F0F0);">
  <p style="color: #999;">Text on gradient</p>
</div>

<!-- PASS: Ensure text color works across entire gradient -->
<div style="background: linear-gradient(to right, #FFF, #F0F0F0);">
  <p style="color: #333;">Text on gradient</p>
</div>
```

## Practical Color Combinations

### Dark Text on Light Background

```css
/* Excellent contrast */
.text-dark { color: #000000; background: #FFFFFF; } /* 21:1 */
.text-charcoal { color: #333333; background: #FFFFFF; } /* 12.6:1 */
.text-gray { color: #595959; background: #FFFFFF; } /* 7:1 AAA */
.text-medium { color: #767676; background: #FFFFFF; } /* 4.5:1 AA */

/* Minimum AA (avoid going lighter) */
.text-light-gray { color: #757575; background: #FFFFFF; } /* 4.6:1 */
```

### Light Text on Dark Background

```css
/* Excellent contrast */
.text-white { color: #FFFFFF; background: #000000; } /* 21:1 */
.text-off-white { color: #F5F5F5; background: #212121; } /* 15.8:1 */
.text-light { color: #E0E0E0; background: #333333; } /* 10.4:1 */
.text-gray-on-dark { color: #BDBDBD; background: #424242; } /* 4.9:1 AA */
```

### Brand Colors (Examples)

```css
/* Blue palette */
.blue-primary { color: #FFFFFF; background: #1976D2; } /* 4.5:1 */
.blue-dark { color: #FFFFFF; background: #0D47A1; } /* 8.6:1 */
.blue-text { color: #0D47A1; background: #FFFFFF; } /* 8.6:1 */

/* Green palette */
.green-primary { color: #FFFFFF; background: #388E3C; } /* 4.5:1 */
.green-dark { color: #FFFFFF; background: #1B5E20; } /* 8.6:1 */
.green-text { color: #1B5E20; background: #FFFFFF; } /* 8.6:1 */

/* Red palette */
.red-primary { color: #FFFFFF; background: #D32F2F; } /* 4.7:1 */
.red-dark { color: #FFFFFF; background: #B71C1C; } /* 7.3:1 */
.red-text { color: #B71C1C; background: #FFFFFF; } /* 7.3:1 */
```

## Testing Tools

### Manual Testing
1. Use browser DevTools color picker to check contrast
2. Test with grayscale mode to see if content is distinguishable
3. View site in bright sunlight or adjust screen brightness
4. Test with color blindness simulators

### Automated Testing
```javascript
// Using axe-core
const results = await axe.run();
const contrastViolations = results.violations.filter(
  v => v.id === 'color-contrast'
);

// Check specific element
const element = document.querySelector('.my-text');
const style = window.getComputedStyle(element);
const color = style.color;
const backgroundColor = style.backgroundColor;
console.log(`Text: ${color}, Background: ${backgroundColor}`);
```

### Recommended Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Tool](https://contrast-ratio.com/)
- Chrome DevTools (has built-in contrast checker)
- [Accessible Colors](https://accessible-colors.com/)
- [Colorable](https://colorable.jxnblk.com/)

## Resources

- [WCAG 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WCAG 1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html)
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
- [Understanding Color Contrast](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html)

## Related Rules

- `color-contrast-enhanced` - Enhanced contrast for AAA compliance
- `link-in-text-block` - Links must be distinguishable from surrounding text
- `focus-visible` - Focus indicators must have sufficient contrast
