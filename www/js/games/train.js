import { el, pick, rand, wait, choices } from '../util.js';

// Fix the track. A little railway crosses a map seen from above and one piece
// is missing. Pick the tile that joins the two loose ends, then the train
// drives through. Every option is drawn exactly as it would sit on the map,
// so it is a shape match, not a left or right puzzle.

export const SIDES = ['N', 'E', 'S', 'W'];
export const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };
export const DX = { N: 0, E: 1, S: 0, W: -1 };
export const DY = { N: -1, E: 0, S: 1, W: 0 };

// A cell is { x, y, in, out }: the side the train enters by and the side it
// leaves by. A piece is the two sides joined into one key, e.g. 'WN'.
export const isTurn = (c) => c.out !== OPP[c.in];
export const pieceOf = (c) => c.in + c.out;

// len: cells on the path, turns: at least this many bends, gaps: missing
// cells in a row. Level 1 never hides the very first cell, so its gap always
// sits between two pieces of track on the map, the easiest join to read.
export const LEVELS = [
  null,
  { size: 3, gaps: 1, len: [4, 6], turns: 1, avoidFirst: true },
  { size: 3, gaps: 1, len: [5, 7], turns: 2 },
  { size: 4, gaps: 1, len: [6, 10], turns: 2 },
  { size: 4, gaps: 2, len: [7, 11], turns: 3 },
  { size: 4, gaps: 2, len: [8, 12], turns: 3 },
];

const inside = (size, x, y) => x >= 0 && y >= 0 && x < size && y < size;
// Where along its edge a boundary cell sits, for the side it faces.
const along = (c, side) => (side === 'N' || side === 'S' ? c.x : c.y);

// The exit may share the entry's edge only when it is well away from it, so
// the two stubs never crowd each other.
function exitOk(from, p, d, c) {
  return d !== from || Math.abs(along(c, d) - p) >= 2;
}

// One random self-avoiding walk from an edge to an edge. Returns null when it
// paints itself into a corner; the caller simply tries again.
function walk(size, target, max) {
  const from = pick(SIDES);
  const p = rand(0, size - 1);
  const x = from === 'W' ? 0 : from === 'E' ? size - 1 : p;
  const y = from === 'N' ? 0 : from === 'S' ? size - 1 : p;
  const cells = [{ x, y, in: from, out: null }];
  const seen = new Set([x + y * size]);
  for (;;) {
    const c = cells[cells.length - 1];
    const steps = [];
    const exits = [];
    for (const d of SIDES) {
      if (d === c.in) continue;
      const nx = c.x + DX[d];
      const ny = c.y + DY[d];
      if (!inside(size, nx, ny)) {
        if (exitOk(from, p, d, c)) exits.push(d);
      } else if (!seen.has(nx + ny * size)) steps.push(d);
    }
    const n = cells.length;
    let d;
    if (n >= target && exits.length) d = pick(exits);
    else if (n < max && steps.length) d = pick(steps);
    else return null;
    c.out = d;
    if (!inside(size, c.x + DX[d], c.y + DY[d])) return cells;
    const next = { x: c.x + DX[d], y: c.y + DY[d], in: OPP[d], out: null };
    seen.add(next.x + next.y * size);
    cells.push(next);
  }
}

// Returns null if the path has no cell of the wanted kind.
function chooseGaps(cells, gaps, avoidFirst, wantTurn) {
  const starts = [];
  for (let i = avoidFirst ? 1 : 0; i + gaps <= cells.length; i++) starts.push(i);
  const pool = starts.filter((i) => isTurn(cells[i]) === wantTurn);
  if (!pool.length) return null;
  const i = pick(pool);
  return Array.from({ length: gaps }, (_, k) => i + k);
}

const stepTo = (a, b) => SIDES.find((d) => a.x + DX[d] === b.x && a.y + DY[d] === b.y);

