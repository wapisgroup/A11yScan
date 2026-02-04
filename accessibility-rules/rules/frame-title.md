# Frames must have a title attribute

**Rule ID:** `frame-title`  
**WCAG:** 4.1.2 Name, Role, Value (Level A), 2.4.1 Bypass Blocks (Level A)  
**Severity:** Serious

## Issue Description

An `<iframe>` or `<frame>` element does not have a `title` attribute, or the title is empty. Screen reader users cannot understand the frame's purpose without a descriptive title.

## Why It Matters

### Impact on Users

- **Screen reader users** hear "frame" without knowing its content or purpose
- **Keyboard users** navigating into frames don't know what they're entering
- **All users** benefit from clear frame identification in developer tools
- **Users with cognitive disabilities** need context to understand embedded content

### Real-World Scenario

A page embeds a YouTube video, a payment form, and an advertisement map, all in iframes without titles. A screen reader user hears: "Frame, Frame, Frame" with no way to distinguish between the video, payment form, and map without entering each one.

## How to Fix

### Solution 1: Add Descriptive Title Attribute

Provide a clear, descriptive `title` for every iframe.

**Bad Example:**
```html
<!-- FAIL - No title -->
<iframe src="https://www.youtube.com/embed/..."></iframe>
```

**Good Example:**
```html
<!-- PASS - Descriptive title -->
<iframe 
  src="https://www.youtube.com/embed/..."
  title="Product demonstration video">
</iframe>
```

### Solution 2: Specific Titles for Different Purposes

Use titles that describe the frame's content and purpose.

**Good Examples:**
```html
<!-- Video embed -->
<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="How to use our product - Tutorial video"
  allowfullscreen>
</iframe>

<!-- Map embed -->
<iframe 
  src="https://www.google.com/maps/embed?..."
  title="Office location map showing 123 Main St, Anytown"
  loading="lazy">
</iframe>

<!-- Third-party form -->
<iframe 
  src="https://forms.example.com/contact"
  title="Contact us form">
</iframe>

<!-- Advertisement -->
<iframe 
  src="https://ads.example.com/banner"
  title="Advertisement">
</iframe>

<!-- Social media embed -->
<iframe 
  src="https://www.facebook.com/plugins/page.php?..."
  title="Our Facebook page">
</iframe>
```

### Solution 3: Unique Titles for Multiple Frames

When using multiple frames, ensure each has a unique title.

**Bad Example:**
```html
<!-- FAIL - Same title for different content -->
<iframe src="/video1.html" title="Video"></iframe>
<iframe src="/video2.html" title="Video"></iframe>
<iframe src="/video3.html" title="Video"></iframe>
```

**Good Example:**
```html
<!-- PASS - Unique, descriptive titles -->
<iframe 
  src="/intro-video.html" 
  title="Introduction: Getting started">
</iframe>
<iframe 
  src="/features-video.html" 
  title="Product features overview">
</iframe>
<iframe 
  src="/tutorial-video.html" 
  title="Step-by-step tutorial">
</iframe>
```

### Solution 4: Dynamic Title Updates

Update frame titles when content changes.

**Good Example (JavaScript):**
```javascript
// Update iframe title based on content
function loadContentInFrame(url, description) {
  const iframe = document.getElementById('content-frame');
  iframe.src = url;
  iframe.title = description;
}

// Example usage
loadContentInFrame(
  '/products/widget.html', 
  'Widget product details'
);
```

**Good Example (React):**
```jsx
function EmbeddedContent({ src, description }) {
  return (
    <iframe
      src={src}
      title={description}
      width="100%"
      height="400"
    />
  );
}

// Usage
<EmbeddedContent 
  src="https://example.com/content" 
  description="Interactive product configurator"
/>
```

### Solution 5: Hide Decorative Frames (Rare)

Only for purely decorative frames with no content.

**Use With Caution:**
```html
<!-- Only if frame is truly decorative and empty -->
<iframe 
  src="/decoration.html" 
  title="Decorative element"
  aria-hidden="true">
</iframe>
```

## Rule Description

This rule ensures all `<iframe>` and `<frame>` elements have a non-empty `title` attribute that describes their content.

### What This Rule Checks

- Presence of `title` attribute on iframes/frames
- Title attribute is not empty
- Title contains actual text (not just whitespace)

