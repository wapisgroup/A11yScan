const https = require('https');

const DEFAULT_CHANNEL = process.env.SLACK_CHANNEL || '#ablelytics';
const DEFAULT_APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.ablelytics.com';

function postSlackMessage(payload, config = {}) {
  const webhookUrl = config.webhookUrl || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[Slack] SLACK_WEBHOOK_URL not set. Skipping notification.');
    return Promise.resolve();
  }

  let url;
  try {
    url = new URL(webhookUrl);
  } catch (err) {
    console.warn('[Slack] Invalid webhook URL. Skipping notification.');
    return Promise.resolve();
  }

  const body = JSON.stringify({
    channel: config.channel || DEFAULT_CHANNEL,
    username: 'Ablelytics',
    icon_emoji: ':white_check_mark:',
    ...payload,
  });

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', (err) => {
      console.warn('[Slack] Notification failed:', err.message || err);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

function projectLink(projectId) {
  if (!projectId) return null;
  return `${DEFAULT_APP_BASE_URL}/workspace/projects/${projectId}`;
}

function formatLink(url, label) {
  if (!url) return '';
  return `<${url}|${label}>`;
}

async function notifyPageCollectionFinished({ projectId, projectName, pagesTotal, sitemapUrl, sitemapGraphUrl }, config) {
  const link = projectLink(projectId);
  const lines = [
    `*Page collection completed* for *${projectName}*`,
    pagesTotal != null ? `Pages discovered: ${pagesTotal}` : null,
    link ? `Open project pages: ${formatLink(link, 'Project Pages')}` : null,
    sitemapUrl ? `Sitemap XML: ${formatLink(sitemapUrl, 'View XML')}` : null,
    sitemapGraphUrl ? `Sitemap graph: ${formatLink(sitemapGraphUrl, 'View Graph')}` : null,
  ].filter(Boolean);

  await postSlackMessage({
    text: `Page collection completed for ${projectName}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    ],
  }, config);
}

async function notifyScanFinished({ projectId, projectName, pagesScanned, agg }, config) {
  const link = projectLink(projectId);
  const stats = agg
    ? `Issues: Critical ${agg.critical}, Serious ${agg.serious}, Moderate ${agg.moderate}, Minor ${agg.minor}`
    : null;

  const lines = [
    `*Scan finished* for *${projectName}*`,
    pagesScanned != null ? `Pages scanned: ${pagesScanned}` : null,
    stats,
    link ? `Open project runs: ${formatLink(link, 'Project Runs')}` : null,
  ].filter(Boolean);

  await postSlackMessage({
    text: `Scan finished for ${projectName}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    ],
  }, config);
}

async function notifyReportGenerated({ projectId, projectName, pdfUrl }, config) {
  const link = projectLink(projectId);
  const lines = [
    `*Report generated* for *${projectName}*`,
    pdfUrl ? `PDF: ${formatLink(pdfUrl, 'Download Report')}` : null,
    link ? `Open project reports: ${formatLink(link, 'Project Reports')}` : null,
  ].filter(Boolean);

  await postSlackMessage({
    text: `Report generated for ${projectName}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    ],
  }, config);
}

async function notifySitemapGenerated({ projectId, projectName, sitemapTreeUrl }, config) {
  const link = projectLink(projectId);
  const lines = [
    `*Sitemap generated* for *${projectName}*`,
    sitemapTreeUrl ? `Sitemap tree: ${formatLink(sitemapTreeUrl, 'View Sitemap')}` : null,
    link ? `Open project: ${formatLink(link, 'Project')}` : null,
  ].filter(Boolean);

  await postSlackMessage({
    text: `Sitemap generated for ${projectName}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    ],
  }, config);
}

async function getSlackConfigFromOrg(db, organisationId) {
  if (!db || !organisationId) return null;
  try {
    const orgSnap = await db.collection('organisations').doc(organisationId).get();
    if (!orgSnap.exists) return null;
    const data = orgSnap.data() || {};
    const slack = data.integrations?.slack || {};
    if (!slack.enabled) return null;
    return {
      enabled: true,
      webhookUrl: slack.webhookUrl,
      channel: slack.channel,
    };
  } catch (err) {
    console.warn('[Slack] Failed to load org config:', err && err.message ? err.message : err);
    return null;
  }
}

module.exports = {
  postSlackMessage,
  notifyPageCollectionFinished,
  notifyScanFinished,
  notifyReportGenerated,
  notifySitemapGenerated,
  getSlackConfigFromOrg,
};