// A snake over the top three rows that always works, in case random walks
// keep failing. The gap is its first bend.
export function fallbackTrack(size, gaps = 1) {
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let k = 0; k < size; k++) cells.push({ x: y % 2 ? size - 1 - k : k, y });
  }
  cells.forEach((c, i) => {
    c.in = i ? OPP[stepTo(cells[i - 1], c)] : 'W';
    c.out = i < cells.length - 1 ? stepTo(c, cells[i + 1]) : 'E';
  });
  return { size, cells, missing: Array.from({ length: gaps }, (_, k) => size - 1 + k) };
}

export function makeTrack(size, gaps = 1, { len = [size + 1, size * 2], turns = 2, avoidFirst = false } = {}) {
  // About two times in three the gap is a bend, the more interesting shape to
  // spot. Decided once, so paths that cannot oblige do not tilt the odds.
  const wantTurn = Math.random() < 2 / 3;
  for (let tries = 0; tries < 4000; tries++) {
    const cells = walk(size, rand(len[0], len[1]), len[1]);
    if (!cells || cells.filter(isTurn).length < turns) continue;
    const missing = chooseGaps(cells, gaps, avoidFirst, wantTurn);
    if (missing) return { size, cells, missing };
  }
  return fallbackTrack(size, gaps);
}

export function levelTrack(level) {
  const L = LEVELS[level] || LEVELS[1];
  return makeTrack(L.size, L.gaps, L);
}

// The three pieces that carry on from the side the train comes in by. The
// bend towards the left or top of the screen sits on the left, straight on in
// the middle, so where a button is matches the way its picture bends.
export function optionsFor(cell) {
  const h = OPP[cell.in];
  const bends = SIDES.filter((d) => d !== cell.in && d !== h);
  const first = bends.find((d) => d === 'W' || d === 'N');
  const last = bends.find((d) => d !== first);
  return [first, h, last].map((o) => cell.in + o);
}

// ---------- Drawing ----------
// One cell is 100 units. The map keeps a margin round the grid for the stub
// the train waits on and the stub it leaves by.

const CELL = 100;
const M = 86;
const STOP = 43; // the train's centre stands this far out on a stub
const GAUGE = 14; // half the gap between the rails
const SLEEPER = 23; // half a sleeper's length
const MID = { N: [50, 0], E: [100, 50], S: [50, 100], W: [0, 50] };

const r1 = (v) => Math.round(v * 10) / 10;
const pt = (x, y) => `${r1(x)} ${r1(y)}`;

// A bend is a quarter circle of radius 50 round the corner between its two
// sides: centre, angle where it starts, and signed sweep (+ is clockwise).
function bend(a, b) {
  const cx = a === 'E' || b === 'E' ? 100 : 0;
  const cy = a === 'S' || b === 'S' ? 100 : 0;
  const ta = Math.atan2(MID[a][1] - cy, MID[a][0] - cx);
  let dt = Math.atan2(MID[b][1] - cy, MID[b][0] - cx) - ta;
  if (dt > Math.PI) dt -= 2 * Math.PI;
  if (dt < -Math.PI) dt += 2 * Math.PI;
  return { cx, cy, ta, dt, sweep: dt > 0 ? 1 : 0 };
}

