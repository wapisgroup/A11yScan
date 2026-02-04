# HTML element must have a lang attribute

**Rule ID:** `html-has-lang`  
**WCAG:** 3.1.1 Language of Page (Level A)  
**Severity:** Serious

## Issue Description

The `<html>` element does not have a `lang` attribute. Screen readers and assistive technologies need this to pronounce content correctly and apply appropriate language-specific rules.

## Why It Matters

### Impact on Users

- **Screen reader users** hear incorrect pronunciation and intonation
- **Braille display users** may see incorrect character translations
- **Translation tools** cannot auto-detect page language accurately
- **Search engines** may not properly index content for language-specific searches
- **Users who adjust language preferences** may not see content in their preferred format

### Real-World Scenario

A French screen reader user visits an English website without a `lang` attribute. The screen reader uses French pronunciation rules for English words, making "button" sound like "boo-tone" and "search" like "sair-sh". This makes the content difficult or impossible to understand.

## How to Fix

### Solution 1: Add lang to HTML Element

Always include a `lang` attribute on the `<html>` element.

**Bad Example:**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
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
    <title>My Website</title>
  </head>
  <body>
    <h1>Welcome</h1>
  </body>
</html>
```

### Solution 2: Use Correct Language Code

Use ISO 639-1 two-letter language codes.

**Good Examples:**
```html
<!-- English -->
<html lang="en">

<!-- Spanish -->
<html lang="es">

<!-- French -->
<html lang="fr">

<!-- German -->
<html lang="de">

<!-- Japanese -->
<html lang="ja">

<!-- Chinese (Simplified) -->
<html lang="zh">

<!-- Arabic -->
<html lang="ar">

<!-- Portuguese -->
<html lang="pt">
```

### Solution 3: Include Region Code (Optional)

For regional variations, add region codes.

**Good Examples:**
```html
<!-- US English -->
<html lang="en-US">

<!-- British English -->
<html lang="en-GB">

<!-- Canadian French -->
<html lang="fr-CA">

<!-- Mexican Spanish -->
<html lang="es-MX">

<!-- Brazilian Portuguese -->
<html lang="pt-BR">

<!-- Simplified Chinese (China) -->
<html lang="zh-CN">

