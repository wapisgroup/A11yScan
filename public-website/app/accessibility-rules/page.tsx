import Link from 'next/link';
import path from 'path';
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { HiBookOpen, HiShieldCheck, HiSparkles } from "react-icons/hi2";
import { URL_AUTH_REGISTER } from "../services/urlServices";
import { notFound } from 'next/navigation';
import { buildPageMetadata } from "../libs/metadata";
import { AccessibilityRulesService } from '@wapisgroup/accessibility-rules';
import standardsMatrixData from "../data/standards-matrix.json";

const rulesDirectory = path.join(
  process.cwd(),
  'node_modules/@wapisgroup/accessibility-rules/rules'
);

// Create instance with explicit path to avoid Next.js __dirname transformation
const rulesService = new AccessibilityRulesService(rulesDirectory);

export const metadata = buildPageMetadata({
  title: "Accessibility Rules Reference",
  description:
    "Browse the full accessibility rules library with WCAG mappings and engine coverage.",
  path: "/accessibility-rules"
});


interface RuleSummary {
  ruleId: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  wcag: string;
  description: string;
}

type StandardsMatrix = {
  standard: string;
  version: string;
  source?: string;
  notes?: Record<string, string>;
  successCriteria: Array<{
    id: string;
    title: string;
    level: 'A' | 'AA' | 'AAA' | null;
    status: string;
    testability: 'Automated' | 'Partial' | 'Manual' | string;
    mapping?: Record<string, any>;
  }>;
};

type EngineLabel = 'Axe-core' | 'Ablelytics-core' | 'Ablelytics-AI' | 'Manual';

function expandRange(start: string, end: string) {
  const startParts = start.split('.').map(Number);
  const endParts = end.split('.').map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return [start, end];
  if (startParts[0] !== endParts[0] || startParts[1] !== endParts[1]) return [start, end];

  const result: string[] = [];
  for (let i = startParts[2]; i <= endParts[2]; i += 1) {
    result.push(`${startParts[0]}.${startParts[1]}.${i}`);
  }
  return result;
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

  try {
    const rules = await rulesService.getAllRules();
    const standardsMatrix = standardsMatrixData as unknown as StandardsMatrix;
    const criteria = standardsMatrix.successCriteria.filter((item) => item.status === 'active');

    const ablelyticsCoreScs = new Set([
      '2.1.1',
      '2.1.2',
      '2.1.3',
      '2.2.2',
      '2.2.7',
      '2.4.1',
      '2.4.3',
      '2.4.7',
      '2.4.11',
      '2.4.12',
      '2.5.1',
      '2.5.2',
      '2.5.4',
      '2.5.6',
      '2.5.7',
      '3.2.3',
      '3.2.4',
      '3.2.6',
      '1.4.2'
    ]);

    const ablelyticsAiScs = new Set([
      ...expandRange('1.2.1', '1.2.9'),
      '1.3.3',
      '1.4.7',
      '1.4.8',
      '2.4.5',
      '2.4.8',
      '3.1.3',
      '3.1.4',
      '3.1.5',
      '3.1.6',
      '3.2.5',
      '3.3.4',
      '3.3.5',
      '3.3.6',
      '3.3.7',
      '3.3.8',
      '3.3.9'
    ]);

    const manualOnlyScs = new Set([
      '1.2.4',
      '1.2.9',
      '2.2.3',
      '2.2.4',
      '2.2.5',
      '2.2.6'
    ]);

    const getEngineLabel = (scId: string): EngineLabel => {
      if (manualOnlyScs.has(scId)) return 'Manual';
      if (ablelyticsAiScs.has(scId)) return 'Ablelytics-AI';
      if (ablelyticsCoreScs.has(scId)) return 'Ablelytics-core';
      return 'Axe-core';
    };

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

        {/* Engine Coverage Table */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Engine coverage by WCAG criterion</h2>
                  <p className="text-slate-600 mt-2">
                    Each success criterion is tagged to a primary engine: Axe-core, Ablelytics-core, Ablelytics-AI,
                    or Manual review. Manual-only items require human validation.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="p-3">SC</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Engine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.slice(0, 12).map((item) => {
                        const engine = getEngineLabel(item.id);

                        return (
                          <tr key={item.id} className="border-t border-slate-200">
                            <td className="p-3 font-mono text-slate-700">{item.id}</td>
                            <td className="p-3 text-slate-700">{item.title}</td>
                            <td className="p-3 text-slate-700">{item.level || '-'}</td>
                            <td className="p-3 text-slate-700">{engine}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-semibold text-indigo-600">
                    Show all criteria
                  </summary>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="p-3">SC</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Level</th>
                          <th className="p-3">Engine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {criteria.slice(12).map((item) => {
                          const engine = getEngineLabel(item.id);

                          return (
                            <tr key={item.id} className="border-t border-slate-200">
                              <td className="p-3 font-mono text-slate-700">{item.id}</td>
                              <td className="p-3 text-slate-700">{item.title}</td>
                              <td className="p-3 text-slate-700">{item.level || '-'}</td>
                              <td className="p-3 text-slate-700">{engine}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
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
  } catch (error) {
    console.error('Error fetching rule:', error);
    notFound();
  }
}