// Bed, sleepers and rails of one piece, as path data, offset to (ox, oy).
// Kept as three layers so a whole map can stack every bed under every
// sleeper under every rail and the joins between cells stay invisible.
export function pieceLayers(a, b, ox = 0, oy = 0) {
  const [ax, ay] = MID[a];
  const [bx, by] = MID[b];
  const out = { bed: '', sleepers: '', rails: '', centre: '' };
  if (b === OPP[a]) {
    const ux = (bx - ax) / CELL;
    const uy = (by - ay) / CELL;
    const nx = -uy;
    const ny = ux;
    out.centre = `M${pt(ox + ax, oy + ay)}L${pt(ox + bx, oy + by)}`;
    out.bed = out.centre;
    for (const s of [-GAUGE, GAUGE]) out.rails += `M${pt(ox + ax + nx * s, oy + ay + ny * s)}L${pt(ox + bx + nx * s, oy + by + ny * s)}`;
    for (let k = 0; k < 5; k++) {
      const t = ((k + 0.5) / 5) * CELL;
      const cx = ox + ax + ux * t;
      const cy = oy + ay + uy * t;
      out.sleepers += `M${pt(cx - nx * SLEEPER, cy - ny * SLEEPER)}L${pt(cx + nx * SLEEPER, cy + ny * SLEEPER)}`;
    }
    return out;
  }
  const { cx, cy, ta, dt, sweep } = bend(a, b);
  const at = (side, r) => [cx + ((MID[side][0] - cx) * r) / 50, cy + ((MID[side][1] - cy) * r) / 50];
  const arc = (r) => {
    const [x0, y0] = at(a, r);
    const [x1, y1] = at(b, r);
    return `M${pt(ox + x0, oy + y0)}A${r} ${r} 0 0 ${sweep} ${pt(ox + x1, oy + y1)}`;
  };
  out.centre = arc(50);
  out.bed = out.centre;
  out.rails = arc(50 - GAUGE) + arc(50 + GAUGE);
  for (let k = 0; k < 4; k++) {
    const th = ta + (dt * (k + 0.5)) / 4;
    const c = Math.cos(th);
    const s = Math.sin(th);
    out.sleepers += `M${pt(ox + cx + c * (50 - SLEEPER), oy + cy + s * (50 - SLEEPER))}L${pt(ox + cx + c * (50 + SLEEPER), oy + cy + s * (50 + SLEEPER))}`;
  }
  return out;
}

// A straight run of track leaving an edge point (x, y) in direction d.
function stubLayers(x, y, d, len) {
  const nx = -DY[d];
  const ny = DX[d];
  const ex = x + DX[d] * len;
  const ey = y + DY[d] * len;
  const out = { bed: `M${pt(x, y)}L${pt(ex, ey)}`, sleepers: '', rails: '' };
  for (const s of [-GAUGE, GAUGE]) out.rails += `M${pt(x + nx * s, y + ny * s)}L${pt(ex + nx * s, ey + ny * s)}`;
  for (let t = 10; t < len; t += 20) {
    const cx = x + DX[d] * t;
    const cy = y + DY[d] * t;
    out.sleepers += `M${pt(cx - nx * SLEEPER, cy - ny * SLEEPER)}L${pt(cx + nx * SLEEPER, cy + ny * SLEEPER)}`;
  }
  return out;
}

const cellOrigin = (c) => [M + c.x * CELL, M + c.y * CELL];
function edgePoint(c, side) {
  const [ox, oy] = cellOrigin(c);
  return [ox + MID[side][0], oy + MID[side][1]];
}

// The one continuous line the train follows: from its spot on the entry stub,
// through every cell, to its spot on the exit stub.
export function routePath(track) {
  const { cells } = track;
  const first = cells[0];
  const last = cells[cells.length - 1];
  const [sx, sy] = edgePoint(first, first.in);
  let d = `M${pt(sx + DX[first.in] * STOP, sy + DY[first.in] * STOP)}L${pt(sx, sy)}`;
  for (const c of cells) {
    const [ox, oy] = cellOrigin(c);
    d += pieceLayers(c.in, c.out, ox, oy).centre.replace(/^M[^LA]*/, '');
  }
  const [ex, ey] = edgePoint(last, last.out);
  return `${d}L${pt(ex + DX[last.out] * STOP, ey + DY[last.out] * STOP)}`;
}

const layersSVG = (L) =>
  `<path class="trn-bed" d="${L.bed}"/><path class="trn-sleepers" d="${L.sleepers}"/><path class="trn-rails" d="${L.rails}"/>`;

