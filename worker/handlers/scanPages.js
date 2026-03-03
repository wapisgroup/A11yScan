/**
 * @file scanPages.js
 * @module worker/handlers/scanPages
 *
 * Phase 8: Replaced Firebase/Firestore reads and writes with REST API calls.
 * Puppeteer/axe-core scan logic, static heuristics, BigQuery writes, and
 * AI-heuristics are all unchanged.
 *
 * Changes from Phase 7 (Firestore) to Phase 8 (REST API):
 * - Project / run / page / scan data is read and written via helpers/api-client.js
 * - Storage uploads use helpers/storage.js (uploadAndGetUrl) instead of admin.storage()
 * - Per-page run stat increments are accumulated locally and flushed once at the end
 * - Subscription usage tracking and scanIndex writes are removed (Firestore-specific)
 * - Slack config is read from env vars instead of Firestore org document
 */

const { notifyScanFinished } = require('../helpers/slack');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { fetchHtml } = require('../helpers/generic');
const { AblelyticsCoreTests } = require('../helpers/ablelytics-core-tests');
const { AblelyticsAiHeuristics } = require('../helpers/ai-heuristics');
const { insertPageScan, insertIssues, insertCoreCheckTimings } = require('../helpers/bigquery');
const {
    getProject,
    updateProject,
    getPages,
    updatePage,
    getRun,
    updateRun,
    createScan,
} = require('../helpers/api-client');
const { uploadAndGetUrl } = require('../helpers/storage');

// ── Compliance profile → axe tag mapping ─────────────────────────────────────
const PROFILE_TO_AXE_TAGS = {
    ada_title_ii_wcag21: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    section_508_wcag20:  ['wcag2a', 'wcag2aa'],
    en_301_549_web:      ['wcag2a', 'wcag2aa', 'wcag21aa'],
    wcag22:              ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
};

function getAxeTagsFromProfiles(profiles) {
    const tags = new Set(['best-practice']);
    const list = Array.isArray(profiles) && profiles.length > 0
        ? profiles
        : ['ada_title_ii_wcag21'];
    list.forEach(p => {
        const mapped = PROFILE_TO_AXE_TAGS[p] || ['wcag2a', 'wcag2aa', 'wcag21aa'];
        mapped.forEach(t => tags.add(t));
    });
    return Array.from(tags);
}

function emptyProjectStats() {
    return {
        pagesTotal: 0,
        pagesScanned: 0,
        pages404: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
    };
}

function toSafeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function parseHttpStatus(value) {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function readPageSummary(pageData) {
    if (!pageData || typeof pageData !== 'object') {
        return {};
    }

    // New API format: violationCount from PageViolationCount join
    if (pageData.violationCount && typeof pageData.violationCount === 'object') {
        return pageData.violationCount;
    }

    // Legacy Firestore formats (kept for backward compatibility)
    const byViolations = pageData.violationsCount;
    if (byViolations && typeof byViolations === 'object') {
        return byViolations;
    }

    const byLastStats = pageData.lastStats;
    if (byLastStats && typeof byLastStats === 'object') {
        return byLastStats;
    }

    const byLastScan = pageData.lastScan && typeof pageData.lastScan === 'object'
        ? pageData.lastScan.summary
        : null;
    if (byLastScan && typeof byLastScan === 'object') {
        return byLastScan;
    }

    return {};
}

function contributionFromPage(pageData) {
    const stats = emptyProjectStats();
    const summary = readPageSummary(pageData);
    const httpStatus = parseHttpStatus(pageData && pageData.httpStatus);

    if (httpStatus == null || (httpStatus >= 200 && httpStatus < 300)) {
        stats.pagesTotal = 1;
    } else {
        stats.pages404 = 1;
    }

    const hasSummary =
        summary.critical !== undefined ||
        summary.serious !== undefined ||
        summary.moderate !== undefined ||
        summary.minor !== undefined;
    if ((pageData && pageData.status === 'scanned') || hasSummary) {
        stats.pagesScanned = 1;
    }

    stats.critical = toSafeNumber(summary.critical);
    stats.serious = toSafeNumber(summary.serious);
    stats.moderate = toSafeNumber(summary.moderate);
    stats.minor = toSafeNumber(summary.minor);

    return stats;
}

function addProjectStats(target, delta) {
    target.pagesTotal += delta.pagesTotal;
    target.pagesScanned += delta.pagesScanned;
    target.pages404 += delta.pages404;
    target.critical += delta.critical;
    target.serious += delta.serious;
    target.moderate += delta.moderate;
    target.minor += delta.minor;
    return target;
}

function diffProjectStats(nextStats, prevStats) {
    return {
        pagesTotal: nextStats.pagesTotal - prevStats.pagesTotal,
        pagesScanned: nextStats.pagesScanned - prevStats.pagesScanned,
        pages404: nextStats.pages404 - prevStats.pages404,
        critical: nextStats.critical - prevStats.critical,
        serious: nextStats.serious - prevStats.serious,
        moderate: nextStats.moderate - prevStats.moderate,
        minor: nextStats.minor - prevStats.minor,
    };
}

function isZeroProjectStats(stats) {
    return (
        stats.pagesTotal === 0 &&
        stats.pagesScanned === 0 &&
        stats.pages404 === 0 &&
        stats.critical === 0 &&
        stats.serious === 0 &&
        stats.moderate === 0 &&
        stats.minor === 0
    );
}

function hasPersistedProjectStats(projectData) {
    const stats = projectData && projectData.projectStats;
    if (!stats || typeof stats !== 'object') return false;

    return (
        stats.pagesTotal !== undefined ||
        stats.pagesScanned !== undefined ||
        stats.pages404 !== undefined ||
        stats.critical !== undefined ||
        stats.serious !== undefined ||
        stats.moderate !== undefined ||
        stats.minor !== undefined
    );
}

async function removeCookieBanners(pageP, mode) {
    const removed = await pageP.evaluate((bannerMode) => {
        const removedElements = [];

        // CookieYes selectors
        const cookieYesSelectors = [
            '#cookieyes-consent',
            '.cookieyes-banner',
            '[id*="cookieyes"]',
            '[class*="cookieyes"]',
            '.cky-consent-container',
            '.cky-overlay'
        ];

        // Common cookie banner selectors
        const commonSelectors = [
            // CookieYes
            ...cookieYesSelectors,
            // OneTrust
            '#consent-management-box',
            '#onetrust-banner-sdk',
            '#onetrust-consent-sdk',
            '.onetrust-pc-dark-filter',
            '[id*="onetrust"]',
            // Cookiebot
            '#CybotCookiebotDialog',
            '#CookiebotWidget',
            '[id*="cookiebot"]',
            // Generic
            '[class*="cookie-banner"]',
            '[class*="cookie-consent"]',
            '[class*="gdpr-banner"]',
            '[class*="gdpr-consent"]',
            '[id*="cookie-banner"]',
            '[id*="cookie-consent"]',
            '[aria-label*="cookie" i]',
            '[aria-label*="consent" i]',
        ];

        const selectorsToUse = bannerMode === 'cookieyes' ? cookieYesSelectors : commonSelectors;

        selectorsToUse.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        removedElements.push({
                            tag: el.tagName,
                            id: el.id || '',
                            class: el.className || '',
                            selector: selector
                        });
                        el.remove();
                    }
                });
            } catch (e) {
                // Ignore selector errors
            }
        });

        // Also remove backdrop/overlay elements
        const overlaySelectors = [
            '[class*="cookie"][class*="overlay"]',
            '[class*="consent"][class*="overlay"]',
            '[class*="cookie"][class*="backdrop"]',
            'body > div[style*="z-index"][style*="position: fixed"]',
        ];

        if (bannerMode === 'all') {
            overlaySelectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => {
                        if (el && el.parentNode && el.textContent.toLowerCase().includes('cookie')) {
                            removedElements.push({ tag: el.tagName, selector: selector });
                            el.remove();
                        }
                    });
                } catch (e) {}
            });
        }

        // Re-enable scrolling if it was disabled
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        return removedElements;
    }, mode);

    return removed;
}

