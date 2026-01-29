"use client";

import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/organism/workspace-layout';
import { PageContainer } from '@/components/molecule/page-container';
import { PrivateRoute } from '@/utils/private-router';
import { loadProject } from '@/services/projectDetailService';

// Types
type SitemapPage = {
  url: string;
  title?: string;
};

type SitemapNode = {
  name: string;
  path: string;
  pages?: SitemapPage[];
  children?: SitemapNode[];
};

type SitemapTreeProps = {
  tree: SitemapNode;
  showRoot?: boolean;
};

/**
 * SitemapTree Component
 * ---------------------
 * Displays a hierarchical sitemap tree with search, expand/collapse, and download functionality.
 */
function SitemapTree({ tree, showRoot = true }: SitemapTreeProps) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    const [query, setQuery] = useState('');

    const toggle = useCallback((path: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const expandPathWithParents = useCallback((path: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            const parts = path.split('/').filter(Boolean);
            let cur = '';
            for (const seg of parts) {
                cur += '/' + seg;
                next.add(cur);
            }
            return next;
        });
    }, []);

    const filterTree = useCallback((node: SitemapNode, q: string): SitemapNode | null => {
        if (!q) return node;

        const ql = q.toLowerCase();
        const pagesMatch = (node.pages ?? []).some(p =>
            (p.title ?? '').toLowerCase().includes(ql) ||
            (p.url ?? '').toLowerCase().includes(ql)
        );

        const nodeMatch = (node.name ?? '').toLowerCase().includes(ql) ||
            (node.path ?? '').toLowerCase().includes(ql);

        const children: SitemapNode[] = [];
        for (const ch of node.children ?? []) {
            const c = filterTree(ch, q);
            if (c) children.push(c);
        }

        if (nodeMatch || pagesMatch || children.length > 0) {
            const filteredPages = (node.pages ?? []).filter(p =>
                (p.title ?? '').toLowerCase().includes(ql) ||
                (p.url ?? '').toLowerCase().includes(ql)
            );
            return {
                ...node,
                pages: filteredPages,
                children
            };
        }

        return null;
    }, []);

    const filtered = useMemo(() => filterTree(tree, query), [tree, query, filterTree]);

    useEffect(() => {
        if (!query || !filtered) return;
        
        function walk(node: SitemapNode) {
            if (node.path && node.path !== '/') {
                expandPathWithParents(node.path);
            }
            for (const ch of node.children ?? []) {
                walk(ch);
            }
        }
        walk(filtered);
    }, [query, filtered, expandPathWithParents]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sitemap-tree.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [tree]);

    const handleReset = useCallback(() => {
        setExpanded(new Set());
        setQuery('');
    }, []);

    if (!tree) {
        return <div className="p-3 text-slate-400">No sitemap data provided.</div>;
    }

    return (
        <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <div className="flex gap-3 mb-3 items-center justify-between">
                <input
                    aria-label="Search sitemap"
                    placeholder="Search pages or paths..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 input"
                />
                <div className="flex gap-2">
                    <button 
                        onClick={handleReset}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm"
                    >
                        Download JSON
                    </button>
                </div>
            </div>

            <div role="tree" aria-label="Sitemap tree" className="text-sm">
                {showRoot ? (
                    <TreeNode
                        node={filtered || tree}
                        level={0}
                        expanded={expanded}
                        toggle={toggle}
                    />
                ) : (
                    (filtered ? (filtered.children ?? []) : (tree.children ?? [])).map((ch) => (
                        <TreeNode key={ch.path} node={ch} level={0} expanded={expanded} toggle={toggle} />
                    ))
                )}
            </div>
        </div>
    );
}

type TreeNodeProps = {
  node: SitemapNode;
  level: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
};

const TreeNode = memo(function TreeNode({ node, level, expanded, toggle }: TreeNodeProps) {
    const isRoot = node.path === '/';
    const nodeKey = node.path || (node.name ? `/${node.name}` : '/');
    const isExpanded = expanded.has(nodeKey);

    const pagesCount = node.pages?.length ?? 0;
    const childrenCount = node.children?.length ?? 0;

    return (
        <div className="py-1.5" style={{ marginLeft: level === 0 ? 0 : 14 }}>
            <div className="flex gap-2 items-start">
                <button
                    onClick={() => toggle(nodeKey)}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.path}`}
                    className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                >
                    <Chevron open={isExpanded} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex flex-col min-w-0">
                            <strong className="truncate">{isRoot ? 'Home' : node.name}</strong>
                            <span className="text-xs text-slate-500 truncate">{node.path}</span>
                        </div>

                        <div className="flex gap-1.5 items-center flex-shrink-0">
                            {pagesCount > 0 && (
                                <Badge>{pagesCount} page{pagesCount > 1 ? 's' : ''}</Badge>
                            )}
                            {childrenCount > 0 && <Badge>{childrenCount} sub</Badge>}
                            {node.pages?.[0] && (
                                <a 
                                    href={node.pages[0].url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-600 hover:underline"
                                >
                                    Open
                                </a>
                            )}
                        </div>
                    </div>

                    {isExpanded && node.pages && node.pages.length > 0 && (
                        <div className="mt-2 pl-1.5 border-l-2 border-dashed border-slate-200">
                            {node.pages.map((p, idx) => (
                                <div key={idx} className="py-1">
                                    <a 
                                        href={p.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        {p.title ? trimTitle(p.title, 120) : p.url}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && node.children && node.children.length > 0 && (
                <div role="group" className="mt-1.5 pl-3 border-l border-slate-100">
                    {node.children.map(ch => (
                        <TreeNode key={ch.path} node={ch} level={level + 1} expanded={expanded} toggle={toggle} />
                    ))}
                </div>
            )}
        </div>
    );
});

// Helper functions and UI components
function trimTitle(t: string | undefined, max = 80): string {
    if (!t) return '';
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="bg-indigo-50 text-indigo-800 px-2 py-1 rounded-full text-xs">
            {children}
        </span>
    );
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24"
            className="transition-transform duration-150"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
            <path 
                fill="currentColor" 
                d="M9.29 6.71L13.59 11 9.29 15.29 10.71 16.71 16.41 11 10.71 5.29z" 
            />
        </svg>
    );
}

/**
 * Sitemap Page Component
 * ---------------------
 * Loads and displays the sitemap tree for a specific project.
 */
export default function SitemapPage() {
    const params = useParams<{ id: string }>();
    const projectId = params?.id;
    const [tree, setTree] = useState<SitemapNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) return;

        async function loadSitemap() {
            try {
                setLoading(true);
                
                // Load project to get sitemap URL
                const project = await loadProject(projectId);
                
                if (!project.sitemapTreeUrl) {
                    setError('No sitemap available for this project. Generate a sitemap first.');
                    setLoading(false);
                    return;
                }
                
                // Fetch the sitemap tree JSON from storage
                const response = await fetch(project.sitemapTreeUrl);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
                }
                
                const data = await response.json();
                setTree(data);
            } catch (err) {
                console.error('Error loading sitemap:', err);
                setError(err instanceof Error ? err.message : 'Failed to load sitemap');
            } finally {
                setLoading(false);
            }
        }

        loadSitemap();
    }, [projectId]);

    return (
        <PrivateRoute>
            <WorkspaceLayout>
                <PageContainer title="Sitemap Viewer">
                    {loading && <div className="p-3 text-slate-400">Loading sitemap...</div>}
                    {error && <div className="p-3 text-red-500">{error}</div>}
                    {!loading && !error && tree && <SitemapTree tree={tree} />}
                </PageContainer>
            </WorkspaceLayout>
        </PrivateRoute>
    );
}
