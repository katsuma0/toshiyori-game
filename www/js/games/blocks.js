import { el, pick, rand, range, choices, sixOptions, replay } from '../util.js';
import { gameHow } from '../i18n.js';

// How many blocks? A tidy isometric pile of identical cubes. Every pile is a
// shape you can reason about (pillars, stairs, a slab with a hole, a cube with
// a corner gone) so the count comes from a little sum, not from squinting.
// Fairness: every cube is either seen or plainly holding up one that is, and a
// missing cube always leaves a hole you can see.

export const RANGE = [null, [3, 8], [6, 12], [10, 16], [14, 20], [18, 27]];

const A = 30; // half the on-screen width of one cube, in SVG units
const key = (x, y, z) => `${x},${y},${z}`;

// Seen from the front corner: x runs down to the right, y down to the left,
// z straight up. Each cube shows its top, its +y face (left) and +x (right).
const project = (x, y, z) => [(x - y) * A, ((x + y) * A) / 2 - z * A];

// ---------- Shapes ----------
// Cubes are listed in the order a person would stack them. paintOrder() keeps
// that order wherever drawing allows, so the pile builds up naturally.

function box(a, b, c, ox = 0, oy = 0) {
  const out = [];
  for (let z = 0; z < c; z++) for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) out.push([x + ox, y + oy, z]);
  return out;
}

// Solid columns from [[x, y, height], ...], stacked layer by layer.
function columns(map) {
  const out = [];
  const top = Math.max(...map.map((c) => c[2]));
  for (let z = 0; z < top; z++) for (const [x, y, h] of map) if (z < h) out.push([x, y, z]);
  return out;
}

// Pillars standing apart in a row: 3 and 2 make 5. Up to three stand level
// with a wide gap; four zigzag a little so the row still fits a phone.
function pillars(hs) {
  const cubes = [];
  hs.forEach((h, i) => {
    const [x, y] = hs.length <= 3 ? [2 * i, -2 * i] : [Math.ceil(1.5 * i), -Math.floor(1.5 * i)];
    for (let z = 0; z < h; z++) cubes.push([x, y, z]);
  });
  return { kind: 'pillars', cubes };
}

// Steps climbing toward the back, so no step hides the one behind it.
function stairs(n, start = 1, depth = 1) {
  const cubes = [];
  for (let x = 0; x < n; x++) {
    for (let z = 0; z < start + n - 1 - x; z++) for (let y = 0; y < depth; y++) cubes.push([x, y, z]);
  }
  return { kind: 'stairs', cubes };
}

// A slab's holes always sit inside it; a gap on the rim would just look like
// a ragged edge.
const slab = (a, b, holes = 0) => ({ kind: 'slab', cubes: box(a, b, 1), holes, inside: true });
const wall = (w, h, holes = 0) => ({ kind: 'wall', cubes: box(w, 1, h), holes });
const cuboid = (a, b, c, holes = 0) => ({ kind: 'cuboid', cubes: box(a, b, c), holes });

// A plus sign, sometimes with a taller middle. Kept low, because a tall plus
// hides its back arms; bigger counts come from longer arms instead.
function plus(h, extra = 0, arm = 1) {
  const map = [[arm, arm, h + extra]];
  for (let k = 1; k <= arm; k++) map.push([arm, arm - k, h], [arm - k, arm, h], [arm + k, arm, h], [arm, arm + k, h]);
  return { kind: 'plus', cubes: columns(map) };
}

// Stepped pyramid with its peak in the back corner: 3x3 + 2x2 + 1 = 14.
function pyramid(a, b, cap = 9) {
  const map = [];
  for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) map.push([x, y, Math.min(cap, a - x, b - y)]);
  return { kind: 'pyramid', cubes: columns(map) };
}

// An L of equal columns, its corner at the back.
function ell(p, q, h) {
  const map = [];
  for (let x = 0; x < p; x++) map.push([x, 0, h]);
  for (let y = 1; y < q; y++) map.push([0, y, h]);
  return { kind: 'ell', cubes: columns(map) };
}

