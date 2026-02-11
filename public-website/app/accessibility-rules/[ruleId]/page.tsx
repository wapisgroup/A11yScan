import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { HiArrowLeft, HiInformationCircle, HiCheckCircle, HiExclamationTriangle, HiClipboardDocumentList, HiShieldCheck } from "react-icons/hi2";
import { URL_AUTH_REGISTER } from "../../services/urlServices";
import { buildPageMetadata } from "../../libs/metadata";
import path from 'path';
import { AccessibilityRulesService } from '@wapisgroup/accessibility-rules';

const rulesDirectory = path.join(
  process.cwd(),
  'node_modules/@wapisgroup/accessibility-rules/rules'
);

// Create instance with explicit path to avoid Next.js __dirname transformation
const rulesService = new AccessibilityRulesService(rulesDirectory);

export async function generateMetadata({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;
  const rule = await rulesService.getRule(ruleId);

  if (!rule) {
    return buildPageMetadata({
      title: "Rule Not Found",
      description: "The requested accessibility rule could not be found.",
      path: `/accessibility-rules/${ruleId}`
    });
  }

  return buildPageMetadata({
    title: rule.title,
    description: rule.description,
    path: `/accessibility-rules/${ruleId}`,
    type: "article"
  });
}


interface Rule {
  ruleId: string;
  title: string;
  severity: string;
  wcag: string;
  description: string;
  whyItMatters: string;
  howToFix: string;
  ruleDescription: string;
  commonMistakes?: string;
  testing?: string;
  resources: Array<{ title: string; url: string }>;
  relatedRules: Array<{ ruleId: string; description: string }>;
}

function getSeverityColor(severity: string) {
  const colors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    Serious: 'bg-orange-100 text-orange-800 border-orange-300',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Minor: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
}

export default async function RuleDetailPage({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;

  try {
    const rule = await rulesService.getRule(ruleId);

    if (!rule) {
      notFound();
    }

    return (
      <LoggedOutLayout>
        <LoggedOutHeader />

        {/* Breadcrumb & Back Navigation */}
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <Link href="/" className="hover:text-indigo-600">Home</Link>
                <span>/</span>
                <Link href="/accessibility-rules" className="hover:text-indigo-600">Accessibility Rules</Link>
                <span>/</span>
                <span className="text-slate-900 font-medium">{rule.title}</span>
              </nav>

              <Link
                href="/accessibility-rules"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <HiArrowLeft className="w-5 h-5" />
                Back to All Rules
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getSeverityColor(rule.severity)}`}>
                  {rule.severity}
                </span>
                <span className="text-sm text-slate-500 font-mono">
                  {rule.wcag}
                </span>
                <span className="text-sm text-slate-500 font-mono">
                  Rule ID: {rule.ruleId}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {rule.title}
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed">
                {rule.description}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-16 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-8">

              {/* Rule Description */}
              {rule.ruleDescription && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center">
                    <HiClipboardDocumentList className="w-8 h-8 mr-3 text-purple-600" />
                    Rule Description
                  </h2>
                  <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-pre:p-0 prose-pre:bg-transparent">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {rule.ruleDescription}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Why It Matters */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center">
                  <HiInformationCircle className="w-8 h-8 mr-3 text-blue-600" />
                  Why It Matters
                </h2>
                <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {rule.whyItMatters}
                  </ReactMarkdown>
                </div>
              </div>

              {/* How to Fix */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center">
                  <HiCheckCircle className="w-8 h-8 mr-3 text-green-600" />
                  How to Fix
                </h2>
                <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {rule.howToFix}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Common Mistakes */}
              {rule.commonMistakes && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center">
                    <HiExclamationTriangle className="w-8 h-8 mr-3 text-red-600" />
                    Common Mistakes
                  </h2>
                  <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-pre:p-0 prose-pre:bg-transparent">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {rule.commonMistakes}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Testing */}
              {rule.testing && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center">
                    <HiClipboardDocumentList className="w-8 h-8 mr-3 text-purple-600" />
                    Testing
                  </h2>
                  <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-pre:p-0 prose-pre:bg-transparent">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {rule.testing}
                    </ReactMarkdown>
                  </div>
                </div>
              )}



              {/* Resources */}
              {rule.resources && rule.resources.length > 0 && (
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">External Resources</h2>
                  <ul className="space-y-3">
                    {rule.resources.map((resource, index) => (
                      <li key={index}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-indigo-700 hover:text-indigo-900 hover:underline font-medium group"
                        >
                          <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Rules */}
              {rule.relatedRules && rule.relatedRules.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Rules</h2>
                  <div className="grid gap-4 md:grid-cols-2">{rule.relatedRules.map((related) => (
                    <Link
                      key={related.ruleId}
                      href={`/accessibility-rules/${related.ruleId}`}
                      className="block p-6 bg-white rounded-xl border-2 border-slate-200 hover:shadow-lg hover:border-indigo-400 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <code className="text-sm text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-1 rounded">
                            {related.ruleId}
                          </code>
                          <p className="text-sm text-slate-700 mt-3 group-hover:text-slate-900">
                            {related.description}
                          </p>
                        </div>
                        <svg
                          className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center text-white">
              <HiShieldCheck className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Automate Your Accessibility Testing
              </h2>
              <p className="text-lg md:text-xl mb-8 text-indigo-100">
                Our tool automatically checks for this rule and hundreds of other accessibility issues.
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
