import { el, sample, shuffle, wait, choices } from '../util.js';

// Balance scales compare pairs of things. Work out which one is heaviest.
// Each scale tips into place when it appears, so the answer is never read off
// a static picture alone.
// Plain coloured balls, not fruit: a grape outweighing a melon would fight what
// people already know and make the puzzle feel like a trick.
const THINGS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
// [things, scales]. Scales always form a chain, so exactly one answer exists.
const LEVELS = [null, [3, 2], [3, 2], [4, 3], [4, 3], [5, 4]];

function scaleSVG(left, right) {
  const s = el('div', 'scale');
  s.innerHTML = `
  <svg viewBox="0 0 220 130">
    <path d="M110 40 L92 118 H128 Z" fill="#C9B79C"/>
    <rect x="80" y="114" width="60" height="10" rx="5" fill="#B49F80"/>
    <g class="beam">
      <rect x="22" y="36" width="176" height="8" rx="4" fill="#8C7A5E"/>
      <g class="pan pan-l"><path d="M42 40 L30 74 M42 40 L54 74" stroke="#8C7A5E" stroke-width="2.5"/><path d="M20 74 H64 Q60 90 42 90 Q24 90 20 74Z" fill="#D9C7A8"/><text x="42" y="70" text-anchor="middle" font-size="32">${left}</text></g>
      <g class="pan pan-r"><path d="M178 40 L166 74 M178 40 L190 74" stroke="#8C7A5E" stroke-width="2.5"/><path d="M156 74 H200 Q196 90 178 90 Q160 90 156 74Z" fill="#D9C7A8"/><text x="178" y="70" text-anchor="middle" font-size="32">${right}</text></g>
    </g>
    <circle cx="110" cy="40" r="7" fill="#6E5E45"/>
  </svg>`;
  return s;
}

// Tilt the beam with a spring, keeping the pans hanging straight down.
function tilt(scale, dir, delay) {
  const beam = scale.querySelector('.beam');
  const pl = scale.querySelector('.pan-l');
  const pr = scale.querySelector('.pan-r');
  const target = dir * 12;
  const start = performance.now() + delay;
  const spring = (p) => 1 - Math.exp(-6 * p) * Math.cos(9 * p);
  const frame = (now) => {
    const p = Math.max(0, (now - start) / 900);
    const a = target * (p >= 1 ? 1 : spring(p));
    beam.setAttribute('transform', `rotate(${a} 110 40)`);
    // Counter-rotate each pan around its hook so it hangs level.
    pl.setAttribute('transform', `rotate(${-a} 42 40)`);
    pr.setAttribute('transform', `rotate(${-a} 178 40)`);
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export default {
  id: 'heavy',
  cat: 'think',
  color: '#B7791F',
  rounds: 3,

  async round(ctx) {
    const [k] = LEVELS[ctx.level];
    // things[0] is heaviest, things[k-1] lightest.
    const things = sample(THINGS, k);
    const pairs = [];
    for (let i = 0; i < k - 1; i++) pairs.push([i, i + 1]);
    // Higher levels add one skip comparison so you have to combine clues.
    if (ctx.level === 2 || ctx.level === 4) pairs.push([0, k - 1]);

    const wrap = el('div', 'scales');
    ctx.stage.append(wrap);
    shuffle(pairs).forEach(([heavy, light], i) => {
      const swap = Math.random() < 0.5;
      const s = scaleSVG(things[swap ? light : heavy], things[swap ? heavy : light]);
      s.style.setProperty('--i', i);
      wrap.append(s);
      // Heavier side goes down: positive rotation drops the right pan.
      tilt(s, swap ? 1 : -1, 250 + i * 180);
    });
    ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));
    await wait(200);
    const misses = await choices(ctx.stage, shuffle(things), things[0], (v) => `<span class="emoji">${v}</span>`, ctx.fx);
    return { mistakes: misses };
  },
};
