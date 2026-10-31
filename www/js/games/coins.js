import { el, pick, rand, shuffle, wait, choices } from '../util.js';
import { lang } from '../i18n.js';

// A little shop. Count a tray of money, work out the change, find the missing
// coin, add up two prices, or see what is left in the purse. Canadian money in
// English and yen in Japanese, so it looks like the money in the player's own
// purse. Amounts are whole cents or yen everywhere, never floats, so a total
// can never come out as $1.3499999.

// ---------- Money ----------

const SILVER = ['#DCDFE4', '#98A0AA', '#2F343B'];
const GOLD = ['#E8BE52', '#A67B1B', '#44310A'];
const COPPER = ['#D39062', '#94572E', '#3A1E0B'];
const ALUMINIUM = ['#EEF0F3', '#ADB3BB', '#3F444B'];
const BRASS = ['#E3C266', '#A4832A', '#44310A'];

// value: [label, size, colours, shape]. Sizes follow the real coins, squeezed
// a little so the smallest label is still easy to read.
const COINS = {
  en: {
    5: ['5¢', 0.86, SILVER],
    10: ['10¢', 0.82, SILVER],
    25: ['25¢', 0.93, SILVER],
    100: ['$1', 1, GOLD, 'eleven'],
    200: ['$2', 1.06, SILVER, 'ring'],
  },
  ja: {
    1: ['1', 0.8, ALUMINIUM],
    5: ['5', 0.86, BRASS, 'hole'],
    10: ['10', 0.9, COPPER],
    50: ['50', 0.84, SILVER, 'hole'],
    100: ['100', 0.92, SILVER],
    500: ['500', 1, GOLD],
  },
};
// Bills: [fill, edge]. Plain rounded notes in the real colours, value only.
const BILLS = {
  en: { 500: ['#4A7DCB', '#2F5A9C'], 1000: ['#8460B8', '#5E3F8E'], 2000: ['#3C8A57', '#28663F'] },
  ja: { 1000: ['#3F7DB0', '#2B5C86'], 5000: ['#8A66B4', '#634390'], 10000: ['#9C6C3C', '#714C27'] },
};

const isBill = (v, l) => !!BILLS[l][v];
const total = (list) => list.reduce((s, v) => s + v, 0);
const groups = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dollars = (v) => `${Math.floor(v / 100)}.${String(v % 100).padStart(2, '0')}`;

// "75¢" under a dollar, "$3.25" from a dollar up, "1,250円" in Japanese.
export function money(v, l = lang()) {
  if (l === 'ja') return `${groups(v)}円`;
  return v < 100 ? `${v}¢` : `$${dollars(v)}`;
}

// Same text with the currency sign a little smaller, so the digits lead.
function moneyHTML(v, l) {
  if (l === 'ja') return `<span class="cash-money">${groups(v)}<small>円</small></span>`;
  return v < 100
    ? `<span class="cash-money">${v}<small>¢</small></span>`
    : `<span class="cash-money"><small>$</small>${dollars(v)}</span>`;
}

// One text size for the whole row of money answers, as big as the widest
// label allows. Measured, not guessed, because the small 円, $ and ¢ and each
// phone's own font make any estimate wrong. Returns the size in px.
function fitAnswers(row) {
  row.style.removeProperty('--fs');
  const btns = [...row.querySelectorAll('.choice')];
  const base = parseFloat(getComputedStyle(btns[0]).fontSize);
  const room = Math.min(...btns.map((b) => b.clientWidth)) - 16;
  const widest = Math.max(...btns.map((b) => b.firstElementChild.offsetWidth));
  if (widest <= room) return base;
  const fs = Math.floor((base * room) / widest);
  row.style.setProperty('--fs', `${fs}px`);
  return fs;
}

