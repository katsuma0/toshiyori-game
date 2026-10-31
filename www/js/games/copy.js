import { el, sample, range, tileGrid, replay, wait } from '../util.js';

// A pattern sits at the top. Tap squares below until both match. Tapping a
// coloured square clears it again, so mistakes are easy to undo.
const LEVELS = [null, [3, 4], [3, 5], [4, 6], [4, 7], [5, 9]];

export default {
  id: 'copy',
  cat: 'look',
  color: '#0CA678',
  rounds: 3,

  round(ctx) {
    const [cols, filled] = LEVELS[ctx.level];
    const n = cols * cols;
    const goal = new Set(sample(range(0, n - 1), filled));
    const on = new Set();
    let mistakes = 0;

    const model = el('div', 'grid model');
    model.style.setProperty('--cols', cols);
    for (let i = 0; i < n; i++) model.append(el('i', goal.has(i) ? 'cell on' : 'cell'));
    ctx.stage.append(model);

    return new Promise((resolve) => {
      const { grid, tiles } = tileGrid(range(0, n - 1), cols, async (t, i) => {
        t.setAttribute('aria-pressed', String(!on.has(i)));
        if (on.has(i)) {
          on.delete(i);
          t.classList.remove('on');
          ctx.fx.select(1);
        } else {
          on.add(i);
          t.classList.add('on');
          replay(t, 'bump-in');
          if (goal.has(i)) ctx.fx.select(5 + on.size);
          else {
            mistakes++;
            ctx.fx.bad();
          }
        }
        ctx.progress([...goal].filter((g) => on.has(g)).length / filled);
        if (on.size === goal.size && [...goal].every((g) => on.has(g))) {
          grid.classList.add('locked', 'solved');
          ctx.fx.good(grid);
          await wait(600);
          resolve({ mistakes });
        }
      }, () => '');
      grid.classList.add('paint');
      tiles.forEach((tile, i) => {
        tile.setAttribute('aria-pressed', 'false');
        if (goal.has(i)) tile.dataset.goal = '1';
      });
      ctx.stage.append(grid);
      ctx.setHint(() => tiles.find((tile, i) => goal.has(i) !== on.has(i)));
    });
  },
};
