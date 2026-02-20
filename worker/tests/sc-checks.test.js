const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.HOME = '/tmp';
process.env.XDG_CONFIG_HOME = '/tmp';
process.env.XDG_CACHE_HOME = '/tmp';
process.env.XDG_DATA_HOME = '/tmp';

const puppeteer = require('puppeteer');
const { DEFAULT_OPTIONS } = require('../helpers/checks/shared');

// Puppeteer-based SC checks
const { checkAudioControl } = require('../helpers/checks/sc-1.4.2');
const { checkKeyboardAccessible } = require('../helpers/checks/sc-2.1.1');
const { checkNoKeyboardTrap } = require('../helpers/checks/sc-2.1.2');
const { checkPauseStopHide } = require('../helpers/checks/sc-2.2.2');
const { checkBypassBlocks } = require('../helpers/checks/sc-2.4.1');
const { checkFocusOrder } = require('../helpers/checks/sc-2.4.3');
const { checkFocusVisible } = require('../helpers/checks/sc-2.4.7');
const { checkFocusObscuredCombined } = require('../helpers/checks/sc-2.4.11');
const { checkAccessibilityTreeNameRoleValue, checkFrameworkAdapterScenarios } = require('../helpers/checks/sc-4.1.2');

// Cheerio-based SC checks (no Puppeteer needed)
const {
  checkConsistentNavigation,
  checkConsistentIdentification,
  checkConsistentHelp
} = require('../helpers/checks/sc-3.2.x');

let browser, page;
const opts = { ...DEFAULT_OPTIONS };