const circle = (r, cy = 50) => `M${50 - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const polygon = (n, r) =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');

// Flat coins: a darker rim, a solid face, one thin inner ring. No shine.
export function coinSVG(v, l) {
  const [label, , [face, rim, ink], shape] = COINS[l][v];
  const ring = (r, colour, w = 2) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${colour}" stroke-width="${w}" opacity=".55"/>`;
  let body;
  if (shape === 'eleven') {
    // The loonie has eleven sides.
    body = `<polygon points="${polygon(11, 49)}" fill="${rim}" stroke="${rim}" stroke-width="2" stroke-linejoin="round"/><polygon points="${polygon(11, 44)}" fill="${face}" stroke="${face}" stroke-width="2" stroke-linejoin="round"/>${ring(35, rim)}`;
  } else if (shape === 'ring') {
    // The toonie: silver ring around a gold centre.
    body = `<circle cx="50" cy="50" r="48" fill="${rim}"/><circle cx="50" cy="50" r="44" fill="${face}"/><circle cx="50" cy="50" r="31" fill="${GOLD[1]}"/><circle cx="50" cy="50" r="28" fill="${GOLD[0]}"/>`;
  } else if (shape === 'hole') {
    // The hole sits a little high so the number under it can stay big.
    body = `<path d="${circle(48)}${circle(7, 27)}" fill="${rim}" fill-rule="evenodd"/><path d="${circle(44)}${circle(10, 27)}" fill="${face}" fill-rule="evenodd"/>${ring(39, rim)}`;
  } else {
    body = `<circle cx="50" cy="50" r="48" fill="${rim}"/><circle cx="50" cy="50" r="44" fill="${face}"/>${ring(39, rim)}`;
  }
  const hole = shape === 'hole';
  const size = hole ? (label.length > 1 ? 37 : 42) : label.length > 2 ? 35 : 40;
  const ty = hole ? 64 : 50;
  const fill = shape === 'ring' ? GOLD[2] : ink;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${money(v, l)}">${body}<text x="50" y="${ty}" dy=".36em" text-anchor="middle" font-size="${size}" font-weight="900" fill="${fill}">${label}</text></svg>`;
}

// Flat bills: the bill's colour, a pale frame and the big value. Dollar bills
// get a round window; yen values are long, so they take the whole width.
export function billSVG(v, l) {
  const [fill, edge] = BILLS[l][v];
  const ja = l === 'ja';
  const label = ja ? String(v) : `$${v / 100}`;
  const size = ja ? (label.length > 4 ? 36 : 42) : 46;
  const yen = ja ? `<tspan font-size="${Math.round(size * 0.6)}" dx="3">円</tspan>` : '';
  const pane = ja ? '' : '<circle cx="46" cy="50" r="22" fill="#fff" fill-opacity=".3"/>';
  return `<svg viewBox="0 0 200 100" role="img" aria-label="${money(v, l)}">
    <rect x="2" y="2" width="196" height="96" rx="12" fill="${fill}" stroke="${edge}" stroke-width="3"/>
    <rect x="11" y="11" width="178" height="78" rx="7" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="2.5"/>
    ${pane}
    <text x="${ja ? 100 : 126}" y="50" dy=".36em" text-anchor="middle" font-size="${size}" font-weight="900" fill="#fff">${label}${yen}</text>
  </svg>`;
}

function piece(v, l, i, cls = '') {
  const bill = isBill(v, l);
  const p = el('span', `cash-piece ${bill ? 'is-bill' : 'is-coin'} ${cls}`, bill ? billSVG(v, l) : coinSVG(v, l));
  p.style.setProperty('--i', i);
  if (!bill) p.style.setProperty('--s', COINS[l][v][1]);
  // A little tilt so the tray looks dropped in, not printed. Kept small so
  // every label still reads upright.
  p.style.setProperty('--r', `${bill ? rand(-4, 4) : rand(-14, 14)}deg`);
  return p;
}

// ---------- Shop items and prices ----------

// Items by price band, so a cake never costs 40¢ and a banana never $9.
const ITEMS = {
  en: [
    [50, ['🍬', '🍭']],
    [100, ['🍌', '🍎', '🍊', '🍬', '🍭']],
    [500, ['🍞', '🥛', '☕', '🧀', '🍪', '🥐', '📰', '🍵', '🥕', '🍩']],
    [1000, ['🍰', '🌷', '🍕', '🧦', '🍇']],
    [Infinity, ['💐', '☂️', '🧣', '📚', '🧸', '🎁']],
  ],
  ja: [
    // 30円 buys a sweet or a banana, never an onigiri.
    [100, ['🍬', '🍭', '🍌']],
    [150, ['🍎', '🍙', '🍡', '🍬']],
    [500, ['🍞', '🥛', '☕', '🍵', '🍙', '🍪', '🥐', '📰', '🍩']],
    [1500, ['🍰', '🍱', '🌷', '🍇', '🧀']],
    [Infinity, ['💐', '☂️', '🧣', '📚', '🧸', '🎁', '👟']],
  ],
};
function itemFor(price, l, not) {
  const band = ITEMS[l].find(([cap]) => price <= cap)[1];
  return pick(band.filter((e) => e !== not));
}

