#!/bin/bash
# Quick setup script to link @accessibility-checker/rules across all apps

set -e

ROOT_DIR="/Users/macbookpro/git/accessibility-checker/react_firebase_app_full"

echo "🔗 Setting up @accessibility-checker/rules package..."
echo ""

# Step 1: Create the package link
echo "1️⃣  Creating package link..."
cd "$ROOT_DIR/accessibility-rules"
npm link

# Step 2: Link to all apps
echo ""
echo "2️⃣  Linking to apps..."

echo "   📦 Linking to public-website..."
cd "$ROOT_DIR/public-website"
npm link @accessibility-checker/rules

echo "   📦 Linking to worker..."
cd "$ROOT_DIR/worker"
npm link @accessibility-checker/rules 2>/dev/null || echo "   ⚠️  Worker: package.json may need to be created"

echo "   📦 Linking to dashboard-app..."
cd "$ROOT_DIR/dashboard-app"
npm link @accessibility-checker/rules 2>/dev/null || echo "   ⚠️  Dashboard: package.json may need updating"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Usage in code:"
echo "   import rulesService from '@accessibility-checker/rules';"
echo "   const rules = await rulesService.getAllRules();"
echo ""
echo "🔄 To update all apps after publishing a new version:"
echo "   Run: npm update @accessibility-checker/rules"
echo "   in each app directory"
