/**
 * handleGenerateReport
 * --------------------
 * Phase 8: Replaced Firebase/Firestore reads and writes with REST API calls.
 * PDF generation logic (pdfmake, groupViolations, etc.) is unchanged.
 *
 * Org branding customisation (colours / logo) is not available in Phase 8
 * as there is no branding API endpoint yet — report uses default branding.
 * Email notifications (previously via Firestore mail extension) are omitted.
 */

const { notifyReportGenerated } = require('../helpers/slack');
const PdfPrinter = require('pdfmake');
const { AccessibilityRulesService } = require('@wapisgroup/accessibility-rules');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const {
    getProject,
    getPages,
    getRun,
    updateRun,
    getScans,
    getReports,
    updateReport,
} = require('../helpers/api-client');
const { uploadAndGetSignedUrl } = require('../helpers/storage');

const DEFAULT_COMPLIANCE_PROFILES = ['ada_title_ii_wcag21'];
const COMPLIANCE_PROFILE_LABELS = {
    ada_title_ii_wcag21: 'ADA Title II (WCAG 2.1 A/AA)',
    section_508_wcag20: 'Section 508 (WCAG 2.0 A/AA)',
    en_301_549_web: 'EN 301 549 (WCAG 2.1 A/AA)',
    wcag22: 'WCAG 2.2 Level A/AA'
};

const rulesDirectory = path.join(
  process.cwd(),
  'node_modules/@wapisgroup/accessibility-rules/rules'
);

// Create instance with explicit path to avoid Next.js __dirname transformation
const rulesService = new AccessibilityRulesService(rulesDirectory);

const LOGO_PNG_PATH = path.join(__dirname, '../assets/logo.png');
const LOGO_SVG_PATH = path.join(__dirname, '../assets/logo.svg');
let LOGO_PNG_DATA_URL = null;
let LOGO_SVG_NORMALIZED = null;
try {
    const pngBuf = fs.readFileSync(LOGO_PNG_PATH);
    LOGO_PNG_DATA_URL = `data:image/png;base64,${pngBuf.toString('base64')}`;
} catch {
    // no PNG — try SVG below
}
if (!LOGO_PNG_DATA_URL) {
    try {
        const svgStr = fs.readFileSync(LOGO_SVG_PATH, 'utf8');
        LOGO_SVG_NORMALIZED = normalizeSvgForPdfmake(svgStr);
    } catch (err) {
        console.warn('Failed to load built-in logo:', err && err.message ? err.message : err);
    }
}


async function loadRuleDescriptions(ruleIds) {
    const uniqueIds = Array.from(new Set(ruleIds.filter(Boolean)));
    if (!uniqueIds.length) return new Map();

    const results = await Promise.all(
        uniqueIds.map(async (ruleId) => {
            try {
                console.log('Loading rule for ID:', ruleId);
                const rule = await rulesService.getRule(ruleId);
                console.log('Loaded rule:', ruleId, rule ? rule.whyItMatters : 'null');
                return [ruleId, rule];
            } catch (err) {
                return [ruleId, null];
            }
        })
    );

    const map = new Map();
    results.forEach(([ruleId, rule]) => {
        console.log(`Rule ID: ${ruleId}, Found: ${!!rule}`);
        if (rule) map.set(ruleId, rule);
    });

    return map;
}

function loadStandardsMatrix() {
    try {
        const matrixPath = path.join(__dirname, '../../knowledgebase/standards-matrix.json');
        const raw = fs.readFileSync(matrixPath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.warn('Failed to load standards matrix:', err && err.message ? err.message : err);
        return null;
    }
}

function normalizeComplianceProfiles(input) {
    if (!Array.isArray(input) || input.length === 0) return DEFAULT_COMPLIANCE_PROFILES;
    const unique = Array.from(new Set(input.filter(Boolean)));
    return unique.length ? unique : DEFAULT_COMPLIANCE_PROFILES;
}

function formatComplianceProfiles(profiles) {
    return profiles.map((profile) => COMPLIANCE_PROFILE_LABELS[profile] || profile).join(', ');
}

function extractScIdsFromTags(tags) {
    if (!Array.isArray(tags)) return [];
    const ids = new Set();

    tags.forEach((tag) => {
        if (typeof tag !== 'string') return;
        const match = tag.match(/^wcag(\d{3,4})$/i);
        if (!match) return;
        const digits = match[1].split('');
        if (digits.length < 3) return;
        const major = digits[0];
        const minor = digits[1];
        const rest = digits.slice(2).join('');
        const sc = `${major}.${minor}.${Number(rest)}`;
        if (!Number.isNaN(Number(rest))) ids.add(sc);
    });

    return Array.from(ids);
}

function stripInlineMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1');
}

