import { el, rand, wait, choices, nearby } from '../util.js';

// Count the blocks in an isometric pile. Stacks never get taller toward the
// front, so every block is either visible or plainly holding one up. No
// hidden-block trick questions.
const LEVELS = [null, [2, 3, 2], [3, 3, 2], [3, 3, 3], [3, 4, 3], [4, 4, 3]];
const A = 26; // half the width of one block on screen

function pile(w, d, maxH) {
  const h = [];
  for (let x = 0; x < w; x++) {
    h[x] = [];
    for (let y = 0; y < d; y++) {
      const cap = Math.min(x ? h[x - 1][y] : maxH, y ? h[x][y - 1] : maxH);
      // Lean toward full stacks so piles look solid, not sparse.
      h[x][y] = x + y === 0 ? maxH : Math.max(0, cap - (Math.random() < 0.55 ? 0 : rand(1, cap)));
    }
  }
  return h;
}

function cubeSVG(sx, sy, colour, k) {
  const top = `${sx},${sy - A} ${sx + A},${sy - A / 2} ${sx},${sy} ${sx - A},${sy - A / 2}`;
  const left = `${sx - A},${sy - A / 2} ${sx},${sy} ${sx},${sy + A} ${sx - A},${sy + A / 2}`;
  const right = `${sx + A},${sy - A / 2} ${sx},${sy} ${sx},${sy + A} ${sx + A},${sy + A / 2}`;
  // Every face gets a dark outline so each block reads as its own piece.
  return `<g class="cube" style="--k:${k}" stroke="#1B3A86" stroke-width="2" stroke-linejoin="round">
    <polygon points="${top}" fill="${colour[0]}"/>
    <polygon points="${left}" fill="${colour[1]}"/>
    <polygon points="${right}" fill="${colour[2]}"/>
  </g>`;
}

export default {
  id: 'blocks',
  cat: 'think',
  color: '#3B6FE0',
  rounds: 3,

  async round(ctx) {
    const [w, d, maxH] = LEVELS[ctx.level];
    const h = pile(w, d, maxH);
    const colour = ['#8FB4FF', '#4C7BE8', '#2F57B8'];
    let svg = '';
    let k = 0;
    let total = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    // Painter's order: back to front, bottom to top.
    for (let s = 0; s < w + d; s++) {
      for (let x = 0; x < w; x++) {
        const y = s - x;
        if (y < 0 || y >= d) continue;
        for (let z = 0; z < h[x][y]; z++) {
          const sx = (x - y) * A;
          const sy = (x + y) * (A / 2) - z * A;
          svg += cubeSVG(sx, sy, colour, k++);
          total++;
          minX = Math.min(minX, sx - A); maxX = Math.max(maxX, sx + A);
          minY = Math.min(minY, sy - A); maxY = Math.max(maxY, sy + A);
        }
      }
    }
    const pad = 8;
    const box = el('div', 'blockpile');
    box.innerHTML = `<svg viewBox="${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}">${svg}</svg>`;
    ctx.stage.append(box);
    // A soft clack as each block drops in.
    for (let i = 0; i < Math.min(total, 8); i++) setTimeout(() => ctx.alive() && ctx.fx.clink(i), 120 + i * 60);
    ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));
    await wait(300);
    const misses = await choices(ctx.stage, nearby(total, 2), total, String, ctx.fx);
    return { mistakes: misses };
  },
};
