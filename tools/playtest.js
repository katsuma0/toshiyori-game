// Plays every game end to end in headless Chromium and saves screenshots.
// Usage: node tools/playtest.js [outDir] [width] [height] [scale]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'www');
const out = process.argv[2] || '/tmp/shots';
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : req.url);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
}).listen(0);

const tap = (page, sel) => page.locator(sel).first().dispatchEvent('pointerdown');

(async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +(process.argv[3] || 393), height: +(process.argv[4] || 852) }, deviceScaleFactor: +(process.argv[5] || 2), hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${port}/`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/0-home.png` });

  const open = async (name) => {
    await page.locator('.home .card', { hasText: name }).click();
    await page.waitForTimeout(900);
  };
  const finish = async (label) => {
    await page.waitForSelector('.results', { timeout: 20000 });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${out}/${label}-results.png` });
    await page.locator('.results .secondary').click();
    await page.waitForTimeout(700);
  };

  // Count Up
  await open('Count Up');
  await page.screenshot({ path: `${out}/1-order.png` });
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector('.stage .grid:not(.locked)');
    const vals = (await page.$$eval('.stage .tile', (ts) => ts.map((t) => +t.dataset.value))).sort((a, b) => a - b);
    if (r === 0) await tap(page, `.stage .tile[data-value="${vals[1]}"]`); // one deliberate mistake
    for (const [k, v] of vals.entries()) {
      await tap(page, `.stage .tile[data-value="${v}"]`);
      if (r === 0 && k === 4) await page.waitForTimeout(500), await page.screenshot({ path: `${out}/1-order-mid.png` });
    }
    await page.waitForTimeout(900);
  }
  await finish('1');

  // Make the Number
  await open('Make the Number');
  await page.screenshot({ path: `${out}/2-sum.png` });
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector('.stage .grid:not(.locked)');
    const T = +(await page.textContent('.target'));
    for (let guard = 0; guard < 20; guard++) {
      const live = await page.$$eval('.stage .tile:not(.done)', (ts) => ts.map((t, i) => ({ v: +t.dataset.value, i })));
      if (!live.length) break;
      const a = live[0];
      const b = live.slice(1).find((x) => x.v === T - a.v);
      const tiles = page.locator('.stage .tile:not(.done)');
      await tiles.nth(a.i).dispatchEvent('pointerdown');
      if (r === 0 && guard === 0) await page.screenshot({ path: `${out}/2-sum-picked.png` });
      await tiles.nth(b.i).dispatchEvent('pointerdown');
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(900);
  }
  await finish('2');

  // Odd One Out
  await open('Odd One Out');
  await page.screenshot({ path: `${out}/3-odd.png` });
  for (let r = 0; r < 5; r++) {
    await page.waitForSelector('.stage .grid:not(.locked)');
    await tap(page, '.stage .tile[data-value="odd"]');
    if (r === 0) { await page.waitForTimeout(300); await page.screenshot({ path: `${out}/3-odd-found.png` }); }
    await page.waitForTimeout(1600);
  }
  await finish('3');

  // Which Has More
  await open('Which Has More');
  await page.screenshot({ path: `${out}/4-more.png` });
  for (let r = 0; r < 6; r++) {
    await page.waitForSelector('.stage .versus');
    const counts = await page.$$eval('.stage .dotbox .count', (cs) => cs.map((c) => +c.textContent));
    const pickIdx = r === 0 ? (counts[0] > counts[1] ? 1 : 0) : (counts[0] > counts[1] ? 0 : 1);
    await page.locator('.stage .dotbox').nth(pickIdx).dispatchEvent('pointerdown');
    if (r === 0) { await page.waitForTimeout(500); await page.screenshot({ path: `${out}/4-more-reveal.png` }); }
    await page.waitForTimeout(2400);
  }
  await finish('4');

  // Remember the Lights: read the sequence off the .lit animations as they play.
  await open('Remember the Lights');
  for (let r = 0; r < 4; r++) {
    await page.waitForSelector('.stage .lights');
    const seq = await page.evaluate(() => new Promise((res) => {
      const seen = [];
      const tiles = [...document.querySelectorAll('.stage .lights .tile')];
      const mo = new MutationObserver((ms) => {
        for (const m of ms) if (m.target.classList.contains('lit') && seen.at(-1) !== tiles.indexOf(m.target)) seen.push(tiles.indexOf(m.target));
        if (!document.querySelector('.stage .lights').classList.contains('locked')) { mo.disconnect(); res(seen); }
      });
      tiles.forEach((t) => mo.observe(t, { attributes: true }));
      mo.observe(document.querySelector('.stage .lights'), { attributes: true });
    }));
    if (r === 0) await page.screenshot({ path: `${out}/5-memory.png` });
    for (const i of seq) {
      await page.locator('.stage .lights .tile').nth(i).dispatchEvent('pointerdown');
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1400);
  }
  await finish('5');

  await page.screenshot({ path: `${out}/6-home-after.png` });
  console.log('levels', await page.evaluate(() => localStorage.getItem('brain-garden-v1')));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
