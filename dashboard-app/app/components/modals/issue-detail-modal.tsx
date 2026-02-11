"use client";

/**
 * IssueDetailModal
 * ---------------
 * A comprehensive modal that displays accessibility issue details in 3 tabs:
 * 1. Code & Brief - Shows the affected code and brief description
 * 2. Full Rule - Complete rule explanation from accessibility-rules
 * 3. How to Fix - AI-powered or rule-based fix suggestions
 */

import React, { useEffect, useState } from 'react';
import { PiX, PiCode, PiFileText, PiLightbulb, PiWarning, PiInfo, PiCheckCircle, PiArrowLeft } from 'react-icons/pi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { RuleData } from '@/actions/getRuleData';


export type IssueData = {
  ruleId?: string | null;
  impact?: string;
  message?: string;
  description?: string | null;
  helpUrl?: string | null;
  html?: string | null;
  selector?: string | null;
  target?: string[] | string | null;
  failureSummary?: string | null;
  tags?: string[];
  engine?: string | null;
  confidence?: number | null;
  needsReview?: boolean | null;
  evidence?: string[] | null;
  aiHowToFix?: string | null;
  allOccurrences?: IssueData[]; // For swiper functionality
};

type IssueDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueData | null;
};

export default function IssueDetailModal({ isOpen, onClose, issue }: IssueDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'rule' | 'fix'>('code');
  const [ruleData, setRuleData] = useState<RuleData | null>(null);
  const [loadingRule, setLoadingRule] = useState(false);
  const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState(0);
  const [aiFixLoading, setAiFixLoading] = useState(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);
  const [aiFixSuggestion, setAiFixSuggestion] = useState<string | null>(null);

  // Get all occurrences or just the single issue
  const allOccurrences = issue?.allOccurrences || (issue ? [issue] : []);
  const hasMultipleOccurrences = allOccurrences.length > 1;
  const currentIssue = allOccurrences[currentOccurrenceIndex] || issue;

  // Navigation handlers for occurrence swiper
  const handlePrevOccurrence = () => {
    setCurrentOccurrenceIndex((prev) => (prev - 1 + allOccurrences.length) % allOccurrences.length);
  };

  const handleNextOccurrence = () => {
    setCurrentOccurrenceIndex((prev) => (prev + 1) % allOccurrences.length);
  };

  // Fetch rule data when modal opens
  useEffect(() => {
    if (!isOpen || !issue?.ruleId) {
      setRuleData(null);
      return;
    }

    let cancelled = false;

    const fetchRule = async () => {
      try {
        setLoadingRule(true);
        const res = await fetch(`/api/accessibility-rules/${encodeURIComponent(issue.ruleId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch rule (${res.status})`);
        }
        const data = (await res.json()) as RuleData | null;
        if (!cancelled) {
          setRuleData(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load rule data:', err);
          setRuleData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRule(false);
        }
      }
    };

    void fetchRule();

    return () => {
      cancelled = true;
    };
  }, [isOpen, issue?.ruleId]);

  // Reset to first tab and first occurrence when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('code');
      setCurrentOccurrenceIndex(0);
      setAiFixError(null);
      setAiFixSuggestion(null);
      setAiFixLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const selectorText = currentIssue?.target
    ? Array.isArray(currentIssue.target)
      ? currentIssue.target.join(' | ')
      : String(currentIssue.target)
    : currentIssue?.selector || '';

  const engineLabel = currentIssue?.engine || issue.engine || null;
  const confidenceValue = typeof currentIssue?.confidence === 'number'
    ? currentIssue.confidence
    : typeof issue.confidence === 'number'
      ? issue.confidence
      : null;
  const needsReview = Boolean(currentIssue?.needsReview ?? issue.needsReview);

  const requestAiFix = async () => {
    if (!currentIssue) return;
    try {
      setAiFixLoading(true);
      setAiFixError(null);
      const res = await fetch('/api/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: {
            message: currentIssue.message,
            ruleId: currentIssue.ruleId,
            engine: currentIssue.engine,
            selector: currentIssue.selector,
            html: currentIssue.html,
            tags: currentIssue.tags,
            evidence: currentIssue.evidence
          }
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setAiFixSuggestion(data?.howToFix || '');
    } catch (err) {
      setAiFixError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiFixLoading(false);
    }
  };

  const publicWebsiteDomain = process.env.NEXT_PUBLIC_PUBLIC_WEBSITE_DOMAIN || '';
  const trimmedPublicDomain = publicWebsiteDomain.replace(/\/$/, '');
  const ruleDetailsUrl = issue.ruleId && trimmedPublicDomain
    ? `${trimmedPublicDomain}/accessibility-rules/${issue.ruleId}`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-[var(--color-border-light)] flex flex-col pointer-events-auto"
          style={{ backgroundColor: '#ffffff' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-start justify-between gap-4 p-6 border-b border-[var(--color-border-light)]"
          >
            <div className="flex-1">
              <h2 className="as-h4-text primary-text-color mb-2">
                {issue.message || issue.description || 'Accessibility Issue'}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {getSeverityBadge(issue.impact)}
                {issue.ruleId && (
                  <code className="px-2 py-1 rounded bg-[var(--color-bg-light)] as-p3-text secondary-text-color font-mono">
                    {issue.ruleId}
                  </code>
                )}
                {engineLabel && (
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 as-p3-text">
                    Engine: {engineLabel}
                  </span>
                )}
                {needsReview && (
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 as-p3-text">
                    Needs review
                  </span>
                )}
                {confidenceValue !== null && (
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 as-p3-text">
                    Confidence: {Math.round(confidenceValue * 100)}%
                  </span>
                )}
                {ruleDetailsUrl && (
                  <a
                    href={ruleDetailsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-brand/10 text-brand as-p3-text hover:bg-brand/20 transition-colors"
                  >
                    View rule
                  </a>
                )}
                {issue.tags && issue.tags.length > 0 && (
                  <div className="flex gap-1">
                    {issue.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-brand/10 text-brand as-p3-text text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-light)] rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <PiX size={24} className="secondary-text-color" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-[var(--color-border-light)]">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all ${
              activeTab === 'code'
                ? 'bg-[var(--color-bg)] border-t border-l border-r border-[var(--color-border-light)] -mb-px primary-text-color font-medium'
                : 'bg-transparent secondary-text-color hover:bg-[var(--color-bg-light)]'
            }`}
          >
            <PiCode size={18} />
            <span className="as-p2-text">Code & Brief</span>
          </button>
          <button
            onClick={() => setActiveTab('rule')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all ${
              activeTab === 'rule'
                ? 'bg-[var(--color-bg)] border-t border-l border-r border-[var(--color-border-light)] -mb-px primary-text-color font-medium'
                : 'bg-transparent secondary-text-color hover:bg-[var(--color-bg-light)]'
            }`}
          >
            <PiFileText size={18} />
            <span className="as-p2-text">Full Rule</span>
          </button>
          <button
            onClick={() => setActiveTab('fix')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all ${
              activeTab === 'fix'
                ? 'bg-[var(--color-bg)] border-t border-l border-r border-[var(--color-border-light)] -mb-px primary-text-color font-medium'
                : 'bg-transparent secondary-text-color hover:bg-[var(--color-bg-light)]'
            }`}
          >
            <PiLightbulb size={18} />
            <span className="as-p2-text">How to Fix</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 1: Code & Brief */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              {/* Brief Description */}
              {ruleData?.description && (
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <h3 className="as-p1-text primary-text-color font-medium mb-2 flex items-center gap-2">
                    <PiInfo size={18} className="text-brand" />
                    What's Wrong
                  </h3>
                  <p className="as-p2-text secondary-text-color">
                    {ruleData.description}
                  </p>
                </div>
              )}

              {/* Failure Summary - Shared across all occurrences */}
              {issue.failureSummary && (
                <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-lg">
                  <h3 className="as-p1-text primary-text-color font-medium mb-2 flex items-center gap-2">
                    <PiWarning size={18} className="text-[var(--color-warning)]" />
                    Specific Failure
                  </h3>
                  <p className="as-p2-text secondary-text-color whitespace-pre-wrap">
                    {issue.failureSummary}
                  </p>
                </div>
              )}

              {/* CSS Selector - Specific to each occurrence */}
              {selectorText && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="as-p1-text primary-text-color font-medium">
                      CSS Selector:
                    </h3>
                    {hasMultipleOccurrences && (
                      <div className="flex items-center gap-2 as-p3-text secondary-text-color">
                        <button
                          onClick={handlePrevOccurrence}
                          className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm"
                          title="Previous occurrence"
                        >
                          <PiArrowLeft size={18} className="text-brand" />
                        </button>
                        <span className="text-sm font-medium px-1">
                          {currentOccurrenceIndex + 1} of {allOccurrences.length}
                        </span>
                        <button
                          onClick={handleNextOccurrence}
                          className="p-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm"
                          title="Next occurrence"
                        >
                          <PiArrowLeft size={18} className="text-brand rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                  <code className="block px-4 py-3 bg-[var(--color-bg-light)] border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color font-mono break-all">
                    {selectorText}
                  </code>
                </div>
              )}

              {currentIssue?.evidence && currentIssue.evidence.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="as-p1-text primary-text-color font-medium mb-2">AI Evidence</h3>
                  <ul className="list-disc pl-5 as-p2-text secondary-text-color">
                    {currentIssue.evidence.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HTML Code - Specific to each occurrence */}
              {currentIssue?.html && (
                <div>
                  <h3 className="as-p1-text primary-text-color font-medium mb-2">
                    HTML Code:
                  </h3>
                  <div className="rounded-lg overflow-hidden border border-[var(--color-border-light)]">
                    <SyntaxHighlighter
                      language="html"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        maxHeight: '300px',
                      }}
                    >
                      {formatHtml(currentIssue.html)}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}

              {/* Help URL */}
              {issue.helpUrl && (
                <div className="p-4 bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 rounded-lg">
                  <h3 className="as-p1-text primary-text-color font-medium mb-2">
                    External Reference
                  </h3>
                  <a
                    href={issue.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="as-p2-text text-brand hover:underline break-all"
                  >
                    {issue.helpUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Full Rule */}
          {activeTab === 'rule' && (
            <div>
              {loadingRule ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand border-t-transparent mb-3"></div>
                    <p className="as-p2-text secondary-text-color">Loading rule documentation...</p>
                  </div>
                </div>
              ) : ruleData ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {ruleData.fullMarkdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PiFileText size={48} className="mx-auto mb-3 text-[var(--color-border-light)]" />
                  <p className="as-p2-text secondary-text-color mb-2">Rule documentation not available</p>
                  {issue.helpUrl && (
                    <a
                      href={issue.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="as-p2-text text-brand hover:underline"
                    >
                      View external documentation →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: How to Fix */}
          {activeTab === 'fix' && (
            <div className="space-y-6">
              {aiFixError && (
                <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-lg">
                  <p className="as-p2-text secondary-text-color">{aiFixError}</p>
                </div>
              )}

              {currentIssue?.aiHowToFix && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <PiLightbulb size={20} className="text-violet-500 flex-shrink-0 mt-1" />
                    <div className="prose prose-sm max-w-none">
                      <h4 className="as-p1-text primary-text-color font-medium mb-2">
                        AI Fix Suggestion
                      </h4>
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {currentIssue.aiHowToFix}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {!currentIssue?.aiHowToFix && aiFixSuggestion && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <PiLightbulb size={20} className="text-violet-500 flex-shrink-0 mt-1" />
                    <div className="prose prose-sm max-w-none">
                      <h4 className="as-p1-text primary-text-color font-medium mb-2">
                        AI Fix Suggestion
                      </h4>
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {aiFixSuggestion}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {!currentIssue?.aiHowToFix && !aiFixSuggestion && (
                <div className="p-4 bg-[var(--color-bg-light)] border border-[var(--color-border-light)] rounded-lg">
                  <div className="flex items-start gap-3">
                    <PiLightbulb size={20} className="text-brand flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="as-p1-text primary-text-color font-medium mb-2">
                        Generate AI Fix Suggestion
                      </h4>
                      <p className="as-p2-text secondary-text-color mb-3">
                        Use AI to propose a tailored fix based on this issue’s code and context.
                      </p>
                      <button
                        type="button"
                        onClick={requestAiFix}
                        disabled={aiFixLoading}
                        className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-60"
                      >
                        {aiFixLoading ? 'Generating…' : 'Generate AI Fix'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ruleData?.howToFix ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {ruleData.howToFix}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PiLightbulb size={48} className="mx-auto mb-3 text-[var(--color-border-light)]" />
                  <p className="as-p2-text secondary-text-color mb-4">
                    Fix suggestions not available for this rule yet
                  </p>
                  <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg text-left max-w-md mx-auto">
                    <h4 className="as-p1-text primary-text-color font-medium mb-2">
                      General Guidance:
                    </h4>
                    <ul className="as-p2-text secondary-text-color space-y-1 list-disc list-inside">
                      <li>Review the {'"Full Rule"'} tab for detailed information</li>
                      <li>Check the element selector and HTML code in {'"Code & Brief"'}</li>
                      <li>Consult WCAG guidelines for {issue.tags?.find(t => t.startsWith('wcag'))}</li>
                      {issue.helpUrl && <li>Visit the external documentation link</li>}
                    </ul>
                  </div>
                </div>
              )}

              {!currentIssue?.aiHowToFix && (
                <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <PiLightbulb size={20} className="text-violet-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="as-p1-text primary-text-color font-medium mb-1">
                        AI-Powered Fix Suggestions (Coming Soon)
                      </h4>
                      <p className="as-p3-text secondary-text-color">
                        We're working on AI-powered fix suggestions that will analyze your specific code
                        and provide tailored recommendations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border-light)] bg-[var(--color-bg-light)] rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] transition-colors as-p2-text primary-text-color"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function getSeverityBadge(impact?: string) {
  switch (impact?.toLowerCase()) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] as-p3-text font-medium">
          <PiWarning size={14} />
          Critical
        </span>
      );
    case 'serious':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)] as-p3-text font-medium">
          <PiWarning size={14} />
          Serious
        </span>
      );
    case 'moderate':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)] as-p3-text font-medium">
          <PiInfo size={14} />
          Moderate
        </span>
      );
    case 'minor':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] as-p3-text font-medium">
          <PiCheckCircle size={14} />
          Minor
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-bg-light)] secondary-text-color as-p3-text">
          {impact || 'Unknown'}
        </span>
      );
  }
}

function formatHtml(html: string): string {
  // Basic HTML formatting - add line breaks for readability
  return html
    .replace(/></g, '>\n<')
    .replace(/(<[^>]+>)/g, (match) => {
      if (match.startsWith('</')) return match;
      return match + '\n';
    })
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n');
}