function buildCodeBlock(text) {
    return {
        table: {
            widths: ['*'],
            body: [[{
                text,
                style: 'codeBlock',
                margin: [8, 6, 8, 6]
            }]]
        },
        layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
            fillColor: () => '#1E1E1E'
        },
        margin: [0, 4, 0, 6]
    };
}

function markdownToPdfBlocks(markdown, styles) {
    if (!markdown) return [];
    const lines = String(markdown).split(/\r?\n/);
    const blocks = [];
    let inCode = false;
    let codeLines = [];
    let currentList = null;

    const flushList = () => {
        if (currentList && currentList.items.length) {
            blocks.push({ ul: currentList.items, style: styles.listStyle });
        }
        currentList = null;
    };

    lines.forEach((rawLine) => {
        const line = rawLine.trimEnd();
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('```')) {
            if (inCode) {
                blocks.push({
                    ...buildCodeBlock(codeLines.join('\n')),
                    style: styles.codeStyle
                });
                codeLines = [];
                inCode = false;
            } else {
                flushList();
                inCode = true;
            }
            return;
        }

        if (inCode) {
            codeLines.push(rawLine);
            return;
        }

        if (!trimmedLine) {
            flushList();
            blocks.push({ text: '', margin: [0, 2, 0, 2] });
            return;
        }

        const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const headingText = stripInlineMarkdown(headingMatch[2]);
            blocks.push({
                text: headingText,
                style: level === 1 ? styles.h2Style : level === 2 ? styles.h3Style : styles.h4Style,
                margin: [0, 6, 0, 4]
            });
            return;
        }

        const listMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
        if (listMatch) {
            if (!currentList) {
                currentList = { items: [] };
            }
            currentList.items.push(stripInlineMarkdown(listMatch[1]));
            return;
        }

        flushList();
        blocks.push({
            text: stripInlineMarkdown(trimmedLine),
            style: styles.paragraphStyle,
            margin: [0, 2, 0, 2]
        });
    });

    flushList();
    if (codeLines.length) {
        blocks.push({
            ...buildCodeBlock(codeLines.join('\n')),
            style: styles.codeStyle
        });
    }

    return blocks;
}

function getScScope(standardsMatrix, profiles) {
    const inScope = new Set();
    const criteria = standardsMatrix?.successCriteria || [];

    criteria.forEach((sc) => {
        const isActive = sc.status === 'active';
        const isInScope = profiles.some((profile) => {
            if (profile === 'wcag22') {
                return isActive;
            }
            const mapping = sc.mapping && sc.mapping[profile];
            return mapping && mapping.in_scope === true;
        });

        if (isInScope) {
            inScope.add(sc.id);
        }
    });

    return inScope;
}

function buildScIssueIndex(allScans) {
    const index = new Map();

    allScans.forEach((scan) => {
        (scan.issues || []).forEach((issue) => {
            const scIds = extractScIdsFromTags(issue.tags);
            scIds.forEach((scId) => {
                index.set(scId, (index.get(scId) || 0) + 1);
            });
        });
    });

    return index;
}

/**
 * Normalise an SVG string for pdfmake's renderer.
 * pdfmake processes SVG linearly, so <defs> must appear before any element
 * that references them.
 */
function normalizeSvgForPdfmake(svgString) {
    const defs = [];
    const withoutDefs = svgString.replace(/<defs[\s\S]*?<\/defs>/gi, (match) => {
        defs.push(match);
        return '';
    });
    if (!defs.length) return svgString;
    return withoutDefs.replace(/(<svg[^>]*>)/, `$1${defs.join('')}`);
}

/**
 * Fetch a URL following up to `maxRedirects` redirects.
 * Returns { buffer, contentType } or null on failure.
 */
function fetchUrl(url, maxRedirects = 5) {
    return new Promise((resolve) => {
        const attempt = (currentUrl, remaining) => {
            const lib = currentUrl.startsWith('https') ? require('https') : require('http');
            lib.get(currentUrl, (res) => {
                if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location && remaining > 0) {
                    res.resume();
                    attempt(res.headers.location, remaining - 1);
                    return;
                }
                if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
                const contentType = res.headers['content-type'] || 'image/png';
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
                res.on('error', () => resolve(null));
            }).on('error', () => resolve(null));
        };
        attempt(url, maxRedirects);
    });
}

