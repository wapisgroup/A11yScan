// crawler.js
const puppeteer = require('puppeteer');
const AxeBuilder = require('@axe-core/puppeteer').default;
const { URL } = require('url');

async function runAxeOnPage(page) {
    const result = await new AxeBuilder({ page }).analyze();
    return result;
}

function normalizeUrl(u) {
    // remove hash and query for crawling purposes, keep origin+pathname
    try {
        const url = new URL(u);
        url.hash = '';
        url.search = '';
        return url.origin + url.pathname.replace(/\/$/, ''); // strip trailing slash
    } catch (e) {
        return null;
    }
}

async function crawlAndTest(startUrl, opts = {}) {
    const maxPages = opts.maxPages || 100;
    const progressCb = opts.progressCb || (() => {});
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const domain = new URL(startUrl).hostname;
    const queue = [startUrl];
    const visited = new Set();
    const results = {}; // url -> { results: axeResult } or { error: '...' }

    while (queue.length && visited.size < maxPages) {
        const url = queue.shift();
        const norm = normalizeUrl(url);
        if (!norm || visited.has(norm)) continue;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            // run axe
            const axeRes = await runAxeOnPage(page);
            results[norm] = { url: norm, results: axeRes };

            // extract links
            const links = await page.$$eval('a[href]', els => els.map(a => a.href).filter(Boolean));
            for (const l of links) {
                try {
                    const u = new URL(l, url);
                    if (u.hostname === domain) {
                        const n = normalizeUrl(u.href);
                        if (n && !visited.has(n) && !queue.includes(n) && visited.size + queue.length < maxPages) {
                            queue.push(n);
                        }
                    }
                } catch (e) { /* ignore invalid URLs */ }
            }
        } catch (err) {
            results[norm || url] = { url: norm || url, error: String(err) };
        }

        visited.add(norm || url);
        await progressCb({ processed: visited.size, url: norm || url });
    }

    await browser.close();
    return results;
}

module.exports = { crawlAndTest };