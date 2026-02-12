
/**
 * @file scanPages.js
 * @module worker/handlers/scanPages
 *
 * @description
 * Worker handler to execute accessibility scans for all pages referenced by a given run document,
 * writing results to Firestore and updating usage statistics.
 *
 * ## Firestore schema assumptions:
 * - Projects are stored at: `projects/{projectId}`
 * - Each project has subcollections:
 *    - `pages` (documents with field `url`)
 *    - `runs` (each run references an array of `pagesIds`)
 *    - `scans` (one document per scan result, keyed by page/run)
 * - Usage counters are tracked in: `subscriptions/{ownerId}/currentUsage`
 *
 * ## Side effects:
 * - Writes a scan result document for each page in `projects/{projectId}/scans`
 * - Updates per-page summary and metadata in `projects/{projectId}/pages/{pageId}`
 * - Aggregates and updates run stats in `projects/{projectId}/runs/{runId}`
 * - Increments usage counters in `subscriptions/{ownerId}`
 *
 * ## Concurrency model:
 * - Limits number of concurrent scans using p-limit, default concurrency 3 (configurable via env)
 *
 * ## Puppeteer/axe vs fallback:
 * - Uses Puppeteer and axe-core for full browser-based accessibility checks when available
 * - Falls back to static HTML heuristics using fetchHtml + cheerio if Puppeteer or axe fails
 *
 * ## Security note:
 * - Page snapshots are sanitized in the browser context before being persisted, removing scripts, noscript, and dangerous attributes
 */

const admin = require('firebase-admin');
const { notifyScanFinished, getSlackConfigFromOrg } = require('../helpers/slack');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { fetchHtml } = require('../helpers/generic');
const { AblelyticsCoreTests } = require('../helpers/ablelytics-core-tests');
const { AblelyticsAiHeuristics } = require('../helpers/ai-heuristics');

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
 * Uploads HTML content to Cloud Storage and returns a download URL.
 * @param {string} projectId - The project ID
 * @param {string} runId - The run ID
 * @param {string} pageId - The page ID
 * @param {string} html - The HTML content to upload
 * @returns {Promise<string>} - The download URL (signed URL in production, public URL in emulator)
 */
async function uploadHtmlToStorage(projectId, runId, pageId, html) {
    try {
        const bucket = admin.storage().bucket();
        const filePath = `scans/${projectId}/${runId}/${pageId}/snapshot.html`;
        const file = bucket.file(filePath);
        
        // Upload the HTML
        await file.save(html, {
            contentType: 'text/html',
            metadata: {
                cacheControl: 'public, max-age=604800', // 7 days
            },
        });
        
        // In emulator mode, return a simple public URL (signed URLs require real credentials)
        if (process.env.EMULATOR_MODE === '1') {
            const bucketName = bucket.name;
            const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
            const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
            console.log('storage url:',`http://${storageHost}/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`)
            return `http://${storageHost}/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
        }
        
        // In production, use signed URL valid for 7 days
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        return url;
    } catch (error) {
        console.error('Failed to upload HTML to storage:', error);
        return null;
    }
}

async function uploadBinaryToStorage(projectId, runId, pageId, filename, buffer, contentType) {
    try {
        const bucket = admin.storage().bucket();
        const filePath = `scans/${projectId}/${runId}/${pageId}/${filename}`;
        const file = bucket.file(filePath);
        await file.save(buffer, {
            contentType,
            metadata: {
                cacheControl: 'public, max-age=604800',
            },
        });

        if (process.env.EMULATOR_MODE === '1') {
            const bucketName = bucket.name;
            const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
            return `http://${storageHost}/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
        }

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        return url;
    } catch (error) {
        console.error('Failed to upload binary to storage:', error);
        return null;
    }
}

/**
 * Scans all pages referenced by a run, writes scan results, and updates usage and stats.
 *
 * @param {FirebaseFirestore.Firestore} db - The Firestore database instance
 * @param {string} projectId - The project ID (must exist in `projects/{projectId}`)
 * @param {string} runId - The run document ID (must exist in `projects/{projectId}/runs/{runId}`)
 * @returns {Promise<{ok: boolean, scanned: number, agg: Object}>} - Object with scan summary
 * @throws {Error} If the project or run is not found
 *
 * ## High-level flow:
 * 1. Lookup project and run, validate existence.
 * 2. Optionally reset usage counters if needed (based on subscription period).
 * 3. Mark run as 'running'.
 * 4. Initialize Puppeteer/axe-core if possible; fall back to static checks if not.
 * 5. Scan each page (concurrently, up to limit):
 *      - Load page document and fetch/render page.
 *      - Run axe-core (if using Puppeteer) or static heuristics.
 *      - Capture and sanitize page snapshot and node highlights.
 *      - Write scan result, update page doc, update run stats, increment usage.
 * 6. Finalize run: mark as 'done', persist aggregate stats, close browser.
 */