test.before(async () => {
  const explicitExecutablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined);

  browser = await puppeteer.launch({
    headless: true,
    userDataDir: '/tmp/a11yscan-puppeteer-profile-sc',
    executablePath: explicitExecutablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-crashpad',
      '--disable-crash-reporter',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
});

test.after(async () => {
  if (page) await page.close();
  if (browser) await browser.close();
});

function loadFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

async function setFixture(name) {
  await page.setContent(loadFixture(name), { waitUntil: 'domcontentloaded' });
}

// ---------------------------------------------------------------------------
// SC 1.4.2 — Audio Control
// ---------------------------------------------------------------------------
test('SC 1.4.2 Audio Control', async (t) => {
  await t.test('fail: autoplay video without controls', async () => {
    await setFixture('sc-1.4.2-fail.html');
    const issues = await checkAudioControl(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-1.4.2'));
  });

  await t.test('pass: autoplay video with controls', async () => {
    await setFixture('sc-1.4.2-pass.html');
    const issues = await checkAudioControl(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.1.1 — Keyboard Accessible
// ---------------------------------------------------------------------------
test('SC 2.1.1 Keyboard Accessible', async (t) => {
  await t.test('fail: div role=button with onclick, not focusable', async () => {
    await setFixture('sc-2.1.1-fail.html');
    const issues = await checkKeyboardAccessible(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.1.1'));
  });

  await t.test('pass: native button with onclick', async () => {
    await setFixture('sc-2.1.1-pass.html');
    const issues = await checkKeyboardAccessible(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.1.2 — No Keyboard Trap
// ---------------------------------------------------------------------------
test('SC 2.1.2 No Keyboard Trap', async (t) => {
  await t.test('fail: keyboard trap in form inputs', async () => {
    await setFixture('sc-2.1.2-fail.html');
    const issues = await checkNoKeyboardTrap(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.1.2'));
  });

  await t.test('pass: normal tab flow through inputs', async () => {
    await setFixture('sc-2.1.2-pass.html');
    const issues = await checkNoKeyboardTrap(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.2.2 — Pause, Stop, Hide
// ---------------------------------------------------------------------------
test('SC 2.2.2 Pause Stop Hide', async (t) => {
  await t.test('fail: marquee element present', async () => {
    await setFixture('sc-2.2.2-fail.html');
    const issues = await checkPauseStopHide(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.2.2'));
  });

  await t.test('pass: no marquee or blink elements', async () => {
    await setFixture('sc-2.2.2-pass.html');
    const issues = await checkPauseStopHide(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.4.1 — Bypass Blocks
// ---------------------------------------------------------------------------
test('SC 2.4.1 Bypass Blocks', async (t) => {
  await t.test('fail: no skip link or main landmark with 8+ nav links', async () => {
    await setFixture('sc-2.4.1-fail.html');
    const issues = await checkBypassBlocks(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.4.1'));
  });

  await t.test('pass: skip link and main landmark present', async () => {
    await setFixture('sc-2.4.1-pass.html');
    const issues = await checkBypassBlocks(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.4.3 — Focus Order
// ---------------------------------------------------------------------------
test('SC 2.4.3 Focus Order', async (t) => {
  await t.test('fail: positive tabindex values', async () => {
    await setFixture('sc-2.4.3-fail.html');
    const issues = await checkFocusOrder(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.4.3'));
  });

  await t.test('pass: natural tab order only', async () => {
    await setFixture('sc-2.4.3-pass.html');
    const issues = await checkFocusOrder(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.4.7 — Focus Visible
// ---------------------------------------------------------------------------
test('SC 2.4.7 Focus Visible', async (t) => {
  await t.test('fail: outline:none on all focusable elements', async () => {
    await setFixture('sc-2.4.7-fail.html');
    const issues = await checkFocusVisible(page, { ...opts, enableVisualFocusChecks: false });
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-2.4.7'));
  });

  await t.test('pass: explicit focus-visible outline styles', async () => {
    await setFixture('sc-2.4.7-pass.html');
    const issues = await checkFocusVisible(page, { ...opts, enableVisualFocusChecks: false });
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 2.4.11 — Focus Not Obscured
// ---------------------------------------------------------------------------
test('SC 2.4.11 Focus Not Obscured', async (t) => {
  await t.test('fail: button fully covered by overlay', async () => {
    await setFixture('sc-2.4.11-fail.html');
    const issues = await checkFocusObscuredCombined(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.some(i => i.ruleId === 'wcag-2.4.11' || i.ruleId === 'wcag-2.4.12'));
  });

  await t.test('pass: no overlays on focusable elements', async () => {
    await setFixture('sc-2.4.11-pass.html');
    const issues = await checkFocusObscuredCombined(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 4.1.2 — Name, Role, Value (Accessibility Tree)
// ---------------------------------------------------------------------------
test('SC 4.1.2 Accessibility Tree Name Role Value', async (t) => {
  await t.test('fail: interactive roles missing accessible name', async () => {
    await setFixture('sc-4.1.2-fail.html');
    const issues = await checkAccessibilityTreeNameRoleValue(page, opts);
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-4.1.2'));
  });

  await t.test('pass: all interactive elements properly labeled', async () => {
    await setFixture('sc-4.1.2-pass.html');
    const issues = await checkAccessibilityTreeNameRoleValue(page, opts);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 4.1.2 — Framework Adapter Scenarios (Dialog Semantics)
// ---------------------------------------------------------------------------
test('SC 4.1.2 Framework Adapter — Dialog Semantics', async (t) => {
  await t.test('fail: dialog missing accessible name', async () => {
    await setFixture('sc-4.1.2-framework-fail.html');
    const issues = await checkFrameworkAdapterScenarios(page, opts, { frameworks: ['mui'] });
    assert.ok(issues.length > 0, 'Expected at least one issue');
    assert.ok(issues.every(i => i.ruleId === 'wcag-4.1.2'));
  });

  await t.test('pass: dialog with aria-label', async () => {
    await setFixture('sc-4.1.2-framework-pass.html');
    const issues = await checkFrameworkAdapterScenarios(page, opts, { frameworks: ['mui'] });
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 3.2.3 — Consistent Navigation (cheerio-based, inline)
// ---------------------------------------------------------------------------
test('SC 3.2.3 Consistent Navigation', async (t) => {
  await t.test('fail: different nav links across pages', () => {
    const pages = [
      { html: '<nav><a href="/a">A</a><a href="/b">B</a></nav>' },
      { html: '<nav><a href="/x">X</a><a href="/y">Y</a></nav>' }
    ];
    const issues = checkConsistentNavigation(pages);
    assert.ok(issues.some(i => i.ruleId === 'wcag-3.2.3'));
  });

  await t.test('pass: same nav links across pages', () => {
    const pages = [
      { html: '<nav><a href="/a">A</a></nav>' },
      { html: '<nav><a href="/a">A</a></nav>' }
    ];
    const issues = checkConsistentNavigation(pages);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 3.2.4 — Consistent Identification (cheerio-based, inline)
// ---------------------------------------------------------------------------
test('SC 3.2.4 Consistent Identification', async (t) => {
  await t.test('fail: same link text maps to different destinations', () => {
    const pages = [
      { html: '<a href="/page1">Read more</a>' },
      { html: '<a href="/page2">Read more</a>' }
    ];
    const issues = checkConsistentIdentification(pages);
    assert.ok(issues.some(i => i.ruleId === 'wcag-3.2.4'));
  });

  await t.test('pass: same link text same destination', () => {
    const pages = [
      { html: '<a href="/about">About</a>' },
      { html: '<a href="/about">About</a>' }
    ];
    const issues = checkConsistentIdentification(pages);
    assert.equal(issues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// SC 3.2.6 — Consistent Help (cheerio-based, inline)
// ---------------------------------------------------------------------------
test('SC 3.2.6 Consistent Help', async (t) => {
  await t.test('fail: help link present on one page but not another', () => {
    const pages = [
      { html: '<a href="/help">Help</a>' },
      { html: '<a href="/about">About</a>' }
    ];
    const issues = checkConsistentHelp(pages);
    assert.ok(issues.some(i => i.ruleId === 'wcag-3.2.6'));
  });

  await t.test('pass: help link consistent across pages', () => {
    const pages = [
      { html: '<a href="/help">Help</a>' },
      { html: '<a href="/help">Help</a>' }
    ];
    const issues = checkConsistentHelp(pages);
    assert.equal(issues.length, 0);
  });
});
