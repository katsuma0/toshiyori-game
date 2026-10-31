import { el, pick, range, sample, shuffle, tileGrid, replay, wait } from '../util.js';

// Find two numbers that add up to the target. The board is built from
// complementary pairs (a, T - a), so any correct pair the player finds still
// leaves a solvable board. Nobody gets stuck with two leftovers that do not fit.
const LEVELS = [
  null,
  { targets: [10], pairs: 4, cols: 4 },
  { targets: [11, 12, 13, 14, 15], pairs: 4, cols: 4 },
  { targets: [14, 15, 16, 18, 20], pairs: 5, cols: 4 },
  { targets: [18, 20, 21, 24, 25], pairs: 6, cols: 4 },
  { targets: [25, 30, 35, 40, 50], pairs: 6, cols: 4 },
];

export default {
  id: 'sum',
  cat: 'math',
  color: '#E8590C',
  rounds: 2,

  round(ctx) {
    const cfg = LEVELS[ctx.level];
    const T = pick(cfg.targets);
    ctx.say(T);
    // Use a different pair each time (1+9, 2+8, ...) so the board looks varied.
    // Half-and-half pairs like 5 + 5 are left out for the same reason.
    const values = sample(range(1, Math.ceil(T / 2) - 1), cfg.pairs).flatMap((a) => [a, T - a]);
    let left = values.length;
    let mistakes = 0;
    let first = null;

    const eq = el('div', 'equation');
    const slotA = el('span', 'slot');
    const slotB = el('span', 'slot');
    const target = el('span', 'target', String(T));
    eq.append(slotA, el('span', 'op', '+'), slotB, el('span', 'op', '='), target);
    ctx.stage.append(eq);

    return new Promise((resolve) => {
      const { grid, tiles } = tileGrid(shuffle(values), cfg.cols, async (t, v) => {
        if (first === t) {
          first = null;
          t.classList.remove('picked');
          slotA.textContent = '';
          ctx.fx.select(2);
          return;
        }
        if (!first) {
          first = t;
          t.classList.add('picked');
          slotA.textContent = v;
          replay(slotA, 'pop');
          ctx.fx.select(4);
          return;
        }

        const a = first;
        first = null;
        slotB.textContent = v;
        replay(slotB, 'pop');
        grid.classList.add('locked');

        if (+a.dataset.value + v === T) {
          ctx.fx.good(t);
          t.classList.add('picked');
          await wait(220);
          a.classList.add('done', 'gone');
          t.classList.add('done', 'gone');
          replay(target, 'pop');
          left -= 2;
          ctx.progress(1 - left / values.length);
          await wait(380);
        } else {
          mistakes++;
          ctx.fx.bad();
          replay(a, 'shake');
          replay(t, 'shake');
          eq.classList.add('wrong');
          await wait(650);
          eq.classList.remove('wrong');
          a.classList.remove('picked');
        }
        slotA.textContent = '';
        slotB.textContent = '';
        grid.classList.remove('locked');
        if (left === 0) resolve({ mistakes });
      });
      grid.classList.add('big-numbers');
      ctx.stage.append(grid);

      ctx.setHint(() => {
        const live = tiles.filter((x) => !x.classList.contains('done'));
        const a = first || live[0];
        const b = live.find((x) => x !== a && +x.dataset.value === T - +a.dataset.value);
        return first ? b : [a, b];
      });
    });
  },
};
