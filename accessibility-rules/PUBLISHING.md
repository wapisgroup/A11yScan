# Publishing @accessibility-checker/rules

## Setup (One-time)

### 1. Authenticate with GitHub Packages

Create a Personal Access Token (PAT) with `write:packages` and `read:packages` permissions:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `write:packages` scope
3. Save the token securely

Add to your `~/.npmrc`:
```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
@accessibility-checker:registry=https://npm.pkg.github.com
```

Or login via npm:
```bash
npm login --scope=@accessibility-checker --registry=https://npm.pkg.github.com
```

### 2. Update package.json repository URL
Make sure the repository URL in package.json matches your actual GitHub repo.

## Publishing a New Version

### 1. Make your changes
Edit rules, update service, etc.

### 2. Update version
```bash
# Patch version (1.0.0 → 1.0.1) - for bug fixes
npm version patch

# Minor version (1.0.0 → 1.1.0) - for new features
npm version minor

# Major version (1.0.0 → 2.0.0) - for breaking changes
npm version major
```

### 3. Publish
```bash
npm publish
```

This will:
- Run tests automatically (`prepublishOnly` script)
- Publish to GitHub Packages

## Using the Package

### In worker app
```bash
cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full/worker
npm install @accessibility-checker/rules@latest
```

### In dashboard app
```bash
cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full/dashboard-app
npm install @accessibility-checker/rules@latest
```

### In public-website
```bash
cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full/public-website
npm install @accessibility-checker/rules@latest
```

## Usage in Code

### CommonJS (Node.js, worker)
```javascript
const rulesService = require('@accessibility-checker/rules');

// Get all rules
const allRules = await rulesService.getAllRules();

// Get specific rule
const rule = await rulesService.getRule('link-name');
```

### ES Modules / TypeScript
```typescript
import rulesService from '@accessibility-checker/rules';
import type { AccessibilityRule, RuleSummary } from '@accessibility-checker/rules';

const rules: AccessibilityRule[] = await rulesService.getAllRules();
const rule: AccessibilityRule = await rulesService.getRule('video-caption');
```

### Next.js Server Components
```tsx
const rulesService = require('@accessibility-checker/rules');

export default async function Page() {
  const rules = await rulesService.getAllRules();
  return <div>{/* render rules */}</div>;
}
```

## Updating Apps After Publishing

When you publish a new version:

```bash
# Update all apps at once
cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full

# Worker
(cd worker && npm update @accessibility-checker/rules)

# Dashboard
(cd dashboard-app && npm update @accessibility-checker/rules)

# Public website
(cd public-website && npm update @accessibility-checker/rules)
```

## Local Development (Alternative to Publishing)

For local testing before publishing:

```bash
cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full/accessibility-rules
npm link

cd ../worker
npm link @accessibility-checker/rules

cd ../dashboard-app
npm link @accessibility-checker/rules

cd ../public-website
npm link @accessibility-checker/rules
```

To unlink:
```bash
npm unlink @accessibility-checker/rules
npm install @accessibility-checker/rules@latest
```

## Version Strategy

Follow semantic versioning:
- **Patch (1.0.x)**: Bug fixes, typo corrections in existing rules
- **Minor (1.x.0)**: New rules added, new methods in service
- **Major (x.0.0)**: Breaking changes to API, removed methods, changed data structure

## Quick Reference

```bash
# Publish new version
npm version patch && npm publish

# Update all apps
for dir in worker dashboard-app public-website; do
  (cd "$dir" && npm update @accessibility-checker/rules)
done

# Check current version across apps
grep -A1 "@accessibility-checker/rules" */package.json
```