/**
 * Org branding — returns defaults since there is no branding API endpoint in Phase 8.
 * Custom logo / colours will be available once a GET /api/v2/organisations/:id endpoint
 * is added in a future phase.
 */
async function loadOrgBranding() {
    return { primaryColor: null, secondaryColor: null, logoDataUrl: null, logoSvg: null };
}

/**
 * Group violations by impact level and rule ID
 */
function groupViolations(allScans, inScopeScIds) {
    const grouped = {
        critical: {},
        serious: {},
        moderate: {},
        minor: {}
    };

    allScans.forEach(scan => {
        const pageUrl = scan.pageUrl;
        (scan.issues || []).forEach(issue => {
            const scIds = extractScIdsFromTags(issue.tags);
            if (inScopeScIds && scIds.length > 0) {
                const hasInScope = scIds.some((scId) => inScopeScIds.has(scId));
                if (!hasInScope) return;
            }
            const rawImpact = issue.impact || 'moderate';
            const impact = ['critical', 'serious', 'moderate', 'minor'].includes(rawImpact) ? rawImpact : 'moderate';
            const message = issue.message || 'Unknown issue';
            const ruleId = issue.ruleId || 'unknown';
            const selector = issue.selector || '';
            const html = issue.html || '';
            const helpUrl = issue.helpUrl || '';
            const description = issue.description || '';
            const engine = issue.engine || null;

            const key = `${ruleId}|||${message}`;

            if (!grouped[impact][key]) {
                grouped[impact][key] = {
                    ruleId,
                    message,
                    description,
                    helpUrl,
                    selector,
                    pages: [],
                    occurrences: [],
                    engines: []
                };
            }

            if (engine && !grouped[impact][key].engines.includes(engine)) {
                grouped[impact][key].engines.push(engine);
            }

            if (!grouped[impact][key].pages.includes(pageUrl)) {
                grouped[impact][key].pages.push(pageUrl);
            }

            const occurrenceKey = `${selector}|||${html}|||${pageUrl}`;
            if (!grouped[impact][key].occurrences.some((o) => o.key === occurrenceKey)) {
                grouped[impact][key].occurrences.push({
                    key: occurrenceKey,
                    pageUrl,
                    selector,
                    html
                });
            }
        });
    });

    return grouped;
}

/**
 * Generate PDF report
 */
