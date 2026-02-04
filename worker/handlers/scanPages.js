/**
 * handleScanPages
 * -------------
 * Executes an accessibility scan for the pages referenced by a run document.
 *
 * Behavior:
 * - Reads run.pagesIds
 * - For each page, runs axe-core via puppeteer when available
 * - Falls back to lightweight HTML heuristics if puppeteer/axe isn't available
 * - Writes scan results into `projects/{projectId}/scans`
 * - Updates per-page summaries and run aggregate stats
 */

const admin = require('firebase-admin');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { fetchHtml } = require('../helpers/generic');

async function handleScanPages(db, projectId, runId) {
    console.log('handleScanPages', projectId, runId);
    // locate project and ensure it exists
    const projectRef = db.collection('projects').doc(projectId);
    const projSnap = await projectRef.get();
    if (!projSnap.exists) {
        throw new Error('Project not found: ' + projectId);
    }

    // Get project owner for usage tracking
    const projectData = projSnap.data();
    const projectOwner = projectData?.owner;

    // Check and reset usage counters if needed (do this once at the start)
    if (projectOwner) {
        try {
            const subscriptionRef = db.collection('subscriptions').doc(projectOwner);
            const subscriptionSnap = await subscriptionRef.get();
            
            if (subscriptionSnap.exists) {
                const subscription = subscriptionSnap.data();
                const now = new Date();
                const needsReset = shouldResetUsageCounters(subscription, now);
                
                if (needsReset) {
                    console.log('Resetting usage counters for new billing period');
                    await subscriptionRef.update({
                        'currentUsage.scansThisMonth': 0,
                        'currentUsage.apiCallsToday': 0,
                        'currentUsage.usagePeriodStart': admin.firestore.Timestamp.fromDate(now),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
        } catch (error) {
            console.error('Failed to check/reset usage counters:', error);
        }
    }

    // Update run status -> running
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Get run doc data and list of page IDs to scan
    const runSnap = await runRef.get();
    if (!runSnap.exists) {
        throw new Error('Run not found: ' + runId);
    }
    const runData = runSnap.data() || {};
    const pagesIds = Array.isArray(runData.pagesIds) ? runData.pagesIds : [];

    if (pagesIds.length === 0) {
        console.log('No pages to scan for run', runId);
        await runRef.update({ status: 'done', finishedAt: admin.firestore.FieldValue.serverTimestamp(), pagesScanned: 0 });
        return { ok: true, scanned: 0 };
    }

    const concurrency = Number(process.env.SCAN_CONCURRENCY) || 3;
    const limit = pLimit(concurrency);

    // Try initialize Puppeteer + axe-core; fall back to HTML heuristics if unavailable
    let usePuppeteer = false;
    let puppeteer = null;
    let axe = null;
    let browser = null;
    try {
        puppeteer = require('puppeteer');
        // axe-core provides a .source string we can inject
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

    // aggregate stats
    const agg = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    let scannedCount = 0;

    // helper to classify and push issue
    function pushIssue(issues, impact, message, selector, ruleId, helpUrl, description) {
        issues.push({ 
            impact, 
            message, 
            selector: selector || null,
            ruleId: ruleId || null,
            helpUrl: helpUrl || null,
            description: description || null
        });
        if (agg[impact] !== undefined) agg[impact]++;
    }

    // process pages concurrently with limit
    await Promise.all(pagesIds.map(pageId => limit(async () => {
        try {
            // Per-page metadata (snapshot, node rectangles, etc.).
            // IMPORTANT: must be per-page to avoid leaking data across pages.
            const pageInfo = {};

            const pageRef = projectRef.collection('pages').doc(pageId);
            const pageSnap = await pageRef.get();
            if (!pageSnap.exists) {
                console.warn('Page doc not found for id', pageId);
                return;
            }
            const page = pageSnap.data();
            const pageUrl = page.url;

            const issues = [];
            let httpStatus = null;

            if (usePuppeteer && browser) {
                let pageP = null;
                try {
                    pageP = await browser.newPage();
                    await pageP.setViewport({ width: 1200, height: 900 });
                    await pageP.setDefaultNavigationTimeout(30000);
                    const resp = await pageP.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => null);
                    if (resp) httpStatus = resp.status();

                    // inject axe-core into page context
                    if (axe && axe.source) {
                        await pageP.addScriptTag({ content: axe.source });
                        // run axe
                        const axeResults = await pageP.evaluate(async () => {
                            try {
                                return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
                            } catch (e) {
                                return { error: String(e) };
                            }
                        });

                        if (axeResults && axeResults.violations) {
                            axeResults.violations.forEach(v => {
                                const impact = v.impact || 'moderate';
                                const ruleId = v.id;
                                const message = v.help || v.description || ruleId;
                                const helpUrl = v.helpUrl || null;
                                const description = v.description || null;
                                
                                // one issue per node
                                v.nodes.forEach(node => {
                                    const selector = (node && (node.html || node.target && node.target.join(','))) || null;
                                    pushIssue(issues, impact, message, selector, ruleId, helpUrl, description);
                                });
                            });
                        } else if (axeResults && axeResults.error) {
                            pushIssue(issues, 'serious', 'Axe run error: ' + axeResults.error);
                        }

                        // capture a sanitized page snapshot and node info (selectors + rects) for in-UI highlighting
                        try {
                            // Get the rendered HTML content and sanitize it inside the page context
                            const sanitizedHtml = await pageP.evaluate(() => {
                                try {
                                    const clone = document.documentElement.cloneNode(true);
                                    // remove scripts & noscript
                                    clone.querySelectorAll('script, noscript').forEach(n => n.remove());
                                    // remove potentially dangerous attributes
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
                                    return '<!doctype html>' + clone.outerHTML;
                                } catch (e) {
                                    return null;
                                }
                            });

                            // compute bounding rects and normalize selectors for each axe node in a single evaluate (faster)
                            const nodesForEvaluation = (axeResults && axeResults.violations) ? axeResults.violations.flatMap(v => v.nodes || []).map(n => ({ target: n.target, html: n.html })) : [];
                            const issueNodes = nodesForEvaluation.length > 0 ? await pageP.evaluate((nodes) => {
                                function getPrimarySelector(n) { if (n && n.target && n.target.length > 0) return n.target[0]; return null; }
                                const results = [];
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
                                            results.push({ selector, xpath: getXPathForElement(el), outerHTML: el.outerHTML, rect: { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height } });
                                        }
                                    } catch (e) {
                                        results.push({ selector: selector || null, xpath: null, outerHTML: n.html || null, rect: null });
                                    }
                                });
                                return results;
                            }, nodesForEvaluation) : [];


                            // attach snapshot + node info to scanDoc for later storage
                            if (sanitizedHtml) pageInfo.pageSnapshot = sanitizedHtml;
                            if (issueNodes && issueNodes.length) pageInfo.nodeInfo = issueNodes;
                        } catch (e) {
                            console.warn('Failed to capture sanitized snapshot / node rects', e);
                        }
                    }

                    // also collect simple checks: title and html[lang]
                    try {
                        const meta = await pageP.evaluate(() => ({ title: document.title || '', lang: document.documentElement.lang || '' }));
                        if (!meta.title || meta.title.trim() === '') pushIssue(issues, 'critical', 'Missing or empty <title> element');
                        if (!meta.lang || meta.lang.trim() === '') pushIssue(issues, 'critical', 'Missing html[lang] attribute');
                    } catch (e) {
                        // ignore
                    }

                } catch (err) {
                    pushIssue(issues, 'critical', `Failed to render page in headless browser: ${String(err)}`);
                } finally {
                    try { if (pageP) await pageP.close(); } catch (e) { }
                }
            } else {
                // fallback static checks using fetchHtml + cheerio
                const pageData = await fetchHtml(pageUrl);
                httpStatus = pageData ? pageData.status : null;
                if (!pageData || !pageData.text) {
                    pushIssue(issues, 'critical', `Failed to fetch page (status: ${httpStatus})`);
                } else {
                    const $ = cheerio.load(pageData.text);
                    const title = ($('title').first().text() || '').trim();
                    if (!title) pushIssue(issues, 'critical', 'Missing or empty <title> element');
                    const htmlLang = $('html').attr('lang');
                    if (!htmlLang) pushIssue(issues, 'critical', 'Missing html[lang] attribute');

                    $('img').each((i, el) => {
                        const alt = ($(el).attr('alt') || '').trim();
                        if (!alt) pushIssue(issues, 'serious', 'Image with missing or empty alt attribute', $(el).toString());
                    });

                    $('a').each((i, el) => {
                        const $el = $(el);
                        const text = ($el.text() || '').trim();
                        const aria = $el.attr('aria-label');
                        const titleAttr = $el.attr('title');
                        const hasImgWithAlt = $el.find('img[alt]').length > 0;
                        if (!text && !aria && !titleAttr && !hasImgWithAlt) {
                            pushIssue(issues, 'serious', 'Link with no accessible name (no text, title or aria-label)', $el.toString());
                        }
                    });

                    if ($('h1').length === 0) pushIssue(issues, 'moderate', 'No <h1> heading present on page');
                    const desc = $('meta[name="description"]').attr('content');
                    if (!desc) pushIssue(issues, 'minor', 'Missing meta description');
                }
            }

            // store scan result per page in projects/{projectId}/scans
            const scansCol = projectRef.collection('scans');
            const scanDoc = {
                pageId: pageId,
                pageUrl: pageUrl,
                runId,
                httpStatus: httpStatus,
                summary: {
                    critical: issues.filter(i => i.impact === 'critical').length,
                    serious: issues.filter(i => i.impact === 'serious').length,
                    moderate: issues.filter(i => i.impact === 'moderate').length,
                    minor: issues.filter(i => i.impact === 'minor').length,
                },
                issues,
                pageInfo,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await scansCol.add(scanDoc);

            // Track this page scan in subscription usage
            if (projectOwner) {
                try {
                    const subscriptionRef = db.collection('subscriptions').doc(projectOwner);
                    await subscriptionRef.update({
                        'currentUsage.scansThisMonth': admin.firestore.FieldValue.increment(1),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } catch (error) {
                    console.error('Failed to track page scan in usage:', error);
                    // Don't fail the scan if usage tracking fails
                }
            }

            // update run counters
            scannedCount++;

            // update page document with latest scan summary and metadata
            try {
                await pageRef.update({
                    lastRunId: runId,
                    lastScan: {
                        runId: runId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        httpStatus: httpStatus || null,
                        summary: scanDoc.summary
                    },
                    lastPageInfo: pageInfo,
                    violationsCount: scanDoc.summary,
                    status: 'scanned',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                // If update fails, log and continue — do not fail the whole job for a single page metadata update
                console.warn('Failed to update page document with scan summary for', pageId, e && e.message ? e.message : e);
            }

            // update aggregated counters on the run document
            await runRef.update({
                pagesScanned: admin.firestore.FieldValue.increment(1),
                'stats.critical': admin.firestore.FieldValue.increment(issues.filter(i => i.impact === 'critical').length),
                'stats.serious': admin.firestore.FieldValue.increment(issues.filter(i => i.impact === 'serious').length),
                'stats.moderate': admin.firestore.FieldValue.increment(issues.filter(i => i.impact === 'moderate').length),
                'stats.minor': admin.firestore.FieldValue.increment(issues.filter(i => i.impact === 'minor').length)
            });

        } catch (err) {
            console.error('Error scanning page', pageId, err && err.stack ? err.stack : err);
            // record error inside scans collection
            try {
                const scansCol = projectRef.collection('scans');
                await scansCol.add({ pageId, runId, error: String(err), createdAt: admin.firestore.FieldValue.serverTimestamp() });
            } catch (e) {
                console.warn('Failed to write error scan doc', e);
            }
        }
    })));

    // close browser if used
    try { if (browser) await browser.close(); } catch (e) { console.warn('Failed to close browser', e); }

    // finalize run: mark done and attach aggregated stats
    await runRef.update({
        status: 'done',
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        pagesScanned: scannedCount,
        'stats.critical': agg.critical,
        'stats.serious': agg.serious,
        'stats.moderate': agg.moderate,
        'stats.minor': agg.minor
    });

    console.log('ScanPages job finished', projectId, runId, 'scanned:', scannedCount, 'agg:', agg);
    return { ok: true, scanned: scannedCount, agg };
}

/**
 * Check if usage counters should be reset based on billing period
 */
function shouldResetUsageCounters(subscription, now) {
    // If no usage period start is set, we should reset
    if (!subscription.currentUsage?.usagePeriodStart) {
        return true;
    }
    
    const periodStart = subscription.currentUsage.usagePeriodStart.toDate();
    const currentPeriodStart = subscription.currentPeriodStart?.toDate();
    
    // If we have a current period start from Stripe and it's different from our usage period, reset
    if (currentPeriodStart && periodStart < currentPeriodStart) {
        return true;
    }
    
    // For daily counters (apiCallsToday), reset if it's a new day
    const periodStartDay = new Date(periodStart).setHours(0, 0, 0, 0);
    const nowDay = new Date(now).setHours(0, 0, 0, 0);
    
    if (periodStartDay < nowDay) {
        return true;
    }
    
    return false;
}

module.exports = { handleScanPages };
