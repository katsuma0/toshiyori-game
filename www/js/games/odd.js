import { pick, rand, tileGrid, replay, wait } from '../util.js';

// Spot the one picture that is different. Early levels swap in a different
// thing, later ones a near twin, and the hardest flips the same picture around.
const EASY = [
  ['🍎', '🍌'], ['🐶', '🐱'], ['🌞', '🌙'], ['🚗', '🚲'], ['🌷', '🍄'],
  ['🎈', '⚽'], ['🐟', '🐦'], ['🏠', '🌳'], ['☕', '🍰'], ['🔑', '✏️'],
];
const NEAR = [
  ['🍎', '🍅'], ['😀', '😃'], ['🌼', '🌻'], ['🐻', '🐨'], ['🍊', '🍋'],
  ['🌲', '🌳'], ['☕', '🍵'], ['🚗', '🚙'], ['🏠', '🏡'], ['🐢', '🦎'],
  ['🍪', '🍩'], ['🐝', '🐞'], ['⭐', '🌟'], ['🍇', '🫐'], ['🦆', '🐓'],
];
// Pictures that are clearly lopsided, so a mirrored copy really looks different.
const FLIP = ['🐟', '🚗', '🐌', '🦆', '🐘', '🚲', '🐓', '🫖', '🎺', '🐕', '🚂', '🦒'];

const LEVELS = [null, { cols: 3, set: 'easy' }, { cols: 3, set: 'near' }, { cols: 4, set: 'near' }, { cols: 4, set: 'flip' }, { cols: 5, set: 'mix' }];

export default {
  id: 'odd',
  name: 'Odd One Out',
  blurb: 'Spot the different one',
  color: '#6D28D9',
  rounds: 5,
  instruction: () => 'Tap the picture that is different',

  round(ctx) {
    const cfg = LEVELS[ctx.level];
    const n = cfg.cols * cfg.cols;
    const set = cfg.set === 'mix' ? pick(['near', 'flip']) : cfg.set;
    let common, odd, flip = false;
    if (set === 'flip') {
      common = odd = pick(FLIP);
      flip = true;
    } else {
      [common, odd] = pick(set === 'easy' ? EASY : NEAR);
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
            ctx.fx.good();
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
