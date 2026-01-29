// ---------- structured sitemap helpers ----------
const {URL} = require("url");
const { Storage } = require('@google-cloud/storage');

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
    // Decide bucket name (prefer admin app bucket, else env)
    const bucketName = admin.app().options?.storageBucket || process.env.STORAGE_BUCKET || process.env.STORAGE_BUCKET_NAME || process.env.STORAGE_BUCKET;
    if (!bucketName) throw new Error('No storage bucket configured (set admin app bucket or STORAGE_BUCKET env)');

    // Create Storage client differently for emulator vs real GCS
    let storageClient;
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        // FIREBASE_STORAGE_EMULATOR_HOST may be like "localhost:9199" or "http://localhost:9199"
        console.log('FIREBASE_STORAGE_EMULATOR_HOST may be like "localhost:9199" or "http://localhost:9199"')
        let host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        const apiEndpoint = `http://${host}`; // @google-cloud/storage expects protocol in apiEndpoint
        // Provide projectId to the client so it doesn't try to fetch metadata
        console.log({ apiEndpoint, projectId: process.env.GCLOUD_PROJECT || 'local-project' })
        storageClient = new Storage({ apiEndpoint, projectId: process.env.GCLOUD_PROJECT || 'local-project' });
        console.log('[storage] configured to use emulator at', apiEndpoint);
    } else {
        storageClient = new Storage(); // production
    }

    console.log('storageClient',storageClient);
    const bucket = storageClient.bucket(bucketName);
    // ensure treePath doesn't start with leading slash
    const objectPath = treePath.replace(/^\/+/, '');

    // Upload the JSON
    await bucket.file(objectPath).save(treeJson, { contentType: 'application/json' });

    // Return a usable download URL depending on emulator vs real
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        // direct emulator download endpoint (no signed URLs)
        const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        const emulatorUrl = `http://${host}/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media`;
        return emulatorUrl;
    } else {
        // production: attempt signed URL (7 days)
        const [signedUrl] = await bucket.file(objectPath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7
        });
        return signedUrl;
    }
}

module.exports = {
    buildSitemapTree,
    treeToList,
    uploadTreeJson
}