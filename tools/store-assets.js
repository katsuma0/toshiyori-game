// Renders the 1024 px app icon and 6.9 inch App Store screenshots (1320 x 2868).
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
  await icon.screenshot({ path: path.join(out, 'AppIcon-1024.png'), omitBackground: false });

  // Reuse the playtest run to capture real gameplay at 440 x 956 points, 3x.
  const shots = '/tmp/store-shots';
  fs.rmSync(shots, { recursive: true, force: true });
  execFileSync('node', [path.join(__dirname, 'playtest.js'), shots, '440', '956', '3'], { stdio: 'inherit' });
  const keep = { '0-home': '1-home', '1-order-mid': '2-count-up', '2-sum-picked': '3-make-the-number', '3-odd': '4-odd-one-out', '4-more': '5-which-has-more', '5-results': '6-results' };
  fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
  for (const [from, to] of Object.entries(keep)) fs.copyFileSync(`${shots}/${from}.png`, path.join(out, 'screenshots', `${to}.png`));
  await browser.close();
})();