/**
 * Upload HTML snapshot to Cloud Storage and return a download URL.
 */
async function uploadHtmlToStorage(projectId, runId, pageId, html) {
    const filePath = `scans/${projectId}/${runId}/${pageId}/snapshot.html`;
    return uploadAndGetUrl(filePath, html, 'text/html');
}

/**
 * Upload a binary artifact (screenshot, etc.) to Cloud Storage.
 */
async function uploadBinaryToStorage(projectId, runId, pageId, filename, buffer, contentType) {
    const filePath = `scans/${projectId}/${runId}/${pageId}/${filename}`;
    return uploadAndGetUrl(filePath, buffer, contentType);
}

/**
 * Scans all pages referenced by a run, writes scan results, and updates stats.
 *
 * @param {string} projectId
 * @param {string} runId
 */
async function handleScanPages(projectId, runId) {
    console.log('handleScanPages', projectId, runId);

    // === Project lookup ===
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found: ' + projectId);

    const storeArtifacts = project.config?.storeArtifacts !== false; // default true
    const axeTags = getAxeTagsFromProfiles(project.config?.complianceProfiles);
    console.log('[scan] storeArtifacts:', storeArtifacts, '| axe tags:', axeTags);

    // === Mark run as running ===
    await updateRun(runId, { status: 'running', startedAt: new Date().toISOString() });

    // === Get run data + page IDs ===
    // The API auto-resolves resolvePagesAtStart — no extra logic needed here.
    const runData = await getRun(runId);
    if (!runData) throw new Error('Run not found: ' + runId);
    const pagesIds = runData.pageIds || [];

    if (pagesIds.length === 0) {
        console.log('[scan] No pages to scan for run', runId);
        await updateRun(runId, { status: 'done', finishedAt: new Date().toISOString(), pagesScanned: 0 });
        return { ok: true, scanned: 0 };
    }

    // === Pre-fetch all project pages and build lookup map ===
    const pagesResult = await getPages(projectId, { limit: 10000 });
    const allPages = (pagesResult && pagesResult.pages) || [];
    const pageMap = new Map(allPages.map(p => [p.id, p]));

    // === Project-level aggregate stats ===
    const projectStatsDelta = emptyProjectStats();
    const projectStatsBaseline = emptyProjectStats();
    const hasExistingProjectStats = hasPersistedProjectStats(project);
    let baselineLoaded = false;

    if (!hasExistingProjectStats) {
        allPages.forEach(pageData => {
            addProjectStats(projectStatsBaseline, contributionFromPage(pageData));
        });
        baselineLoaded = true;
        console.log('[scan] bootstrapped projectStats baseline from pages:', projectStatsBaseline);
    }

    // === Concurrency limiter ===
    const concurrency = Number(process.env.SCAN_CONCURRENCY) || 3;
    const limit = pLimit(concurrency);

    // === Puppeteer/axe initialization ===
    let usePuppeteer = false;
    let puppeteer = null;
    let axe = null;
    let browser = null;
    try {
        puppeteer = require('puppeteer');
        axe = require('axe-core');
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        usePuppeteer = true;
        console.log('Puppeteer launched successfully - using axe-core for accessibility checks');
    } catch (err) {
        console.warn('Puppeteer/axe not available or failed to launch, falling back to static HTML heuristics:', err && err.message ? err.message : err);
        usePuppeteer = false;
        if (browser) try { await browser.close(); } catch (e) { }
        browser = null;
    }

    // === Aggregate stats for the run ===
    const agg = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    let scannedCount = 0;
    let completedCount = 0;
    const progressUpdateIntervalMs = Number(process.env.SCAN_PROGRESS_UPDATE_MS) || 1000;
    let lastProgressUpdateAt = 0;
    let progressUpdateChain = Promise.resolve();

    const maybePushRunProgress = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastProgressUpdateAt < progressUpdateIntervalMs) return;
        lastProgressUpdateAt = now;

        // Serialize progress writes to avoid racing PATCH calls from concurrent page workers.
        progressUpdateChain = progressUpdateChain
            .then(async () => {
                await updateRun(runId, {
                    status: 'running',
                    pagesTotal: pagesIds.length,
                    pagesScanned: completedCount,
                });
            })
            .catch((e) => {
                console.warn('[scan] Failed to push run progress for', runId, e && e.message ? e.message : e);
            });

        await progressUpdateChain;
    };

    function pushIssue(issues, impact, message, selector, ruleId, helpUrl, description, tags, failureSummary, html, target, engine, confidence, needsReview, evidence, aiHowToFix, decision) {
        issues.push({
            impact,
            message,
            selector: selector || null,
            ruleId: ruleId || null,
            helpUrl: helpUrl || null,
            description: description || null,
            tags: tags || [],
            failureSummary: failureSummary || null,
            html: html || null,
            target: target || [],
            engine: engine || null,
            confidence: typeof confidence === 'number' ? confidence : null,
            needsReview: typeof needsReview === 'boolean' ? needsReview : null,
            evidence: Array.isArray(evidence) ? evidence : [],
            aiHowToFix: aiHowToFix || null,
            decision: decision || null
        });
        if (agg[impact] !== undefined) agg[impact]++;
    }

    // === Per-page scan ===
    await Promise.all(pagesIds.map(pageId => limit(async () => {
        const pageScanStartedAt = new Date();
        try {
            const pageInfo = {};

            const page = pageMap.get(pageId);
            if (!page) {
                console.warn('[scan] Page not found in map for id', pageId);
                return;
            }
            const pageUrl = page.url;
            const previousContribution = contributionFromPage(page);

            // Skip non-HTML resources (XML sitemaps, PDFs, images, fonts, etc.)
            const NON_HTML_EXT = /\.(xml|pdf|css|js|jpg|jpeg|png|gif|svg|webp|ico|woff2?|ttf|eot|mp4|mp3|zip|gz|json)(\?|#|$)/i;
            if (NON_HTML_EXT.test(pageUrl)) {
                console.log(`[scan] Skipping non-HTML resource ${pageUrl}`);
                try {
                    await updatePage(pageId, {
                        status: 'skipped',
                        activeRunId: null,
                    });
                } catch (e) { /* ignore */ }
                return;
            }

            try {
                await updatePage(pageId, {
                    status: 'running',
                    activeRunId: runId,
                });
            } catch (e) {
                console.warn('[scan] Failed to mark page as running for', pageId, e && e.message ? e.message : e);
            }

            const issues = [];
            let httpStatus = null;
            const removeCookieBannersEnabled = Boolean(
                project.config?.removeCookieBanners && project.config.removeCookieBanners !== 'none'
            );

            if (usePuppeteer && browser) {
                let pageP = null;
                try {
                    pageP = await browser.newPage();

                    // Set viewport to a standard desktop size
                    await pageP.setViewport({ width: 1200, height: 900 });
                    await pageP.setDefaultNavigationTimeout(30000);

                    // Inject cookies if configured in project settings
                    if (project.config?.cookies && Array.isArray(project.config.cookies) && project.config.cookies.length > 0) {
                        try {
                            const urlObj = new URL(pageUrl);
                            const pageDomain = urlObj.hostname;
                            const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

                            // console.log(`========== COOKIE INJECTION DEBUG ==========`);
                            // console.log(`Target URL: ${pageUrl}`);
                            // console.log(`Base domain: ${baseUrl}`);
                            // console.log(`Cookies to inject: ${project.config.cookies.length}`);

                            await pageP.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch((err) => {
                                console.log('Initial navigation for cookies failed:', err.message);
                            });

                            for (let i = 0; i < project.config.cookies.length; i++) {
                                const cookie = project.config.cookies[i];
                                // console.log(`\n--- Cookie ${i + 1} ---`);
                                // console.log(`Raw cookie data:`, cookie);

                                let cookieDomain = cookie.domain || pageDomain;
                                cookieDomain = cookieDomain.replace(/^https?:\/\//, '');
                                cookieDomain = cookieDomain.split('/')[0];
                                if (cookieDomain.startsWith('www.')) {
                                    cookieDomain = cookieDomain.substring(4);
                                }
                                if (!cookieDomain.startsWith('.')) {
                                    cookieDomain = '.' + cookieDomain;
                                }

                                const cookieObj = {
                                    name: cookie.name,
                                    value: cookie.value,
                                    domain: cookieDomain,
                                    path: '/',
                                };

                                // console.log(`Cleaned cookie object:`, cookieObj);

                                try {
                                    await pageP.setCookie(cookieObj);
                                    // console.log(`✓ Cookie set successfully: ${cookie.name}`);
                                } catch (cookieErr) {
                                    console.error(`✗ Failed to set cookie ${cookie.name}:`, cookieErr.message);
                                }
                            }

                            // console.log(`\n--- Verifying cookies after setCookie ---`);
                            const cookiesAfterSet = await pageP.cookies();
                            // console.log(`Total cookies in browser: ${cookiesAfterSet.length}`);
                            cookiesAfterSet.forEach(c => {
                                // console.log(`  - ${c.name}=${c.value.substring(0, 50)}... (domain: ${c.domain})`);
                            });

                            // console.log(`========== END COOKIE INJECTION DEBUG ==========\n`);
                        } catch (cookieErr) {
                            console.warn('Failed to inject cookies:', cookieErr);
                        }
                    }

                    // Pre-inject axe-core before navigation
                    if (axe && axe.source) {
                        await pageP.evaluateOnNewDocument(axe.source);
                    }

                    const resp = await pageP.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => null);

                    if (resp) httpStatus = resp.status();

                    // Skip non-2xx pages
                    if (httpStatus !== null && (httpStatus < 200 || httpStatus >= 300)) {
                        console.log(`[scan] Skipping non-2xx page ${pageUrl} (HTTP ${httpStatus})`);
                        try {
                            await updatePage(pageId, {
                                httpStatus,
                                status: 'skipped',
                                activeRunId: null,
                            });
                        } catch (e) { /* ignore */ }
                        return;
                    }

                    // Remove cookie banners if configured
                    if (removeCookieBannersEnabled) {
                        try {
                            const mode = project.config.removeCookieBanners;
                            // console.log(`\n--- Removing cookie banners (mode: ${mode}) ---`);
                            const removed = await removeCookieBanners(pageP, mode);
                            // console.log(`✓ Removed ${removed.length} cookie banner elements`);
                            if (removed.length > 0) {
                                removed.forEach((el, i) => {
                                    // console.log(`  ${i + 1}. <${el.tag}> ${el.id ? `id="${el.id}"` : ''} ${el.class ? `class="${el.class.substring(0, 40)}..."` : ''}`);
                                });
                            }
                            // console.log(`--- End banner removal ---\n`);

                            // Install MutationObserver to auto-remove re-appearing banners
                            await pageP.evaluate((bannerMode) => {
                                const cookieYesSelectors = [
                                    '#cookieyes-consent', '.cookieyes-banner', '[id*="cookieyes"]',
                                    '[class*="cookieyes"]', '.cky-consent-container', '.cky-overlay'
                                ];
                                const commonSelectors = [
                                    ...cookieYesSelectors,
                                    '#consent-management-box', '#onetrust-banner-sdk', '#onetrust-consent-sdk',
                                    '.onetrust-pc-dark-filter', '[id*="onetrust"]',
                                    '#CybotCookiebotDialog', '#CookiebotWidget', '[id*="cookiebot"]',
                                    '[class*="cookie-banner"]', '[class*="cookie-consent"]',
                                    '[class*="gdpr-banner"]', '[class*="gdpr-consent"]',
                                    '[id*="cookie-banner"]', '[id*="cookie-consent"]',
                                    '[aria-label*="cookie" i]', '[aria-label*="consent" i]'
                                ];
                                const selectorsToUse = bannerMode === 'cookieyes' ? cookieYesSelectors : commonSelectors;
                                const observer = new MutationObserver(() => {
                                    selectorsToUse.forEach(sel => {
                                        try {
                                            document.querySelectorAll(sel).forEach(el => {
                                                if (el && el.parentNode) el.remove();
                                            });
                                        } catch (e) {}
                                    });
                                    document.body.style.overflow = '';
                                    document.documentElement.style.overflow = '';
                                });
                                if (document.body) {
                                    observer.observe(document.body, { childList: true, subtree: true });
                                }
                                window.__cookieBannerObserver = observer;
                            }, mode);
                        } catch (bannerErr) {
                            console.warn('Failed to remove cookie banners:', bannerErr);
                        }
                    }

                    // Verify cookies after page load
                    if (project.config?.cookies && Array.isArray(project.config.cookies) && project.config.cookies.length > 0) {
                        console.log(`\n--- Verifying cookies after page load ---`);
                        const cookiesAfterLoad = await pageP.cookies();
                        console.log(`Total cookies after page load: ${cookiesAfterLoad.length}`);
                        cookiesAfterLoad.forEach(c => {
                            console.log(`  - ${c.name}=${c.value.substring(0, 50)}... (domain: ${c.domain}, path: ${c.path})`);
                        });
                        for (const expectedCookie of project.config.cookies) {
                            const found = cookiesAfterLoad.find(c => c.name === expectedCookie.name);
                            if (found) {
                                console.log(`✓ Cookie "${expectedCookie.name}" is present in browser`);
                            } else {
                                console.log(`✗ Cookie "${expectedCookie.name}" NOT FOUND in browser!`);
                            }
                        }
                        console.log(`--- End cookie verification ---\n`);
                    }

                    // Run axe-core accessibility checks
                    if (axe && axe.source) {
                        const axeResults = await pageP.evaluate(async (tags) => {
                            try {
                                return await axe.run(document, { runOnly: { type: 'tag', values: tags } });
                            } catch (e) {
                                return { error: String(e) };
                            }
                        }, axeTags);

                        if (axeResults && axeResults.violations) {
                            // Extra stability check for axe "list" findings
                            const listSelectors = Array.from(
                                new Set(
                                    axeResults.violations
                                        .filter(v => v && v.id === 'list' && Array.isArray(v.nodes))
                                        .flatMap(v => v.nodes || [])
                                        .map(node => (Array.isArray(node?.target) ? node.target[0] : null))
                                        .filter(Boolean)
                                )
                            );
                            let listValidationMap = {};
                            if (listSelectors.length > 0) {
                                listValidationMap = await pageP.evaluate((selectors) => {
                                    const result = {};
                                    const allowedChildren = new Set(['LI', 'SCRIPT', 'TEMPLATE']);
                                    selectors.forEach((selector) => {
                                        try {
                                            const el = document.querySelector(selector);
                                            if (!el) {
                                                result[selector] = false;
                                                return;
                                            }
                                            const tag = String(el.tagName || '').toUpperCase();
                                            if (tag === 'LI') {
                                                result[selector] = !el.closest('ul,ol,menu');
                                                return;
                                            }
                                            if (tag === 'UL' || tag === 'OL' || tag === 'MENU') {
                                                const invalidChild = Array.from(el.children).some((child) => !allowedChildren.has(String(child.tagName || '').toUpperCase()));
                                                result[selector] = invalidChild;
                                                return;
                                            }
                                            result[selector] = false;
                                        } catch (e) {
                                            result[selector] = false;
                                        }
                                    });
                                    return result;
                                }, listSelectors);
                            }

                            axeResults.violations.forEach(v => {
                                const impact = v.impact || 'moderate';
                                const ruleId = v.id;
                                const message = v.help || v.description || ruleId;
                                const helpUrl = v.helpUrl || null;
                                const description = v.description || null;
                                const tags = v.tags || [];

                                v.nodes.forEach(node => {
                                    if (ruleId === 'list') {
                                        const verificationSelector = Array.isArray(node?.target) ? node.target[0] : null;
                                        if (verificationSelector && listValidationMap[verificationSelector] !== true) {
                                            return;
                                        }
                                    }
                                    const selector = (node && (node.html || node.target && node.target.join(','))) || null;
                                    const failureSummary = (node && node.failureSummary) || null;
                                    const html = (node && node.html) || null;
                                    const target = (node && node.target) || null;
                                    pushIssue(issues, impact, message, selector, ruleId, helpUrl, description, tags, failureSummary, html, target, 'axe-core');
                                });
                            });
                        } else if (axeResults && axeResults.error) {
                            pushIssue(issues, 'serious', 'Axe run error: ' + axeResults.error, null, null, null, null, [], null, null, null, 'axe-core');
                        }

                        // === Page snapshot and node highlight capture ===
                        try {
                            const nodesForEvaluation = (axeResults && axeResults.violations) ? axeResults.violations.flatMap(v => v.nodes || []).map(n => ({ target: n.target, html: n.html })) : [];
                            // console.log('Nodes for evaluation count:', nodesForEvaluation.length);

                            const snapshotResult = await pageP.evaluate((nodes) => {
                                let html = null;
                                try {
                                    const clone = document.documentElement.cloneNode(true);
                                    clone.querySelectorAll('script, noscript').forEach(n => n.remove());
                                    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT, null, false);
                                    const eventAttrs = ['onabort', 'onblur', 'onchange', 'onclick', 'onerror', 'onfocus', 'oninput', 'onload', 'onmouseover', 'onsubmit', 'onresize', 'onunload'];
                                    while (walker.nextNode()) {
                                        const el = walker.currentNode;
                                        eventAttrs.forEach(a => { if (el.hasAttribute && el.hasAttribute(a)) el.removeAttribute(a); });
                                        if (el.hasAttribute && el.hasAttribute('href')) {
                                            const href = el.getAttribute('href') || '';
                                            if (href.trim().toLowerCase().startsWith('javascript:')) el.removeAttribute('href');
                                        }
                                    }
                                    html = '<!doctype html>' + clone.outerHTML;
                                } catch (e) {}

                                function getPrimarySelector(n) { if (n && n.target && n.target.length > 0) return n.target[0]; return null; }
                                function getXPathForElement(elm) {
                                    if (elm.id) return `id("${elm.id}")`;
                                    const parts = [];
                                    while (elm && elm.nodeType === Node.ELEMENT_NODE) {
                                        let nb = 1;
                                        let sib = elm.previousSibling;
                                        while (sib) {
                                            if (sib.nodeType === Node.DOCUMENT_TYPE_NODE) { sib = sib.previousSibling; continue; }
                                            if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === elm.nodeName) nb++;
                                            sib = sib.previousSibling;
                                        }
                                        const tagName = elm.nodeName.toLowerCase();
                                        parts.unshift(`${tagName}[${nb}]`);
                                        elm = elm.parentNode;
                                    }
                                    return '/' + parts.join('/');
                                }

                                const nodeRects = [];
                                nodes.forEach((n) => {
                                    const selector = getPrimarySelector(n) || null;
                                    try {
                                        let el = null;
                                        if (selector) el = document.querySelector(selector);
                                        if (!el && n.html) {
                                            const all = Array.from(document.querySelectorAll('*'));
                                            el = all.find(e => {
                                                try { return e.outerHTML && e.outerHTML.indexOf(n.html.slice(0, 120)) !== -1; } catch (e) { return false; }
                                            }) || null;
                                        }
                                        if (!el) {
                                            nodeRects.push({ selector, xpath: null, outerHTML: n.html || null, rect: null });
                                        } else {
                                            const r = el.getBoundingClientRect();
                                            const truncatedHtml = el.outerHTML ? el.outerHTML.substring(0, 500) : null;
                                            nodeRects.push({ selector, xpath: getXPathForElement(el), outerHTML: truncatedHtml, rect: { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height } });
                                        }
                                    } catch (e) {
                                        const truncatedHtml = n.html ? n.html.substring(0, 500) : null;
                                        nodeRects.push({ selector: selector || null, xpath: null, outerHTML: truncatedHtml, rect: null });
                                    }
                                });

                                return { html, nodeRects };
                            }, nodesForEvaluation);

                            const sanitizedHtml = snapshotResult ? snapshotResult.html : null;
                            const issueNodes = snapshotResult ? snapshotResult.nodeRects : [];
                            // console.log('SanitizedHtml:', !!sanitizedHtml, sanitizedHtml ? sanitizedHtml.length : 0);

                            if (storeArtifacts && sanitizedHtml) {
                                const storageUrl = await uploadHtmlToStorage(projectId, runId, pageId, sanitizedHtml);
                                if (storageUrl) {
                                    pageInfo.pageSnapshotUrl = storageUrl;
                                } else {
                                    console.warn('[scan] Storage upload failed for snapshot');
                                }
                            }
                            if (storeArtifacts) {
                                try {
                                    const screenshotBuffer = await pageP.screenshot({ fullPage: true, type: 'jpeg', quality: 65 });
                                    if (screenshotBuffer) {
                                        const screenshotUrl = await uploadBinaryToStorage(
                                            projectId,
                                            runId,
                                            pageId,
                                            'screenshot.jpg',
                                            screenshotBuffer,
                                            'image/jpeg'
                                        );
                                        if (screenshotUrl) pageInfo.pageScreenshotUrl = screenshotUrl;
                                    }
                                } catch (shotErr) {
                                    console.warn('Failed to capture/upload screenshot:', shotErr && shotErr.message ? shotErr.message : shotErr);
                                }
                            }
                            if (issueNodes && issueNodes.length) pageInfo.nodeInfo = issueNodes;

                        } catch (e) {
                            console.warn('Failed to capture sanitized snapshot / node rects', e);
                        }
                    }

                    // Ablelytics core tests
                    let coreIssues = [];
                    let coreStats = null;
                    try {
                        const coreTests = new AblelyticsCoreTests(pageP, {
                            includeMultiPageChecks: false,
                            includeExperimentalChecks: String(process.env.ENABLE_CORE_EXPERIMENTAL_HEURISTICS || '').toLowerCase() === '1',
                            includeAccessibilityTreeChecks: String(process.env.ENABLE_CORE_A11Y_TREE_CHECKS || '1').toLowerCase() !== '0',
                            enableVisualFocusChecks: String(process.env.ENABLE_CORE_VISUAL_FOCUS_CHECKS || '1').toLowerCase() !== '0',
                            minConfidenceForAutoRaise: Number(process.env.CORE_AUTORAISE_CONFIDENCE || 0.7),
                            suppressions: (() => {
                                try {
                                    const raw = process.env.CORE_SUPPRESSIONS_JSON;
                                    if (!raw) return [];
                                    const parsed = JSON.parse(raw);
                                    return Array.isArray(parsed) ? parsed : [];
                                } catch (e) {
                                    return [];
                                }
                            })()
                        });
                        coreIssues = await coreTests.runAll();
                        coreStats = typeof coreTests.getLastRunStats === 'function' ? coreTests.getLastRunStats() : null;
                        coreIssues.forEach((issue) => {
                            pushIssue(
                                issues,
                                issue.impact,
                                issue.message,
                                issue.selector,
                                issue.ruleId,
                                issue.helpUrl,
                                issue.description,
                                issue.tags,
                                issue.failureSummary,
                                issue.html,
                                issue.target,
                                issue.engine || 'ablelytics-core',
                                issue.confidence,
                                issue.needsReview,
                                issue.evidence,
                                null,
                                issue.decision
                            );
                        });
                        if (coreStats) {
                            pageInfo.coreTiming = coreStats;
                            if (String(process.env.ENABLE_CORE_TIMING_LOGS || '1').toLowerCase() !== '0') {
                                // console.log('[ablelytics-core][timing]', JSON.stringify({
                                //     projectId,
                                //     runId,
                                //     pageId,
                                //     pageUrl,
                                //     totalDurationMs: coreStats.totalDurationMs,
                                //     checks: coreStats.checks
                                // }));
                            }
                        }
                    } catch (coreErr) {
                        console.warn('Ablelytics core tests failed:', coreErr && coreErr.message ? coreErr.message : coreErr);
                    }

                    if (coreIssues.length > 0) {
                        try {
                            const coreNodesForEvaluation = coreIssues
                                .filter((issue) => issue.selector || issue.html)
                                .map((issue) => ({ selector: issue.selector || null, html: issue.html || null }));

                            const coreIssueNodes = coreNodesForEvaluation.length > 0 ? await pageP.evaluate((nodes) => {
                                const results = [];
                                nodes.forEach((n) => {
                                    const selector = n.selector || null;
                                    try {
                                        let el = null;
                                        if (selector) el = document.querySelector(selector);
                                        if (!el && n.html) {
                                            const all = Array.from(document.querySelectorAll('*'));
                                            el = all.find(e => {
                                                try { return e.outerHTML && e.outerHTML.indexOf(n.html.slice(0, 120)) !== -1; } catch (e) { return false; }
                                            }) || null;
                                        }
                                        if (!el) {
                                            results.push({ selector, xpath: null, outerHTML: n.html || null, rect: null });
                                        } else {
                                            const r = el.getBoundingClientRect();
                                            function getXPathForElement(elm) {
                                                if (elm.id) return `id("${elm.id}")`;
                                                const parts = [];
                                                while (elm && elm.nodeType === Node.ELEMENT_NODE) {
                                                    let nb = 1;
                                                    let sib = elm.previousSibling;
                                                    while (sib) {
                                                        if (sib.nodeType === Node.DOCUMENT_TYPE_NODE) { sib = sib.previousSibling; continue; }
                                                        if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === elm.nodeName) nb++;
                                                        sib = sib.previousSibling;
                                                    }
                                                    const tagName = elm.nodeName.toLowerCase();
                                                    parts.unshift(`${tagName}[${nb}]`);
                                                    elm = elm.parentNode;
                                                }
                                                return '/' + parts.join('/');
                                            }
                                            const truncatedHtml = el.outerHTML ? el.outerHTML.substring(0, 500) : null;
                                            results.push({ selector, xpath: getXPathForElement(el), outerHTML: truncatedHtml, rect: { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height } });
                                        }
                                    } catch (e) {
                                        const truncatedHtml = n.html ? n.html.substring(0, 500) : null;
                                        results.push({ selector: selector || null, xpath: null, outerHTML: truncatedHtml, rect: null });
                                    }
                                });
                                return results;
                            }, coreNodesForEvaluation) : [];

                            if (coreIssueNodes.length > 0) {
                                const existingNodes = Array.isArray(pageInfo.nodeInfo) ? pageInfo.nodeInfo : [];
                                const mergedNodes = [...existingNodes];
                                coreIssueNodes.forEach((node) => {
                                    const key = `${node.selector || ''}|||${node.outerHTML || ''}`;
                                    const exists = mergedNodes.some((n) => `${n.selector || ''}|||${n.outerHTML || ''}` === key);
                                    if (!exists) mergedNodes.push(node);
                                });
                                pageInfo.nodeInfo = mergedNodes;
                            }
                        } catch (coreNodeErr) {
                            console.warn('Failed to map core issue nodes:', coreNodeErr && coreNodeErr.message ? coreNodeErr.message : coreNodeErr);
                        }
                    }

                    // AI heuristics checks
                    let aiIssues = [];
                    // if (String(process.env.ENABLE_AI_HEURISTICS || '').toLowerCase() === '1') {
                    //     try {
                    //         const aiTests = new AblelyticsAiHeuristics(pageP);
                    //         aiIssues = (await aiTests.runAll()).filter((issue) => (issue.confidence ?? 0) >= 0.65);
                    //         aiIssues.forEach((issue) => {
                    //             pushIssue(
                    //                 issues,
                    //                 issue.impact,
                    //                 issue.message,
                    //                 issue.selector,
                    //                 issue.ruleId,
                    //                 issue.helpUrl,
                    //                 issue.description,
                    //                 issue.tags,
                    //                 issue.failureSummary,
                    //                 issue.html,
                    //                 issue.target,
                    //                 issue.engine || 'ai-heuristics',
                    //                 issue.confidence,
                    //                 issue.needsReview,
                    //                 issue.evidence,
                    //                 issue.aiHowToFix
                    //             );
                    //         });
                    //     } catch (aiErr) {
                    //         console.warn('AI heuristics failed:', aiErr && aiErr.message ? aiErr.message : aiErr);
                    //     }
                    // }

                    if (aiIssues.length > 0) {
                        try {
                            const aiNodesForEvaluation = aiIssues
                                .filter((issue) => issue.selector || issue.html)
                                .map((issue) => ({ selector: issue.selector || null, html: issue.html || null }));

                            const aiIssueNodes = aiNodesForEvaluation.length > 0 ? await pageP.evaluate((nodes) => {
                                const results = [];
                                nodes.forEach((n) => {
                                    const selector = n.selector || null;
                                    try {
                                        let el = null;
                                        if (selector) el = document.querySelector(selector);
                                        if (!el && n.html) {
                                            const all = Array.from(document.querySelectorAll('*'));
                                            el = all.find(e => {
                                                try { return e.outerHTML && e.outerHTML.indexOf(n.html.slice(0, 120)) !== -1; } catch (e) { return false; }
                                            }) || null;
                                        }
                                        if (!el) {
                                            results.push({ selector, xpath: null, outerHTML: n.html || null, rect: null });
                                        } else {
                                            const r = el.getBoundingClientRect();
                                            function getXPathForElement(elm) {
                                                if (elm.id) return `id("${elm.id}")`;
                                                const parts = [];
                                                while (elm && elm.nodeType === Node.ELEMENT_NODE) {
                                                    let nb = 1;
                                                    let sib = elm.previousSibling;
                                                    while (sib) {
                                                        if (sib.nodeType === Node.DOCUMENT_TYPE_NODE) { sib = sib.previousSibling; continue; }
                                                        if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === elm.nodeName) nb++;
                                                        sib = sib.previousSibling;
                                                    }
                                                    const tagName = elm.nodeName.toLowerCase();
                                                    parts.unshift(`${tagName}[${nb}]`);
                                                    elm = elm.parentNode;
                                                }
                                                return '/' + parts.join('/');
                                            }
                                            const truncatedHtml = el.outerHTML ? el.outerHTML.substring(0, 500) : null;
                                            results.push({ selector, xpath: getXPathForElement(el), outerHTML: truncatedHtml, rect: { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height } });
                                        }
                                    } catch (e) {
                                        const truncatedHtml = n.html ? n.html.substring(0, 500) : null;
                                        results.push({ selector: selector || null, xpath: null, outerHTML: truncatedHtml, rect: null });
                                    }
                                });
                                return results;
                            }, aiNodesForEvaluation) : [];

                            if (aiIssueNodes.length > 0) {
                                const existingNodes = Array.isArray(pageInfo.nodeInfo) ? pageInfo.nodeInfo : [];
                                const mergedNodes = [...existingNodes];
                                aiIssueNodes.forEach((node) => {
                                    const key = `${node.selector || ''}|||${node.outerHTML || ''}`;
                                    const exists = mergedNodes.some((n) => `${n.selector || ''}|||${n.outerHTML || ''}` === key);
                                    if (!exists) mergedNodes.push(node);
                                });
                                pageInfo.nodeInfo = mergedNodes;
                            }
                        } catch (aiNodeErr) {
                            console.warn('Failed to map AI issue nodes:', aiNodeErr && aiNodeErr.message ? aiNodeErr.message : aiNodeErr);
                        }
                    }

                    // Simple checks: title and html[lang]
                    try {
                        const meta = await pageP.evaluate(() => ({ title: document.title || '', lang: document.documentElement.lang || '' }));
                        if (!meta.title || meta.title.trim() === '') pushIssue(issues, 'critical', 'Missing or empty <title> element', null, null, null, null, [], null, null, null, 'ablelytics-core');
                        if (!meta.lang || meta.lang.trim() === '') pushIssue(issues, 'critical', 'Missing html[lang] attribute', null, null, null, null, [], null, null, null, 'ablelytics-core');
                    } catch (e) {
                        // ignore
                    }

                    // === Cross-engine deduplication ===
                    const seenAxeKeys = new Set();
                    issues.forEach(issue => {
                        if (issue.engine === 'axe-core') {
                            seenAxeKeys.add(`${issue.ruleId}::${issue.selector || (issue.html ? issue.html.slice(0, 80) : '')}`);
                        }
                    });
                    const coreToAxeRuleMap = {
                        'wcag-2.4.7': 'focus-visible',
                    };
                    for (let i = issues.length - 1; i >= 0; i--) {
                        const issue = issues[i];
                        if (issue.engine !== 'ablelytics-core') continue;
                        const mappedRuleId = coreToAxeRuleMap[issue.ruleId] || issue.ruleId;
                        const key = `${mappedRuleId}::${issue.selector || (issue.html ? issue.html.slice(0, 80) : '')}`;
                        if (seenAxeKeys.has(key)) {
                            issues.splice(i, 1);
                        }
                    }

                } catch (err) {
                    pushIssue(issues, 'critical', `Failed to render page in headless browser: ${String(err)}`, null, null, null, null, [], null, null, null, 'ablelytics-core');
                } finally {
                    try { if (pageP) await pageP.close(); } catch (e) { }
                }
            } else {
                // Fallback: static HTML checks via fetchHtml + cheerio
                const pageData = await fetchHtml(pageUrl);
                httpStatus = pageData ? pageData.status : null;

                if (httpStatus !== null && (httpStatus < 200 || httpStatus >= 300)) {
                    console.log(`[scan] Skipping non-2xx page ${pageUrl} (HTTP ${httpStatus}) [static]`);
                    try {
                        await updatePage(pageId, {
                            httpStatus,
                            status: 'skipped',
                            activeRunId: null,
                        });
                    } catch (e) { /* ignore */ }
                    return;
                }

                    if (!pageData || !pageData.text) {
                        pushIssue(issues, 'critical', `Failed to fetch page (status: ${httpStatus})`, null, null, null, null, [], null, null, null, 'ablelytics-core');
                    } else {
                    const $ = cheerio.load(pageData.text);
                    const title = ($('title').first().text() || '').trim();
                    if (!title) pushIssue(issues, 'critical', 'Missing or empty <title> element', null, null, null, null, [], null, null, null, 'ablelytics-core');
                    const htmlLang = $('html').attr('lang');
                    if (!htmlLang) pushIssue(issues, 'critical', 'Missing html[lang] attribute', null, null, null, null, [], null, null, null, 'ablelytics-core');

                    $('img').each((i, el) => {
                        const alt = ($(el).attr('alt') || '').trim();
                        if (!alt) pushIssue(issues, 'serious', 'Image with missing or empty alt attribute', $(el).toString(), null, null, null, [], null, null, null, 'ablelytics-core');
                    });

                    $('a').each((i, el) => {
                        const $el = $(el);
                        const text = ($el.text() || '').trim();
                        const aria = $el.attr('aria-label');
                        const titleAttr = $el.attr('title');
                        const hasImgWithAlt = $el.find('img[alt]').length > 0;
                        if (!text && !aria && !titleAttr && !hasImgWithAlt) {
                            pushIssue(issues, 'serious', 'Link with no accessible name (no text, title or aria-label)', $el.toString(), null, null, null, [], null, null, null, 'ablelytics-core');
                        }
                    });

                    if ($('h1').length === 0) pushIssue(issues, 'moderate', 'No <h1> heading present on page', null, null, null, null, [], null, null, null, 'ablelytics-core');
                    const desc = $('meta[name="description"]').attr('content');
                    if (!desc) pushIssue(issues, 'minor', 'Missing meta description', null, null, null, null, [], null, null, null, 'ablelytics-core');
                }
            }

            // === Persist scan result via REST API ===
            const { pageSnapshotUrl, pageScreenshotUrl, nodeInfo, coreTiming } = pageInfo;
            const snapshotArtifactPath = pageSnapshotUrl || null;

            const scanSummary = {
                critical: issues.filter(i => i.impact === 'critical').length,
                serious: issues.filter(i => i.impact === 'serious').length,
                moderate: issues.filter(i => i.impact === 'moderate').length,
                minor: issues.filter(i => i.impact === 'minor').length,
            };

            const scanFinishedAt = new Date();
            const detectedEngines = Array.from(
                new Set((issues || []).map((issue) => issue && issue.engine).filter(Boolean))
            );

            try {
                await insertPageScan({
                    projectId,
                    organisationId: project.organisationId || null,
                    runId,
                    pageId,
                    pageUrl,
                    action: runData.type || null,
                    status: 'scanned',
                    httpStatus,
                    summary: scanSummary,
                    issuesTotal: issues.length,
                    engines: detectedEngines,
                    coreTotalDurationMs: pageInfo.coreTiming?.totalDurationMs || null,
                    usedPuppeteer: usePuppeteer && Boolean(browser),
                    scanStartedAt: pageScanStartedAt,
                    scanFinishedAt,
                    ingestedAt: scanFinishedAt,
                });

                await insertIssues({
                    projectId,
                    organisationId: project.organisationId || null,
                    runId,
                    pageId,
                    pageUrl,
                    issues,
                    ingestedAt: scanFinishedAt,
                });

                if (Array.isArray(pageInfo.coreTiming?.checks) && pageInfo.coreTiming.checks.length > 0) {
                    await insertCoreCheckTimings({
                        projectId,
                        organisationId: project.organisationId || null,
                        runId,
                        pageId,
                        pageUrl,
                        checks: pageInfo.coreTiming.checks,
                        scanStartedAt: pageScanStartedAt,
                        scanFinishedAt,
                        ingestedAt: scanFinishedAt,
                    });
                }
            } catch (bqErr) {
                console.warn(
                    '[scan] BigQuery write failed for page',
                    pageId,
                    bqErr && bqErr.message ? bqErr.message : bqErr
                );
            }

            console.log(`[snapshotArtifactPath] ${snapshotArtifactPath} for page ${pageId}`);

            await createScan({
                projectId,
                pageId,
                runId,
                type: runData.type || 'scan_pages',
                httpStatus: httpStatus || null,
                artifactPath: snapshotArtifactPath,
                summary: scanSummary,
                issues,
                pageSnapshotUrl: pageSnapshotUrl || null,
                pageScreenshotUrl: pageScreenshotUrl || null,
                nodeInfo: nodeInfo || null,
            });

            // Update page with latest scan summary
            try {
                await updatePage(pageId, {
                    lastRunId: runId,
                    status: 'scanned',
                    activeRunId: null,
                    httpStatus: httpStatus || null,
                    violationCounts: scanSummary,
                });
            } catch (e) {
                console.warn('[scan] Failed to update page document for', pageId, e && e.message ? e.message : e);
            }

            scannedCount++;

            // Bill scans incrementally per successfully scanned page.
            try {
                await updateRun(runId, {
                    usageIncrementScans: 1,
                });
            } catch (e) {
                console.warn('[scan] Failed to increment scan usage for run', runId, e && e.message ? e.message : e);
            }

            // Accumulate project stats delta
            const nextContribution = contributionFromPage({
                ...page,
                status: 'scanned',
                httpStatus: httpStatus || null,
                violationCount: scanSummary,
            });

            const previousForDelta = (hasExistingProjectStats || baselineLoaded)
                ? previousContribution
                : emptyProjectStats();
            addProjectStats(projectStatsDelta, diffProjectStats(nextContribution, previousForDelta));

        } catch (err) {
            console.error('[scan] Error scanning page', pageId, err && err.stack ? err.stack : err);
            const scanFinishedAt = new Date();

            // Record error scan
            try {
                await createScan({
                    projectId,
                    pageId,
                    runId,
                    type: runData.type || 'scan_pages',
                    issues: [],
                    summary: null,
                });
            } catch (e) {
                console.warn('[scan] Failed to write error scan doc', e);
            }

            // BigQuery write for failed page
            try {
                const failedPage = pageMap.get(pageId);
                const failedPageUrl = failedPage ? failedPage.url : null;
                await insertPageScan({
                    projectId,
                    organisationId: project.organisationId || null,
                    runId,
                    pageId,
                    pageUrl: failedPageUrl,
                    action: runData.type || null,
                    status: 'failed',
                    httpStatus: null,
                    summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
                    issuesTotal: 0,
                    engines: [],
                    coreTotalDurationMs: null,
                    usedPuppeteer: usePuppeteer && Boolean(browser),
                    error: String(err),
                    scanStartedAt: pageScanStartedAt,
                    scanFinishedAt,
                    ingestedAt: scanFinishedAt,
                });
            } catch (bqErr) {
                console.warn(
                    '[scan] BigQuery write failed for failed page',
                    pageId,
                    bqErr && bqErr.message ? bqErr.message : bqErr
                );
            }

            try {
                await updatePage(pageId, { status: 'failed', activeRunId: null });
            } catch (e) {
                console.warn('[scan] Failed to mark page as failed for', pageId, e && e.message ? e.message : e);
            }
        } finally {
            completedCount++;
            void maybePushRunProgress(false);
        }
    })));

    // === Cleanup ===
    try { if (browser) await browser.close(); } catch (e) { console.warn('[scan] Failed to close browser', e); }

    await maybePushRunProgress(true);

    // === Finalize run ===
    await updateRun(runId, {
        status: 'done',
        finishedAt: new Date().toISOString(),
        pagesScanned: completedCount,
        stats: agg,
    });

    // === Update project aggregate stats ===
    try {
        const freshProject = await getProject(projectId);
        const now = new Date().toISOString();
        const baseProjectUpdate = { lastScanAt: now };

        if (hasExistingProjectStats) {
            if (isZeroProjectStats(projectStatsDelta)) {
                await updateProject(projectId, baseProjectUpdate);
            } else {
                const cur = (typeof freshProject.projectStats === 'object' && freshProject.projectStats) || {};
                await updateProject(projectId, {
                    ...baseProjectUpdate,
                    projectStats: {
                        pagesTotal: (Number(cur.pagesTotal) || 0) + projectStatsDelta.pagesTotal,
                        pagesScanned: (Number(cur.pagesScanned) || 0) + projectStatsDelta.pagesScanned,
                        pages404: (Number(cur.pages404) || 0) + projectStatsDelta.pages404,
                        critical: (Number(cur.critical) || 0) + projectStatsDelta.critical,
                        serious: (Number(cur.serious) || 0) + projectStatsDelta.serious,
                        moderate: (Number(cur.moderate) || 0) + projectStatsDelta.moderate,
                        minor: (Number(cur.minor) || 0) + projectStatsDelta.minor,
                        updatedAt: now,
                    },
                });
            }
        } else {
            const resolvedProjectStats = emptyProjectStats();
            if (baselineLoaded) addProjectStats(resolvedProjectStats, projectStatsBaseline);
            addProjectStats(resolvedProjectStats, projectStatsDelta);
            await updateProject(projectId, {
                ...baseProjectUpdate,
                projectStats: { ...resolvedProjectStats, updatedAt: now },
            });
        }
    } catch (e) {
        console.warn(
            '[scan] Failed to update project aggregate stats for',
            projectId,
            e && e.message ? e.message : e
        );
    }

    console.log('[scan] ScanPages job finished', projectId, runId, 'scanned:', scannedCount, 'agg:', agg);

    try {
        const slackConfig = process.env.SLACK_WEBHOOK_URL
            ? { webhookUrl: process.env.SLACK_WEBHOOK_URL, channel: process.env.SLACK_CHANNEL }
            : null;
        if (slackConfig) {
            await notifyScanFinished({
                projectId,
                projectName: (project.name || project.domain) || projectId,
                pagesScanned: scannedCount,
                agg,
            }, slackConfig);
        }
    } catch (e) {
        console.warn('[scan] Slack notification failed:', e && e.message ? e.message : e);
    }

    return { ok: true, scanned: scannedCount, agg };
}

module.exports = { handleScanPages };