// ---------- Scenery ----------
// Round, flat shapes seen from above. Outlines come from the same circles
// drawn a little bigger underneath, so overlapping lobes merge cleanly.

const jit = (k) => (Math.random() * 2 - 1) * k;

function blob(cls, parts, edge = 3) {
  const under = parts.map(([x, y, r]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r + edge)}"/>`).join('');
  const over = parts.map(([x, y, r]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`).join('');
  return `<g class="${cls}"><g class="e">${under}</g><g class="f">${over}</g></g>`;
}

// A round canopy with a softly scalloped edge.
function tree(cx, cy, s = 1) {
  const a = Math.random() * Math.PI * 2;
  const lobes = [[0, 0, 20 * s]];
  for (let k = 0; k < 6; k++) {
    const t = a + (k * Math.PI * 2) / 6;
    lobes.push([Math.cos(t) * 14 * s, Math.sin(t) * 14 * s, 10.5 * s]);
  }
  return blob('trn-tree', lobes.map(([x, y, r]) => [cx + x, cy + y, r]));
}

function flower(cx, cy, tone) {
  let petals = '';
  for (let k = 0; k < 5; k++) {
    const t = (k / 5) * Math.PI * 2;
    petals += `<circle cx="${r1(cx + Math.cos(t) * 5)}" cy="${r1(cy + Math.sin(t) * 5)}" r="4.4"/>`;
  }
  return `<g class="trn-flower ${tone}">${petals}<circle class="c" cx="${r1(cx)}" cy="${r1(cy)}" r="3.4"/></g>`;
}

// A little clover patch. Round on purpose: anything pointy on this map could
// be mistaken for a direction arrow.
const tuft = (x, y) => `<g class="trn-clover"><circle cx="${r1(x - 4.5)}" cy="${r1(y + 2)}" r="4.5"/><circle cx="${r1(x + 4.5)}" cy="${r1(y + 2)}" r="4.5"/><circle cx="${r1(x)}" cy="${r1(y - 5)}" r="4.5"/></g>`;

function scenery(kind, ox, oy) {
  const cx = ox + 50;
  const cy = oy + 50;
  switch (kind) {
    case 'tree':
      return tree(cx + jit(6), cy + jit(6), 1.05);
    case 'grove':
      return tree(ox + 32 + jit(3), oy + 34 + jit(3), 0.62) + tree(ox + 68 + jit(3), oy + 46 + jit(4), 0.7) + tree(ox + 38 + jit(4), oy + 70 + jit(3), 0.56);
    case 'bush':
      return blob('trn-bush', [[cx - 10, cy + 2, 13], [cx + 9, cy - 3, 15], [cx + 2, cy + 11, 11]].map(([x, y, r]) => [x + jit(4), y + jit(4), r])) + flower(ox + 24, oy + 24, 'pink');
    case 'pond': {
      const rx = 33 + jit(3);
      const ry = 24 + jit(3);
      return `<g class="trn-pond"><ellipse class="e" cx="${cx}" cy="${cy}" rx="${r1(rx + 3)}" ry="${r1(ry + 3)}"/><ellipse class="f" cx="${cx}" cy="${cy}" rx="${r1(rx)}" ry="${r1(ry)}"/>
        <path class="pad" d="M${pt(cx + 12, cy + 2)}a8 8 0 1 0 7 -4l-7 4z"/><circle class="bud" cx="${r1(cx - 12)}" cy="${r1(cy - 6)}" r="3.2"/></g>`;
    }
    case 'flowers': {
      const tones = ['pink', 'yellow', 'white'];
      const spots = [[28, 30], [66, 26], [46, 54], [74, 68], [26, 72]];
      return spots
        .filter(() => Math.random() < 0.8)
        .map(([x, y], k) => flower(ox + x + jit(4), oy + y + jit(4), tones[(k + rand(0, 2)) % 3]))
        .join('');
    }
    case 'rocks':
      return blob('trn-rock', [[cx - 12 + jit(3), cy + 6, 12], [cx + 10, cy - 6 + jit(3), 9]], 2.5) + tuft(ox + 70, oy + 72) + tuft(ox + 26, oy + 30);
    default:
      return tuft(ox + 30 + jit(6), oy + 40 + jit(6)) + tuft(ox + 66 + jit(6), oy + 64 + jit(6));
  }
}

// Cells off the track get scenery, with a pond at most once so the map feels
// like a place, not a pattern.
function sceneryFor(track) {
  const on = new Set(track.cells.map((c) => c.x + c.y * track.size));
  const kinds = ['tree', 'tree', 'grove', 'flowers', 'bush', 'pond', 'rocks', 'grass'];
  let pond = false;
  let svg = '';
  for (let y = 0; y < track.size; y++) {
    for (let x = 0; x < track.size; x++) {
      if (on.has(x + y * track.size)) continue;
      let kind = pick(kinds);
      if (kind === 'pond' && pond) kind = pick(['tree', 'flowers', 'grass']);
      if (kind === 'pond') pond = true;
      svg += scenery(kind, M + x * CELL, M + y * CELL);
    }
  }
  return svg;
}

// A few clovers and flowers in the margin, kept clear of the spots where the
// train waits, where it stops and where the flag stands.
function borderScenery(vb, keepClear) {
  const spots = [];
  for (let k = 0; k < 10; k++) {
    const side = pick(SIDES);
    const t = M + Math.random() * (vb - 2 * M);
    const depth = 20 + Math.random() * (M - 40);
    const x = side === 'W' ? depth : side === 'E' ? vb - depth : t;
    const y = side === 'N' ? depth : side === 'S' ? vb - depth : t;
    if (keepClear.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 64)) continue;
    if (spots.some(([px, py]) => Math.hypot(px - x, py - y) < 60)) continue;
    spots.push([x, y]);
  }
  return spots.map(([x, y], k) => (k % 3 === 0 ? flower(x, y, k % 2 ? 'yellow' : 'white') : tuft(x, y))).join('');
}

// ---------- Pictures ----------

// The engine, seen from above, nose pointing right. Wheels peek out at the
// sides, a pale cab roof with a window at the back, a chimney up front.
const TRAIN = `<svg viewBox="-40 -26 80 52" aria-hidden="true">
  <g class="trn-wheels"><rect x="-24" y="-24" width="11" height="48" rx="3"/><rect x="-4" y="-24" width="11" height="48" rx="3"/><rect x="15" y="-24" width="11" height="48" rx="3"/></g>
  <rect class="trn-body" x="-32" y="-19" width="62" height="38" rx="13"/>
  <rect class="trn-cab" x="-29" y="-16" width="25" height="32" rx="9"/>
  <rect class="trn-window" x="-23.5" y="-10" width="14" height="20" rx="4"/>
  <circle class="trn-chimney" cx="13" cy="0" r="7.5"/>
  <circle class="trn-chimney-top" cx="13" cy="0" r="3.6"/>
  <circle class="trn-lamp" cx="25" cy="0" r="4"/>
  <rect class="trn-buffer" x="29" y="-14" width="6" height="28" rx="3"/>
</svg>`;

const FLAG = `<svg viewBox="0 0 46 60" aria-hidden="true">
  <ellipse class="trn-flag-foot" cx="7" cy="57" rx="7" ry="3"/>
  <path class="trn-flag-cloth" d="M8 6 L42 14.5 L8 25 Z"/>
  <path class="trn-flag-pole" d="M7 5 V57"/>
  <circle class="trn-flag-knob" cx="7" cy="4.5" r="3.6"/>
</svg>`;

// Point and heading at fraction f along a piece's centre line.
function pointOn(a, b, f) {
  if (b === OPP[a]) {
    const [ax, ay] = MID[a];
    const [bx, by] = MID[b];
    return [ax + (bx - ax) * f, ay + (by - ay) * f, (bx - ax) / CELL, (by - ay) / CELL];
  }
  const { cx, cy, ta, dt } = bend(a, b);
  const th = ta + dt * f;
  const s = Math.sign(dt);
  return [cx + Math.cos(th) * 50, cy + Math.sin(th) * 50, -Math.sin(th) * s, Math.cos(th) * s];
}

// An arrow along the middle of the track, bending with it, showing which way
// the train will go. A long shaft and a narrow head so it can only be read
// one way, whatever angle it sits at.
function arrow(a, b) {
  const f0 = 0.26;
  const f1 = 0.6;
  const [x0, y0] = pointOn(a, b, f0);
  const [x1, y1, tx, ty] = pointOn(a, b, f1);
  const shaft = `M${pt(x0, y0)}${b === OPP[a] ? 'L' : `A50 50 0 0 ${bend(a, b).sweep} `}${pt(x1, y1)}`;
  const nx = -ty;
  const ny = tx;
  const head = `M${pt(x1 + tx * 17, y1 + ty * 17)}L${pt(x1 + nx * 11, y1 + ny * 11)}L${pt(x1 - nx * 11, y1 - ny * 11)}Z`;
  return `<g class="trn-arrow"><path class="o" d="${shaft}"/><path class="o h" d="${head}"/><path class="i" d="${shaft}"/><path class="i h" d="${head}"/></g>`;
}

// One square tile, the same art as the map: grass, the piece, and on answer
// buttons an arrow for the direction of travel.
function tileSVG(key, { withArrow = false, cls = '' } = {}) {
  const a = key[0];
  const b = key[1];
  // The outline goes on top so the rails run cleanly up to the tile's edge.
  return `<svg class="trn-tile ${cls}" viewBox="0 0 100 100" aria-hidden="true"><rect class="trn-tilebg" x="1" y="1" width="98" height="98" rx="14"/>${layersSVG(pieceLayers(a, b))}<rect class="trn-tileline" x="1" y="1" width="98" height="98" rx="14"/>${withArrow ? arrow(a, b) : ''}</svg>`;
}

// Map units to a percentage of the map's width, for the HTML overlays.
const pc = (v, vb) => `${(v / vb) * 100}%`;

function buildMap(track) {
  const { size, cells, missing } = track;
  const vb = size * CELL + 2 * M;
  const gaps = new Set(missing);
  const L = { bed: '', sleepers: '', rails: '' };
  const add = (p) => {
    L.bed += p.bed;
    L.sleepers += p.sleepers;
    L.rails += p.rails;
  };
  cells.forEach((c, i) => {
    if (gaps.has(i)) return;
    const [ox, oy] = cellOrigin(c);
    add(pieceLayers(c.in, c.out, ox, oy));
  });
  const first = cells[0];
  const last = cells[cells.length - 1];
  const [sx, sy] = edgePoint(first, first.in);
  const [ex, ey] = edgePoint(last, last.out);
  add(stubLayers(sx, sy, first.in, M));
  add(stubLayers(ex, ey, last.out, M));

  let lines = '';
  for (let k = 1; k < size; k++) {
    const v = M + k * CELL;
    lines += `M${v} ${M}V${M + size * CELL}M${M} ${v}H${M + size * CELL}`;
  }
  const stopIn = [sx + DX[first.in] * STOP, sy + DY[first.in] * STOP];
  const stopOut = [ex + DX[last.out] * STOP, ey + DY[last.out] * STOP];
  const flagAt = flagSpot(last.out, ex, ey, vb);

  const wrap = el('div', 'trn-map');
  wrap.style.setProperty('--cell', (CELL / vb) * 100);
  wrap.innerHTML = `<svg class="trn-ground" viewBox="0 0 ${vb} ${vb}" aria-hidden="true">
    <rect class="trn-meadow" x="0" y="0" width="${vb}" height="${vb}" rx="36"/>
    <rect class="trn-field" x="${M}" y="${M}" width="${size * CELL}" height="${size * CELL}" rx="6"/>
    <path class="trn-gridline" d="${lines}"/>
    ${borderScenery(vb, [stopIn, stopOut, flagAt])}
    ${sceneryFor(track)}
    ${layersSVG(L)}
    <rect class="trn-frame" x="1.5" y="1.5" width="${vb - 3}" height="${vb - 3}" rx="34.5"/>
    <path class="trn-route" d="${routePath(track)}"/>
  </svg>`;

  const slots = missing.map((i) => {
    const [ox, oy] = cellOrigin(cells[i]);
    const s = el('div', 'trn-slot', '<div class="trn-ask"><span>?</span></div>');
    s.style.left = pc(ox, vb);
    s.style.top = pc(oy, vb);
    s.style.width = pc(CELL, vb);
    s.style.height = pc(CELL, vb);
    wrap.append(s);
    return s;
  });

  const flag = el('div', 'trn-flag', `<div>${FLAG}</div>`);
  flag.style.left = pc(flagAt[0], vb);
  flag.style.top = pc(flagAt[1], vb);
  wrap.append(flag);

  const mover = el('div', 'trn-mover');
  const train = el('div', 'trn-train', TRAIN);
  mover.append(train);
  wrap.append(mover);
  const h = OPP[first.in];
  placeTrain(mover, train, stopIn[0], stopIn[1], Math.atan2(DY[h], DX[h]), vb);

  // A piece that has landed joins the map's own track paths. Drawn as one
  // shape with its neighbours, its rails meet theirs with no hairline seam,
  // which a separate overlay picture always leaves at the cell edge.
  const paths = {};
  for (const k of ['bed', 'sleepers', 'rails']) paths[k] = wrap.querySelector(`.trn-ground .trn-${k}`);
  const lay = (i) => {
    const c = cells[i];
    const [ox, oy] = cellOrigin(c);
    const p = pieceLayers(c.in, c.out, ox, oy);
    for (const k in paths) paths[k].setAttribute('d', paths[k].getAttribute('d') + p[k]);
  };

  // The map sits in a box that fills the space above the answers, so it can
  // grow as big as the screen allows without ever reaching them.
  const fit = el('div', 'trn-fit');
  fit.append(wrap);
  return { fit, wrap, slots, flag, mover, train, vb, lay, route: wrap.querySelector('.trn-route') };
}

// Foot of the flag pole: beside the exit stub, next to where the train
// stops, with the whole flag inside the margin so it is never cut off.
function flagSpot(side, x, y, vb) {
  if (side === 'N') return [x + 42, M - 14];
  if (side === 'S') return [x + 42, vb - 12];
  return [side === 'E' ? vb - M + 30 : 30, y - 34];
}

function placeTrain(mover, train, x, y, ang, vb) {
  // The mover is as big as the map, so its percentages are map percentages.
  mover.style.transform = `translate(${(x / vb) * 100}%, ${(y / vb) * 100}%)`;
  train.style.transform = `translate(-50%, -50%) rotate(${ang}rad)`;
}

function puff(map, x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const p = el('i', 'trn-puff');
  p.style.left = pc(x, map.vb);
  p.style.top = pc(y, map.vb);
  map.wrap.append(p);
  p.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.35)', opacity: 0.95 },
      { transform: 'translate(-50%, -120%) scale(1.5)', opacity: 0 },
    ],
    { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' },
  ).onfinish = () => p.remove();
}

// Slow out of the station, cruise, slow into the next one.
const ease = (f) => 0.5 - Math.cos(Math.PI * f) / 2;

function ride(ctx, map) {
  return new Promise((resolve) => {
    const path = map.route;
    const total = path.getTotalLength();
    const dur = Math.min(3200, Math.max(2200, total * 3));
    let t0 = 0;
    let next = 0;
    let k = 0;
    const frame = (now) => {
      if (!ctx.alive()) return resolve();
      if (!t0) t0 = now;
      const f = Math.min(1, (now - t0) / dur);
      const s = ease(f) * total;
      const p = path.getPointAtLength(s);
      const a = path.getPointAtLength(Math.max(0, s - 1.5));
      const b = path.getPointAtLength(Math.min(total, s + 1.5));
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      placeTrain(map.mover, map.train, p.x, p.y, ang, map.vb);
      // A soft chug and a puff of steam about once per cell.
      if (s >= next && f < 0.97) {
        ctx.fx.clink(k++);
        puff(map, p.x + Math.cos(ang) * 13, p.y + Math.sin(ang) * 13);
        next += CELL * 1.4;
      }
      if (f < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

// A tried piece flashes into the gap. A wrong one shakes and fades back to
// the question mark; the right one drops in and stays.
function tryPiece(slot, key, ok, settle) {
  slot.querySelectorAll('.trn-piece.wrong').forEach((n) => n.remove());
  const p = el('div', `trn-piece ${ok ? 'placed' : 'wrong'}`, tileSVG(key));
  slot.append(p);
  if (ok) {
    slot.classList.remove('trying', 'active');
    slot.classList.add('filled');
    // Once it has landed, hand it over to the map. The timer covers the
    // case where animationend never comes, e.g. a backgrounded app.
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      settle();
      p.remove();
    };
    p.addEventListener('animationend', (e) => e.target === p && land());
    setTimeout(land, 700);
    return;
  }
  slot.classList.add('trying');
  // Just before the fade ends, so it never blinks back at full strength.
  setTimeout(() => {
    p.remove();
    if (!slot.querySelector('.trn-piece.wrong')) slot.classList.remove('trying');
  }, 1100);
}

export default {
  id: 'train',
  cat: 'think',
  rounds: 4,

  async round(ctx) {
    const track = levelTrack(ctx.level);
    const map = buildMap(track);
    ctx.stage.append(map.fit);
    ctx.progress(0);
    const steps = track.missing.length + 1;
    let mistakes = 0;
    let row = null;

    for (let k = 0; k < track.missing.length; k++) {
      const cell = track.cells[track.missing[k]];
      const slot = map.slots[k];
      slot.classList.add('active');
      const opts = optionsFor(cell);
      // Build the answers off stage, then swap them in place of the last
      // set, so the map never jumps while the row changes.
      const host = el('div');
      const answered = choices(host, opts, pieceOf(cell), (v) => tileSVG(v, { withArrow: true, cls: 'trn-opt' }), ctx.fx);
      const next = host.firstElementChild;
      next.classList.add('trn-choices');
      // Capture runs before choices() sees the tap, with the same guard it
      // uses, so the gap reacts the instant the finger lands.
      next.addEventListener(
        'pointerdown',
        (e) => {
          const b = e.target.closest('.choice');
          if (!b || next.classList.contains('locked') || b.classList.contains('nope')) return;
          const ok = b.dataset.ok === '1';
          const gap = track.missing[k];
          tryPiece(slot, opts[[...next.children].indexOf(b)], ok, () => map.lay(gap));
          if (ok) ctx.fx.clink(2);
        },
        true,
      );
      if (row) {
        row.classList.add('trn-leave');
        await wait(220);
        if (!ctx.alive()) return { mistakes };
        row.replaceWith(next);
      } else ctx.stage.append(next);
      row = next;
      ctx.setHint(() => next.querySelector('[data-ok]'));
      mistakes += await answered;
      if (!ctx.alive()) return { mistakes };
      ctx.progress((k + 1) / steps);
    }

    ctx.setHint(null);
    row.classList.add('trn-done');
    await ride(ctx, map);
    if (!ctx.alive()) return { mistakes };
    map.flag.classList.add('wave');
    ctx.fx.good(map.flag);
    await wait(700);
    return { mistakes };
  },
};
