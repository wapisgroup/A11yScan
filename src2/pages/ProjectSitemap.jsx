import React, { useEffect, useState } from 'react';
import SitemapTree from '../components/molecule/SiteMapThree';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {useParams} from "react-router-dom";

export default function ProjectSitemap() {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const { projectId } = useParams()

    console.log(projectId)

    useEffect(() => {
        if (!projectId) return;
        let mounted = true;
        setLoading(true);
        setErr(null);

        (async () => {
            try {
                const p = (await getDoc(doc(db, 'projects', projectId))).data();
                if (!p) throw new Error('Project not found');

                console.log('DocumentData:',p);

                // prefer embedded JSON, else fetch from URL
                if (p.sitemapTree) {
                    if (mounted) setTree(p.sitemapTree);
                } else if (p.sitemapTreeUrl) {
                    const res = await fetch(p.sitemapTreeUrl);
                    if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
                    const json = await res.json();
                    if (mounted) setTree(json);
                } else {
                    throw new Error('No sitemap available for this project');
                }
            } catch (e) {
                if (mounted) setErr(e.message || String(e));
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [projectId]);

    if (loading) return <div>Loading sitemap…</div>;
    if (err) return <div>Error: {err}</div>;
    return <SitemapTree tree={tree} />;
}