import { el, pick, rand, replay, choices, sixOptions } from '../util.js';

// Four arithmetic games on one calm screen: a big sum on a card, six answers
// underneath. Problems come from the level rules below so the numbers stay
// friendly for mental maths, and the wrong answers are the slips people really
// make (a forgotten carry, the next fact in the times table), never nonsense.

const SYMBOL = { plus: '+', minus: '−', times: '×', divide: '÷' };
// Highest wrong answer per game. Minus never shows more than 100, since a
// bigger number there could only be a guess.
const MAX = { plus: 110, minus: 100, times: 120, divide: 120 };

const units = (n) => n % 10;
const tensOf = (n) => Math.floor(n / 10);
const flip = (pair, p = 0.5) => (Math.random() < p ? [pair[1], pair[0]] : pair);
const notRound = (n) => n % 10 !== 0;

// Two numbers picked together until they pass a test. Rejection keeps every
// allowed pair equally likely, which a nested range would not.
function pairWhere(lo, hi, ok) {
  let x;
  let y;
  do {
    x = rand(lo, hi);
    y = rand(lo, hi);
  } while (!ok(x, y));
  return [x, y];
}

function plusPair(level) {
  if (level === 1) {
    // 23 + 4: the units stay below ten. No round tens, since 90 + 7 needs no sum.
    const u = rand(1, 7);
    return [rand(1, 9) * 10 + u, rand(2, 9 - u)];
  }
  if (level === 2) {
    // 27 + 8: one carry into the tens. Sometimes written small one first.
    const u = rand(1, 9);
    const b = rand(Math.max(2, 10 - u), 9);
    const a = rand(1, Math.floor((100 - u - b) / 10)) * 10 + u;
    return flip([a, b], 0.35);
  }
  if (level === 3) {
    // 32 + 45: nothing to carry, and no round tens that make it trivial.
    const [ua, ub] = pairWhere(1, 8, (x, y) => x + y <= 9);
    const [ta, tb] = pairWhere(1, 8, (x, y) => x + y <= 9);
    return [ta * 10 + ua, tb * 10 + ub];
  }
  if (level === 4) {
    // 38 + 47: one carry, small tens so the total stays under 90.
    const [ua, ub] = pairWhere(1, 9, (x, y) => x + y >= 10);
    const [ta, tb] = pairWhere(1, 6, (x, y) => x + y <= 7);
    return [ta * 10 + ua, tb * 10 + ub];
  }
  // Bigger two-digit sums up to 100, mostly with a carry: 46 + 38, 57 + 43.
  const carry = Math.random() < 0.75;
  let a;
  let b;
  do {
    a = rand(11, 89);
    b = rand(11, 89);
  } while (a + b > 100 || a + b < 50 || !notRound(a) || !notRound(b) || (units(a) + units(b) >= 10) !== carry);
  return [a, b];
}

function minusPair(level) {
  if (level === 1) {
    // 28 - 5: no borrowing.
    const u = rand(2, 9);
    return [rand(1, 9) * 10 + u, rand(2, u)];
  }
  if (level === 2) {
    // 32 - 7: borrow from the tens.
    const u = rand(0, 8);
    return [rand(2, 9) * 10 + u, rand(Math.max(2, u + 1), 9)];
  }
  if (level === 3 || level === 4) {
    // 58 - 23 without borrowing, 52 - 27 with it. The tens always drop by at
    // least one so the answer is never zero.
    const borrow = level === 4;
    const [ua, ub] = pairWhere(0, 9, (x, y) => (borrow ? y > x : y <= x && y > 0));
    const ta = rand(2, 9);
    return [ta * 10 + ua, rand(1, ta - 1) * 10 + ub];
  }
  // 100 - 37, or a bigger borrow such as 83 - 47.
  if (Math.random() < 0.4) {
    let b;
    do b = rand(11, 89); while (!notRound(b));
    return [100, b];
  }
  const [ua, ub] = pairWhere(0, 9, (x, y) => y > x);
  const ta = rand(5, 9);
  return [ta * 10 + ua, rand(1, ta - 2) * 10 + ub];
}

