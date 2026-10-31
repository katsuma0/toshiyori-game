export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Restarts a CSS animation even if the class is already on the element.
export function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

// Grid of big tappable tiles. Tiles answer to pointerdown, not click, so the
// response lands under the finger with no 100 ms delay.
export function tileGrid(values, cols, onTap, render = (v) => v) {
  const grid = el('div', 'grid');
  grid.style.setProperty('--cols', cols);
  // Keep tiles square when the last row is short, e.g. 6 tiles in 3 columns.
  grid.style.aspectRatio = `${cols} / ${Math.ceil(values.length / cols)}`;
  const tiles = values.map((v, i) => {
    const t = el('button', 'tile', render(v));
    t.type = 'button';
    t.dataset.value = v;
    t.style.setProperty('--i', i);
    t.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (t.classList.contains('done') || grid.classList.contains('locked')) return;
      onTap(t, v, i);
    });
    grid.append(t);
    return t;
  });
  return { grid, tiles };
}

// A row of big answer bubbles. Resolves with the number of wrong taps once the
// right one is found, so the player always finishes on a success.
export function choices(host, options, correct, render = (v) => v, fx) {
  const row = el('div', 'choices');
  row.style.setProperty('--n', options.length);
  host.append(row);
  return new Promise((resolve) => {
    let misses = 0;
    options.forEach((v, i) => {
      const b = el('button', 'choice', render(v));
      b.type = 'button';
      b.style.setProperty('--i', i);
      if (v === correct) b.dataset.ok = '1';
      b.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        if (row.classList.contains('locked') || b.classList.contains('nope')) return;
        if (v === correct) {
          row.classList.add('locked');
          b.classList.add('right');
          fx.good(b);
          await wait(650);
          resolve(misses);
        } else {
          misses++;
          fx.bad();
          b.classList.add('nope');
          replay(b, 'shake');
        }
      });
      row.append(b);
    });
  });
}

// Six answer options: the right one plus five plausible slips drawn from
// `pool`, topped up with near neighbours if the pool runs short. Numbers come
// back sorted so the player can scan them like a keypad.
export function sixOptions(answer, pool = [], { min = 0, n = 6 } = {}) {
  const out = new Set([answer]);
  for (const v of shuffle(pool)) {
    if (out.size >= n) break;
    if (v >= min && v !== answer && Number.isInteger(v)) out.add(v);
  }
  for (let k = 1; out.size < n && k < 1000; k++) {
    for (const v of shuffle([answer + k, answer - k])) if (out.size < n && v >= min) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

// Wrong answers that look plausible: close to the right one, distinct, positive.
export function nearby(answer, spread, n = 2, step = 1) {
  const out = new Set();
  let guard = 0;
  while (out.size < n && guard++ < 200) {
    const d = rand(1, spread) * step * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + d;
    if (v > 0 && v !== answer) out.add(v);
  }
  return shuffle([answer, ...out]);
}
