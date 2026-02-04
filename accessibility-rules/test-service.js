/**
 * Test script for the Accessibility Rules Service
 * Run with: node test-service.js
 */

const rulesService = require('./rules-service');

async function testRulesService() {
  console.log('🧪 Testing Accessibility Rules Service\n');
  
  try {
    // Test 1: Get a single rule
    console.log('Test 1: Get single rule...');
    const linkRule = await rulesService.getRule('tabindex');
    console.log(`✅ Retrieved rule: ${linkRule.title}`);
    console.log(`   Severity: ${linkRule.severity}`);
    console.log(`   WCAG: ${linkRule.wcag}\n`);
    
    // Test 2: Get all rules
    console.log('Test 2: Get all rules...');
    const allRules = await rulesService.getAllRules();
    console.log(`✅ Found ${allRules.length} rules:`);
    allRules.forEach(rule => {
      console.log(`   - ${rule.ruleId}: ${rule.title}`);
    });
    console.log('');
    
    // Test 3: Get rules by severity
    console.log('Test 3: Get rules by severity...');
    const criticalRules = await rulesService.getRulesBySeverity('critical');
    console.log(`✅ Found ${criticalRules.length} critical rules\n`);
    
    // Test 4: Search rules
    console.log('Test 4: Search for "link" rules...');
    const linkRules = await rulesService.searchRules('link');
    console.log(`✅ Found ${linkRules.length} matching rules\n`);
    
    // Test 5: Get rule summary
    console.log('Test 5: Get rule summary...');
    const summary = await rulesService.getRuleSummary('image-alt');
    console.log(`✅ Summary:`);
    console.log(`   Title: ${summary.title}`);
    console.log(`   Severity: ${summary.severity}\n`);
    
    // Test 6: Get HTML output
    console.log('Test 6: Generate HTML...');
    const html = await rulesService.getRuleAsHTML('link-name');
    console.log(`✅ Generated ${html.length} characters of HTML\n`);
    
    // Test 7: Display rule structure
    console.log('Test 7: Rule structure for "color-contrast":');
    const contrastRule = await rulesService.getRule('color-contrast');
    console.log(`   Title: ${contrastRule.title}`);
    console.log(`   Description length: ${contrastRule.description.length} chars`);
    console.log(`   How to fix length: ${contrastRule.howToFix.length} chars`);
    console.log(`   Resources: ${contrastRule.resources.length} links`);
    console.log(`   Related rules: ${contrastRule.relatedRules.length}\n`);
    
    console.log('✅ All tests passed!\n');
    
    // Display example usage
    console.log('📖 Example Usage:\n');
    console.log('const rulesService = require(\'./rules-service\');\n');
    console.log('// Get a rule');
    console.log('const rule = await rulesService.getRule(\'link-name\');');
    console.log('console.log(rule.title);');
    console.log('console.log(rule.howToFix);\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testRulesService();