// Prices that look like real Japanese shop tags.
const YEN = {
  tiny: [30, 40, 50, 60, 70, 80, 90],
  small: [120, 130, 150, 160, 180, 220, 250, 280, 320, 350, 380, 420, 450, 480],
  mid: [180, 280, 350, 380, 450, 480, 550, 580, 650, 680, 750, 780, 850, 880, 980],
  odd: [140, 170, 190, 230, 240, 260, 290, 340, 360, 370, 390, 430, 460, 540, 570, 590, 640, 670, 690, 740, 760, 790, 840, 860, 890, 940, 960, 990],
  ninety8: [198, 298, 398, 498, 598, 698, 798, 898],
  big: [1080, 1280, 1480, 1580, 1680, 1980, 2280, 2480, 2980, 3280, 3480, 3980, 4280, 4580],
  huge: [4980, 5480, 5980, 6480, 6980, 7480, 7980, 8480, 8980, 9480],
};
// A random multiple of `st` between lo and hi.
const cents = (lo, hi, st) => lo + st * rand(0, Math.floor((hi - lo) / st));

// ---------- Levels ----------

// Which kinds of round each level can deal. New kinds join as the level rises.
export const LEVEL_VARIANTS = [
  null,
  ['count', 'change'],
  ['count', 'change', 'two'],
  ['count', 'change', 'missing', 'two'],
  ['count', 'change', 'missing', 'two', 'left'],
  ['count', 'change', 'missing', 'two', 'left'],
];
const FIRST = { count: 1, change: 1, two: 2, missing: 3, left: 4 };

// n: pieces in the tray, bills: which bills and how many (nb), big: at least
// one of these coins so the level's new coins always show up.
const COUNT = {
  en: [
    null,
    { n: [3, 4], coins: [5, 10, 25] },
    { n: [4, 5], coins: [5, 10, 25, 100, 200], big: [100, 200] },
    { n: [5, 5], coins: [5, 10, 25, 100, 200], big: [100, 200] },
    { n: [5, 6], coins: [5, 10, 25, 100, 200], bills: [500, 1000], nb: [1, 1] },
    { n: [6, 8], coins: [5, 10, 25, 100, 200], bills: [500, 1000, 2000], nb: [1, 3] },
  ],
  ja: [
    null,
    { n: [3, 4], coins: [10, 50, 100] },
    { n: [4, 5], coins: [10, 50, 100, 500], big: [100, 500] },
    { n: [5, 5], coins: [5, 10, 50, 100, 500], big: [100, 500] },
    { n: [5, 6], coins: [1, 5, 10, 50, 100, 500], bills: [1000], nb: [1, 1] },
    { n: [6, 8], coins: [1, 5, 10, 50, 100, 500], bills: [1000, 5000, 10000], nb: [1, 3] },
  ],
};

// [money handed over, price picker]. One deal is chosen per round.
const CHANGE = {
  en: [
    null,
    [[[100], () => cents(50, 95, 5)], [[200], () => pick([100, 125, 150, 175])]],
    [[[500], () => cents(150, 475, 25)]],
    [[[1000], () => cents(250, 975, 25)], [[500], () => cents(105, 495, 5)]],
    [[[2000], () => cents(405, 1495, 5)], [[1000], () => cents(205, 995, 5)]],
    [[[2000], () => cents(1005, 1995, 5)], [[1000, 500], () => cents(1005, 1495, 5)]],
  ],
  ja: [
    null,
    [[[100], () => pick(YEN.tiny)], [[500], () => pick([100, 200, 300, 400])]],
    [[[500], () => pick(YEN.small)]],
    [[[1000], () => pick(YEN.mid)]],
    [[[1000], () => pick([...YEN.mid, ...YEN.odd, ...YEN.ninety8])], [[5000], () => pick(YEN.big)]],
    [[[10000], () => pick(YEN.huge)], [[5000], () => pick(YEN.big)], [[1000], () => pick(YEN.ninety8)]],
  ],
};