function timesPair(level) {
  if (level === 1) return flip([pick([2, 5, 10]), rand(2, 10)]);
  if (level === 2) return flip([rand(2, 5), rand(2, 10)]);
  // Facts below 12 (2 x 2, 3 x 3) are too easy by level 3.
  if (level === 3) return pairWhere(2, 9, (x, y) => x * y >= 12);
  if (level === 4) {
    // The bigger half of the tables, with an easy 10 x now and then as a breather.
    if (Math.random() < 0.15) return flip([10, rand(2, 10)]);
    let x;
    let y;
    do {
      x = rand(2, 9);
      y = rand(2, 12);
    } while (Math.max(x, y) < 6);
    return flip([x, y]);
  }
  // 12 x 4, 23 x 4: split into tens and units in the head, total at most 100.
  const y = rand(2, 9);
  let x;
  do x = rand(11, Math.floor(100 / y)); while (!notRound(x));
  return flip([x, y], 0.25);
}

// Division is built backwards from a times fact, so it always comes out even.
function dividePair(level) {
  let b;
  let q;
  if (level === 1) [b, q] = [pick([2, 5, 10]), rand(2, 10)];
  else if (level === 2) [b, q] = [rand(2, 5), rand(2, 10)];
  else if (level === 3) [b, q] = [rand(2, 9), rand(2, 9)];
  else if (level === 4) [b, q] = pairWhere(2, 12, (x, y) => x <= 9 && Math.max(x, y) >= 6);
  else {
    const r = Math.random();
    if (r < 0.1) [b, q] = [10, rand(4, 10)];
    else if (r < 0.65) {
      // Answers past the tables: 84 / 7, 96 / 3, halving 86.
      b = rand(2, 9);
      q = rand(11, Math.floor(100 / b));
    } else [b, q] = pairWhere(3, 10, (x, y) => x <= 9 && y >= 5 && x * y >= 40);
  }
  // Halving and answers of 2 are the easy end, so levels 3 and 4 mostly skip them.
  if (level >= 3 && level <= 4 && (b === 2 || q === 2) && Math.random() < 0.7) return dividePair(level);
  return [b * q, b];
}

const MAKERS = { plus: plusPair, minus: minusPair, times: timesPair, divide: dividePair };
const SOLVE = {
  plus: (a, b) => a + b,
  minus: (a, b) => a - b,
  times: (a, b) => a * b,
  divide: (a, b) => a / b,
};

export function makeProblem(op, level) {
  const lv = Math.min(5, Math.max(1, Math.round(level) || 1));
  const [a, b] = MAKERS[op](lv);
  return { a, b, op, answer: SOLVE[op](a, b) };
}

// 34 -> 43, the slip of reading or writing the digits the wrong way round.
// Round tens have no such twin: 90 never turns into 9. Only when the digits
// are close, since 17 -> 71 is too far off to pass for an answer.
const swapped = (n) => (n > 10 && n < 100 && units(n) && Math.abs(units(n) - tensOf(n)) <= 2 ? units(n) * 10 + tensOf(n) : -1);

