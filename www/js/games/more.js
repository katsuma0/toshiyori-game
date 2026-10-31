import { el, rand, sample, range, replay, wait } from '../util.js';

// Two boxes of dots, tap the one with more. After every answer both counts are
// shown, so a wrong guess still teaches something.
const LEVELS = [null, [3, 8, 3], [4, 12, 2], [6, 15, 2], [8, 20, 1], [10, 24, 1]];
const CELLS_X = 4;
const CELLS_Y = 7;

function box(count, colour) {
  const b = el('button', 'dotbox');
  b.type = 'button';
  b.style.setProperty('--dot', colour);
  // Dots sit on a jittered grid so they never overlap, which would make
  // counting unfair.
  const cells = sample(range(0, CELLS_X * CELLS_Y - 1), count);
  const field = el('div', 'dots');
  for (const [k, c] of cells.entries()) {
    const d = el('i', 'dot');
    const x = ((c % CELLS_X) + 0.5 + (Math.random() - 0.5) * 0.4) / CELLS_X;
    const y = ((Math.floor(c / CELLS_X)) + 0.5 + (Math.random() - 0.5) * 0.4) / CELLS_Y;
    d.style.left = `${x * 100}%`;
    d.style.top = `${y * 100}%`;
    d.style.setProperty('--i', k);
    field.append(d);
  }
  b.append(field, el('span', 'count', String(count)));
  return b;
}

export default {
  id: 'more',
  name: 'Which Has More',
  blurb: 'Pick the bigger group',
  color: '#1D4ED8',
  rounds: 6,
  instruction: () => 'Tap the box with more dots',

  round(ctx) {
    const [lo, hi, gap] = LEVELS[ctx.level];
    let a, b;
    do {
      a = rand(lo, hi);
      b = rand(lo, hi);
    } while (Math.abs(a - b) < gap || a === b);

    const wrap = el('div', 'versus');
    const left = box(a, '#1D4ED8');
    const right = box(b, '#C2410C');
    left.setAttribute('aria-label', 'Left box');
    right.setAttribute('aria-label', 'Right box');
    wrap.append(left, right);
    ctx.stage.append(wrap);

    return new Promise((resolve) => {
      let answered = false;
      const choose = async (chosen, other, mine, theirs) => {
        if (answered) return;
        answered = true;
        const right = mine > theirs;
        if (right) ctx.fx.good();
        else ctx.fx.bad();
        chosen.classList.add(right ? 'right' : 'wrong');
        if (!right) replay(chosen, 'shake');
        (right ? chosen : other).classList.add('winner');
        wrap.classList.add('reveal');
        await wait(1500);
        resolve({ mistakes: right ? 0 : 1 });
      };
      for (const [me, other, mine, theirs] of [[left, right, a, b], [right, left, b, a]]) {
        me.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          choose(me, other, mine, theirs);
        });
      }
      ctx.setHint(() => (a > b ? left : right));
    });
  },
};
