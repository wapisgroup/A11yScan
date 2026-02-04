import Link from 'next/link';
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { HiBookOpen, HiShieldCheck, HiSparkles } from "react-icons/hi2";
import { URL_AUTH_REGISTER } from "../services/urlServices";
import { AccessibilityRulesService } from '@accessibility-checker/rules';
import path from 'path';

// Create instance with explicit path to avoid Next.js __dirname transformation
const rulesService = new AccessibilityRulesService(
  path.join(process.cwd(), '../accessibility-rules/rules')
);


interface RuleSummary {
  ruleId: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  wcag: string;
  description: string;
}

function groupRulesByCategory(rules: RuleSummary[]) {
  const categories: Record<string, RuleSummary[]> = {
    'ARIA': [],
    'Forms & Inputs': [],
    'Images & Media': [],
    'Document Structure': [],
    'Lists & Landmarks': [],
    'Navigation & Interaction': [],
  };
  
  rules.forEach(rule => {
    const id = rule.ruleId;
    if (id.startsWith('aria-')) {
      categories['ARIA'].push(rule);
    } else if (['label', 'input-button-name', 'button-name', 'autocomplete-valid', 'input-image-alt'].includes(id)) {
      categories['Forms & Inputs'].push(rule);
    } else if (['image-alt', 'video-caption', 'audio-caption', 'area-alt', 'object-alt', 'frame-title'].includes(id)) {
      categories['Images & Media'].push(rule);
    } else if (['document-title', 'html-has-lang', 'html-lang-valid', 'page-has-heading-one', 'heading-order', 'empty-heading', 'duplicate-id'].includes(id)) {
      categories['Document Structure'].push(rule);
    } else if (['list', 'listitem', 'landmark-one-main', 'definition-list', 'dlitem', 'region'].includes(id)) {
      categories['Lists & Landmarks'].push(rule);
    } else {
      categories['Navigation & Interaction'].push(rule);
    }
  });
  
  return categories;
}

function getSeverityBadgeClass(severity: string) {
  const classes = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    Serious: 'bg-orange-100 text-orange-800 border-orange-300',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Minor: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-800 border-gray-300';
}

export default async function AccessibilityRulesPage() {
  const rules = await rulesService.getAllRules();

  const categorizedRules = groupRulesByCategory(rules);
  
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-semibold mb-8">
              <HiBookOpen className="w-4 h-4" />
              {rules.length} Accessibility Rules
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Complete <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Accessibility Rules</span> Reference
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              Comprehensive guide to web accessibility rules. Learn about WCAG compliance,
              discover practical solutions, and implement accessible web experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={URL_AUTH_REGISTER} 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Testing Your Site
              </Link>
            </div>
          </div>
        </div>
      </section>
        
      {/* Stats Dashboard */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">{rules.length}</div>
                <div className="text-sm text-slate-600 font-medium">Total Rules</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {rules.filter(r => r.severity === 'Critical').length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Critical</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {rules.filter(r => r.severity === 'Serious').length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Serious</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {rules.filter(r => r.severity === 'Moderate').length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Moderate</div>
              </div>
            </div>
          </div>
        </div>
      </section>
        
      {/* Rules by Category */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-16">{Object.entries(categorizedRules).map(([category, categoryRules]) => {
              if (categoryRules.length === 0) return null;
              
              return (
              <section key={category} className="scroll-mt-20" id={category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-')}>
                <div className="flex items-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900">
                    {category}
                  </h2>
                  <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {categoryRules.length} {categoryRules.length === 1 ? 'rule' : 'rules'}
                  </span>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryRules.map((rule) => (
                    <Link
                      key={rule.ruleId}
                      href={`/accessibility-rules/${rule.ruleId}`}
                      className="block bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-indigo-400 transition-all duration-200 group"
                    >
                      {/* Header with Severity and Arrow */}
                      <div className="flex items-start justify-between mb-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${getSeverityBadgeClass(rule.severity)}`}>
                          {rule.severity}
                        </span>
                        <svg 
                          className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                        {rule.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                        {rule.description}
                      </p>
                      
                      {/* WCAG Reference */}
                      <div className="flex items-center text-xs text-slate-500 font-mono">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {rule.wcag.split('(')[0].trim()}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          </div>
          </div>
        </div>
      </section>
        
      {/* Footer CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <HiShieldCheck className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need Help with Accessibility?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-indigo-100">
              Our automated accessibility checker can scan your website and identify issues based on these rules.
            </p>
            <Link
              href={URL_AUTH_REGISTER}
              className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>
      
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