// The tray is one coin short of the price. miss: which coin can be missing.
const MISSING = {
  en: [
    null, null, null,
    { n: [2, 3], coins: [5, 10, 25, 100, 200], miss: [5, 10, 25, 100, 200], max: 500 },
    { n: [3, 4], coins: [5, 10, 25, 100, 200], bills: [500], nb: [0, 1], miss: [5, 10, 25, 100, 200] },
    { n: [4, 5], coins: [5, 10, 25, 100, 200], bills: [500, 1000], nb: [1, 2], miss: [5, 10, 25, 100, 200] },
  ],
  ja: [
    null, null, null,
    { n: [2, 3], coins: [10, 50, 100, 500], miss: [10, 50, 100, 500], max: 1000 },
    { n: [3, 4], coins: [10, 50, 100, 500], bills: [1000], nb: [0, 1], miss: [10, 50, 100, 500] },
    { n: [4, 5], coins: [1, 5, 10, 50, 100, 500], bills: [1000, 5000], nb: [1, 2], miss: [1, 5, 10, 50, 100, 500] },
  ],
};
// The six coin pictures to choose from. Canada has five coins, so the $5 bill
// fills the sixth button.
const PICKS = { en: [5, 10, 25, 100, 200, 500], ja: [1, 5, 10, 50, 100, 500] };

// Two prices. From level 5 the total always carries over a dollar or a thousand.
const TWO = {
  en: [
    null, null,
    () => [cents(25, 100, 25), cents(25, 100, 25)],
    () => [cents(50, 400, 25), cents(50, 400, 25)],
    () => [cents(105, 495, 5), cents(105, 495, 5)],
    () => {
      for (;;) {
        const a = cents(105, 995, 5);
        const b = cents(105, 795, 5);
        if (a % 100 && b % 100 && (a % 100) + (b % 100) >= 100) return [a, b];
      }
    },
  ],
  ja: [
    null, null,
    () => [pick([50, 60, 80, 100, 120, 150]), pick([30, 50, 80, 100, 120])],
    () => [pick(YEN.small), pick(YEN.small.filter((v) => v <= 350))],
    () => [pick([...YEN.mid, ...YEN.odd]), pick(YEN.small)],
    () => {
      for (;;) {
        const a = pick([...YEN.mid, ...YEN.big.slice(0, 8)]);
        const b = pick([...YEN.small, ...YEN.mid]);
        if ((a % 1000) + (b % 1000) >= 1000) return [a, b];
      }
    },
  ],
};

// What is left in the purse after buying one thing.
const LEFT = {
  en: [
    null, null, null, null,
    { n: [3, 5], coins: [5, 10, 25, 100, 200], big: [100, 200], min: 200 },
    { n: [4, 6], coins: [5, 10, 25, 100, 200], bills: [500, 1000], nb: [1, 1], min: 600 },
  ],
  ja: [
    null, null, null, null,
    { n: [3, 5], coins: [10, 50, 100, 500], big: [100, 500], min: 300, prices: [...YEN.small, ...YEN.mid, ...YEN.odd] },
    { n: [4, 6], coins: [10, 50, 100, 500], bills: [1000, 5000], nb: [1, 1], min: 1500, prices: [...YEN.mid, ...YEN.ninety8, ...YEN.big] },
  ],
};

// ---------- Problems ----------

// A handful of money, biggest first so it reads like counting out a purse.
// At most three of one coin and two of one bill, so the tray never turns into
// a chore.
function handful(cfg) {
  for (;;) {
    const out = [];
    const nb = cfg.bills ? rand(cfg.nb[0], cfg.nb[1]) : 0;
    while (out.length < nb) {
      const b = pick(cfg.bills);
      if (out.filter((x) => x === b).length < 2) out.push(b);
    }
    const n = rand(cfg.n[0], cfg.n[1]);
    while (out.length < n) {
      const c = pick(cfg.coins);
      if (out.filter((x) => x === c).length < 3) out.push(c);
    }
    if (cfg.big && !out.some((v) => cfg.big.includes(v))) continue;
    if (cfg.min && total(out) < cfg.min) continue;
    return out.sort((a, b) => b - a);
  }
}

const near = (v, steps) => steps.flatMap((s) => [v + s, v - s]);
const COIN_STEPS = { en: [5, 10, 25, 100], ja: [10, 50, 100] };