### What This Rule Does Not Check

- Quality or descriptiveness of title text
- Whether title accurately describes content
- Duplicate titles (separate check)
- Other frame attributes (name, src, etc.)

### Best Practices

1. **Be specific** - Describe what's in the frame, not just "iframe"
2. **Include purpose** - "Contact form" not just "Form"
3. **Keep concise** - Clear but not overly long
4. **Unique titles** - Different title for each frame
5. **Update dynamically** - Change title when frame content changes

## Common Mistakes

### 1. Missing Title Attribute
```html
<!-- FAIL -->
<iframe src="/content.html"></iframe>
<iframe src="https://www.youtube.com/embed/..."></iframe>
```

### 2. Empty Title
```html
<!-- FAIL -->
<iframe src="/content.html" title=""></iframe>
<iframe src="/content.html" title="   "></iframe>
```

### 3. Generic Title
```html
<!-- FAIL - Too vague -->
<iframe src="/video.html" title="iframe"></iframe>
<iframe src="/map.html" title="Frame"></iframe>
<iframe src="/form.html" title="Content"></iframe>
```

### 4. Same Title for All Frames
```html
<!-- FAIL - Not unique -->
<iframe src="/video1.html" title="Embedded content"></iframe>
<iframe src="/video2.html" title="Embedded content"></iframe>
<iframe src="/map.html" title="Embedded content"></iframe>
```

### 5. Using Name Instead of Title
```html
<!-- FAIL - name is not sufficient -->
<iframe src="/content.html" name="content-frame"></iframe>

<!-- PASS -->
<iframe 
  src="/content.html" 
  name="content-frame"
  title="Main content area">
</iframe>
```

## Examples by Content Type

### Video Embeds
```html
<!-- YouTube -->
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="Product demonstration - How to assemble the widget"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>

<!-- Vimeo -->
<iframe 
  src="https://player.vimeo.com/video/123456789"
  title="Customer testimonial from Jane Smith"
  width="640"
  height="360"
  frameborder="0"
  allowfullscreen>
</iframe>

<!-- Self-hosted -->
<iframe 
  src="/videos/tutorial.html"
  title="Getting started tutorial - Part 1"
  width="800"
  height="450">
</iframe>
```

### Maps
```html
<!-- Google Maps -->
<iframe 
  src="https://www.google.com/maps/embed?pb=..."
  title="Map showing our office location at 123 Main Street"
  width="600"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy">
</iframe>

<!-- OpenStreetMap -->
<iframe 
  src="https://www.openstreetmap.org/export/embed.html?..."
  title="Interactive map of delivery areas"
  width="600"
  height="450">
</iframe>
```

### Forms and Surveys
```html
<!-- Google Forms -->
<iframe 
  src="https://docs.google.com/forms/d/e/.../viewform"
  title="Customer satisfaction survey"
  width="640"
  height="800"
  frameborder="0">
</iframe>

<!-- Typeform -->
<iframe 
  src="https://form.typeform.com/to/..."
  title="Event registration form"
  width="100%"
  height="500">
</iframe>

<!-- Contact form -->
<iframe 
  src="/forms/contact.html"
  title="Contact us - Send us a message"
  width="100%"
  height="600">
</iframe>
```

### Social Media Embeds
```html
<!-- Facebook Page -->
<iframe 
  src="https://www.facebook.com/plugins/page.php?href=..."
  title="Our company Facebook page"
  width="340"
  height="500"
  style="border:none;overflow:hidden"
  scrolling="no"
  frameborder="0">
</iframe>

<!-- Twitter Timeline -->
<iframe 
  src="https://platform.twitter.com/widgets/..."
  title="Our latest tweets from @companyname"
  width="400"
  height="600">
</iframe>

<!-- Instagram Post -->
<iframe 
  src="https://www.instagram.com/p/.../embed"
  title="Instagram post showing our new product launch"
  width="400"
  height="480"
  frameborder="0">
</iframe>
```

### Advertisements
```html
<!-- Ad frame -->
<iframe 
  src="https://ads.example.com/banner?id=123"
  title="Advertisement"
  width="300"
  height="250"
  scrolling="no">
</iframe>

<!-- Google Ads -->
<iframe 
  src="https://googleads.g.doubleclick.net/..."
  title="Sponsored advertisement"
  width="728"
  height="90">
</iframe>
```