async function generatePDF(projectData, runData, groupedViolations, reportTitle, complianceProfiles, standardsMatrix, scIssueIndex, inScopeScIds, ruleDataById, orgBranding) {
    return new Promise((resolve, reject) => {
        try {
            const fonts = {
                Roboto: {
                    normal: path.join(__dirname, '../fonts/Roboto_Condensed-Regular.ttf'),
                    bold: path.join(__dirname, '../fonts/Roboto_Condensed-SemiBold.ttf'),
                    italics: path.join(__dirname, '../fonts/Roboto_Condensed-Italic.ttf'),
                    bolditalics: path.join(__dirname, '../fonts/Roboto_Condensed-SemiBoldItalic.ttf')
                }
            };

            const printer = new PdfPrinter(fonts);
            const profilesLabel = formatComplianceProfiles(complianceProfiles);
            const reportDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const stats = {
                critical: Object.keys(groupedViolations.critical).length,
                serious: Object.keys(groupedViolations.serious).length,
                moderate: Object.keys(groupedViolations.moderate).length,
                minor: Object.keys(groupedViolations.minor).length
            };
            const totalIssues = stats.critical + stats.serious + stats.moderate + stats.minor;

            const criteria = standardsMatrix?.successCriteria || [];
            const standardsLabels = {
                ada_title_ii_wcag21: 'ADA',
                section_508_wcag20: '508',
                en_301_549_web: 'EN 301 549'
            };

            const getStandardsScopeLabel = (sc) => {
                const labels = [];
                if (sc.mapping?.ada_title_ii_wcag21?.in_scope) labels.push(standardsLabels.ada_title_ii_wcag21);
                if (sc.mapping?.section_508_wcag20?.in_scope) labels.push(standardsLabels.section_508_wcag20);
                if (sc.mapping?.en_301_549_web?.in_scope) labels.push(standardsLabels.en_301_549_web);
                return labels.length ? labels.join(', ') : '—';
            };

            const getOutOfScopeReason = (sc) => {
                const reasons = [];
                complianceProfiles.forEach((profile) => {
                    if (profile === 'wcag22') {
                        if (sc.status !== 'active') {
                            reasons.push('Removed or obsolete in WCAG 2.2');
                        }
                        return;
                    }

                    const mapping = sc.mapping && sc.mapping[profile];
                    if (!mapping) {
                        reasons.push('Not covered by selected standard');
                        return;
                    }
                    if (mapping.in_scope === false) {
                        reasons.push(mapping.reason || 'Not required by selected standard');
                    }
                });

                const uniqueReasons = Array.from(new Set(reasons.filter(Boolean)));
                return uniqueReasons.length ? uniqueReasons.join('; ') : 'Not in selected profiles';
            };

            const scRows = criteria.map((sc) => {
                const inScope = inScopeScIds?.has(sc.id);
                if (!inScope) {
                    return {
                        ...sc,
                        status: 'N/A',
                        scopeLabel: getStandardsScopeLabel(sc),
                        outOfScopeReason: getOutOfScopeReason(sc)
                    };
                }

                const issueCount = scIssueIndex.get(sc.id) || 0;
                const scopeLabel = getStandardsScopeLabel(sc);
                if (issueCount > 0) {
                    return { ...sc, status: 'Fail', scopeLabel, outOfScopeReason: null };
                }
                if (sc.testability === 'Manual') {
                    return { ...sc, status: 'Manual', scopeLabel, outOfScopeReason: null };
                }
                return { ...sc, status: 'Pass', scopeLabel, outOfScopeReason: null };
            });

            const severityDefs = [
                {
                    level: 'Critical',
                    color: '#DC2626',
                    desc: 'Issues that completely block access to content or functionality for users with disabilities. These must be fixed immediately as they violate WCAG Level A requirements.'
                },
                {
                    level: 'Serious',
                    color: '#F97316',
                    desc: 'Significant barriers that make content very difficult to access. These issues may prevent users from completing important tasks and should be prioritized for fixing.'
                },
                {
                    level: 'Moderate',
                    color: '#F59E0B',
                    desc: 'Issues that cause noticeable difficulties but don\'t completely prevent access. While workarounds may exist, these should still be addressed to improve user experience.'
                },
                {
                    level: 'Minor',
                    color: '#3B82F6',
                    desc: 'Issues that cause minor inconveniences but don\'t significantly impact accessibility. These are best practices that should be implemented when possible.'
                }
            ];

            const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
            const impactColors = {
                critical: '#DC2626',
                serious: '#F97316',
                moderate: '#F59E0B',
                minor: '#3B82F6'
            };
            const impactLabels = {
                critical: 'Critical Issues',
                serious: 'Serious Issues',
                moderate: 'Moderate Issues',
                minor: 'Minor Issues'
            };

            const content = [];

            content.push({ text: 'Accessibility Report', style: 'title', alignment: 'center', margin: [0, 60, 0, 12] });
            content.push({ text: reportTitle, style: 'subtitle', alignment: 'center' });
            content.push({ text: '', margin: [0, 12, 0, 0] });
            content.push({ text: `Generated on ${reportDate}`, style: 'smallMuted', alignment: 'center', margin: [0, 8, 0, 0] });
            content.push({ text: `Compliance profiles: ${profilesLabel}`, style: 'smallMuted', alignment: 'center', margin: [0, 6, 0, 0] });
            content.push({ text: '', pageBreak: 'after' });

            content.push({ text: 'About This Report', style: 'h1', margin: [0, 10, 0, 8] });
            content.push({
                text: 'This accessibility report provides a comprehensive analysis of web accessibility issues found on your website. ' +
                      'The report follows the selected compliance profiles and identifies barriers that may prevent people with disabilities ' +
                      'from accessing your content.',
                style: 'body'
            });
            content.push({ text: 'Understanding Issue Severity', style: 'h2', margin: [0, 18, 0, 6] });
            severityDefs.forEach((def) => {
                content.push({
                    text: [
                        { text: def.level + ': ', color: def.color, bold: true },
                        { text: def.desc, color: '#475569' }
                    ],
                    style: 'small',
                    margin: [0, 6, 0, 0]
                });
            });
            content.push({ text: '', pageBreak: 'after' });

            content.push({ text: 'Executive Summary', style: 'h1', margin: [0, 10, 0, 8] });
            content.push({ text: `Total Issues Found: ${totalIssues}`, style: 'body' });
            content.push({ text: `Critical: ${stats.critical}`, style: 'h2', color: '#DC2626', margin: [0, 10, 0, 0] });
            content.push({ text: `Serious: ${stats.serious}`, style: 'h2', color: '#F97316', margin: [0, 4, 0, 0] });
            content.push({ text: `Moderate: ${stats.moderate}`, style: 'h2', color: '#F59E0B', margin: [0, 4, 0, 0] });
            content.push({ text: `Minor: ${stats.minor}`, style: 'h2', color: '#3B82F6', margin: [0, 4, 0, 0] });
            content.push({ text: `Profiles: ${profilesLabel}`, style: 'smallMuted', margin: [0, 10, 0, 0] });
            content.push({ text: '', pageBreak: 'after' });

            if (standardsMatrix && inScopeScIds) {
                content.push({ text: 'Success Criteria Summary', style: 'h1', margin: [0, 10, 0, 6] });
                content.push({
                    text: 'Pass, fail, manual, and not applicable status for each success criterion in scope.',
                    style: 'smallMuted',
                    margin: [0, 0, 0, 10]
                });

                const tableBody = [
                    [
                        { text: 'SC', style: 'tableHeader' },
                        { text: 'Level', style: 'tableHeader' },
                        { text: 'Status', style: 'tableHeader' },
                        { text: 'Standards / Notes', style: 'tableHeader' },
                        { text: 'Title', style: 'tableHeader' }
                    ]
                ];

                scRows.forEach((row) => {
                    const scopeText = row.status === 'N/A'
                        ? `Not applicable: ${row.outOfScopeReason || 'Not in scope'}`
                        : row.scopeLabel || '—';

                    const statusColor = row.status === 'Fail' ? '#DC2626'
                        : row.status === 'Manual' ? '#F59E0B'
                        : row.status === 'Pass' ? '#16A34A'
                        : '#94A3B8';

                    tableBody.push([
                        { text: row.id, style: 'tableCell' },
                        { text: row.level || '-', style: 'tableCell' },
                        { text: row.status, style: 'tableCell', color: statusColor },
                        { text: scopeText, style: 'tableCell' },
                        { text: row.title, style: 'tableCell' }
                    ]);
                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: [42, 32, 44, 150, '*'],
                        body: tableBody
                    },
                    layout: {
                        hLineColor: '#E2E8F0',
                        vLineColor: '#E2E8F0',
                        paddingLeft: () => 6,
                        paddingRight: () => 6,
                        paddingTop: () => 4,
                        paddingBottom: () => 4
                    }
                });
            }

            impactOrder.forEach((impact) => {
                const issues = groupedViolations[impact];
                const issueKeys = Object.keys(issues);

                if (issueKeys.length === 0) return;

                content.push({ text: impactLabels[impact], style: 'h1', color: impactColors[impact], pageBreak: 'before' });
                content.push({
                    text: `${issueKeys.length} unique issue${issueKeys.length !== 1 ? 's' : ''} found`,
                    style: 'bodyMuted',
                    margin: [0, 0, 0, 10]
                });

                issueKeys.forEach((key, index) => {
                    const issue = issues[key];
                    const publicWebsiteDomain = process.env.PUBLIC_WEBSITE_DOMAIN || '';
                    const trimmedDomain = publicWebsiteDomain.replace(/\/$/, '');
                    const ruleUrl = issue.ruleId && trimmedDomain ? `${trimmedDomain}/accessibility-rules/${issue.ruleId}` : null;

                    const stack = [
                        { text: `${index + 1}. ${issue.message}`, style: 'bodyBold', margin: [0, 0, 0, 4] }
                    ];

                    if (issue.ruleId && issue.ruleId !== 'unknown') {
                        stack.push({ text: `Rule: ${issue.ruleId}`, style: 'small', color: '#8B5CF6' });
                    }

                    if (issue.engines && issue.engines.length) {
                        const engineLabel = issue.engines.length === 1 ? 'Engine' : 'Engines';
                        stack.push({ text: `${engineLabel}: ${issue.engines.join(', ')}`, style: 'smallMuted' });
                    }

                    const ruleDetails = issue.ruleId ? ruleDataById?.get(issue.ruleId) : null;
                    const whyItMatters = ruleDetails?.whyItMatters || null;
                    const ruleDescription = ruleDetails?.ruleDescription || null;

                    if (ruleDescription) {
                        stack.push({ text: 'Rule description:', style: 'smallMuted', margin: [0, 6, 0, 0] });
                        const blocks = markdownToPdfBlocks(ruleDescription, {
                            paragraphStyle: 'small',
                            listStyle: 'small',
                            codeStyle: 'code',
                            h2Style: 'h3',
                            h3Style: 'h4',
                            h4Style: 'h4'
                        });
                        stack.push(...blocks);
                    }

                    if (whyItMatters) {
                        stack.push({ text: 'Why it matters:', style: 'smallMuted', margin: [0, 6, 0, 0] });
                        const blocks = markdownToPdfBlocks(whyItMatters, {
                            paragraphStyle: 'small',
                            listStyle: 'small',
                            codeStyle: 'code',
                            h2Style: 'h3',
                            h3Style: 'h4',
                            h4Style: 'h4'
                        });
                        stack.push(...blocks);
                    }

                    if (ruleUrl) {
                        stack.push({
                            text: [
                                { text: 'Learn more: ', color: '#2563EB' },
                                { text: ruleUrl, link: ruleUrl, color: '#3B82F6' }
                            ],
                            style: 'small'
                        });
                    } else if (issue.helpUrl) {
                        stack.push({
                            text: [
                                { text: 'Learn more: ', color: '#2563EB' },
                                { text: issue.helpUrl, link: issue.helpUrl, color: '#3B82F6' }
                            ],
                            style: 'small'
                        });
                    }

                    if (issue.occurrences && issue.occurrences.length) {
                        const codeMap = new Map();
                        issue.occurrences.forEach((occurrence) => {
                            const codeText = occurrence.html || occurrence.selector || '';
                            if (!codeText) return;
                            const existing = codeMap.get(codeText) || { pages: [] };
                            if (occurrence.pageUrl && !existing.pages.includes(occurrence.pageUrl)) {
                                existing.pages.push(occurrence.pageUrl);
                            }
                            codeMap.set(codeText, existing);
                        });

                        const codeEntries = Array.from(codeMap.entries());
                        stack.push({ text: `Affected code (${codeEntries.length}):`, style: 'smallMuted', margin: [0, 8, 0, 2] });

                        codeEntries.forEach(([codeText, data], codeIndex) => {
                            const pages = data.pages || [];
                            const pagesToShow = pages.slice(0, 3);
                            stack.push({ text: `Code snippet ${codeIndex + 1}`, style: 'tinyMuted', margin: [0, 4, 0, 2] });
                            stack.push(buildCodeBlock(codeText.substring(0, 500)));
                            if (pagesToShow.length) {
                                stack.push({ text: pagesToShow.join(', '), style: 'tiny' });
                            }
                            if (pages.length > pagesToShow.length) {
                                stack.push({ text: `... and ${pages.length - pagesToShow.length} more pages`, style: 'tinyMuted' });
                            }
                        });
                    } else if (issue.selector && issue.selector.trim()) {
                        stack.push({ text: 'Selector:', style: 'smallMuted', margin: [0, 6, 0, 0] });
                        stack.push(buildCodeBlock(issue.selector.substring(0, 500)));
                    }

                    const pagesToShow = issue.pages.slice(0, 5);
                    stack.push({ text: `Affected pages (${issue.pages.length}):`, style: 'smallMuted', margin: [0, 6, 0, 2] });
                    stack.push({ ul: pagesToShow, style: 'tiny' });
                    if (issue.pages.length > 5) {
                        stack.push({ text: `... and ${issue.pages.length - 5} more pages`, style: 'tinyMuted' });
                    }

                    content.push({ stack, margin: [0, 0, 0, 12] });
                });
            });

            const headerBgColor = (orgBranding && orgBranding.primaryColor) || '#F8FAFC';
            const headerTextColor = (orgBranding && orgBranding.secondaryColor) || '#64748B';

            const header = (currentPage, pageCount, pageSize) => {
                const headerProject = projectData?.name || '';
                const domainProject = projectData?.domain || '';
                const logoNode = (orgBranding && orgBranding.logoSvg)
                    ? { svg: orgBranding.logoSvg, width: 120 }
                    : (orgBranding && orgBranding.logoDataUrl)
                        ? { image: orgBranding.logoDataUrl, fit: [120, 28] }
                        : LOGO_PNG_DATA_URL
                            ? { image: LOGO_PNG_DATA_URL, fit: [120, 28] }
                            : LOGO_SVG_NORMALIZED
                                ? { svg: LOGO_SVG_NORMALIZED, width: 120 }
                                : { text: 'Ablelytics', style: 'brand' };
                return {
                    margin: [0, 0, 0, 0],
                    stack: [
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 0,
                                    y: 0,
                                    w: pageSize.width,
                                    h: 44,
                                    color: headerBgColor
                                }
                            ],
                            absolutePosition: { x: 0, y: 0 }
                        },
                        {
                            columns: [
                                { stack: [logoNode], width: 'auto' },
                                { stack: [
                                    { text: headerProject, alignment: 'right', style: 'headerProject', color: headerTextColor },
                                    { text: domainProject, alignment: 'right', style: 'headerProject', color: headerTextColor }
                                ] }
                            ],
                            margin: [50, 10, 50, 0],
                            columnGap: 10
                        }
                    ]
                };
            };

            const footer = (currentPage, pageCount) => {
                return {
                    columns: [
                        { text: '' },
                        { text: `Page ${currentPage}`, alignment: 'right', width: 'auto' }
                    ],
                    margin: [20, 0, 20, 10],
                    fontSize: 9,
                    color: '#666666'
                };
            };

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [50, 70, 50, 50],
                header,
                footer,
                content,
                defaultStyle: {
                    font: 'Roboto',
                    fontSize: 10,
                    color: '#0F172A'
                },
                styles: {
                    title: { fontSize: 24, bold: true, color: '#0F172A' },
                    subtitle: { fontSize: 13, color: '#475569' },
                    h1: { fontSize: 18, bold: true, color: '#0F172A' },
                    h2: { fontSize: 14, bold: true, color: '#0F172A' },
                    h3: { fontSize: 12, bold: true, color: '#0F172A' },
                    h4: { fontSize: 11, bold: true, color: '#0F172A' },
                    body: { fontSize: 10, color: '#475569' },
                    bodyBold: { fontSize: 10, bold: true, color: '#0F172A' },
                    bodyMuted: { fontSize: 10, color: '#64748B' },
                    small: { fontSize: 9, color: '#475569' },
                    smallMuted: { fontSize: 9, color: '#94A3B8' },
                    tiny: { fontSize: 8, color: '#475569' },
                    tinyMuted: { fontSize: 8, color: '#94A3B8' },
                    code: { fontSize: 8, font: 'Roboto', color: '#1E293B' },
                    codeBlock: { fontSize: 8, color: '#E2E8F0' },
                    brand: { fontSize: 10, bold: true, color: '#0F172A' },
                    headerProject: { fontSize: 9, color: '#64748B' },
                    tableHeader: { fontSize: 9, bold: true, color: '#0F172A' },
                    tableCell: { fontSize: 8.5, color: '#475569' }
                },
                info: {
                    Title: reportTitle,
                    Author: 'Ablelytics Accessibility Checker',
                    Subject: 'Accessibility Report',
                    Keywords: 'accessibility, WCAG, report'
                }
            };

            const doc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