// Six options: the answer plus five believable slips. tiers[0] holds the
// "thinking" slips (forgot a bill, read the price as the change, took away
// instead of added); one of them goes to the front of the queue. The rest are
// counting slips. The answer's place in the sorted row is random, so it is
// never given away by always sitting in the middle or never at an end.
function six(answer, tiers, l, max = Infinity) {
  const unit = l === 'ja' ? 1 : 5;
  const ok = (v) => Number.isInteger(v) && v >= unit && v <= max && v !== answer && v % unit === 0;
  const order = [];
  const side = [0, 0];
  const add = (v) => {
    if (!ok(v) || order.includes(v)) return;
    order.push(v);
    side[v > answer ? 1 : 0]++;
  };
  const [first, ...rest] = tiers;
  const thinking = shuffle(first).filter(ok);
  if (thinking.length) add(thinking[0]);
  rest.forEach((t) => shuffle(t).forEach(add));
  thinking.forEach(add);
  // Near neighbours in tidy steps, so either end of the row can hold the answer.
  const st = l === 'ja' ? (answer % 10 ? 1 : 10) : 5;
  for (let k = 1; (side[0] < 5 || side[1] < 5) && k < 400; k++) {
    add(answer + k * st);
    add(answer - k * st);
  }
  const below = order.filter((v) => v < answer);
  const above = order.filter((v) => v > answer);
  const k = rand(Math.max(0, 5 - above.length), Math.min(5, below.length));
  return [...below.slice(0, k), answer, ...above.slice(0, 5 - k)].sort((a, b) => a - b);
}

const MAKE = {
  count(level, l) {
    const tray = handful(COUNT[l][level]);
    const answer = total(tray);
    const kinds = [...new Set(tray)];
    const bills = kinds.filter((v) => isBill(v, l));
    const options = six(answer, [
      bills.map((b) => answer - b),
      near(answer, kinds),
      [...near(answer, kinds.map((k) => k * 2)), ...near(answer, [100])],
    ], l);
    return { answer, options, tray };
  },

  change(level, l) {
    const [pay, price] = ((d) => [d[0].slice(), d[1]()])(pick(CHANGE[l][level]));
    const paid = total(pay);
    const answer = paid - price;
    const options = six(answer, [
      [price],
      near(answer, COIN_STEPS[l]),
      [paid, ...near(answer, l === 'ja' ? [1000, 500] : [500, 50])],
    ], l, paid);
    return { answer, options, pay, paid, price, item: itemFor(price, l) };
  },

  missing(level, l) {
    const cfg = MISSING[l][level];
    for (;;) {
      const tray = handful(cfg);
      const answer = pick(cfg.miss);
      const price = total(tray) + answer;
      if (cfg.max && price > cfg.max) continue;
      // Yen tags end in 0, or in 8 like tax-included prices (1,078円), never 2,515円.
      if (l === 'ja' && price % 10 && price % 10 !== 8) continue;
      return { answer, options: PICKS[l].slice(), tray, have: total(tray), price, item: itemFor(price, l) };
    }
  },

  two(level, l) {
    const prices = TWO[l][level]();
    const [a, b] = prices;
    const answer = a + b;
    const carry = l === 'ja' ? 1000 : 100;
    const carried = Math.floor(answer / carry) > Math.floor(a / carry) + Math.floor(b / carry);
    const options = six(answer, [
      [Math.abs(a - b), ...(carried ? [answer - carry] : [])],
      near(answer, COIN_STEPS[l]),
      [a, b, ...near(answer, [100])],
    ], l);
    const first = itemFor(a, l);
    return { answer, options, prices, items: [first, itemFor(b, l, first)] };
  },

  left(level, l) {
    const cfg = LEFT[l][level];
    for (;;) {
      const tray = handful(cfg);
      const have = total(tray);
      // Something that costs between a quarter and most of the purse.
      const price = l === 'ja'
        ? pick(cfg.prices.filter((p) => p >= have * 0.25 && p <= have - 20))
        : cents(Math.ceil((have * 0.25) / 5) * 5, have - 20, 5);
      if (!price || price >= have) continue;
      const answer = have - price;
      const kinds = [...new Set(tray)];
      const options = six(answer, [
        [have, price],
        near(answer, kinds),
        [...near(answer, [100]), have + price],
      ], l, have);
      return { answer, options, tray, have, price, item: itemFor(price, l) };
    }
  },
};

// One problem, as plain data, so it can be checked without a screen.
export function makeProblem(level, l = lang(), variant = null) {
  level = Math.min(5, Math.max(1, Math.round(level) || 1));
  const v = variant || pick(LEVEL_VARIANTS[level]);
  // A variant asked for below its level uses the first level it appears at.
  const lv = Math.max(level, FIRST[v]);
  return { variant: v, lang: l, level: lv, ...MAKE[v](lv, l) };
}