async function handleScanPages(db, projectId, runId) {
    console.log('handleScanPages', projectId, runId);
    // === Project lookup phase ===
    // Locate project and ensure it exists
    const projectRef = db.collection('projects').doc(projectId);
    const projSnap = await projectRef.get();
    if (!projSnap.exists) {
        throw new Error('Project not found: ' + projectId);
    }

    // Get project owner for usage tracking
    const projectData = projSnap.data();
    const projectOwner = projectData?.owner;

    // === Usage counters reset logic ===
    // Check and reset usage counters if needed (do this once at the start of scan)
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

    // === Run status transition ===
    // Mark the run as 'running' and set start timestamp
    const runRef = projectRef.collection('runs').doc(runId);
    await runRef.update({ status: 'running', startedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Get run doc data and list of page IDs to scan
    const runSnap = await runRef.get();
    if (!runSnap.exists) {
        throw new Error('Run not found: ' + runId);
    }
    const runData = runSnap.data() || {};
    let pagesIds = Array.isArray(runData.pagesIds) ? runData.pagesIds : [];

    // For pipeline jobs (collect pages -> scan), resolve target pages at run start.
    if (pagesIds.length === 0 && Boolean(runData.resolvePagesAtStart)) {
        const pagesSnap = await projectRef.collection('pages').get();
        pagesIds = pagesSnap.docs.map((d) => d.id);
        await runRef.update({
            pagesIds,
            pagesTotal: pagesIds.length,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    if (pagesIds.length === 0) {
        console.log('No pages to scan for run', runId);
        await runRef.update({ status: 'done', finishedAt: admin.firestore.FieldValue.serverTimestamp(), pagesScanned: 0 });
        return { ok: true, scanned: 0 };
    }

    // === Concurrency limiter setup ===
    // Limit the number of concurrent page scans (default 3, configurable)
    const concurrency = Number(process.env.SCAN_CONCURRENCY) || 3;
    const limit = pLimit(concurrency);

    // === Puppeteer/axe initialization and fallback ===
    // Try to initialize Puppeteer + axe-core for browser-based scans.
    // If unavailable, fall back to static HTML heuristics.
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

    // === Aggregate stats for the run ===
    const agg = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    let scannedCount = 0;

    /**
     * Pushes a normalized issue object into the issues array and increments aggregate counters.
     *
     * @param {Array} issues - The array to push the issue into
     * @param {string} impact - Impact level: 'critical', 'serious', 'moderate', or 'minor'
     * @param {string} message - Human-readable issue description
     * @param {string} [selector] - CSS selector or node identifier (optional)
     * @param {string} [ruleId] - Rule identifier (optional)
     * @param {string} [helpUrl] - Reference URL for more info (optional)
     * @param {string} [description] - Additional description (optional)
     * @param {Array} [tags] - Array of standards tags (e.g., ['wcag2a', 'wcag411']) (optional)
     * @param {string} [failureSummary] - Specific failure explanation for this node (optional)
     * @param {string} [html] - HTML snippet of the problematic element (optional)
     * @param {Array} [target] - CSS selector array from axe (optional)
     *
     * The issue object has the shape:
     *   { impact, message, selector, ruleId, helpUrl, description, tags, failureSummary, html, target }
     * Also increments the corresponding counter in agg.
     */
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

    // === Per-page scan flow (concurrent) ===
    // Each page is processed independently, including fetch/render, axe/static checks, snapshotting, and persistence.
    await Promise.all(pagesIds.map(pageId => limit(async () => {
        let pageRef = null;
        try {
            // Per-page metadata (snapshot, node rectangles, etc.).
            // IMPORTANT: must be per-page to avoid leaking data across pages.
            const pageInfo = {};

            pageRef = projectRef.collection('pages').doc(pageId);
            const pageSnap = await pageRef.get();
            if (!pageSnap.exists) {
                console.warn('Page doc not found for id', pageId);
                return;
            }
            const page = pageSnap.data();
            const pageUrl = page.url;

            try {
                await pageRef.update({
                    status: 'running',
                    activeRunId: runId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } catch (e) {
                console.warn('Failed to mark page as running for', pageId, e && e.message ? e.message : e);
            }

            const issues = [];
            let httpStatus = null;
            const removeCookieBannersEnabled = Boolean(
                projectData?.config?.removeCookieBanners && projectData.config.removeCookieBanners !== 'none'
            );

            if (usePuppeteer && browser) {
                let pageP = null;
                try {
                    pageP = await browser.newPage();
                    
                    // Set viewport to a standard desktop size to ensure consistent rendering and layout
                    await pageP.setViewport({ width: 1200, height: 900 });
                    await pageP.setDefaultNavigationTimeout(30000);
                    
                    // Inject cookies if configured in project settings
                    // MUST be done BEFORE navigation or by navigating to domain first
                    if (projectData?.config?.cookies && Array.isArray(projectData.config.cookies) && projectData.config.cookies.length > 0) {
                        try {
                            // Parse the page URL to get the domain
                            const urlObj = new URL(pageUrl);
                            const pageDomain = urlObj.hostname;
                            const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
                            
                            console.log(`========== COOKIE INJECTION DEBUG ==========`);
                            console.log(`Target URL: ${pageUrl}`);
                            console.log(`Base domain: ${baseUrl}`);
                            console.log(`Cookies to inject: ${projectData.config.cookies.length}`);
                            
                            // Navigate to base URL first to establish domain context
                            console.log(`Navigating to base URL: ${baseUrl}`);
                            await pageP.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch((err) => {
                                console.log('Initial navigation for cookies failed:', err.message);
                            });
                            
                            // Set each cookie
                            for (let i = 0; i < projectData.config.cookies.length; i++) {
                                const cookie = projectData.config.cookies[i];
                                console.log(`\n--- Cookie ${i + 1} ---`);
                                console.log(`Raw cookie data:`, cookie);
                                
                                // Clean up domain if it contains protocol or path
                                let cookieDomain = cookie.domain || pageDomain;
                                
                                // Remove protocol if present (https://, http://)
                                cookieDomain = cookieDomain.replace(/^https?:\/\//, '');
                                
                                // Remove path if present (everything after /)
                                cookieDomain = cookieDomain.split('/')[0];
                                
                                // Remove www. prefix to allow cookie on all subdomains
                                if (cookieDomain.startsWith('www.')) {
                                    cookieDomain = cookieDomain.substring(4); // Remove 'www.'
                                }
                                
                                // Add leading dot for subdomain sharing (unless already present)
                                if (!cookieDomain.startsWith('.')) {
                                    cookieDomain = '.' + cookieDomain;
                                }
                                
                                const cookieObj = {
                                    name: cookie.name,
                                    value: cookie.value,
                                    domain: cookieDomain,
                                    path: '/',
                                };
                                
                                console.log(`Cleaned cookie object:`, cookieObj);
                                
                                try {
                                    await pageP.setCookie(cookieObj);
                                    console.log(`✓ Cookie set successfully: ${cookie.name}`);
                                } catch (cookieErr) {
                                    console.error(`✗ Failed to set cookie ${cookie.name}:`, cookieErr.message);
                                }
                            }
                            
                            // Verify cookies were set
                            console.log(`\n--- Verifying cookies after setCookie ---`);
                            const cookiesAfterSet = await pageP.cookies();
                            console.log(`Total cookies in browser: ${cookiesAfterSet.length}`);
                            cookiesAfterSet.forEach(c => {
                                console.log(`  - ${c.name}=${c.value.substring(0, 50)}... (domain: ${c.domain})`);
                            });
                            
                            console.log(`========== END COOKIE INJECTION DEBUG ==========\n`);
                        } catch (cookieErr) {
                            console.warn('Failed to inject cookies:', cookieErr);
                        }
                    }
                    
                    // Use 'networkidle2' to wait for network to be mostly idle, so page is fully loaded
                    const resp = await pageP.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => null);

                    if (resp) httpStatus = resp.status();
                    
                    // Remove cookie banners if configured
                    if (removeCookieBannersEnabled) {
                        try {
                            const mode = projectData.config.removeCookieBanners;
                            console.log(`\n--- Removing cookie banners (mode: ${mode}) ---`);
                            const removed = await removeCookieBanners(pageP, mode);
                            console.log(`✓ Removed ${removed.length} cookie banner elements`);
                            if (removed.length > 0) {
                                removed.forEach((el, i) => {
                                    console.log(`  ${i + 1}. <${el.tag}> ${el.id ? `id="${el.id}"` : ''} ${el.class ? `class="${el.class.substring(0, 40)}..."` : ''}`);
                                });
                            }
                            console.log(`--- End banner removal ---\n`);
                        } catch (bannerErr) {
                            console.warn('Failed to remove cookie banners:', bannerErr);
                        }
                    }
                    
                    // Verify cookies after page load
                    if (projectData?.config?.cookies && Array.isArray(projectData.config.cookies) && projectData.config.cookies.length > 0) {
                        console.log(`\n--- Verifying cookies after page load ---`);
                        const cookiesAfterLoad = await pageP.cookies();
                        console.log(`Total cookies after page load: ${cookiesAfterLoad.length}`);
                        cookiesAfterLoad.forEach(c => {
                            console.log(`  - ${c.name}=${c.value.substring(0, 50)}... (domain: ${c.domain}, path: ${c.path})`);
                        });
                        
                        // Check if our specific cookies are present
                        for (const expectedCookie of projectData.config.cookies) {
                            const found = cookiesAfterLoad.find(c => c.name === expectedCookie.name);
                            if (found) {
                                console.log(`✓ Cookie "${expectedCookie.name}" is present in browser`);
                            } else {
                                console.log(`✗ Cookie "${expectedCookie.name}" NOT FOUND in browser!`);
                            }
                        }
                        console.log(`--- End cookie verification ---\n`);
                    }
                    // Ensure cookie banners are removed right before axe runs
                    if (removeCookieBannersEnabled) {
                        try {
                            await pageP.waitForTimeout(300);
                            await removeCookieBanners(pageP, projectData.config.removeCookieBanners);
                        } catch (bannerErr) {
                            console.warn('Failed to re-remove cookie banners before axe:', bannerErr);
                        }
                    }

                    // Inject axe-core into page context and run accessibility checks
                    if (axe && axe.source) {
                        await pageP.addScriptTag({ content: axe.source });
                        // Run axe with WCAG 2.0, 2.1, and best-practice checks for comprehensive coverage
                        const axeResults = await pageP.evaluate(async () => {
                            try {
                                return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
                            } catch (e) {
                                return { error: String(e) };
                            }
                        });
                        
                        if (axeResults && axeResults.violations) {
                            // Extra stability check for axe "list" findings:
                            // validate candidates against current DOM to reduce transient false positives.
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
                                
                                // one issue per node
                                v.nodes.forEach(node => {
                                    if (ruleId === 'list') {
                                        const verificationSelector = Array.isArray(node?.target) ? node.target[0] : null;
                                        if (verificationSelector && listValidationMap[verificationSelector] !== true) {
                                            return;
                                        }
                                    }
                                    // Use either the node's html or the joined target selectors for highlighting
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

                        // Ensure cookie banners are removed right before snapshot
                        if (removeCookieBannersEnabled) {
                            try {
                                await pageP.waitForTimeout(200);
                                await removeCookieBanners(pageP, projectData.config.removeCookieBanners);
                            } catch (bannerErr) {
                                console.warn('Failed to re-remove cookie banners before snapshot:', bannerErr);
                            }
                        }

                        // === Page snapshot and node highlight capture ===
                        try {
                            // Get the rendered HTML content and sanitize it inside the page context
                            // Remove scripts, noscript, and dangerous attributes before persisting
                            console.log('Before sanitizedHtml');
                            const sanitizedHtml = await pageP.evaluate(() => {
                                try {
                                    const clone = document.documentElement.cloneNode(true);
                                    // Remove scripts & noscript for safety
                                    clone.querySelectorAll('script, noscript').forEach(n => n.remove());
                                    // Remove potentially dangerous event attributes and javascript: hrefs
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
                            console.log('SanitizedHtml:', !!sanitizedHtml, sanitizedHtml ? sanitizedHtml.length : 0);

                            // Compute bounding rects and normalized selectors for each axe node in a single evaluate (faster)
                            // Selectors are chosen from axe node.target (prefer), or by matching html
                            const nodesForEvaluation = (axeResults && axeResults.violations) ? axeResults.violations.flatMap(v => v.nodes || []).map(n => ({ target: n.target, html: n.html })) : [];
                            console.log('Nodes for evaluation count:', nodesForEvaluation.length);
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
                                            // Truncate outerHTML to avoid Firestore nested entity limits (500 chars is enough for matching)
                                            const truncatedHtml = el.outerHTML ? el.outerHTML.substring(0, 500) : null;
                                            results.push({ selector, xpath: getXPathForElement(el), outerHTML: truncatedHtml, rect: { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height } });
                                        }
                                    } catch (e) {
                                        // Truncate HTML for fallback case too
                                        const truncatedHtml = n.html ? n.html.substring(0, 500) : null;
                                        results.push({ selector: selector || null, xpath: null, outerHTML: truncatedHtml, rect: null });
                                    }
                                });
                                return results;
                            }, nodesForEvaluation) : [];

                            // Upload HTML to Storage instead of storing in Firestore
                            if (sanitizedHtml) {
                                const storageUrl = await uploadHtmlToStorage(projectId, runId, pageId, sanitizedHtml);
                                if (storageUrl) {
                                    pageInfo.pageSnapshotUrl = storageUrl;
                                } else {
                                    // Fallback: store truncated HTML if storage upload fails
                                    console.warn('Storage upload failed, storing truncated HTML in Firestore');
                                    pageInfo.pageSnapshot = sanitizedHtml.substring(0, 500000); // Max 50KB
                                }
                            }
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
                            if (issueNodes && issueNodes.length) pageInfo.nodeInfo = issueNodes;

                        } catch (e) {
                            console.warn('Failed to capture sanitized snapshot / node rects', e);
                        }

                        
                    }

                    // Ablelytics core tests (Puppeteer/Playwright compatible checks)
                    let coreIssues = [];
                    let coreStats = null;
                    try {
                        if (removeCookieBannersEnabled) {
                            try {
                                await pageP.waitForTimeout(400);
                                await removeCookieBanners(pageP, projectData.config.removeCookieBanners);
                            } catch (bannerErr) {
                                console.warn('Failed to re-remove cookie banners:', bannerErr);
                            }
                        }
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
                                console.log('[ablelytics-core][timing]', JSON.stringify({
                                    projectId,
                                    runId,
                                    pageId,
                                    pageUrl,
                                    totalDurationMs: coreStats.totalDurationMs,
                                    checks: coreStats.checks
                                }));
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

                    // AI heuristics checks (content intent / meaning)
                    let aiIssues = [];
                    if (String(process.env.ENABLE_AI_HEURISTICS || '').toLowerCase() === '1') {
                        try {
                            const aiTests = new AblelyticsAiHeuristics(pageP);
                            aiIssues = await aiTests.runAll();
                            aiIssues.forEach((issue) => {
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
                                    issue.engine || 'ai-heuristics',
                                    issue.confidence,
                                    issue.needsReview,
                                    issue.evidence,
                                    issue.aiHowToFix
                                );
                            });
                        } catch (aiErr) {
                            console.warn('AI heuristics failed:', aiErr && aiErr.message ? aiErr.message : aiErr);
                        }
                    }

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
                                                if (elm.id) return `id(\"${elm.id}\")`;
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

                    // Also collect simple checks: title and html[lang]
                    try {
                        const meta = await pageP.evaluate(() => ({ title: document.title || '', lang: document.documentElement.lang || '' }));
                        if (!meta.title || meta.title.trim() === '') pushIssue(issues, 'critical', 'Missing or empty <title> element', null, null, null, null, [], null, null, null, 'ablelytics-core');
                        if (!meta.lang || meta.lang.trim() === '') pushIssue(issues, 'critical', 'Missing html[lang] attribute', null, null, null, null, [], null, null, null, 'ablelytics-core');
                    } catch (e) {
                        // ignore
                    }

                } catch (err) {
                    pushIssue(issues, 'critical', `Failed to render page in headless browser: ${String(err)}`, null, null, null, null, [], null, null, null, 'ablelytics-core');
                } finally {
                    try { if (pageP) await pageP.close(); } catch (e) { }
                }
            } else {
                // fallback static checks using fetchHtml + cheerio
                const pageData = await fetchHtml(pageUrl);
                httpStatus = pageData ? pageData.status : null;
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

            // === Persistence: store scan result per page in projects/{projectId}/scans ===
            const scansCol = projectRef.collection('scans');
            
            // Extract pageSnapshot, pageSnapshotUrl and nodeInfo to top level
            const { pageSnapshot, pageSnapshotUrl, pageScreenshotUrl, nodeInfo, coreTiming, ...restPageInfo } = pageInfo;
            
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
                // Store HTML snapshot URL from Cloud Storage (preferred) or truncated HTML (fallback)
                pageSnapshotUrl: pageSnapshotUrl || null,
                pageScreenshotUrl: pageScreenshotUrl || null,
                pageSnapshot: pageSnapshot || null,
                nodeInfo: nodeInfo || [],
                coreTiming: coreTiming || null,
                pageInfo: Object.keys(restPageInfo).length > 0 ? restPageInfo : null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await scansCol.add(scanDoc);

            // Maintain an org-scoped scan index for fast listing/filtering in UI.
            try {
                const organisationId = projectData?.organisationId || null;
                const scanIndexId = `${projectId}__${pageId}`;
                await db.collection('scanIndex').doc(scanIndexId).set({
                    projectId,
                    projectName: projectData?.name || projectData?.domain || projectId,
                    organisationId,
                    pageId,
                    url: pageUrl || null,
                    runId,
                    status: 'scanned',
                    summary: scanDoc.summary,
                    totalIssues:
                        Number(scanDoc.summary?.critical || 0) +
                        Number(scanDoc.summary?.serious || 0) +
                        Number(scanDoc.summary?.moderate || 0) +
                        Number(scanDoc.summary?.minor || 0),
                    lastScanned: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            } catch (e) {
                console.warn('Failed to update scan index for', pageId, e && e.message ? e.message : e);
            }

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

            // Update run counters
            scannedCount++;

            // Update page document with latest scan summary and metadata
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
                    activeRunId: null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                // If update fails, log and continue — do not fail the whole job for a single page metadata update
                console.warn('Failed to update page document with scan summary for', pageId, e && e.message ? e.message : e);
            }

            // Update aggregated counters on the run document
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

            try {
                const organisationId = projectData?.organisationId || null;
                const scanIndexId = `${projectId}__${pageId}`;
                await db.collection('scanIndex').doc(scanIndexId).set({
                    projectId,
                    projectName: projectData?.name || projectData?.domain || projectId,
                    organisationId,
                    pageId,
                    url: pageRef ? (await pageRef.get()).data()?.url || null : null,
                    runId,
                    status: 'failed',
                    summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
                    totalIssues: 0,
                    lastScanned: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            } catch (e) {
                console.warn('Failed to update failed scan index for', pageId, e && e.message ? e.message : e);
            }

            try {
                if (pageRef) {
                    await pageRef.update({
                        status: 'failed',
                        activeRunId: null,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            } catch (e) {
                console.warn('Failed to mark page as failed for', pageId, e && e.message ? e.message : e);
            }
        }
    })));

    // === Cleanup and finalization ===
    // Close browser if used
    try { if (browser) await browser.close(); } catch (e) { console.warn('Failed to close browser', e); }

    // Finalize run: mark done and attach aggregated stats
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

    try {
        const slackConfig = await getSlackConfigFromOrg(db, projectData?.organisationId);
        if (slackConfig) {
            await notifyScanFinished({
                projectId,
                projectName: (projectData && (projectData.name || projectData.domain)) || projectId,
                pagesScanned: scannedCount,
                agg,
            }, slackConfig);
        }
    } catch (e) {
        console.warn('Slack notification failed:', e && e.message ? e.message : e);
    }

    return { ok: true, scanned: scannedCount, agg };
}

/**
 * Determines if usage counters should be reset for a subscription.
 *
 * @param {Object} subscription - The subscription object from Firestore.
 *   Expects:
 *     - currentUsage.usagePeriodStart: Firestore Timestamp (start of current usage period)
 *     - currentPeriodStart: Firestore Timestamp (Stripe-provided billing period start, optional)
 * @param {Date} now - Current time
 * @returns {boolean} True if counters should be reset (new billing period or new day for daily counters)
 *
 * Reset rules:
 *   - If usagePeriodStart is missing, always reset.
 *   - If Stripe's currentPeriodStart is present and later than our usagePeriodStart, reset.
 *   - For daily counters (apiCallsToday), reset if usagePeriodStart is before today.
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
