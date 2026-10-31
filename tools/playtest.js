// Plays every game and the mixed "Play" set end to end in headless Chromium,
// in English and Japanese, and saves screenshots along the way. Exits non-zero
// on any page error.
// Usage: node tools/playtest.js [outDir] [width] [height] [scale]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'www');
const out = process.argv[2] || '/tmp/shots';
const W = +(process.argv[3] || 393);
const H = +(process.argv[4] || 852);
const S = +(process.argv[5] || 2);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(root, url === '/' ? 'index.html' : url);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
}).listen(0);

// Records the order tiles light up in the Lights game, so the bot can repeat it.
const recorder = () => {
  window.__seq = [];
  new MutationObserver((ms) => {
    for (const m of ms) {
      const t = m.target;
      if (m.type === 'attributes' && t.classList?.contains('lit') && t.closest('.lights.locked')) {
        const i = [...t.parentNode.children].indexOf(t);
        if (window.__seq.at(-1) !== i) window.__seq.push(i);
      }
      if (m.type === 'childList' && [...m.addedNodes].some((n) => n.classList?.contains('lights'))) window.__seq = [];
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
};

const down = (loc) => loc.dispatchEvent('pointerdown');

// Looks at whatever is on stage and makes one correct move.
async function move(page, shot) {
  const st = page.locator('.play:not(.leave) .stage');
  // Stopwatch: start, wait for the target, stop, then sit out the result.
  if (await st.locator('[data-role="go"]').count()) {
    const target = +(await page.locator('.play:not(.leave) .instruction').textContent()).match(/\d+/)[0];
    await down(st.locator('[data-role="go"]'));
    const t0 = Date.now();
    await page.waitForTimeout(1500);
    await shot();
    // The screenshot takes a variable bite out of the wait, so stop on the clock.
    await page.waitForTimeout(Math.max(0, target * 1000 - 60 - (Date.now() - t0)));
    await down(st.locator('[data-role="go"]'));
    return page.waitForTimeout(2600);
  }
  if (await st.locator('.choices:not(.locked) .choice[data-ok]').count()) {
    // Let the falling cubes land first, so the screenshot shows a whole pile.
    if (await st.locator('.bk-view').count()) await page.waitForTimeout(1800);
    await shot();
    return down(st.locator('.choice[data-ok]'));
  }
  if (await st.locator('.paint:not(.locked)').count()) {
    await shot();
    const n = await st.locator('.paint .tile[data-goal]:not(.on)').count();
    for (let i = 0; i < n; i++) await down(st.locator('.paint .tile[data-goal]:not(.on)').first());
    return;
  }
  if (await st.locator('.flip-card:not(.up)').count()) {
    const vals = await st.locator('.flip-card').evaluateAll((cs) => cs.map((c) => (c.classList.contains('up') ? null : c.dataset.value)));
    const v = vals.find((x) => x);
    const idx = vals.map((x, i) => (x === v ? i : -1)).filter((i) => i >= 0);
    await down(st.locator('.flip-card').nth(idx[0]));
    await shot();
    await down(st.locator('.flip-card').nth(idx[1]));
    return page.waitForTimeout(400);
  }
  if (await st.locator('.status.turn').count() && await st.locator('.lights:not(.locked)').count()) {
    const seq = await page.evaluate(() => window.__seq.slice());
    await shot();
    for (const i of seq) { await down(st.locator('.lights .tile').nth(i)); await page.waitForTimeout(60); }
    return page.waitForTimeout(600);
  }
  if (await st.locator('.equation').count() && await st.locator('.grid:not(.locked) .tile:not(.done)').count()) {
    const T = +(await st.locator('.target').textContent());
    const live = await st.locator('.tile:not(.done)').evaluateAll((ts) => ts.map((t) => +t.dataset.value));
    const a = 0;
    const b = live.findIndex((v, i) => i > 0 && v === T - live[0]);
    await down(st.locator('.tile:not(.done)').nth(a));
    await shot();
    await down(st.locator('.tile:not(.done)').nth(b));
    return page.waitForTimeout(700);
  }
  if (await st.locator('.pictures:not(.locked)').count()) {
    await shot();
    return down(st.locator('.tile[data-value="odd"]'));
  }
  if (await st.locator('.big-numbers:not(.locked)').count() && !(await st.locator('.equation').count())) {
    const vals = (await st.locator('.tile').evaluateAll((ts) => ts.map((t) => +t.dataset.value))).sort((x, y) => x - y);
    for (const [k, v] of vals.entries()) {
      await down(st.locator(`.tile[data-value="${v}"]`));
      if (k === 5) { await page.waitForTimeout(500); await shot(); }
    }
    return;
  }
  return page.waitForTimeout(150);
}

async function solve(page, label) {
  let shots = 0;
  const shot = async () => {
    if (shots++) return;
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${label}.png` });
  };
  const until = Date.now() + 90000;
  while (!(await page.locator('.results:not(.leave)').count())) {
    if (Date.now() > until) throw new Error(`${label}: stuck`);
    await move(page, shot);
  }
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${label}-results.png` });
  await page.locator('.results .secondary').click();
  await page.waitForTimeout(700);
}

(async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const errors = [];
  for (const lang of ['en', 'ja']) {
    // Japanese is reached the way a player would: through the Settings sheet.
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: S, hasTouch: true, locale: 'en-CA' });
    page.on('pageerror', (e) => errors.push(`${lang}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${lang}: ${m.text()}`));
    await page.addInitScript(recorder);
    await page.goto(`http://localhost:${port}/`);
    await page.waitForTimeout(1200);
    if (lang === 'ja') {
      await page.locator('.home:not(.leave) .gear-btn').click();
      await page.waitForTimeout(600);
      await page.locator('.sheet .row').nth(3).click();
      await page.waitForTimeout(300);
      await page.locator('.sheet .done-btn').click();
      await page.waitForTimeout(900);
      // Reopen so the home screen behind the sheet is in Japanese too.
      await page.locator('.home:not(.leave) .gear-btn').click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/ja-00-settings.png` });
      await page.locator('.sheet .done-btn').click();
      await page.waitForTimeout(900);
    } else {
      await page.locator('.home:not(.leave) .gear-btn').click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/en-00-settings.png` });
      await page.locator('.veil').click({ position: { x: 20, y: 20 } });
      await page.waitForTimeout(900);
    }
    await page.screenshot({ path: `${out}/${lang}-00-home.png` });

    // Japanese plays a spread that shows yen and the picture games for the store.
    const count = await page.locator('.game-tile').count();
    const picks = lang === 'en' ? [...Array(count).keys()] : [1, 5, 9, 11];
    for (const i of picks) {
      const tile = page.locator('.home:not(.leave) .game-tile').nth(i);
      const name = (await tile.locator('strong').textContent()).trim();
      await tile.click();
      await page.waitForTimeout(500);
      await solve(page, `${lang}-${String(i + 1).padStart(2, '0')}-${lang === 'en' ? name.toLowerCase().replace(/\W+/g, '-') : 'game'}`);
      console.log(lang, 'ok', name);
    }
    await page.locator('.home:not(.leave) .play-all').click();
    await page.waitForTimeout(500);
    await solve(page, `${lang}-20-mix`);
    console.log(lang, 'ok mix');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${lang}-21-home-after.png` });
    await page.close();
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
  server.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
