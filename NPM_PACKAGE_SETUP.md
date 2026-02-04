# Accessibility Rules NPM Package Setup ✅

## What Was Created

I've converted the `accessibility-rules` directory into a proper NPM package that can be:
- ✅ Installed via `npm link` locally (done)
- ✅ Published to GitHub Packages (private, free)
- ✅ Version controlled with semantic versioning
- ✅ Used consistently across all apps

## Package Structure

```
accessibility-rules/
├── package.json          # NPM package configuration
├── index.d.ts           # TypeScript definitions
├── .npmignore           # Files to exclude from package
├── rules-service.js     # Main service (singleton export)
├── rules/               # 24 markdown rule files
├── PUBLISHING.md        # Complete publishing guide
└── README.md           # Documentation
```

## Current Status

### ✅ Completed
1. **Package setup**:
   - package.json configured for GitHub Packages
   - TypeScript definitions added (index.d.ts)
   - .npmignore created to exclude test files
   
2. **Local linking** (for development):
   - Package linked globally: `@accessibility-checker/rules`
   - public-website already linked ✅
   
3. **Code updated**:
   - ✅ `/public-website/app/accessibility-rules/page.tsx` - Using package
   - ✅ `/public-website/app/accessibility-rules/[ruleId]/page.tsx` - Using package

### 📋 Next Steps

1. **Test the public-website** (should work now):
   ```bash
   cd /Users/macbookpro/git/accessibility-checker/react_firebase_app_full/public-website
   npm run dev
   # Visit http://localhost:3001/accessibility-rules
   ```

2. **Link to other apps**:
   ```bash
   # Run the setup script
   ./setup-rules-package.sh
   
   # Or manually for each app:
   cd worker && npm link @accessibility-checker/rules
   cd dashboard-app && npm link @accessibility-checker/rules
   ```

3. **Update code in worker and dashboard** to use the package:
   ```javascript
   // Old way
   const rulesService = require('../accessibility-rules/rules-service');
   
   // New way
   import rulesService from '@accessibility-checker/rules';
   ```

## Usage Examples

### In Next.js (public-website) ✅ DONE
```typescript
import rulesService from '@accessibility-checker/rules';

export default async function Page() {
  const rules = await rulesService.getAllRules();
  const rule = await rulesService.getRule('video-caption');
  
  return <div>{/* render */}</div>;
}
```

### In Worker (TODO)
```javascript
import rulesService from '@accessibility-checker/rules';

const rules = await rulesService.getAllRules();
const criticalRules = await rulesService.getRulesBySeverity('Critical');
```

### In Dashboard (TODO)
```typescript
import rulesService, { type AccessibilityRule } from '@accessibility-checker/rules';

const rule: AccessibilityRule = await rulesService.getRule('link-name');
```

## Publishing Workflow

### Local Development (Current)
```bash
# After making changes to rules
cd accessibility-rules
npm link  # Updates all linked apps

# Apps automatically use latest changes
```

### Publishing to GitHub Packages (Future)
```bash
# 1. Make changes to rules
cd accessibility-rules

# 2. Update version
npm version patch  # or minor, or major

# 3. Publish
npm publish

# 4. Update apps
cd ../public-website
npm update @accessibility-checker/rules

cd ../worker  
npm update @accessibility-checker/rules

cd ../dashboard-app
npm update @accessibility-checker/rules
```

## Benefits

### ✅ Version Control
- Each update gets a version number (1.0.0 → 1.0.1)
- Can pin specific versions in apps
- Easy rollback if needed

### ✅ Single Source of Truth
- Rules defined once in `accessibility-rules/`
- All apps use the exact same version
- No code duplication

### ✅ Easy Updates
- Update rules in one place
- Publish once
- Pull updates in each app
- No manual file copying

### ✅ Type Safety
- TypeScript definitions included
- Autocomplete in IDEs
- Compile-time error checking

### ✅ Private Package
- GitHub Packages = Free for private repos
- No public exposure of business logic
- Team access control via GitHub

## Current Import Changes

### Before ❌
```typescript
// Fragile relative paths, different in each app
const rulesService = require('../../../../accessibility-rules/rules-service');
const rulesService = require('../../../accessibility-rules/rules-service');
```

### After ✅
```typescript
// Same import everywhere
import rulesService from '@accessibility-checker/rules';
```

## Files Reference

- **Setup Guide**: `/accessibility-rules/PUBLISHING.md`
- **Quick Setup Script**: `/setup-rules-package.sh`  
- **TypeScript Types**: `/accessibility-rules/index.d.ts`
- **Package Config**: `/accessibility-rules/package.json`

## What Changed in Public Website

Both accessibility rules pages now import from the NPM package:

**Before**:
```typescript
const rulesService = require('../../../../accessibility-rules/rules-service');
```

**After**:
```typescript
import rulesService from '@accessibility-checker/rules';
```

The pages are Server Components that:
1. Import the rulesService singleton
2. Call `await rulesService.getAllRules()` or `await rulesService.getRule(id)`
3. Render with the data

No more:
- ❌ API route fetching
- ❌ Client-side useEffect
- ❌ Loading states
- ❌ Relative path dependencies

## Quick Commands

```bash
# Link package to all apps
./setup-rules-package.sh

# Test in public-website
cd public-website && npm run dev

# Publish new version
cd accessibility-rules && npm version patch && npm publish

# Update all apps after publishing
for dir in worker dashboard-app public-website; do
  (cd "$dir" && npm update @accessibility-checker/rules)
done
```

---

✅ **Package is ready to use!** The public-website is already using it via npm link.