// Believable wrong answers as [value, weight]; heavier ones turn up more often.
// One of the `key` slips is always shown.
function slips({ a, b, op, answer: A }, level) {
  const near = [[A - 1, 3], [A + 1, 3], [A - 2, 2], [A + 2, 2]];
  // Twenty off, or ten and one off together, only make sense once both
  // numbers have tens.
  const far = level >= 3 ? [[A - 20, 1], [A + 20, 1], [A - 11, 0.4], [A + 11, 0.4], [A - 9, 0.4], [A + 9, 0.4]] : [];
  const close = [...near, [A - 3, 0.6], [A + 3, 0.6], ...far];
  // The wrong sign, but only when it still looks like an answer here.
  const wrong = (v) => [v >= 10 ? v : -1, 1];
  if (op === 'plus') {
    // A forgotten carry lands exactly ten short.
    const carried = units(a) + units(b) >= 10;
    return {
      list: [...close, [A - 10, carried ? 5 : 3], [A + 10, 3], [swapped(A), 1], wrong(Math.abs(a - b))],
      key: [A - 10, A + 10],
    };
  }
  if (op === 'minus') {
    // Taking the small digit from the big one instead of borrowing: 52 - 27 -> 35.
    const backwards = Math.abs(units(a) - units(b)) + 10 * (tensOf(a) - tensOf(b));
    return {
      list: [...close, [A - 10, 3], [A + 10, 3], [backwards, 5], [swapped(A), 1], wrong(a + b)],
      key: [A - 10, A + 10],
    };
  }
  if (op === 'times') {
    // The fact just before or after in either table: 7 x 8 -> 49, 63, 48, 64.
    const list = [[a * (b - 1), 3], [a * (b + 1), 3], [(a - 1) * b, 3], [(a + 1) * b, 3]];
    list.push([a * (b + 2), 0.7], [(a + 2) * b, 0.7], [a * (b - 2), 0.7], [(a - 2) * b, 0.7]);
    list.push([A - 1, 1], [A + 1, 1], [A - 2, 0.7], [A + 2, 0.7], [A - 10, 1.5], [A + 10, 1.5], [swapped(A), 1.5], [a + b, 1]);
    const key = list.slice(0, 4).map(([v]) => v);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    if (big > 10 && level >= 5) {
      // 23 x 4 -> 83 or 80: the tens multiplied, the units forgotten. And
      // 23 x 4 -> 82: the carry from 3 x 4 dropped.
      list.push([tensOf(big) * 10 * small + units(big), 3], [tensOf(big) * 10 * small, 1.5]);
      list.push([A - 10 * tensOf(units(big) * small), 2.5]);
      // Ten off is always shown here too, so the last digit alone (3 x 4
      // ends in 2) never gives the answer away.
      return { list, key: [A - 10, A + 10] };
    }
    return { list, key };
  }
  // Division: the neighbours, the divisor itself, and the sum done with the
  // next divisor along (or, early on, another of the easy ones).
  const list = [...near, [A - 3, 1.2], [A + 3, 1.2], [A - 4, 0.6], [A + 4, 0.6], [b, 1.5]];
  for (const d of [b - 1, b + 1]) if (d > 1 && a % d === 0) list.push([a / d, 2]);
  if (level <= 2) for (const d of [2, 5, 10]) if (d !== b && a % d === 0) list.push([a / d, 1.5]);
  if (A >= 10) list.push([A - 10, 1.5], [A + 10, 1.5], [swapped(A), 1.5]);
  return { list, key: [A - 1, A + 1] };
}

// How many decoys go below the answer. Spread out, so the answer's place in
// the sorted row changes from sum to sum and "pick the middle one" never works.
const BELOW = [3, 4, 5, 5, 4, 3];
const FILL = 0.05;

// Weighted draw that removes the winner from the list.
function draw(list) {
  let r = Math.random() * list.reduce((s, [, w]) => s + w, 0);
  const i = list.findIndex(([, w]) => (r -= w) < 0);
  return list.splice(i < 0 ? list.length - 1 : i, 1)[0][0];
}

// Five distinct, believable wrong answers. sixOptions then sorts them with the
// answer like a keypad. Always exactly five valid decoys, so its own top-up
// (which knows nothing of the ceiling) never runs.
export function decoys(problem, level = 3) {
  const A = problem.answer;
  // Every answer is at least 1, so 0 would never look possible.
  const ok = (v) => Number.isInteger(v) && v >= 1 && v <= MAX[problem.op] && v !== A;
  const { list, key } = slips(problem, level);
  const weight = new Map();
  for (const [v, w] of list) if (ok(v) && w > 0) weight.set(v, (weight.get(v) || 0) + w);
  // Faint fillers, only for when one side runs short near zero or the ceiling.
  for (const d of [3, 4, 5, 9, 11]) for (const v of [A - d, A + d]) if (ok(v) && !weight.has(v)) weight.set(v, FILL);

  const sides = [[...weight].filter(([v]) => v < A), [...weight].filter(([v]) => v > A)];
  // Keep to real slips when there are enough of them; fillers only if not.
  const real = sides.map((side) => side.filter(([, w]) => w > FILL).length);
  const [lo, hi] = real[0] + real[1] >= 5 ? [5 - real[1], real[0]] : [5 - sides[1].length, sides[0].length];
  const k = Math.max(lo, Math.min(draw(BELOW.map((w, i) => [i, w])), hi));
  const need = [k, 5 - k];
  const hasKey = sides.map((side) => side.some(([v]) => key.includes(v)));
  // If the telling slip only exists on a side that gets no decoys, give that
  // side one.
  for (const s of [0, 1]) {
    if (hasKey[s] && !need[s] && !(need[1 - s] && hasKey[1 - s]) && sides[s].length) {
      need[s]++;
      need[1 - s]--;
    }
  }
  const out = [];
  // The most telling slip always makes the cut: ten off for sums, so the last
  // digit alone is not enough, and the next fact along for times and divide.
  const keyed = [0, 1].flatMap((s) => (need[s] ? sides[s].filter(([v]) => key.includes(v)).map((e) => [s, e]) : []));
  if (keyed.length) {
    const [s, e] = pick(keyed);
    sides[s].splice(sides[s].indexOf(e), 1);
    out.push(e[0]);
    need[s]--;
  }
  for (const s of [0, 1]) for (let n = need[s]; n > 0; n--) out.push(draw(sides[s]));
  return out;
}

