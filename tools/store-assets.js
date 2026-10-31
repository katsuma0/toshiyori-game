// Renders the 1024 px app icon and 6.9 inch App Store screenshots (1320 x 2868)
// in English and Japanese, straight from a real playthrough.
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
  await browser.close();

  const shots = '/tmp/store-shots';
  fs.rmSync(shots, { recursive: true, force: true });
  execFileSync('node', [path.join(__dirname, 'playtest.js'), shots, '440', '956', '3'], { stdio: 'inherit' });
  const pick = {
    en: ['en-00-home', 'en-01-count-up', 'en-04-heaviest', 'en-07-pairs', 'en-09-coins', 'en-10-flash-results'],
    ja: ['ja-00-home', 'ja-01-game', 'ja-02-game', 'ja-03-game', 'ja-20-mix', 'ja-20-mix-results'],
  };
  fs.rmSync(path.join(out, 'screenshots'), { recursive: true, force: true });
  for (const [lang, files] of Object.entries(pick)) {
    const dir = path.join(out, 'screenshots', lang);
    fs.mkdirSync(dir, { recursive: true });
    files.forEach((f, i) => fs.copyFileSync(`${shots}/${f}.png`, path.join(dir, `${i + 1}.png`)));
  }
})();
