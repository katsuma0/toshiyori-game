import { el, sample, range, tileGrid, replay, wait } from '../util.js';
import { icons } from '../icons.js';

// Squares light up one at a time, then you tap them in the same order. A wrong
// tap shows the right square and lets you carry on, so a round always finishes.
const LEVELS = [null, { cols: 3, len: 3, ms: 950 }, { cols: 3, len: 4, ms: 850 }, { cols: 3, len: 5, ms: 800 }, { cols: 4, len: 5, ms: 750 }, { cols: 4, len: 6, ms: 700 }];

export default {
  id: 'memory',
  name: 'Remember the Lights',
  blurb: 'Repeat the pattern',
  color: '#BE185D',
  rounds: 4,
  instruction: () => 'Watch the lights, then tap them in the same order',

  round(ctx) {
    const cfg = LEVELS[ctx.level];
    const n = cfg.cols * cfg.cols;
    const seq = sample(range(0, n - 1), cfg.len);
    let pos = 0;
    let mistakes = 0;

    const status = el('div', 'status');
    const setStatus = (watch) => {
      status.innerHTML = watch
        ? `${icons.eye}<span>Watch</span>`
        : `${icons.hand}<span>Your turn</span>`;
      status.classList.toggle('turn', !watch);
      replay(status, 'pop');
    };
    ctx.stage.append(status);

    return new Promise(async (resolve) => {
      const { grid, tiles } = tileGrid(range(0, n - 1), cfg.cols, async (t, v) => {
        if (v === seq[pos]) {
          ctx.fx.light(pos);
          t.classList.remove('hint');
          replay(t, 'lit');
          pos++;
          ctx.progress(pos / seq.length);
          if (pos === seq.length) {
            grid.classList.add('locked');
            await wait(450);
            resolve({ mistakes });
          }
        } else {
          mistakes++;
          ctx.fx.bad();
          replay(t, 'shake');
          tiles[seq[pos]].classList.add('hint');
        }
      }, () => '');
      grid.classList.add('lights', 'locked');
      ctx.stage.append(grid);
      ctx.setHint(null);

      setStatus(true);
      await wait(700);
      for (const [k, i] of seq.entries()) {
        if (!ctx.alive()) return;
        ctx.fx.light(k);
        replay(tiles[i], 'lit');
        await wait(cfg.ms);
      }
      if (!ctx.alive()) return;
      setStatus(false);
      grid.classList.remove('locked');
    });
  },
};
