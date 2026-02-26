// ---------- structured sitemap helpers ----------
const {URL} = require("url");

// Build a nested tree from pages (pages = nodes array with { id:url, title })
function buildSitemapTree(pages, options = {}) {
    const { maxDepth = 10, stripQuery = true } = options;

    // root node
    const root = { name: '', path: '/', pages: [], children: {} };

    for (const p of pages) {
        let u;
        try {
            u = new URL(p.id);
        } catch (err) {
            // skip invalid urls
            console.error(err);
            continue;
        }

        // optionally strip query and hash
        let pathname = u.pathname || '/';
        if (stripQuery) {
            // leave pathname only (query removed already)
        }

        // split segments, ignore empty, guard depth
        const segments = pathname.split('/').filter(Boolean).slice(0, maxDepth);

        let node = root;
        let curPath = '';
        // if no segments -> page at root
        if (segments.length === 0) {
            node.pages.push({ url: p.id, title: p.title });
        } else {
            for (const seg of segments) {
                curPath += '/' + seg;
                if (!node.children[seg]) {
                    node.children[seg] = { name: seg, path: curPath, pages: [], children: {} };
                }
                node = node.children[seg];
            }
            node.pages.push({ url: p.id, title: p.title });
        }
    }

    // convert children maps to arrays recursively
    function convert(node) {
        const childrenArr = Object.values(node.children).map(convert);
        return {
            name: node.name,
            path: node.path,
            pages: node.pages,
            children: childrenArr
        };
    }

    return convert(root);
}

// optional: flatten tree to a list of nodes with depth info
function treeToList(tree) {
    const out = [];
    function walk(node, depth = 0) {
        out.push({
            name: node.name,
            path: node.path,
            pagesCount: (node.pages && node.pages.length) || 0,
            depth
        });
        for (const ch of node.children || []) walk(ch, depth + 1);
    }
    walk(tree, 0);
    return out;
}

async function uploadTreeJson(admin, treeJson, treePath) {
    // Use admin.storage() — already initialized correctly for both emulator and production.
    // This avoids needing a separate @google-cloud/storage client with separate credentials.
    const bucketName = admin.app().options?.storageBucket
        || process.env.STORAGE_BUCKET
        || process.env.STORAGE_BUCKET_NAME;
    if (!bucketName) throw new Error('No storage bucket configured (set admin app storageBucket or STORAGE_BUCKET env)');

    const bucket = admin.storage().bucket(bucketName);
    // ensure treePath doesn't start with leading slash
    const objectPath = treePath.replace(/^\/+/, '');
    const file = bucket.file(objectPath);

    // Upload the JSON
    await file.save(treeJson, { contentType: 'application/json' });

    // Return a usable download URL depending on emulator vs production
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        return `http://${host}/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media`;
    } else {
        // Production: Firebase download token (non-expiring, browser-accessible, CORS-friendly)
        const { randomUUID } = require('crypto');
        const downloadToken = randomUUID();
        await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: downloadToken } });
        return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
    }
}

module.exports = {
    buildSitemapTree,
    treeToList,
    uploadTreeJson
}