// Deals the level's variants like a shuffled deck, so a session sees each
// one and never the same kind twice in a row. `fresh` starts a new deck for a
// new session, so four rounds at level 3 and up are four different kinds.
const deck = { level: 0, cards: [], last: null, stage: null };
export function nextVariant(level, fresh = false) {
  level = Math.min(5, Math.max(1, Math.round(level) || 1));
  if (fresh || deck.level !== level || !deck.cards.length) {
    const cards = shuffle(LEVEL_VARIANTS[level]);
    if (cards[0] === deck.last) cards.push(cards.shift());
    deck.level = level;
    deck.cards = cards;
  }
  deck.last = deck.cards.shift();
  return deck.last;
}

// ---------- Screen ----------

const SAY = {
  count: { en: 'How much money?', ja: 'ぜんぶで いくら？' },
  change: { en: 'How much change?', ja: 'おつりは いくら？' },
  missing: { en: 'Which coin is missing?', ja: 'たりないのは どれ？' },
  two: { en: 'How much for both?', ja: 'ふたつで いくら？' },
  left: { en: 'How much is left?', ja: 'のこりは いくら？' },
};
const LABEL = {
  pay: { en: 'You pay', ja: '出すお金' },
  have: { en: 'Your money', ja: 'おさいふ' },
};
const MINUS = '−';

function tag(v, l) {
  return el('div', 'cash-tag', moneyHTML(v, l));
}

function shopItem(emoji, price, l) {
  const it = el('div', 'cash-item');
  it.append(el('span', 'emoji', emoji), tag(price, l));
  return it;
}

function tray(list, l, label) {
  const t = el('div', label ? 'cash-tray labelled' : 'cash-tray');
  if (label) t.append(el('span', 'cash-label', label));
  list.forEach((v, i) => t.append(piece(v, l, i)));
  return t;
}

// The maths behind the answer, shown on the counter for a moment afterwards.
function sentence(p, l) {
  const m = (v) => money(v, l);
  switch (p.variant) {
    case 'change': return [`${m(p.paid)} ${MINUS} ${m(p.price)}`, m(p.answer)];
    case 'left': return [`${m(p.have)} ${MINUS} ${m(p.price)}`, m(p.answer)];
    case 'two': return [`${m(p.prices[0])} + ${m(p.prices[1])}`, m(p.answer)];
    case 'missing': return [`${m(p.have)} + ${m(p.answer)}`, m(p.price)];
    default: return [null, m(p.answer)];
  }
}

function board(p) {
  const l = p.lang;
  const b = el('div', `cash-board v-${p.variant}`);
  const pieces = p.tray || p.pay || [];
  if (pieces.length <= 4 && !pieces.some((v) => isBill(v, l))) b.classList.add('few');
  if (pieces.length >= 7) b.classList.add('many');

  if (p.variant === 'count') {
    // The total waits on a tag hung on the tray.
    const t = tray(p.tray, l);
    t.prepend(el('div', 'cash-tag cash-ask', '?'));
    b.append(t);
    return b;
  }

  const shop = el('div', 'cash-shop');
  const shelf = el('div', 'cash-shelf');
  if (p.variant === 'two') {
    shelf.append(shopItem(p.items[0], p.prices[0], l), el('span', 'cash-plus', '+'), shopItem(p.items[1], p.prices[1], l));
  } else {
    shelf.append(shopItem(p.item, p.price, l));
  }
  const [sum, result] = sentence(p, l);
  // Opacity hides the worked sum from eyes but not from VoiceOver, so it stays
  // out of the accessibility tree until the round is solved.
  const math = el('div', 'cash-math', `<span>${sum}</span><b>= ${result}</b>`);
  math.setAttribute('aria-hidden', 'true');
  shop.append(shelf, math);
  b.append(shop);

  if (p.variant === 'change') b.append(tray(p.pay, l, LABEL.pay[l]));
  if (p.variant === 'left') b.append(tray(p.tray, l, LABEL.have[l]));
  if (p.variant === 'missing') {
    const t = tray(p.tray, l);
    const slot = el('span', 'cash-slot', '?');
    slot.style.setProperty('--i', p.tray.length);
    t.append(slot);
    b.append(t);
  }
  return b;
}

