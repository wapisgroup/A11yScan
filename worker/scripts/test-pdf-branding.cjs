/**
 * test-pdf-branding.cjs
 * Run with: node scripts/test-pdf-branding.cjs
 *
 * Generates a sample PDF using mock org branding and writes it to
 * local-artifacts/test-branding.pdf so you can open and inspect it.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Minimal mock of handleGenerateReport internals ──────────────────────────

// Expose the private helpers by reading the source and evaluating in a sandbox
// that exposes them. Simplest approach: re-require with a wrapper module.
// Instead, we just inline a thin driver that calls the exported handler with a
// mock Firestore db.

// ─── Mock Firestore ───────────────────────────────────────────────────────────

const MOCK_ORG = {
    primaryColor:   '#1a56db',   // blue header background
    secondaryColor: '#ffffff',   // white header text
    // Use a real public PNG so the logo fetch actually works
    customLogo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
};

const MOCK_PROJECT = {
    name: 'Test Project',
    domain: 'https://example.com',
    organisationId: 'org_test',
    config: { complianceProfiles: ['ada_title_ii_wcag21'] },
};

const MOCK_SCAN = {
    pageId: 'page_1',
    pageUrl: 'https://example.com/home',
    issues: [
        {
            ruleId: 'color-contrast',
            impact: 'serious',
            message: 'Elements must have sufficient color contrast',
            description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI',
            selector: 'h1.hero-title',
            html: '<h1 class="hero-title">Welcome</h1>',
            tags: ['wcag2aa', 'wcag143'],
        },
        {
            ruleId: 'image-alt',
            impact: 'critical',
            message: 'Images must have alternate text',
            description: 'Ensures img elements have alternate text or a role of none or presentation',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt?application=axeAPI',
            selector: 'img.logo',
            html: '<img class="logo" src="/logo.png">',
            tags: ['wcag2a', 'wcag111'],
        },
    ],
    summary: {},
};

function makeMockDb() {
    return {
        collection(name) {
            return {
                doc(id) {
                    return {
                        async get() {
                            if (name === 'organisations' && id === 'org_test') {
                                return { exists: true, data: () => MOCK_ORG };
                            }
                            if (name === 'projects') {
                                return { exists: true, data: () => MOCK_PROJECT };
                            }
                            return { exists: false, data: () => ({}) };
                        },
                        collection(sub) {
                            return {
                                async add(data) { return { id: 'report_1' }; },
                                async update(data) {},
                                doc(id2) {
                                    return {
                                        async get() {
                                            if (sub === 'runs') {
                                                return {
                                                    exists: true,
                                                    data: () => ({
                                                        pagesIds: ['page_1'],
                                                        meta: { title: 'Branding Test Report' },
                                                        reportType: 'full',
                                                        creatorId: 'user_1',
                                                    }),
                                                };
                                            }
                                            return { exists: false, data: () => ({}) };
                                        },
                                        async update() {},
                                    };
                                },
                                where() { return this; },
                                orderBy() { return this; },
                                limit() { return this; },
                                async get() {
                                    if (sub === 'scans') {
                                        return {
                                            empty: false,
                                            docs: [{
                                                data: () => ({
                                                    pageUrl: MOCK_SCAN.pageUrl,
                                                    issues: MOCK_SCAN.issues,
                                                    summary: {},
                                                }),
                                            }],
                                        };
                                    }
                                    return { empty: true, docs: [] };
                                },
                            };
                        },
                    };
                },
            };
        },
    };
}

// ─── Patch storage so we capture the PDF buffer instead of uploading ──────────

let capturedPdf = null;

// Monkey-patch require for @google-cloud/storage
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === '@google-cloud/storage') {
        return {
            Storage: class {
                bucket() {
                    return {
                        file() {
                            return {
                                async save(buf) { capturedPdf = buf; },
                                async getSignedUrl() { return ['http://localhost/test.pdf']; },
                            };
                        },
                    };
                }
            },
        };
    }
    if (request === '../helpers/slack') {
        return { notifyReportGenerated: async () => {}, getSlackConfigFromOrg: async () => null };
    }
    return originalLoad.apply(this, arguments);
};

// Stub admin
const admin = {
    firestore: {
        FieldValue: { serverTimestamp: () => new Date() },
    },
    app() { return { options: { storageBucket: 'test-bucket' } }; },
};
Module._load = (function (orig) {
    return function (request, parent, isMain) {
        if (request === 'firebase-admin') return admin;
        return orig.apply(this, arguments);
    };
})(Module._load);

// ─── Run ──────────────────────────────────────────────────────────────────────

(async () => {
    console.log('Loading handler...');
    const { handleGenerateReport } = require('../handlers/generateReport');

    const mockDb = makeMockDb();

    console.log('Running handleGenerateReport with mock data...');
    try {
        const result = await handleGenerateReport(mockDb, 'project_1', 'run_1');
        console.log('Result:', result);
    } catch (err) {
        console.error('handleGenerateReport threw:', err.message);
        // The handler may throw trying to send email etc — we only care about the PDF
    }

    if (!capturedPdf) {
        console.error('❌ No PDF was captured — check the storage mock.');
        process.exit(1);
    }

    const outDir = path.join(__dirname, '../local-artifacts');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'test-branding.pdf');
    fs.writeFileSync(outPath, capturedPdf);
    console.log(`\n✅ PDF written to: ${outPath}`);
    console.log('   Open it to verify header color and logo are applied.');
})();