export function optionsFor(problem, level = 3) {
  return sixOptions(problem.answer, decoys(problem, level), { min: 1 });
}

// The last few sums, so a session never shows the same one twice. 3 x 7 and
// 7 x 3 count as the same.
const recent = [];
const keyOf = ({ a, b, op }) => (op === 'plus' || op === 'times' ? `${op}:${Math.min(a, b)}:${Math.max(a, b)}` : `${op}:${a}:${b}`);

export function freshProblem(op, level) {
  let p = makeProblem(op, level);
  for (let k = 0; k < 40 && recent.includes(keyOf(p)); k++) p = makeProblem(op, level);
  recent.push(keyOf(p));
  if (recent.length > 16) recent.shift();
  return p;
}

// Small line drawings of each sign, for the card's corners.
const GLYPH = {
  plus: 'M-7 0h14M0-7v14',
  minus: 'M-7 0h14',
  times: 'M-5-5l10 10M5-5l-10 10',
  divide: 'M-7 0h14M0-6.5v.1M0 6.5v.1',
};

function deco(op, cls) {
  const marks = [[16, 18, 1], [44, 13, 0.62], [15, 46, 0.62], [40, 38, 0.4]]
    .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="${GLYPH[op]}"/>`)
    .join('');
  return `<svg class="math-deco ${cls}" viewBox="0 0 60 60" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round">${marks}</svg>`;
}

function card(p, opts) {
  const box = el('div', 'math-card', deco(p.op, 'tl') + deco(p.op, 'br'));
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', `${p.a} ${SYMBOL[p.op]} ${p.b} = ?`);
  const eq = el('div', 'math-eq');
  // The bubble is as wide as the widest option from the start, so it never
  // hints at how many digits the answer has and never jumps when it fills in.
  const width = Math.max(...opts.map((v) => String(v).length));
  const ans = el('span', 'math-ans', `<span class="math-ghost">${'8'.repeat(width)}</span><span class="math-q">?</span>`);
  const parts = [
    el('span', 'math-n', String(p.a)),
    el('span', 'math-op', SYMBOL[p.op]),
    el('span', 'math-n', String(p.b)),
    el('span', 'math-is', '='),
    ans,
  ];
  parts.forEach((n, i) => n.style.setProperty('--i', i));
  eq.append(...parts);
  box.append(eq);
  return { box, eq, ans, q: ans.lastElementChild };
}

// Biggest type that still fits on one line, so short sums get huge digits.
function fit(box, eq) {
  const cs = getComputedStyle(box);
  const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const need = eq.offsetWidth;
  if (need > room && need > 0) {
    const size = parseFloat(getComputedStyle(eq).fontSize);
    eq.style.fontSize = `${Math.floor(size * (room / need) * 0.98)}px`;
  }
}

function game(op) {
  return {
    id: op,
    cat: 'math',
    rounds: 5,

    async round(ctx) {
      const p = freshProblem(op, ctx.level);
      const opts = optionsFor(p, ctx.level);
      const { box, eq, ans, q } = card(p, opts);
      ctx.stage.append(box);
      fit(box, eq);
      ctx.fx.flip();
      ctx.progress(0);
      ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));

      // Hook into the answer buttons' own feedback: the ? fills in the moment
      // the right one is tapped, and shrugs a little at a wrong one.
      const fx = {
        ...ctx.fx,
        good(at) {
          ctx.fx.good(at);
          q.textContent = String(p.answer);
          ans.classList.add('solved');
          replay(ans, 'math-bump');
          replay(q, 'math-pop');
          box.setAttribute('aria-label', `${p.a} ${SYMBOL[p.op]} ${p.b} = ${p.answer}`);
        },
        bad() {
          ctx.fx.bad();
          replay(ans, 'math-wobble');
        },
      };
      const misses = await choices(ctx.stage, opts, p.answer, String, fx);
      return { mistakes: misses };
    },
  };
}

export const plus = game('plus');
export const minus = game('minus');
export const times = game('times');
export const divide = game('divide');
