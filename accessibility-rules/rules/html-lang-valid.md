# html element must have a valid lang attribute value

**Rule ID:** `html-lang-valid`  
**WCAG:** 3.1.1 Language of Page (Level A)  
**Severity:** Serious

## Issue Description

The `<html>` element has a `lang` attribute with an invalid value. Screen readers and browsers cannot determine the correct language for pronunciation and processing.

## Why It Matters

### Impact on Users

- **Screen reader users** hear incorrect pronunciation
- **Translation tools** cannot accurately translate content
- **Search engines** may not properly index content
- **Braille display users** get incorrect character mappings

### Real-World Scenario

A German website has `<html lang="de-de">` (lowercase). Some assistive technologies don't recognize the invalid format and default to English pronunciation. German words like "ich" are pronounced as the English word "itch," making the content incomprehensible.

## How to Fix

### Solution 1: Use Valid ISO Language Codes

Use proper ISO 639-1 language codes (2-letter or language-region format).

**Bad Example:**
```html
<!-- FAIL - Invalid language codes -->
<html lang="english">
<html lang="EN">
<html lang="en-us">
<html lang="us">
<html lang="en_US">
<html lang="en-UK">
```

**Good Example:**
```html
<!-- PASS - Valid language codes -->
<html lang="en">
<html lang="en-US">
<html lang="en-GB">
<html lang="es">
<html lang="es-MX">
<html lang="fr-CA">
<html lang="de-DE">
<html lang="zh-CN">
<html lang="ja">
```

### Solution 2: Common Language Codes

Use these validated codes for common languages.

**English Variants:**
```html
<html lang="en">      <!-- English (generic) -->
<html lang="en-US">   <!-- English (United States) -->
<html lang="en-GB">   <!-- English (United Kingdom) -->
<html lang="en-CA">   <!-- English (Canada) -->
<html lang="en-AU">   <!-- English (Australia) -->
```

**Spanish Variants:**
```html
<html lang="es">      <!-- Spanish (generic) -->
<html lang="es-ES">   <!-- Spanish (Spain) -->
<html lang="es-MX">   <!-- Spanish (Mexico) -->
<html lang="es-AR">   <!-- Spanish (Argentina) -->
```

**French Variants:**
```html
<html lang="fr">      <!-- French (generic) -->
<html lang="fr-FR">   <!-- French (France) -->
<html lang="fr-CA">   <!-- French (Canada) -->
<html lang="fr-BE">   <!-- French (Belgium) -->
```

**German Variants:**
```html
<html lang="de">      <!-- German (generic) -->
<html lang="de-DE">   <!-- German (Germany) -->
<html lang="de-AT">   <!-- German (Austria) -->
<html lang="de-CH">   <!-- German (Switzerland) -->
```

**Chinese Variants:**
```html
<html lang="zh">      <!-- Chinese (generic) -->
<html lang="zh-CN">   <!-- Chinese (Simplified, China) -->
<html lang="zh-TW">   <!-- Chinese (Traditional, Taiwan) -->
<html lang="zh-HK">   <!-- Chinese (Hong Kong) -->
```

**Other Common Languages:**
```html
<html lang="ja">      <!-- Japanese -->
<html lang="ko">      <!-- Korean -->
<html lang="pt">      <!-- Portuguese -->
<html lang="pt-BR">   <!-- Portuguese (Brazil) -->
<html lang="pt-PT">   <!-- Portuguese (Portugal) -->
<html lang="it">      <!-- Italian -->
<html lang="ru">      <!-- Russian -->
<html lang="ar">      <!-- Arabic -->
<html lang="hi">      <!-- Hindi -->
<html lang="nl">      <!-- Dutch -->
<html lang="pl">      <!-- Polish -->
<html lang="tr">      <!-- Turkish -->
```

### Solution 3: Framework Implementations

**Next.js:**
```jsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// For internationalization
import { useRouter } from 'next/router';

export default function RootLayout({ children }) {
  const { locale } = useRouter();
  
  return (
    <html lang={locale || 'en'}>
      <body>{children}</body>
    </html>
  );
}
```

**React (SPA):**
```jsx
// Set lang attribute on mount
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);
  
  return <div>App content</div>;
}

// With i18n
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  return <div>App content</div>;
}
```

**Vue:**
```vue
<!-- App.vue -->
<script setup>
import { onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

onMounted(() => {
  document.documentElement.lang = locale.value;
});

watch(locale, (newLocale) => {
  document.documentElement.lang = newLocale;
});
</script>
```

### Solution 4: Multi-Language Sites

Set language dynamically based on user selection or detection.