<!-- Traditional Chinese (Taiwan) -->
<html lang="zh-TW">
```

### Solution 4: Dynamic Language Setting

For multi-language sites, set language dynamically.

**Good Example (Server-side):**
```php
<?php
$lang = $_GET['lang'] ?? 'en';
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($lang); ?>">
```

**Good Example (JavaScript/React):**
```jsx
function App() {
  const [language, setLanguage] = useState('en');
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  
  return <div>Content</div>;
}
```

**Good Example (Next.js):**
```jsx
// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document({ locale }) {
  return (
    <Html lang={locale || 'en'}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Solution 5: Mixed Language Content

Mark sections in different languages with `lang` attribute.

**Good Example:**
```html
<html lang="en">
  <head>
    <title>English Site with Quotes</title>
  </head>
  <body>
    <h1>Famous Quotes</h1>
    <blockquote lang="fr">
      <p>La vie est belle.</p>
    </blockquote>
    
    <p>The quote above is French for "Life is beautiful."</p>
    
    <blockquote lang="es">
      <p>Hasta la vista, baby.</p>
    </blockquote>
  </body>
</html>
```

## Rule Description

This rule ensures that the `<html>` element has a valid `lang` attribute that identifies the primary language of the page.

### What This Rule Checks

- Presence of `lang` attribute on `<html>` element
- That the `lang` attribute is not empty

### What This Rule Does Not Check

- Whether the language code is valid (see `html-lang-valid` rule)
- Whether the specified language matches actual content
- Proper use of language codes for content sections

### Language Code Format

- **Primary language**: Two-letter ISO 639-1 code (e.g., `en`, `fr`, `es`)
- **Region (optional)**: Two-letter ISO 3166-1 code (e.g., `US`, `GB`, `MX`)
- **Format**: `language-REGION` (e.g., `en-US`, `fr-CA`)

## Common Mistakes

### 1. Missing lang Attribute
```html
<!-- FAIL -->
<!DOCTYPE html>
<html>
  <head><title>Page</title></head>
  <body>Content</body>
</html>
```

### 2. Empty lang Attribute
```html
<!-- FAIL -->
<html lang="">
```

### 3. Invalid Format
```html
<!-- FAIL -->
<html lang="english">
<html lang="EN">
<html lang="en_US">
<html lang="en-us">
```

### 4. Wrong Element
```html
<!-- FAIL - lang on body instead of html -->
<!DOCTYPE html>
<html>
  <body lang="en">
    Content
  </body>
</html>
```

### 5. Using Full Language Name
```html
<!-- FAIL -->
<html lang="English">
<html lang="Spanish">
<html lang="French">
```

## Examples by Language

### Common Languages
```html
<!-- Arabic -->
<html lang="ar" dir="rtl">

<!-- Bengali -->
<html lang="bn">

<!-- Chinese (Simplified) -->
<html lang="zh-Hans">

<!-- Chinese (Traditional) -->
<html lang="zh-Hant">

<!-- Dutch -->
<html lang="nl">

<!-- English -->
<html lang="en">

<!-- French -->
<html lang="fr">

<!-- German -->
<html lang="de">

<!-- Hindi -->
<html lang="hi">

<!-- Italian -->
<html lang="it">

<!-- Japanese -->
<html lang="ja">

<!-- Korean -->
<html lang="ko">

<!-- Polish -->
<html lang="pl">

<!-- Portuguese -->
<html lang="pt">

<!-- Russian -->
<html lang="ru">

<!-- Spanish -->
<html lang="es">

<!-- Turkish -->
<html lang="tr">

<!-- Vietnamese -->
<html lang="vi">
```

### Regional Variants
```html
<!-- English variants -->
<html lang="en-US"> <!-- United States -->
<html lang="en-GB"> <!-- United Kingdom -->
<html lang="en-AU"> <!-- Australia -->
<html lang="en-CA"> <!-- Canada -->
<html lang="en-IN"> <!-- India -->

<!-- Spanish variants -->
<html lang="es-ES"> <!-- Spain -->
<html lang="es-MX"> <!-- Mexico -->
<html lang="es-AR"> <!-- Argentina -->
<html lang="es-CO"> <!-- Colombia -->

<!-- French variants -->
<html lang="fr-FR"> <!-- France -->
<html lang="fr-CA"> <!-- Canada -->
<html lang="fr-BE"> <!-- Belgium -->

<!-- Portuguese variants -->
<html lang="pt-BR"> <!-- Brazil -->
<html lang="pt-PT"> <!-- Portugal -->

<!-- Chinese variants -->
<html lang="zh-CN"> <!-- China (Simplified) -->
<html lang="zh-TW"> <!-- Taiwan (Traditional) -->
<html lang="zh-HK"> <!-- Hong Kong (Traditional) -->
```

## Right-to-Left Languages

For RTL languages, include `dir="rtl"`:

```html
<!-- Arabic -->
<html lang="ar" dir="rtl">
  <head>
    <title>موقع عربي</title>
  </head>
  <body>
    <h1>مرحبا</h1>
  </body>
</html>

<!-- Hebrew -->
<html lang="he" dir="rtl">
  <head>
    <title>אתר עברי</title>
  </head>
  <body>
    <h1>שלום</h1>
  </body>
</html>

<!-- Persian -->
<html lang="fa" dir="rtl">
  <head>
    <title>سایت فارسی</title>
  </head>
  <body>
    <h1>سلام</h1>
  </body>
</html>
```

## Multi-Language Sites

### Language Switcher
```html
<html lang="en">
  <head>
    <title>My Site</title>
    <link rel="alternate" hreflang="es" href="/es/">
    <link rel="alternate" hreflang="fr" href="/fr/">
  </head>
  <body>
    <nav aria-label="Language selector">
      <a href="/en/" hreflang="en" lang="en">English</a>
      <a href="/es/" hreflang="es" lang="es">Español</a>
      <a href="/fr/" hreflang="fr" lang="fr">Français</a>
    </nav>
  </body>
</html>
```

### Content in Multiple Languages
```html
<html lang="en">
  <body>
    <article>
      <h1>Learning Languages</h1>
      
      <section>
        <h2>Common Greetings</h2>
        <dl>
          <dt>English</dt>
          <dd lang="en">Hello</dd>
          
          <dt>Spanish</dt>
          <dd lang="es">Hola</dd>
          
          <dt>French</dt>
          <dd lang="fr">Bonjour</dd>
          
          <dt>German</dt>
          <dd lang="de">Guten Tag</dd>
          
          <dt>Japanese</dt>
          <dd lang="ja">こんにちは</dd>
        </dl>
      </section>
    </article>
  </body>
</html>
```

## Framework Examples

### React/Next.js
```jsx
// _app.js or _document.js
import { Html } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      {/* content */}
    </Html>
  );
}

// Dynamic language
import { useRouter } from 'next/router';

export default function Document() {
  const { locale } = useRouter();
  
  return (
    <Html lang={locale}>
      {/* content */}
    </Html>
  );
}
```

### Vue
```vue
<!-- App.vue or index.html -->
<template>
  <div id="app">
    <!-- content -->
  </div>
</template>

<script>
export default {
  mounted() {
    document.documentElement.lang = this.$i18n.locale;
  },
  watch: {
    '$i18n.locale'(newLocale) {
      document.documentElement.lang = newLocale;
    }
  }
}
</script>
```

### Angular
```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(private translate: TranslateService) {}
  
  ngOnInit() {
    const lang = this.translate.currentLang || 'en';
    document.documentElement.lang = lang;
    
    this.translate.onLangChange.subscribe(event => {
      document.documentElement.lang = event.lang;
    });
  }
}
```

## Testing

### Manual Testing
1. View page source
2. Check `<html>` tag has `lang` attribute
3. Verify language code matches content
4. Test with different language settings

### Screen Reader Testing
```
NVDA: Control+NVDA+V (voice settings)
Expected: Voice should match page language

JAWS: Insert+F2 (language list)
Expected: Correct language selected for page
```

### Automated Testing
```javascript
// Check for lang attribute
const htmlElement = document.documentElement;
const lang = htmlElement.getAttribute('lang');

if (!lang || lang.trim() === '') {
  console.error('HTML element missing lang attribute');
}

// Using axe-core
const results = await axe.run();
const langViolations = results.violations.filter(
  v => v.id === 'html-has-lang'
);
```

### Browser DevTools
```javascript
// Check current lang
document.documentElement.lang

// Check if attribute exists
document.documentElement.hasAttribute('lang')

// See all language declarations
Array.from(document.querySelectorAll('[lang]')).map(el => ({
  tag: el.tagName,
  lang: el.lang,
  text: el.textContent.substring(0, 50)
}));
```

## Resources

- [WCAG 3.1.1 Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)
- [HTML lang attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang)
- [Language tags in HTML](https://www.w3.org/International/questions/qa-html-language-declarations)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [WebAIM: Language of Page](https://webaim.org/techniques/language/)

## Related Rules

- `html-lang-valid` - lang attribute must have a valid value
- `valid-lang` - lang attribute must be valid on all elements
- `html-xml-lang-mismatch` - HTML and XML lang must match