// Two or three towers with a clear gap: 2x1 dominoes or 2x2 blocks.
function towers(size, hs) {
  const cubes = [];
  hs.forEach((h, i) => cubes.push(...box(2, size, h, size === 2 ? 3 * i : 2 * i, -2 * i)));
  return { kind: 'towers', cubes };
}

// Each level offers a mix of shapes, one entry per kind so every kind comes up
// about as often. Anything outside the level's range is simply drawn again,
// so the tables can stay loose.
const any = (...makers) => () => pick(makers)();

const RECIPES = [
  null,
  [
    any(() => pillars([rand(1, 5), rand(1, 4)]), () => pillars([rand(1, 3), rand(1, 3), rand(1, 2)])),
    any(() => stairs(pick([2, 3]), 1), () => stairs(2, rand(2, 3))),
    any(() => slab(...pick([[2, 2], [3, 2], [4, 2]])), () => slab(3, 3, 1)),
    () => wall(...pick([[2, 2], [3, 2], [4, 2], [2, 3]]), rand(0, 1)),
    () => cuboid(2, 2, 2, rand(0, 1)),
    () => plus(1, rand(0, 2)),
    () => pyramid(...pick([[2, 2], [3, 2]])),
    () => ell(...pick([[3, 3, 1], [2, 2, 2], [3, 2, 2]])),
  ],
  [
    any(() => pillars([rand(1, 5), rand(1, 5), rand(1, 4)]), () => pillars([rand(3, 6), rand(3, 6)])),
    any(() => stairs(pick([3, 4]), 1), () => stairs(3, 2), () => stairs(3, 1, 2)),
    any(() => slab(...pick([[3, 3], [4, 3]]), 1), () => slab(...pick([[4, 2], [5, 2]]))),
    () => wall(...pick([[4, 2], [3, 3], [4, 3], [5, 2]]), rand(0, 2)),
    () => cuboid(...pick([[2, 2, 2], [3, 2, 2], [2, 2, 3]]), rand(0, 1)),
    any(() => plus(2, rand(0, 2)), () => plus(1, rand(0, 2), 2)),
    () => pyramid(...pick([[3, 2], [4, 2]])),
    () => ell(...pick([[3, 3, 2], [4, 2, 2], [4, 3, 2], [3, 2, 3]])),
    () => towers(1, [rand(2, 3), rand(2, 3)]),
  ],
  [
    any(() => pillars([rand(3, 6), rand(3, 6), rand(3, 6)]), () => pillars([rand(2, 5), rand(2, 5), rand(2, 5), rand(2, 5)])),
    any(() => stairs(pick([4, 5]), 1), () => stairs(4, 2), () => stairs(3, 1, 2)),
    () => slab(...pick([[4, 4, 1], [4, 3, 1], [5, 3, 1], [5, 3, 2]])),
    () => wall(...pick([[4, 3], [5, 3], [4, 4]]), rand(1, 2)),
    () => cuboid(...pick([[3, 2, 2], [2, 2, 3], [2, 2, 4], [3, 3, 2], [4, 2, 2]]), rand(1, 2)),
    any(() => plus(2, rand(0, 2)), () => plus(1, rand(1, 3), 2)),
    () => pyramid(...pick([[3, 3], [3, 3, 2], [4, 2]])),
    () => ell(...pick([[4, 3, 2], [3, 3, 3], [4, 4, 2], [5, 3, 2]])),
    any(() => towers(1, [rand(3, 4), rand(3, 4)]), () => towers(2, [rand(1, 2), rand(1, 2)])),
  ],
  [
    () => pillars([rand(3, 6), rand(3, 6), rand(3, 6), rand(3, 6)]),
    any(() => stairs(5, pick([1, 2])), () => stairs(4, pick([1, 2]), pick([1, 2]))),
    () => slab(...pick([[4, 4, 1], [5, 4, 1], [5, 4, 2], [6, 3, 1], [6, 3, 2]])),
    () => wall(...pick([[5, 3], [5, 4], [4, 4], [6, 3]]), rand(1, 2)),
    () => cuboid(...pick([[3, 3, 2], [2, 2, 4], [2, 2, 5], [4, 2, 2], [3, 2, 3]]), rand(1, 3)),
    () => plus(2, rand(0, 2), 2),
    () => pyramid(...pick([[4, 3], [3, 3], [5, 2]])),
    () => ell(...pick([[4, 4, 2], [5, 3, 2], [3, 3, 4], [4, 3, 3], [5, 4, 2]])),
    any(() => towers(2, [rand(2, 3), rand(2, 3)]), () => towers(1, [rand(2, 4), rand(2, 4), rand(2, 4)])),
  ],
  [
    any(() => cuboid(3, 3, 3, rand(0, 3)), () => cuboid(...pick([[4, 3, 2], [3, 2, 4], [4, 2, 3], [3, 3, 2]]), rand(1, 3))),
    () => pyramid(...pick([[4, 4, 2], [4, 3], [5, 3]])),
    () => stairs(...pick([[6, 1, 1], [4, 1, 2], [3, 1, 3], [5, 2, 1], [3, 2, 2]])),
    () => slab(...pick([[5, 4, 0], [5, 4, 1], [5, 4, 2], [5, 5, 1], [5, 5, 2], [6, 4, 1], [6, 4, 2]])),
    () => wall(...pick([[5, 4], [6, 4], [5, 5]]), rand(1, 2)),
    () => plus(pick([2, 3]), rand(0, 2), 2),
    () => ell(...pick([[4, 4, 3], [5, 4, 3], [4, 3, 3], [3, 3, 5]])),
    any(() => towers(2, [rand(2, 3), rand(2, 3)]), () => towers(1, [rand(3, 5), rand(3, 5), rand(3, 5)])),
    () => pillars([rand(4, 7), rand(4, 7), rand(4, 7), rand(4, 7)]),
  ],
];