**Server-Side (Node.js/Express):**
```javascript
app.get('*', (req, res) => {
  // Detect language from Accept-Language header or user preference
  const lang = req.acceptsLanguages(['en', 'es', 'fr', 'de']) || 'en';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="${lang}">
      <head>
        <title>Page Title</title>
      </head>
      <body>
        <!-- Content -->
      </body>
    </html>
  `);
});
```

**Client-Side Language Switcher:**
```javascript
function setLanguage(lang) {
  // Validate language code
  const validLangs = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
  
  if (validLangs.includes(lang)) {
    document.documentElement.lang = lang;
    localStorage.setItem('preferred-language', lang);
    loadTranslations(lang);
  }
}

// Load saved language preference
const savedLang = localStorage.getItem('preferred-language') || 'en';
setLanguage(savedLang);
```

### Solution 5: Language Code Format

Follow the correct format for language codes.

**Format Rules:**
```
Primary language subtag (required):
- 2 letters (ISO 639-1): en, es, fr, de, ja, zh
- Lowercase

Region subtag (optional):
- 2 letters (ISO 3166-1): US, GB, MX, CN, JP
- UPPERCASE

Separator:
- Use hyphen (-), NOT underscore (_)

Examples:
✓ lang="en"
✓ lang="en-US"
✓ lang="zh-CN"
✗ lang="en_US"
✗ lang="en-us"
✗ lang="EN-US"
```

**Validation:**
```javascript
function isValidLangCode(lang) {
  // Format: language or language-REGION
  const pattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  return pattern.test(lang);
}

// Examples
isValidLangCode('en');       // true
isValidLangCode('en-US');    // true
isValidLangCode('EN');       // false
isValidLangCode('en-us');    // false
isValidLangCode('english');  // false
isValidLangCode('en_US');    // false
```

## Rule Description

This rule ensures the `lang` attribute on the `<html>` element uses a valid language code according to BCP 47 (ISO 639-1 or language-region format).

### What This Rule Checks

- Language code follows ISO 639-1 format
- Language code is lowercase (primary subtag)
- Region code is uppercase (if present)
- Uses hyphen separator (not underscore)
- Code exists in valid language registry

### Invalid Patterns

```
Invalid codes:
- Full language names: "english", "spanish"
- Wrong case: "EN", "en-us"
- Wrong separator: "en_US"
- Region only: "US", "GB"
- Made-up codes: "eng", "esp"
```

## Common Mistakes

### 1. Full Language Name
```html
<!-- FAIL -->
<html lang="english">
<html lang="Spanish">

<!-- PASS -->
<html lang="en">
<html lang="es">
```

### 2. Wrong Case
```html
<!-- FAIL -->
<html lang="EN">
<html lang="en-us">
<html lang="EN-US">

<!-- PASS -->
<html lang="en">
<html lang="en-US">
```

### 3. Underscore Instead of Hyphen
```html
<!-- FAIL -->
<html lang="en_US">
<html lang="zh_CN">

<!-- PASS -->
<html lang="en-US">
<html lang="zh-CN">
```

### 4. Region Code Only
```html
<!-- FAIL -->
<html lang="US">
<html lang="GB">

<!-- PASS -->
<html lang="en-US">
<html lang="en-GB">
```

### 5. Three-Letter Codes
```html
<!-- FAIL - Use 2-letter codes -->
<html lang="eng">
<html lang="spa">

<!-- PASS -->
<html lang="en">
<html lang="es">
```

## Testing

### Manual Testing
1. View page source
2. Find `<html>` tag
3. Check `lang` attribute value
4. Verify format matches: lowercase letters, optional `-UPPERCASE`
5. Confirm code is valid ISO 639-1

### Screen Reader Testing
```
NVDA/JAWS: 
Expected: Correct pronunciation for page language

Invalid lang codes result in:
- Default language pronunciation (usually English)
- Mispronounced words
- Incorrect voice/sounds
```

### Automated Testing
```javascript
// Check html lang validity
const html = document.documentElement;
const lang = html.getAttribute('lang');

// Valid language code pattern
const validPattern = /^[a-z]{2,3}(-[A-Z]{2})?$/;

if (!lang) {
  console.error('html element missing lang attribute');
} else if (!validPattern.test(lang)) {
  console.error(`Invalid lang code format: "${lang}"`);
}

// List of valid ISO 639-1 codes (partial)
const validCodes = new Set([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru',
  'ja', 'zh', 'ko', 'ar', 'hi', 'tr', 'sv', 'no', 'da',
  'fi', 'cs', 'el', 'he', 'th', 'id', 'vi', 'ro', 'hu'
]);

const primaryLang = lang.split('-')[0];
if (!validCodes.has(primaryLang)) {
  console.warn(`Language code "${primaryLang}" may be invalid`);
}

// Using axe-core
const results = await axe.run();
const violations = results.violations.filter(
  v => v.id === 'html-lang-valid'
);
```

## Resources

- [WCAG 3.1.1 Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)
- [BCP 47: Tags for Identifying Languages](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [MDN: lang attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang)
- [IANA Language Subtag Registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)

## Related Rules

- `html-has-lang` - html element must have lang attribute
- `valid-lang` - lang attribute must have valid value