// After the right tap: the counter shows the sum, the missing coin drops
// into its gap, the total fills its tag.
function reveal(b, p, ctx) {
  const l = p.lang;
  b.classList.add('solved');
  b.querySelector('.cash-math')?.removeAttribute('aria-hidden');
  if (p.variant === 'count') {
    const ask = b.querySelector('.cash-ask');
    ask.innerHTML = moneyHTML(p.answer, l);
    ask.classList.add('filled');
  }
  if (p.variant === 'missing') {
    const slot = b.querySelector('.cash-slot');
    const c = piece(p.answer, l, 0, 'landed');
    slot.replaceWith(c);
    setTimeout(() => ctx.alive() && ctx.fx.clink(2), 250);
  }
}

// Big text or a short phone can leave too little room. Shrink the money and
// the counter a step at a time, before the first paint, until the puzzle and
// the answers both fit on screen. Returns the scale it settled on.
function fit(stage, b) {
  let f = 1;
  b.style.removeProperty('--fit');
  while (stage.scrollHeight > stage.clientHeight + 1 && f > 0.6) {
    f = Math.round((f - 0.06) * 100) / 100;
    b.style.setProperty('--fit', f);
  }
  return f;
}

// A long price like 10,510円 in big text can be wider than the counter.
// Shrink the tags a step at a time until the shelf fits inside it.
function fitShelf(b) {
  const shop = b.querySelector('.cash-shop');
  if (!shop) return;
  const shelf = shop.querySelector('.cash-shelf');
  const room = shop.clientWidth - 32;
  for (let k = 1; shelf.offsetWidth > room && k > 0.6; ) {
    k = Math.round((k - 0.05) * 100) / 100;
    shop.style.setProperty('--tag', k);
  }
}

// Plays one prepared problem. Exported so the test page can show any variant.
export async function playProblem(ctx, p) {
  const l = p.lang;
  ctx.say(SAY[p.variant][l]);
  const b = board(p);
  ctx.stage.append(b);

  // Money lands one piece at a time with a soft clink, bills with a paper fwip.
  const pieces = p.tray || p.pay || [];
  pieces.forEach((v, i) => {
    setTimeout(() => {
      if (!ctx.alive()) return;
      if (isBill(v, l)) ctx.fx.flip();
      else ctx.fx.clink(i);
    }, 260 + i * 110);
  });

  const coinsAsk = p.variant === 'missing';
  const render = coinsAsk
    ? (v) => (isBill(v, l)
      ? `<span class="cash-pick is-bill">${billSVG(v, l)}</span>`
      // Real sizes squeezed further than in the tray, so 1円 and 10¢ stay readable.
      : `<span class="cash-pick is-coin" style="--s:${(0.88 + (COINS[l][v][1] - 0.8) * 0.6).toFixed(3)}">${coinSVG(v, l)}</span>`)
    : (v) => moneyHTML(v, l);
  const done = choices(ctx.stage, p.options, p.answer, render, ctx.fx);
  const row = ctx.stage.lastElementChild;
  row.classList.add('cash-choices', coinsAsk ? 'pictures-ask' : 'money-ask');
  // The answers are laid out now, so the board can be fitted around them, but
  // they only pop in once most of the money has landed.
  row.style.setProperty('--lead', `${Math.min(700, 200 + pieces.length * 70)}ms`);
  // Long amounts like 10,086円 would come out small in three columns. Give
  // them two wide columns instead, as long as the money above still fits
  // at nearly full size.
  if (!coinsAsk && fitAnswers(row) < 28) {
    row.classList.add('wide');
    fitAnswers(row);
    if (fit(ctx.stage, b) < 0.88) {
      row.classList.remove('wide');
      fitAnswers(row);
    }
  }
  fit(ctx.stage, b);
  fitShelf(b);
  row.querySelector('.choice[data-ok]').addEventListener('pointerdown', () => reveal(b, p, ctx), { once: true });
  ctx.setHint(() => ctx.stage.querySelector('.choice[data-ok]'));

  const mistakes = await done;
  // Leave the worked sum on screen for a moment before the round moves on.
  await wait(750);
  return { mistakes };
}

export default {
  id: 'coins',
  cat: 'math',
  rounds: 4,

  round(ctx) {
    const l = lang() === 'ja' ? 'ja' : 'en';
    // Each session gets its own stage element, which marks a new session.
    const fresh = deck.stage !== ctx.stage;
    deck.stage = ctx.stage;
    return playProblem(ctx, makeProblem(ctx.level, l, nextVariant(ctx.level, fresh)));
  },
};
