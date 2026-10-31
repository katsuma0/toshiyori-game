import { range, sample, shuffle, tileGrid, replay } from '../util.js';

// Tap every number from smallest to biggest. Level 1 is a 3x3 warm up, then the
// full 4x4, then the numbers stop being consecutive so you have to compare.
export default {
  id: 'order',
  name: 'Count Up',
  blurb: 'Tap 1, 2, 3 in order',
  color: '#2E7D4F',
  rounds: 3,
  instruction: (lv) => (lv <= 2 ? 'Tap the numbers in order, smallest first' : 'Tap from smallest to biggest'),

  round(ctx) {
    const lv = ctx.level;
    const cols = lv === 1 ? 3 : 4;
    const n = cols * cols;
    const pool = lv <= 2 ? range(1, n) : range(1, [0, 0, 0, 30, 60, 99][lv]);
    const order = sample(pool, n).sort((a, b) => a - b);
    let next = 0;
    let mistakes = 0;

    return new Promise((resolve) => {
      const { grid, tiles } = tileGrid(shuffle(order), cols, (t, v) => {
        if (v === order[next]) {
          ctx.fx.step(next, n);
          t.classList.add('done', 'right');
          next++;
          ctx.progress(next / n);
          if (next === n) {
            grid.classList.add('locked');
            resolve({ mistakes });
          }
        } else {
          mistakes++;
          ctx.fx.bad();
          replay(t, 'shake');
        }
      });
      grid.classList.add('big-numbers');
      ctx.stage.append(grid);
      ctx.setHint(() => tiles.find((t) => +t.dataset.value === order[next]));
    });
  },
};
