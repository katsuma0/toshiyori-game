import { range, sample, shuffle, tileGrid, replay } from '../util.js';

// Tap every number from smallest to biggest on a 4x4 board. From level 2 the
// numbers stop being consecutive, so you have to compare instead of count.
const POOL = [null, 16, 30, 60, 99, 200];

export default {
  id: 'order',
  cat: 'math',
  color: '#2E9E5B',
  rounds: 2,

  round(ctx) {
    const cols = 4;
    const n = 16;
    const max = POOL[ctx.level];
    const order = (max === n ? range(1, n) : sample(range(1, max), n)).sort((a, b) => a - b);
    let next = 0;
    let mistakes = 0;

    return new Promise((resolve) => {
      const { grid, tiles } = tileGrid(shuffle(order), cols, (t, v) => {
        if (v === order[next]) {
          ctx.fx.step(next, n, t);
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
      if (max > 99) grid.classList.add('three-digits');
      ctx.stage.append(grid);
      ctx.setHint(() => tiles.find((t) => +t.dataset.value === order[next]));
    });
  },
};
