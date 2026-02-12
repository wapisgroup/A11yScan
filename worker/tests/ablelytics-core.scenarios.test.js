const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

process.env.HOME = '/tmp';
process.env.XDG_CONFIG_HOME = '/tmp';
process.env.XDG_CACHE_HOME = '/tmp';
process.env.XDG_DATA_HOME = '/tmp';

const puppeteer = require('puppeteer');
const { AblelyticsCoreTests } = require('../helpers/ablelytics-core-tests');

let browser;
let page;

test.before(async () => {
  const explicitExecutablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROME_PATH
    || (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined);

  browser = await puppeteer.launch({
    headless: true,
    userDataDir: '/tmp/a11yscan-puppeteer-profile',
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

async function setHtml(html) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
}

function createCore() {
  return new AblelyticsCoreTests(page, {
    maxComponentChecks: 10,
    includeExperimentalChecks: false
  });
}

test('modal scenario: detects missing focus transfer into dialog', async () => {
  await setHtml(`
    <button id="open" aria-haspopup="dialog" aria-controls="dlg">Open dialog</button>
    <div id="dlg" role="dialog" aria-modal="true" style="display:none;">
      <button id="close">Close</button>
    </div>
    <script>
      const open = document.getElementById('open');
      const dlg = document.getElementById('dlg');
      open.addEventListener('click', () => { dlg.style.display = 'block'; });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') dlg.style.display = 'none';
      });
    </script>
  `);

  const core = createCore();
  const issues = await core.checkModalInteractionScenario();
  assert.ok(issues.some((i) => i.message.includes('focus did not move into it')));
});

test('menu scenario: passes with keyboard open/nav/close behavior', async () => {
  await setHtml(`
    <button id="menuBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="menu1">Menu</button>
    <div id="menu1" role="menu" style="display:none;">
      <button id="item1" role="menuitem">Item 1</button>
      <button role="menuitem">Item 2</button>
    </div>
    <script>
      const btn = document.getElementById('menuBtn');
      const menu = document.getElementById('menu1');
      const item1 = document.getElementById('item1');
      function openMenu() { btn.setAttribute('aria-expanded', 'true'); menu.style.display = 'block'; }
      function closeMenu() { btn.setAttribute('aria-expanded', 'false'); menu.style.display = 'none'; btn.focus(); }
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) closeMenu(); else openMenu();
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && btn.getAttribute('aria-expanded') === 'true') item1.focus();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') closeMenu();
      });
    </script>
  `);

  const core = createCore();
  const issues = await core.checkMenuInteractionScenario();
  assert.equal(issues.length, 0);
});

test('tabs scenario: passes with arrow navigation and visible panel', async () => {
  await setHtml(`
    <div role="tablist" aria-label="Example tabs">
      <button id="tab1" role="tab" aria-selected="true" aria-controls="panel1" tabindex="0">Tab 1</button>
      <button id="tab2" role="tab" aria-selected="false" aria-controls="panel2" tabindex="-1">Tab 2</button>
    </div>
    <div id="panel1" role="tabpanel">Panel 1</div>
    <div id="panel2" role="tabpanel" style="display:none;">Panel 2</div>
    <script>
      const tabs = [document.getElementById('tab1'), document.getElementById('tab2')];
      const panels = [document.getElementById('panel1'), document.getElementById('panel2')];
      function selectTab(idx) {
        tabs.forEach((t, i) => {
          t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
          t.tabIndex = i === idx ? 0 : -1;
        });
        panels.forEach((p, i) => { p.style.display = i === idx ? 'block' : 'none'; });
      }
      tabs[0].addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { selectTab(1); tabs[1].focus(); } });
      tabs[1].addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { selectTab(0); tabs[0].focus(); } });
    </script>
  `);

  const core = createCore();
  const issues = await core.checkTabsInteractionScenario();
  assert.equal(issues.length, 0);
});

test('disclosure scenario: passes when Enter/Space toggles aria-expanded and panel visibility', async () => {
  await setHtml(`
    <button id="acc" aria-expanded="false" aria-controls="panel">Toggle</button>
    <div id="panel" style="display:none;">Hidden content</div>
    <script>
      const acc = document.getElementById('acc');
      const panel = document.getElementById('panel');
      acc.addEventListener('click', () => {
        const expanded = acc.getAttribute('aria-expanded') === 'true';
        acc.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.style.display = expanded ? 'none' : 'block';
      });
    </script>
  `);

  const core = createCore();
  const issues = await core.checkDisclosureInteractionScenario();
  assert.equal(issues.length, 0);
});

test('carousel scenario: detects non-working keyboard next control', async () => {
  await setHtml(`
    <div class="carousel" aria-roledescription="carousel">
      <button class="carousel-control-next" aria-label="Next slide">Next</button>
      <div class="carousel-item active" id="s1">Slide 1</div>
      <div class="carousel-item" id="s2">Slide 2</div>
    </div>
  `);

  const core = createCore();
  const issues = await core.checkCarouselInteractionScenario();
  assert.ok(issues.some((i) => i.message.includes('next control')));
});

test('drag-drop scenario: detects draggable without keyboard alternative', async () => {
  await setHtml(`
    <div role="list">
      <div id="card1" draggable="true">Card A</div>
      <div id="card2" draggable="true">Card B</div>
    </div>
  `);

  const core = createCore();
  const issues = await core.checkDragDropKeyboardAlternativeScenario();
  assert.ok(issues.some((i) => i.message.includes('without obvious keyboard alternative')));
});

test('drag-drop scenario: passes when move controls exist', async () => {
  await setHtml(`
    <div role="list" data-sortable>
      <div id="card1" draggable="true" tabindex="0">Card A</div>
      <button aria-label="Move up">Move up</button>
      <button aria-label="Move down">Move down</button>
    </div>
  `);

  const core = createCore();
  const issues = await core.checkDragDropKeyboardAlternativeScenario();
  assert.equal(issues.length, 0);
});