// ---------- What the player can see ----------
// Light travels to the viewer along (1, 1, 1). A point on a face is seen when
// that ray passes through no other cube.

function blocked(cubes, px, py, pz) {
  for (const [x, y, z] of cubes) {
    const t0 = Math.max(x - px, y - py, z - pz);
    const t1 = Math.min(x + 1 - px, y + 1 - py, z + 1 - pz);
    if (t1 > Math.max(t0, 0) + 1e-9) return true;
  }
  return false;
}

const FACES = {
  top: (x, y, z, u, v) => [x + u, y + v, z + 1],
  left: (x, y, z, u, v) => [x + u, y + 1, z + v],
  right: (x, y, z, u, v) => [x + 1, y + u, z + v],
};

// Share of a cube's face that can be seen, sampled on an n x n grid.
export function seenShare(cubes, [x, y, z], face = 'top', n = 8) {
  let hit = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!blocked(cubes, ...FACES[face](x, y, z, (i + 0.5) / n, (j + 0.5) / n))) hit++;
    }
  }
  return hit / (n * n);
}

// How many cubes show at least a sliver: the count a player gets if they
// forget the ones tucked out of sight.
export function visibleCount(cubes) {
  return cubes.filter((c) => Object.keys(FACES).some((f) => seenShare(cubes, c, f, 6) > 0.03)).length;
}

// A top or a hole counts as in view when about half of it shows or more.
const SEEN = 0.45;

// Everything that would make a pile unfair. An empty list means fair.
export function problems({ cubes, removed = [], count }) {
  const out = [];
  const set = new Set(cubes.map((c) => key(...c)));
  if (set.size !== cubes.length) out.push('duplicate cube');
  if (count !== cubes.length) out.push('count mismatch');
  for (const [x, y, z] of cubes) {
    if (z > 0 && !set.has(key(x, y, z - 1))) out.push(`floating ${key(x, y, z)}`);
    // The top of every column must show, or the column could be any height.
    if (!set.has(key(x, y, z + 1)) && seenShare(cubes, [x, y, z]) < SEEN) out.push(`hidden top ${key(x, y, z)}`);
  }
  for (const [x, y, z] of removed) {
    if (set.has(key(x, y, z))) out.push(`removed still there ${key(x, y, z)}`);
    if (set.has(key(x, y, z + 1))) out.push(`removed from under ${key(x, y, z)}`);
    if (z > 0 && !set.has(key(x, y, z - 1))) out.push(`hole too deep ${key(x, y, z)}`);
    // The mouth of the hole must be in plain view.
    if (seenShare(cubes, [x, y, z]) < SEEN) out.push(`hole hidden ${key(x, y, z)}`);
  }
  return out;
}