async function handleGenerateReport(projectId, runId) {
    console.log('handleGenerateReport', projectId, runId);

    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found: ' + projectId);

    await updateRun(runId, { status: 'running', startedAt: new Date().toISOString() });

    const runData = await getRun(runId);
    if (!runData) throw new Error('Run not found: ' + runId);
    const pagesIds = runData.pageIds || [];

    if (pagesIds.length === 0) {
        throw new Error('No pages specified for report generation');
    }

    console.log(`[generateReport] Generating report for ${pagesIds.length} pages...`);

    // Fetch page URL map (scans don't include pageUrl directly)
    const pagesResult = await getPages(projectId, { limit: 10000 });
    const allPagesList = (pagesResult && pagesResult.pages) || [];
    const pageUrlMap = new Map(allPagesList.map(p => [p.id, p.url]));

    // Fetch latest scan per page
    const scans = await getScans(projectId, { pageIds: pagesIds, latestPerPage: true });
    const allScans = (scans || []).map(scan => ({
        pageId: scan.pageId,
        pageUrl: pageUrlMap.get(scan.pageId) || null,
        issues: Array.isArray(scan.issues) ? scan.issues : [],
        summary: (scan.summary && typeof scan.summary === 'object') ? scan.summary : {},
    }));

    if (allScans.length === 0) {
        throw new Error('No scan results found for the specified pages');
    }

    console.log(`[generateReport] Found scan results for ${allScans.length} pages`);

    // Find the pre-created Report record for this run (created by the report trigger action)
    let reportRecord = null;
    try {
        const reportsList = await getReports(projectId, { runId });
        reportRecord = (reportsList && reportsList.length > 0) ? reportsList[0] : null;
    } catch (e) {
        console.warn('[generateReport] Could not fetch report record:', e && e.message ? e.message : e);
    }

    const reportTitle = (reportRecord && reportRecord.title) || runData.meta?.title || 'Accessibility Report';

    const standardsMatrix = loadStandardsMatrix();
    const complianceProfiles = normalizeComplianceProfiles(project.config?.complianceProfiles);
    const inScopeScIds = standardsMatrix ? getScScope(standardsMatrix, complianceProfiles) : null;
    const scIssueIndex = standardsMatrix ? buildScIssueIndex(allScans) : new Map();

    const ruleIds = [];
    allScans.forEach((scan) => {
        (scan.issues || []).forEach((issue) => {
            if (issue.ruleId) ruleIds.push(issue.ruleId);
        });
    });

    const [ruleDataById, orgBranding] = await Promise.all([
        loadRuleDescriptions(ruleIds),
        loadOrgBranding(),
    ]);

    const groupedViolations = groupViolations(allScans, inScopeScIds);

    const calculatedStats = {
        critical: Object.keys(groupedViolations.critical).length,
        serious: Object.keys(groupedViolations.serious).length,
        moderate: Object.keys(groupedViolations.moderate).length,
        minor: Object.keys(groupedViolations.minor).length
    };

    // Generate PDF
    console.log('[generateReport] Generating PDF...');
    const pdfBuffer = await generatePDF(
        project,
        runData,
        groupedViolations,
        reportTitle,
        complianceProfiles,
        standardsMatrix,
        scIssueIndex,
        inScopeScIds,
        ruleDataById,
        orgBranding
    );

    // Upload PDF to storage
    const fileHash = crypto.randomBytes(16).toString('hex');
    const fileName = `${projectId}_${runId}_${fileHash}.pdf`;
    const filePath = `projects/${projectId}/reports/${fileName}`;

    const downloadUrl = await uploadAndGetSignedUrl(
        filePath,
        pdfBuffer,
        'application/pdf',
        1000 * 60 * 60 * 24 * 7, // 7 days
        process.env.STORAGE_BUCKET
    );

    console.log('[generateReport] PDF uploaded to storage:', filePath);

    // Update run to done
    await updateRun(runId, {
        status: 'done',
        finishedAt: new Date().toISOString(),
        pagesScanned: allScans.length,
    });

    // Update the Report record if one exists
    if (reportRecord) {
        try {
            await updateReport(reportRecord.id, {
                status: 'completed',
                pdfUrl: downloadUrl,
                stats: calculatedStats,
                pageCount: allScans.length,
                completedAt: new Date().toISOString(),
            });
            console.log('[generateReport] Report record updated:', reportRecord.id);
        } catch (e) {
            console.warn('[generateReport] Failed to update report record:', e && e.message ? e.message : e);
        }
    } else {
        console.warn('[generateReport] No Report record found for runId', runId, '— PDF URL:', downloadUrl);
    }

    console.log('[generateReport] Completed successfully');

    try {
        const slackConfig = process.env.SLACK_WEBHOOK_URL
            ? { webhookUrl: process.env.SLACK_WEBHOOK_URL, channel: process.env.SLACK_CHANNEL }
            : null;
        if (slackConfig) {
            await notifyReportGenerated({
                projectId,
                projectName: (project.name || project.domain) || projectId,
                pdfUrl: downloadUrl,
            }, slackConfig);
        }
    } catch (e) {
        console.warn('[generateReport] Slack notification failed:', e && e.message ? e.message : e);
    }

    return {
        ok: true,
        reportUrl: downloadUrl,
        pagesScanned: allScans.length,
        reportId: reportRecord?.id || null,
    };
}

module.exports = { handleGenerateReport };
