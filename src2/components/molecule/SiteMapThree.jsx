import React, { useMemo, useState, useCallback } from 'react';

/**
 * SitemapTree component
 * Props:
 *  - tree: structured sitemap JSON (root node)
 *  - showRoot (bool): whether to render the root node label (default: true)
 */
export default function SitemapTree({ tree, showRoot = true }) {
    const [expanded, setExpanded] = useState(() => new Set()); // store paths that are expanded
    const [query, setQuery] = useState('');

    // toggle expand
    const toggle = useCallback((path) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }, []);

    // Expand a path and all parents (used by search to reveal matches)
    const expandPathWithParents = useCallback((path) => {
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

    // Filtering: return null if node (and descendants) do not match query
    const filterTree = useCallback((node, q) => {
        if (!q) return node; // no filter

        const ql = q.toLowerCase();
        // check pages (url/title)
        const pagesMatch = (node.pages || []).some(p =>
            (p.title || '').toLowerCase().includes(ql) ||
            (p.url || '').toLowerCase().includes(ql)
        );

        // check node label/path
        const nodeMatch = (node.name || '').toLowerCase().includes(ql) ||
            (node.path || '').toLowerCase().includes(ql);

        // filter children recursively
        const children = [];
        for (const ch of node.children || []) {
            const c = filterTree(ch, q);
            if (c) children.push(c);
        }

        if (nodeMatch || pagesMatch || children.length > 0) {
            // keep node but with filtered children and filtered pages (optional)
            const filteredPages = (node.pages || []).filter(p =>
                (p.title || '').toLowerCase().includes(ql) ||
                (p.url || '').toLowerCase().includes(ql)
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

    // when query changes, auto-expand all parents for matches
    React.useEffect(() => {
        if (!query) return;
        // traverse filtered tree and expand nodes that have matches
        function walk(node) {
            if (!node) return;
            // expand this node path (but don't expand root with empty path unless you want)
            if (node.path && node.path !== '/') expandPathWithParents(node.path);
            for (const ch of node.children || []) walk(ch);
        }
        walk(filtered);
    }, [query, filtered, expandPathWithParents]);

    // Download JSON
    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sitemap-tree.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    if (!tree) return <div style={styles.message}>No sitemap data provided.</div>;

    return (
        <div style={styles.container}>
            <div style={styles.toolbar}>
                <input
                    aria-label="Search sitemap"
                    placeholder="Search pages or paths..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={styles.search}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setExpanded(new Set()); setQuery(''); }} style={styles.button}>
                        Reset
                    </button>
                    <button onClick={handleDownload} style={styles.button}>
                        Download JSON
                    </button>
                </div>
            </div>

            <div role="tree" aria-label="Sitemap tree" style={styles.tree}>
                {showRoot ? (
                    <TreeNode
                        node={filtered || tree}
                        level={0}
                        expanded={expanded}
                        toggle={toggle}
                    />
                ) : (
                    // render children of root as top-level nodes
                    (filtered ? (filtered.children || []) : (tree.children || [])).map((ch) => (
                        <TreeNode key={ch.path} node={ch} level={0} expanded={expanded} toggle={toggle} />
                    ))
                )}
            </div>
        </div>
    );
}

/* TreeNode: recursive rendering */
function TreeNode({ node, level = 0, expanded, toggle }) {
    const isRoot = node.path === '/';
    const nodeKey = node.path || (node.name ? `/${node.name}` : '/');
    const isExpanded = expanded.has(nodeKey);

    const pagesCount = (node.pages && node.pages.length) || 0;
    const childrenCount = (node.children && node.children.length) || 0;

    return (
        <div style={{ ...styles.node, marginLeft: level === 0 ? 0 : 14 }}>
            <div style={styles.nodeRow}>
                <button
                    onClick={() => toggle(nodeKey)}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.path}`}
                    style={styles.chevBtn}
                >
                    <Chevron open={isExpanded} />
                </button>

                <div style={styles.nodeLabel}>
                    <div style={styles.titleRow}>
                        <div style={styles.pathText}>
                            <strong>{isRoot ? 'Home' : node.name}</strong>
                            <span style={styles.pathTiny}> {node.path}</span>
                        </div>

                        <div style={styles.badges}>
                            {pagesCount > 0 && <Badge>{pagesCount} page{pagesCount > 1 ? 's' : ''}</Badge>}
                            {childrenCount > 0 && <Badge>{childrenCount} sub</Badge>}
                            {node.pages && node.pages[0] && (
                                <a href={node.pages[0].url} target="_blank" rel="noopener noreferrer" style={styles.openLink}>
                                    Open
                                </a>
                            )}
                        </div>
                    </div>

                    {/* optionally show page list when node is expanded */}
                    {isExpanded && node.pages && node.pages.length > 0 && (
                        <div style={styles.pagesList}>
                            {node.pages.map((p, idx) => (
                                <div key={idx} style={styles.pageItem}>
                                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={styles.pageLink}>
                                        {p.title ? trimTitle(p.title, 120) : p.url}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* children */}
            {isExpanded && node.children && node.children.length > 0 && (
                <div role="group" style={styles.children}>
                    {node.children.map(ch => (
                        <TreeNode key={ch.path} node={ch} level={level + 1} expanded={expanded} toggle={toggle} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* small helpers & UI components */

function trimTitle(t, max = 80) {
    if (!t) return '';
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function Badge({ children }) {
    return <span style={styles.badge}>{children}</span>;
}

function Chevron({ open }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .12s' }}>
            <path fill="currentColor" d="M9.29 6.71L13.59 11 9.29 15.29 10.71 16.71 16.41 11 10.71 5.29z" />
        </svg>
    );
}

/* Inline styles (kept small & neutral) */
const styles = {
    container: {
        border: '1px solid #e6e9ee',
        borderRadius: 8,
        padding: 12,
        background: '#ffffff',
        fontFamily: 'Inter, Roboto, -apple-system, system-ui, sans-serif',
        color: '#1f2937'
    },
    toolbar: {
        display: 'flex',
        gap: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    search: {
        flex: '1 1 auto',
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        fontSize: 14
    },
    button: {
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        cursor: 'pointer'
    },
    tree: {
        fontSize: 14,
        lineHeight: 1.4
    },
    node: {
        padding: '6px 0'
    },
    nodeRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start'
    },
    chevBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#6b7280'
    },
    nodeLabel: {
        flex: '1 1 auto'
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
    },
    pathText: {
        display: 'flex',
        flexDirection: 'column'
    },
    pathTiny: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6
    },
    badges: {
        display: 'flex',
        gap: 6,
        alignItems: 'center'
    },
    badge: {
        background: '#eef2ff',
        color: '#3730a3',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12
    },
    openLink: {
        marginLeft: 8,
        fontSize: 13,
        textDecoration: 'none',
        color: '#0366d6'
    },
    pagesList: {
        marginTop: 8,
        paddingLeft: 6,
        borderLeft: '2px dashed #f1f5f9'
    },
    pageItem: {
        padding: '4px 0'
    },
    pageLink: {
        color: '#0b5cff',
        textDecoration: 'none',
        fontSize: 13
    },
    children: {
        marginTop: 6,
        paddingLeft: 12,
        borderLeft: '1px solid rgba(0,0,0,0.03)'
    },
    message: {
        padding: 12,
        color: '#6b7280'
    }
};