"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/organism/workspace-layout';
import { PageContainer } from '@/components/molecule/page-container';
import { PrivateRoute } from '@/utils/private-router';
import { SitemapTree, type SitemapNode } from '@/components/organism/sitemap-tree';

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
                const response = await fetch(`/api/projects/${projectId}/sitemap-tree`);
                if (response.status === 404) {
                    setError('No sitemap available for this project. Generate a sitemap first.');
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Failed to fetch sitemap (${response.status})`);
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
