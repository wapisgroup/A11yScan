const url = require("url");

async function fetchHtml(u) {
    try {
        const res = await fetch(u, { redirect: 'follow', timeout: 20000, headers: { 'User-Agent': 'A11yScan-SitemapBot/1.0' } });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html')) return null;
        const text = await res.text();
        return { text, status: res.status };
    } catch (err) {
        console.warn('fetch error', u, err && err.message);
        return null;
    }
}

function normalizeUrl(base, href) {
    try {
        const resolved = new url.URL(href, base);
        // strip fragment
        resolved.hash = '';
        // remove trailing slash normalization: keep trailing slash? We'll normalize removing trailing slash unless root
        let out = resolved.toString();
        if (out.endsWith('/') && out !== `${resolved.origin}/`) out = out.slice(0, -1);
        return out;
    } catch (e) {
        return null;
    }
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}


module.exports = {
    fetchHtml,
    normalizeUrl,
    escapeXml
}