### Payment and Checkout
```html
<!-- Stripe Checkout -->
<iframe 
  src="https://checkout.stripe.com/..."
  title="Secure payment form - Stripe Checkout"
  width="100%"
  height="600"
  frameborder="0">
</iframe>

<!-- PayPal -->
<iframe 
  src="https://www.paypal.com/sdk/..."
  title="PayPal payment options"
  width="100%"
  height="400">
</iframe>
```

### Interactive Content
```html
<!-- Code editor -->
<iframe 
  src="https://codesandbox.io/embed/..."
  title="Live code example - React component demo"
  width="100%"
  height="500"
  sandbox="allow-scripts allow-same-origin">
</iframe>

<!-- Presentation -->
<iframe 
  src="https://docs.google.com/presentation/d/e/.../embed"
  title="Q4 2025 Sales Presentation"
  width="960"
  height="569"
  frameborder="0"
  allowfullscreen="true">
</iframe>

<!-- Calendar -->
<iframe 
  src="https://calendar.google.com/calendar/embed?src=..."
  title="Event calendar - Upcoming workshops and webinars"
  width="800"
  height="600"
  frameborder="0">
</iframe>
```

## Application Frame Examples

### Content Portal
```html
<!-- Navigation frame (legacy) -->
<frame 
  src="/nav.html" 
  name="navigation"
  title="Main navigation menu">

<!-- Content frame (legacy) -->
<frame 
  src="/content.html" 
  name="content"
  title="Main content area">
```

### Dashboard Widgets
```html
<!-- Analytics widget -->
<iframe 
  src="/widgets/analytics.html"
  title="Real-time visitor analytics dashboard"
  width="100%"
  height="400">
</iframe>

<!-- Status widget -->
<iframe 
  src="/widgets/system-status.html"
  title="System status monitor"
  width="100%"
  height="300">
</iframe>
```

## Dynamic Content Example

```javascript
// Update iframe content and title
function loadSection(section) {
  const iframe = document.getElementById('content-iframe');
  const titles = {
    home: 'Home - Welcome page',
    products: 'Products - Browse our catalog',
    about: 'About Us - Company information',
    contact: 'Contact - Get in touch'
  };
  
  iframe.src = `/${section}.html`;
  iframe.title = titles[section] || 'Content';
}

// React component
function DynamicFrame({ page }) {
  const titles = {
    home: 'Home - Welcome page',
    products: 'Products - Browse our catalog',
    about: 'About Us - Company information'
  };
  
  return (
    <iframe
      src={`/${page}.html`}
      title={titles[page] || 'Page content'}
      width="100%"
      height="600"
    />
  );
}
```

## Testing

### Manual Testing
1. Inspect each iframe element in the page
2. Verify `title` attribute exists and is not empty
3. Check that title describes frame content
4. Ensure different frames have different titles

### Screen Reader Testing
```
NVDA: Navigate to iframe with Tab or arrow keys
Expected: "Frame: [title text]" or "[title text], frame"

JAWS: Navigate to iframe
Expected: Announces title before entering frame

Tab into frame:
Expected: Screen reader announces frame title
```

### Automated Testing
```javascript
// Check all iframes have titles
const iframes = document.querySelectorAll('iframe, frame');

iframes.forEach(iframe => {
  const title = iframe.getAttribute('title');
  if (!title || title.trim() === '') {
    console.error('Frame without title:', iframe);
  }
});

// Using axe-core
const results = await axe.run();
const frameViolations = results.violations.filter(
  v => v.id === 'frame-title'
);
```

### Browser DevTools
```javascript
// Find all frames
$$('iframe, frame')

// Check for missing/empty titles
Array.from(document.querySelectorAll('iframe, frame'))
  .filter(frame => !frame.title || !frame.title.trim())
  .forEach(frame => console.log('Missing title:', frame));

// List all frame titles
Array.from(document.querySelectorAll('iframe, frame'))
  .map(f => ({ src: f.src, title: f.title }));
```

## Resources

- [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)
- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html)
- [MDN: iframe element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [WebAIM: Frames](https://webaim.org/techniques/frames/)

## Related Rules

- `frame-title-unique` - Frame titles should be unique
- `document-title` - Documents must have titles
- `label` - Form elements must have labels
- `button-name` - Buttons must have accessible names
