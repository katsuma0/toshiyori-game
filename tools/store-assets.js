// Renders the 1024 px app icon, a cream launch screen image, and 6.9 inch App
// Store screenshots (1320 x 2868) in English and Japanese, straight from a real
// playthrough.
// Usage: node tools/store-assets.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const out = path.join(__dirname, '..', 'store');
(async () => {
  const browser = await chromium.launch();
  const icon = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await icon.goto('file://' + path.join(out, 'icon.svg'));
  await icon.screenshot({ path: path.join(out, 'AppIcon-1024.png') });
  // Capacitor's template launch image is its own logo on white. This one is
  // the app's cream with the icon's tiles small in the middle, so opening the
  // app never flashes someone else's brand.
  const splash = await browser.newPage({ viewport: { width: 2732, height: 2732 } });
  const svg = fs.readFileSync(path.join(out, 'icon.svg'), 'utf8');
  await splash.setContent(`<body style="margin:0;height:100vh;display:grid;place-items:center;background:#FBF7F1"><div style="width:520px;height:520px">${svg.replace('<svg', '<svg width="520" height="520"')}</div></body>`);
  await splash.screenshot({ path: path.join(out, 'Splash-2732.png') });
  await browser.close();

  const shots = '/tmp/store-shots';
  fs.rmSync(shots, { recursive: true, force: true });
  execFileSync('node', [path.join(__dirname, 'playtest.js'), shots, '440', '956', '3'], { stdio: 'inherit' });
  const pick = {
    en: ['en-00-home', 'en-02-train', 'en-06-blocks', 'en-03-plus', 'en-10-stopwatch', 'en-14-pairs'],
    ja: ['ja-00-home', 'ja-02-game', 'ja-12-game', 'ja-06-game', 'ja-10-game', 'ja-00-settings'],
  };

  fs.rmSync(path.join(out, 'screenshots'), { recursive: true, force: true });
  for (const [lang, files] of Object.entries(pick)) {
    const dir = path.join(out, 'screenshots', lang);
    fs.mkdirSync(dir, { recursive: true });
    files.forEach((f, i) => fs.copyFileSync(`${shots}/${f}.png`, path.join(dir, `${i + 1}.png`)));
  }
})();
