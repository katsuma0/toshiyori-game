import { el, rand, shuffle, wait, choices } from '../util.js';
import { t } from '../i18n.js';

// A number shows for a moment, then hides. Pick it from six that look alike.
const LEVELS = [null, [3, 1600], [4, 1500], [5, 1400], [6, 1400], [7, 1300]];

function makeNumber(len) {
  let s = String(rand(1, 9));
  while (s.length < len) s += rand(0, 9);
  return s;
}

// Decoys change one digit or swap two neighbours, which is what memory slips
// actually look like.
function decoy(s) {
  const a = s.split('');
  if (Math.random() < 0.5 && a.length > 1) {
    const i = rand(0, a.length - 2);
    // Never swap a 0 to the front: no real number starts with 0, so it would
    // give itself away.
    if (a[i] !== a[i + 1] && !(i === 0 && a[1] === '0')) {
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a.join('');
    }
  }
  const i = rand(1, a.length - 1);
  let d;
  do d = String(rand(0, 9)); while (d === a[i]);
  a[i] = d;
  return a.join('');
}

// A no-break space groups the digits without ever letting a number split
// across two lines. The narrow kind is too thin to see at this size.
const pretty = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

export default {
  id: 'flash',
  cat: 'memory',
  color: '#C2255C',
  rounds: 4,

  async round(ctx) {
    const [len, ms] = LEVELS[ctx.level];
    const answer = makeNumber(len);
    const opts = new Set([answer]);
    // Five decoys, each one slip away from the real number.
    let guard = 0;
    while (opts.size < 6 && guard++ < 500) opts.add(decoy(answer));

    const board = el('div', 'flashboard', `<span class="digits">${pretty(answer)}</span>`);
    ctx.stage.append(board);
    ctx.setHint(null);
    await wait(ms + 450);
    if (!ctx.alive()) return { mistakes: 0 };
    board.classList.add('hidden');
    board.innerHTML = `<span class="digits">?</span>`;
    ctx.say(t('which'));
    ctx.fx.flip();
    const picked = choices(ctx.stage, shuffle([...opts]), answer, pretty, ctx.fx);
    // Five digits and up do not fit three across at a readable size, so the
    // six answers go two across instead.
    if (len >= 5) ctx.stage.querySelector('.choices').classList.add('wide');
    const misses = await picked;
    board.innerHTML = `<span class="digits">${pretty(answer)}</span>`;
    board.classList.remove('hidden');
    return { mistakes: misses };
  },
};