// Takes k cubes off the top layer, only where the gap stays plainly visible.
// Spots with neighbours all round are favoured so the gap reads as a hole,
// not a ragged edge, and two gaps never touch.
function dig(cubes, k, inside = false) {
  let present = cubes;
  const removed = [];
  for (let n = 0; n < k; n++) {
    const set = new Set(present.map((c) => key(...c)));
    const near = ([x, y, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => set.has(key(x + dx, y + dy, z))).length;
    const options = present.filter((c) => {
      const [x, y, z] = c;
      if (set.has(key(x, y, z + 1)) || (inside && near(c) < 4)) return false;
      if (removed.some((r) => r[2] === z && Math.abs(r[0] - x) <= 1 && Math.abs(r[1] - y) <= 1)) return false;
      // Taking a cube away only ever uncovers others, so just this hole and
      // the cube now on top of its column need checking.
      const rest = present.filter((p) => p !== c);
      return seenShare(rest, c) >= SEEN && (z === 0 || seenShare(rest, [x, y, z - 1]) >= SEEN);
    });
    if (!options.length) return null;
    const weights = options.map((c) => [0.05, 0.1, 0.4, 1, 8][near(c)]);
    let r = Math.random() * weights.reduce((s, w) => s + w, 0);
    const c = options.find((_, i) => (r -= weights[i]) < 0) || options[options.length - 1];
    present = present.filter((p) => p !== c);
    removed.push(c);
  }
  return { present, removed };
}

function finish({ kind, cubes, holes = 0, inside }) {
  let removed = [];
  if (holes) {
    const d = dig(cubes, holes, inside);
    if (!d) return null;
    ({ present: cubes, removed } = d);
  }
  // A mirror image is just as fair, and doubles the variety.
  if (Math.random() < 0.5) {
    cubes = cubes.map(([x, y, z]) => [y, x, z]);
    removed = removed.map(([x, y, z]) => [y, x, z]);
  }
  return { kind, cubes, removed, count: cubes.length };
}

// A fair pile for this level. `avoid` lists shape kinds just played, so the
// same shape does not come up twice in a row.
export function makePile(level, avoid = []) {
  const [lo, hi] = RANGE[level];
  for (let guard = 0; guard < 400; guard++) {
    const spec = pick(RECIPES[level])();
    const n = spec.cubes.length - (spec.holes || 0);
    if (n < lo || n > hi || (guard < 200 && avoid.includes(spec.kind))) continue;
    const pile = finish(spec);
    if (pile && !problems(pile).length) return pile;
  }
  // Practically unreachable; a plain wall in range keeps the game going.
  return finish(wall(...[null, [3, 2], [3, 3], [4, 3], [4, 4], [5, 4]][level]));
}

// Six answers: the count, the "forgot the hidden ones" slip, the "counted the
// gap anyway" slip, and near neighbours to round it out. The answer's place
// among the sorted buttons is picked evenly from every place the slips allow,
// so always tapping, say, the fourth button is no better than a guess.
export function optionsFor(pile) {
  const answer = pile.count;
  const slips = new Set();
  const seen = visibleCount(pile.cubes);
  if (seen < answer && answer - seen <= 9) slips.add(seen);
  if (pile.removed.length) slips.add(answer + pile.removed.length);
  const under = [...slips].filter((v) => v < answer).length;
  const spot = pick(range(under, 5 - (slips.size - under)).filter((p) => p < answer));
  const out = new Set([answer, ...slips]);
  const below = () => [...out].filter((v) => v < answer).length;
  const above = () => [...out].filter((v) => v > answer).length;
  for (let k = 1; below() < spot; k++) out.add(answer - k);
  for (let k = 1; above() < 5 - spot; k++) out.add(answer + k);
  return sixOptions(answer, [...out].filter((v) => v !== answer), { min: 1 });
}

// Back to front. Two unit cubes overlap on screen only when their offsets
// differ by at most one on every axis, and then the one with the larger
// x + y + z is nearer. Among the cubes free to go next, the shape's own
// stacking order wins.
export function paintOrder(cubes) {
  const n = cubes.length;
  const ahead = cubes.map(() => []);
  const waiting = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = [0, 1, 2].map((a) => cubes[j][a] - cubes[i][a]);
      if (Math.max(...d) - Math.min(...d) > 1) continue;
      const [back, front] = d[0] + d[1] + d[2] > 0 ? [i, j] : [j, i];
      ahead[back].push(front);
      waiting[front]++;
    }
  }
  const ready = new Set(cubes.map((_, i) => i).filter((i) => !waiting[i]));
  const out = [];
  while (ready.size) {
    const i = Math.min(...ready);
    ready.delete(i);
    out.push(cubes[i]);
    for (const f of ahead[i]) if (--waiting[f] === 0) ready.add(f);
  }
  return out;
}

