import { pick, rand, tileGrid, replay, wait } from '../util.js';

// Spot the one picture that is different. It starts with near twins (apple and
// tomato) and the hardest levels use the same picture flipped around.
const NEAR = [
  ['🍎', '🍅'], ['😀', '😃'], ['🌼', '🌻'], ['🐻', '🐨'], ['🍊', '🍋'],
  ['🌲', '🌳'], ['☕', '🍵'], ['🚗', '🚙'], ['🏠', '🏡'], ['🐢', '🦎'],
  ['🍪', '🍩'], ['🐝', '🐞'], ['⭐', '🌟'], ['🍇', '🫐'], ['🦆', '🐓'],
];
// Pictures that are clearly lopsided, so a mirrored copy really looks different.
const FLIP = ['🐟', '🚗', '🐌', '🦆', '🐘', '🚲', '🐓', '🫖', '🎺', '🐕', '🚂', '🦒'];

const LEVELS = [null, { cols: 3, set: 'near' }, { cols: 4, set: 'near' }, { cols: 4, set: 'mix' }, { cols: 5, set: 'near' }, { cols: 5, set: 'flip' }];

export default {
  id: 'odd',
  cat: 'look',
  color: '#7C4DDB',
  rounds: 4,

  round(ctx) {
    const cfg = LEVELS[ctx.level];
    const n = cfg.cols * cfg.cols;
    const set = cfg.set === 'mix' ? pick(['near', 'flip']) : cfg.set;
    let common, odd, flip = false;
    if (set === 'flip') {
      common = odd = pick(FLIP);
      flip = true;
    } else {
      [common, odd] = pick(NEAR);
      if (Math.random() < 0.5) [common, odd] = [odd, common];
    }
    const at = rand(0, n - 1);
    const values = Array.from({ length: n }, (_, i) => (i === at ? 'odd' : 'same'));
    let mistakes = 0;

    return new Promise((resolve) => {
      const { grid, tiles } = tileGrid(
        values,
        cfg.cols,
        async (t, v) => {
          if (v === 'odd') {
            ctx.fx.good(t);
            grid.classList.add('locked', 'solved');
            t.classList.add('right', 'found');
            await wait(700);
            resolve({ mistakes });
          } else {
            mistakes++;
            ctx.fx.bad();
            replay(t, 'shake');
          }
        },
        (v) => `<span class="emoji${v === 'odd' && flip ? ' flip' : ''}">${v === 'odd' ? odd : common}</span>`,
      );
      grid.classList.add('pictures');
      ctx.stage.append(grid);
      ctx.setHint(() => tiles[at]);
    });
  },
};
