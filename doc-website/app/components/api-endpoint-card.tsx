'use client';

import { useState } from 'react';
import type { ApiEndpoint } from '../lib/docs';

const METHOD_STYLE: Record<string, string> = {
  GET:    'bg-emerald-500 text-white',
  POST:   'bg-blue-500 text-white',
  PATCH:  'bg-amber-500 text-white',
  DELETE: 'bg-rose-500 text-white',
};

const METHOD_BORDER: Record<string, string> = {
  GET:    'border-l-emerald-400',
  POST:   'border-l-blue-400',
  PATCH:  'border-l-amber-400',
  DELETE: 'border-l-rose-400',
};

type TabKey = 'curl' | 'javascript' | 'python';
const TAB_LABELS: Record<TabKey, string> = { curl: 'cURL', javascript: 'JavaScript', python: 'Python' };

function statusColor(code: string) {
  if (code.startsWith('2')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100';
  if (code.startsWith('4')) return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100';
}

export function ApiEndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const tabs = (['curl', 'javascript', 'python'] as TabKey[]).filter(
    (t) => endpoint.codeExamples?.[t]
  );
  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0] ?? 'curl');

  return (
    <article
      id={endpoint.id}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden border-l-4 ${METHOD_BORDER[endpoint.method] ?? ''}`}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-widest ${METHOD_STYLE[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1 flex-1 min-w-0 truncate">
          {endpoint.path}
        </code>
        {endpoint.auth && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Authenticated
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* ── Description ── */}
        <p className="text-slate-700 leading-relaxed">{endpoint.description}</p>

        {/* ── Query Parameters table ── */}
        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Query Parameters</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5 border-b border-slate-200">Name</th>
                    <th className="px-4 py-2.5 border-b border-slate-200">Type</th>
                    <th className="px-4 py-2.5 border-b border-slate-200">Required</th>
                    <th className="px-4 py-2.5 border-b border-slate-200">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {endpoint.queryParams.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-700 font-semibold">{p.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.type}</td>
                      <td className="px-4 py-2.5">
                        {p.required
                          ? <span className="inline-flex rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs text-rose-600 font-medium">required</span>
                          : <span className="inline-flex rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-400">optional</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tabbed code examples ── */}
        {tabs.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-slate-700 shadow-sm">
            <div className="flex bg-slate-800 border-b border-slate-700">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-medium transition-colors focus:outline-none ${
                    activeTab === tab
                      ? 'bg-slate-700 text-white border-b-2 border-indigo-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
            <pre className="bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto leading-relaxed">
              <code>{endpoint.codeExamples![activeTab]}</code>
            </pre>
          </div>
        )}

        {/* ── Request body ── */}
        {endpoint.requestBody && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Request Body</h4>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 text-emerald-300 text-xs p-4 leading-relaxed">
              <code>{endpoint.requestBody}</code>
            </pre>
          </div>
        )}

        {/* ── Response ── */}
        {endpoint.responseBody && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Response</h4>
            <pre className="overflow-x-auto rounded-xl bg-[#0d1117] text-slate-100 text-xs p-4 leading-relaxed">
              <code>{endpoint.responseBody}</code>
            </pre>
          </div>
        )}

        {/* ── Status codes ── */}
        {endpoint.statusCodes && endpoint.statusCodes.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Status Codes</h4>
            <div className="flex flex-wrap gap-2">
              {endpoint.statusCodes.map((code) => (
                <span key={code} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusColor(code)}`}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {endpoint.notes && endpoint.notes.length > 0 && (
          <ul className="space-y-1.5 text-sm text-slate-600 border-t border-slate-100 pt-4">
            {endpoint.notes.map((note) => (
              <li key={note} className="flex gap-2 items-start">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
