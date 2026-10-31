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