// ---------- Drawing ----------

const pts = (corners) => corners.map((c) => project(...c).map((v) => Math.round(v * 10) / 10).join(',')).join(' ');

function cubeSVG([x, y, z], k) {
  const top = pts([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]);
  const left = pts([[x, y + 1, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z], [x, y + 1, z]]);
  const right = pts([[x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z], [x + 1, y, z]]);
  return `<g class="bk-cube" style="--k:${k}"><polygon class="t" points="${top}"/><polygon class="l" points="${left}"/><polygon class="r" points="${right}"/></g>`;
}

export function pileSVG(pile) {
  const mat = A * 0.3; // how far the floor mat reaches past the cubes
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = ([sx, sy], r = 0) => {
    x0 = Math.min(x0, sx - r); x1 = Math.max(x1, sx + r);
    y0 = Math.min(y0, sy - r); y1 = Math.max(y1, sy + r);
  };
  // The mat covers the whole footprint, gaps included, so a missing cube
  // reads as missing rather than as the edge of the shape.
  const foot = new Map();
  for (const [x, y] of [...pile.cubes, ...pile.removed]) foot.set(`${x},${y}`, [x, y]);
  const floor = [...foot.values()].map(([x, y]) => {
    const c = [[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]];
    c.forEach((p) => grow(project(...p), mat));
    return `<polygon points="${pts(c)}"/>`;
  });
  const body = paintOrder(pile.cubes).map((c, k) => {
    const [x, y, z] = c;
    for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) grow(project(x + dx, y + dy, z + dz));
    return cubeSVG(c, k);
  });
  // Small piles get a minimum frame so their cubes stay a friendly size
  // instead of ballooning to fill the screen.
  const pad = A * 0.3;
  const w = Math.max(x1 - x0 + pad * 2, A * 8);
  const h = Math.max(y1 - y0 + pad * 2, A * 6.5);
  const vb = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h].map((v) => Math.round(v));
  // Bigger piles drop faster per cube so the whole build stays about a second.
  const step = Math.round(Math.max(38, Math.min(120, 1000 / pile.count)));
  return {
    step,
    svg: `<svg viewBox="${vb.join(' ')}" style="--step:${step}ms" role="img" aria-label="${gameHow('blocks')}">
      <g class="bk-floor" stroke-width="${mat * 2}">${floor.join('')}</g>${body.join('')}</svg>`,
  };
}

// ---------- The game ----------

let recent = [];

export default {
  id: 'blocks',
  cat: 'think',
  rounds: 4,

  async round(ctx) {
    const pile = makePile(Math.min(5, Math.max(1, ctx.level | 0)), recent);
    recent = [pile.kind, ...recent].slice(0, 2);

    const view = el('div', 'bk-view');
    const { svg, step } = pileSVG(pile);
    view.innerHTML = svg;
    ctx.stage.append(view);
    // A soft clack as each of the first few cubes lands.
    for (let i = 0; i < Math.min(pile.count, 6); i++) {
      setTimeout(() => ctx.alive() && ctx.fx.clink(i), 120 + i * step + 340);
    }

    // The answers go in straight away so the pile never jumps when they
    // arrive; blocks.css holds their pop-in until the pile is mostly built.
    ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));
    const picked = choices(ctx.stage, optionsFor(pile), pile.count, String, ctx.fx);
    ctx.stage.querySelector('.choice[data-ok]').addEventListener('pointerdown', () => replay(view, 'solved'), { once: true });
    const misses = await picked;
    return { mistakes: misses };
  },
};
