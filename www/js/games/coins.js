import { el, pick, rand, shuffle, wait, choices } from '../util.js';
import { lang } from '../i18n.js';

// Add up a handful of coins. Canadian coins in English, yen in Japanese, so
// the money looks like the money in the player's own purse.
// [value in cents or yen, label, size, face, rim, text, hole]
const CAD = [
  [5, '5¢', 0.82, '#D9DCE1', '#AEB3BA', '#4A4F57'],
  [10, '10¢', 0.7, '#D9DCE1', '#AEB3BA', '#4A4F57'],
  [25, '25¢', 0.9, '#D9DCE1', '#AEB3BA', '#4A4F57'],
  [100, '$1', 1, '#E8C25A', '#B8912E', '#5C4510'],
  [200, '$2', 1.08, '#E8C25A', '#B9BEC6', '#5C4510', 'ring'],
];
const JPY = [
  [1, '1', 0.75, '#E6E8EB', '#BFC3C9', '#5A5F66'],
  [5, '5', 0.85, '#E3C063', '#B8962F', '#5C4510', 'hole'],
  [10, '10', 0.9, '#C98A5A', '#9C6236', '#4A2A12'],
  [50, '50', 0.82, '#E6E8EB', '#BFC3C9', '#5A5F66', 'hole'],
  [100, '100', 0.92, '#E6E8EB', '#BFC3C9', '#5A5F66'],
  [500, '500', 1.05, '#E8C25A', '#B8912E', '#5C4510'],
];
// [coin count, which coins are allowed (indexes)]
const LEVELS = {
  en: [null, [3, [0, 1, 2]], [4, [0, 1, 2, 3]], [4, [0, 1, 2, 3, 4]], [5, [0, 1, 2, 3, 4]], [6, [0, 1, 2, 3, 4]]],
  ja: [null, [3, [0, 2, 4]], [4, [1, 2, 4]], [4, [1, 2, 3, 4]], [5, [0, 1, 2, 3, 4, 5]], [6, [0, 1, 2, 3, 4, 5]]],
};

const money = (v) => (lang() === 'ja' ? `${v.toLocaleString('ja-JP')}円` : v < 100 ? `${v}¢` : `$${(v / 100).toFixed(2)}`);

function coinSVG([, label, size, face, rim, text, extra]) {
  const r = 46;
  const hole = extra === 'hole' ? `<circle cx="50" cy="50" r="11" fill="var(--bg-deep)"/>` : '';
  const ring = extra === 'ring' ? `<circle cx="50" cy="50" r="${r}" fill="${rim}"/><circle cx="50" cy="50" r="30" fill="${face}"/>` : `<circle cx="50" cy="50" r="${r}" fill="${face}"/>`;
  const y = extra === 'hole' ? 30 : 50;
  return `<svg viewBox="0 0 100 100" style="width:calc(var(--coin) * ${size})">
    <circle cx="50" cy="54" r="${r}" fill="${rim}"/>
    ${ring}
    <circle cx="50" cy="50" r="${r - 5}" fill="none" stroke="${rim}" stroke-width="2.5" stroke-dasharray="2 3"/>
    ${hole}
    <text x="50" y="${y}" dy=".36em" text-anchor="middle" font-size="${label.length > 3 ? 24 : 30}" font-weight="900" fill="${text}">${label}</text>
  </svg>`;
}

export default {
  id: 'coins',
  cat: 'math',
  color: '#C08A12',
  rounds: 3,

  async round(ctx) {
    const set = lang() === 'ja' ? JPY : CAD;
    const [count, allowed] = LEVELS[lang() === 'ja' ? 'ja' : 'en'][ctx.level];
    const coins = Array.from({ length: count }, () => set[pick(allowed)]).sort((a, b) => b[0] - a[0]);
    const total = coins.reduce((s, c) => s + c[0], 0);

    const tray = el('div', 'coin-tray');
    coins.forEach((c, i) => {
      const coin = el('span', 'coin', coinSVG(c));
      coin.style.setProperty('--i', i);
      coin.style.setProperty('--r', `${rand(-25, 25)}deg`);
      tray.append(coin);
      setTimeout(() => ctx.alive() && ctx.fx.clink(i), 200 + i * 110);
    });
    ctx.stage.append(tray);

    // Decoys are off by one coin from the set, the classic counting slip.
    const opts = new Set([total]);
    const vals = allowed.map((i) => set[i][0]);
    while (opts.size < 3) {
      const v = total + pick(vals) * (Math.random() < 0.5 ? -1 : 1);
      if (v > 0) opts.add(v);
    }
    ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));
    await wait(300);
    const misses = await choices(ctx.stage, shuffle([...opts]), total, money, ctx.fx);
    return { mistakes: misses };
  },
};
