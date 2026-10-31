import { fx, unlockAudio } from './feedback.js';
import { icons } from './icons.js';
import { settings, save, levelOf, record, playedToday, hasPlayed } from './store.js';
import { el, wait } from './util.js';
import order from './games/order.js';
import sum from './games/sum.js';
import odd from './games/odd.js';
import more from './games/more.js';
import memory from './games/memory.js';

const GAMES = [order, sum, odd, more, memory];
const app = document.getElementById('app');
let session = null;

document.addEventListener('pointerdown', unlockAudio, { once: true });

function applySettings() {
  document.documentElement.classList.toggle('big-text', settings.bigText);
}

// One screen on stage at a time. The old one fades back while the new one rises
// in, both at once, so there is never a blank frame.
function show(screen) {
  const old = app.firstElementChild;
  if (old) {
    old.classList.add('leave');
    old.inert = true;
    setTimeout(() => old.remove(), 400);
  }
  screen.classList.add('screen', 'enter');
  app.append(screen);
  screen.addEventListener('animationend', () => screen.classList.remove('enter'), { once: true });
}

function button(cls, iconSvg, label, onClick) {
  const b = el('button', `btn ${cls}`, `${iconSvg}<span>${label}</span>`);
  b.type = 'button';
  b.addEventListener('click', () => {
    fx.press();
    onClick();
  });
  return b;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function levelDots(lv) {
  return `<span class="level" aria-label="Level ${lv} of 5">${[1, 2, 3, 4, 5]
    .map((k) => `<i class="${k <= lv ? 'on' : ''}"></i>`)
    .join('')}</span>`;
}

// ---------- Home ----------

function home() {
  session = null;
  const s = el('main', 'home');
  const date = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
  s.append(el('header', 'hello', `<p class="date">${date}</p><h1>${greeting()}</h1>`));

  const list = el('div', 'cards');
  GAMES.forEach((g, i) => {
    const done = playedToday(g.id);
    const card = el(
      'button',
      `card${done ? ' played' : ''}`,
      `<span class="badge" style="background:${g.color}">${icons[g.id]}</span>
       <span class="label"><strong>${g.name}</strong><small>${g.blurb}</small></span>
       <span class="go">${done ? `<span class="tick">${icons.check}</span>` : icons.arrow}</span>`,
    );
    card.type = 'button';
    card.style.setProperty('--i', i);
    card.setAttribute('aria-label', `${g.name}. ${g.blurb}.${done ? ' Played today.' : ''}`);
    card.addEventListener('click', () => {
      fx.press();
      play(g);
    });
    list.append(card);
  });
  s.append(list);

  const toggles = el('footer', 'toggles');
  const toggle = (key, on, off, label) => {
    const b = el('button', 'toggle');
    b.type = 'button';
    const paint = () => {
      b.innerHTML = `${settings[key] ? on : off}<span>${label}</span>`;
      b.setAttribute('aria-pressed', settings[key]);
    };
    paint();
    b.addEventListener('click', () => {
      settings[key] = !settings[key];
      save();
      applySettings();
      paint();
      fx.press();
    });
    return b;
  };
  toggles.append(
    toggle('sound', icons.soundOn, icons.soundOff, 'Sound'),
    toggle('haptics', icons.vibrate, icons.vibrateOff, 'Buzz'),
    toggle('bigText', icons.text, icons.text, 'Big text'),
  );
  s.append(toggles);
  show(s);
}

// ---------- A game session ----------

async function play(game) {
  const me = {};
  session = me;
  const alive = () => session === me;
  const level = levelOf(game.id);
  const started = Date.now();
  // First timers get a nudge sooner. Everyone gets one eventually.
  const hintDelay = hasPlayed(game.id) ? 7000 : 4000;

  const s = el('main', 'play');
  s.style.setProperty('--accent', game.color);
  const top = el('header', 'bar');
  top.append(button('home-btn', icons.home, 'Home', home));
  top.append(el('div', 'title', `<span class="badge small" style="background:${game.color}">${icons[game.id]}</span><span>${game.name}</span>`));
  const bar = el('div', 'progress', '<i></i>');
  const fill = bar.firstElementChild;
  const instr = el('p', 'instruction', game.instruction(level));
  const stage = el('section', 'stage');
  const flash = el('div', 'flash', icons.check);
  s.append(top, bar, instr, stage, flash);
  show(s);

  let round = 0;
  let hintFn = null;
  let hintTimer = 0;
  const clearNudge = () => stage.querySelectorAll('.nudge').forEach((n) => n.classList.remove('nudge'));
  const armHint = () => {
    clearTimeout(hintTimer);
    clearNudge();
    if (!hintFn) return;
    hintTimer = setTimeout(() => {
      if (!alive() || !hintFn) return;
      [hintFn()].flat().filter(Boolean).forEach((n) => n.classList.add('nudge'));
    }, hintDelay);
  };
  stage.addEventListener('pointerdown', armHint);

  const ctx = {
    stage,
    level,
    fx,
    alive,
    setHint(fn) {
      hintFn = fn;
      armHint();
    },
    progress(f) {
      fill.style.width = `${((round + f) / game.rounds) * 100}%`;
    },
  };

  let mistakes = 0;
  await wait(350);
  for (round = 0; round < game.rounds; round++) {
    if (!alive()) return;
    stage.replaceChildren();
    stage.classList.remove('out');
    const r = await game.round(ctx);
    clearTimeout(hintTimer);
    if (!alive()) return;
    mistakes += r.mistakes;
    ctx.progress(1);
    fx.round();
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
    stage.classList.add('out');
    await wait(750);
  }
  if (!alive()) return;
  results(game, mistakes, Date.now() - started);
}

// ---------- Results ----------

function results(game, mistakes, ms) {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const { before, after } = record(game.id, stars);
  const words = ['', 'Good effort!', 'Well done!', 'Excellent!'][stars];
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  const time = mins ? `${mins} min ${secs} sec` : `${secs} seconds`;

  const s = el('main', 'results');
  s.style.setProperty('--accent', game.color);
  const starRow = el('div', 'stars', [0, 1, 2].map((k) => `<span class="star${k < stars ? ' got' : ''}" style="--k:${k}">${icons.star}</span>`).join(''));
  starRow.setAttribute('aria-label', `${stars} out of 3 stars`);
  s.append(
    el('div', 'badge big', icons[game.id]),
    starRow,
    el('h1', '', words),
    el('p', 'meta', `${game.name} · ${time}`),
  );
  s.querySelector('.badge').style.background = game.color;
  if (after !== before) {
    s.append(el('p', 'levelup', after > before ? `Level up! Now level ${after}` : `Next time a little easier`));
  }
  s.append(el('div', 'lv', levelDots(after)));
  const actions = el('div', 'actions');
  actions.append(button('primary', icons.replay, 'Play again', () => play(game)), button('secondary', icons.home, 'Home', home));
  s.append(actions);
  show(s);

  fx.win();
  for (let k = 0; k < stars; k++) setTimeout(() => fx.star(k), 450 + k * 280);
}

applySettings();
home();
