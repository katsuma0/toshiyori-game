import { fx, unlockAudio } from './feedback.js';
import { icons } from './icons.js';
import { settings, save, levelOf, record, playedToday, hasPlayed, markPlayed } from './store.js';
import { t, gameName, gameHow, lang, setLang, locale } from './i18n.js';
import { mascot } from './mascot.js';
import { confetti } from './particles.js';
import { el, wait, sample, replay } from './util.js';
import order from './games/order.js';
import sum from './games/sum.js';
import coins from './games/coins.js';
import odd from './games/odd.js';
import copy from './games/copy.js';
import lights from './games/lights.js';
import pairs from './games/pairs.js';
import flash from './games/flash.js';
import heavy from './games/heavy.js';
import blocks from './games/blocks.js';

// Grouped by kind so neighbours on the home screen feel different.
const GAMES = [order, odd, lights, heavy, sum, copy, pairs, blocks, coins, flash];
const app = document.getElementById('app');
let session = null;

document.addEventListener('pointerdown', unlockAudio, { once: true });

function applySettings() {
  document.documentElement.classList.toggle('big-text', settings.bigText);
  document.documentElement.lang = lang() === 'ja' ? 'ja' : 'en-CA';
}

// One screen at a time. The old one shrinks away while the new one bounces in,
// both at once, so there is never a blank frame.
function show(screen) {
  const old = [...app.children].filter((c) => !c.classList.contains('leave'));
  old.forEach((o) => {
    o.classList.add('leave');
    o.inert = true;
    setTimeout(() => o.remove(), 450);
  });
  screen.classList.add('screen', 'enter');
  app.append(screen);
  screen.addEventListener('animationend', (e) => e.target === screen && screen.classList.remove('enter'));
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
  return t(h < 11 ? 'morning' : h < 18 ? 'afternoon' : 'evening');
}

function levelDots(lv) {
  return `<span class="level" role="img" aria-label="${t('level', lv)}">${[1, 2, 3, 4, 5]
    .map((k) => `<i class="${k <= lv ? 'on' : ''}"></i>`)
    .join('')}</span>`;
}

// ---------- Home ----------

function home() {
  session = null;
  const s = el('main', 'home');
  const date = new Date().toLocaleDateString(locale(), { weekday: 'long', month: 'long', day: 'numeric' });
  const head = el('header', 'hello');
  const m = mascot('idle', 76);
  m.addEventListener('pointerdown', () => {
    replay(m, 'boing');
    fx.select(7);
  });
  head.append(m, el('div', 'hello-text', `<p class="date">${date}</p><h1>${greeting()}</h1>`));
  s.append(head);

  const scroll = el('div', 'home-scroll');
  const big = el('button', `play-all${playedToday('today') ? ' played' : ''}`, `<span class="play-icon">${icons.play}</span><span class="play-text"><strong>${t('today')}</strong><small>${t('todaySub')}</small></span>${playedToday('today') ? `<span class="tick">${icons.check}</span>` : ''}`);
  big.type = 'button';
  big.addEventListener('click', () => {
    fx.press();
    playMix();
  });
  scroll.append(big);

  const list = el('div', 'tiles');
  GAMES.forEach((g, i) => {
    const done = playedToday(g.id);
    const card = el(
      'button',
      `game-tile${done ? ' played' : ''}`,
      `<span class="badge" style="--c:${g.color}">${icons[g.id]}</span>
       <strong>${gameName(g.id)}</strong>
       ${done ? `<span class="tick">${icons.check}</span>` : ''}`,
    );
    card.type = 'button';
    card.style.setProperty('--i', i);
    card.style.setProperty('--c', g.color);
    card.setAttribute('aria-label', `${gameName(g.id)}. ${gameHow(g.id, 10)}.${done ? ` ${t('played')}.` : ''}`);
    card.addEventListener('click', () => {
      fx.press();
      play([g], g.rounds);
    });
    list.append(card);
  });
  scroll.append(list);
  s.append(scroll);

  const toggles = el('footer', 'toggles');
  const toggle = (key, on, off, label, flip = () => (settings[key] = !settings[key])) => {
    const b = el('button', 'toggle');
    b.type = 'button';
    const paint = () => {
      b.innerHTML = `${settings[key] === false ? off : on}<span>${label()}</span>`;
      if (key !== 'lang') b.setAttribute('aria-pressed', !!settings[key]);
    };
    paint();
    b.addEventListener('click', () => {
      flip();
      save();
      applySettings();
      fx.press();
      replay(b, 'boing');
      // Language changes every word on the page, so rebuild it.
      if (key === 'lang') home();
      else paint();
    });
    return b;
  };
  toggles.append(
    toggle('sound', icons.soundOn, icons.soundOff, () => t('sound')),
    toggle('haptics', icons.vibrate, icons.vibrateOff, () => t('buzz')),
    toggle('bigText', icons.text, icons.text, () => t('bigText')),
    toggle('lang', icons.globe, icons.globe, () => t('lang'), () => setLang(lang() === 'ja' ? 'en' : 'ja')),
  );
  s.append(toggles);
  show(s);
}

// ---------- A session: one game several times, or a mix of games once each ----------

function playMix() {
  play(sample(GAMES, 5), 1, true);
}

async function play(list, roundsEach, mix = false) {
  const me = {};
  session = me;
  const alive = () => session === me;
  const started = Date.now();
  const plan = list.flatMap((g) => Array(roundsEach).fill(g));

  const s = el('main', 'play');
  const top = el('header', 'bar');
  top.append(button('home-btn', icons.home, t('home'), home));
  const title = el('div', 'title');
  top.append(title);
  const bar = el('div', 'progress', '<i></i>');
  const fill = bar.firstElementChild;
  const instr = el('p', 'instruction');
  const stage = el('section', 'stage');
  const flash = el('div', 'flash', icons.check);
  s.append(top, bar, instr, stage, flash);
  show(s);

  let step = 0;
  let hintFn = null;
  let hintTimer = 0;
  let hintDelay = 7000;
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

  let mistakes = 0;
  await wait(380);
  for (step = 0; step < plan.length; step++) {
    if (!alive()) return;
    const game = plan[step];
    // First timers get a nudge sooner. Everyone gets one eventually.
    hintDelay = hasPlayed(game.id) ? 7000 : 4000;
    s.style.setProperty('--accent', game.color);
    title.innerHTML = `<span class="badge small" style="--c:${game.color}">${icons[game.id]}</span><span>${gameName(game.id)}</span>`;
    const say = (arg) => {
      instr.textContent = typeof arg === 'number' ? gameHow(game.id, arg) : arg;
      replay(instr, 'pop');
    };
    say(gameHow(game.id, 10));
    stage.replaceChildren();
    stage.classList.remove('out');
    replay(stage, 'stage-in');
    hintFn = null;

    const ctx = {
      stage,
      level: levelOf(game.id),
      fx,
      alive,
      say,
      setHint(fn) {
        hintFn = fn;
        armHint();
      },
      progress(f) {
        fill.style.width = `${((step + Math.min(1, f)) / plan.length) * 100}%`;
      },
    };
    const r = await game.round(ctx);
    clearTimeout(hintTimer);
    if (!alive()) return;
    mistakes += r.mistakes;
    ctx.progress(1);
    fx.round();
    replay(flash, 'show');
    stage.classList.add('out');
    await wait(800);
  }
  if (!alive()) return;
  results(list, mix, mistakes, Date.now() - started);
}

// ---------- Results ----------

function results(list, mix, mistakes, ms) {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const game = list[0];
  let change = null;
  if (mix) markPlayed('today');
  else change = record(game.id, stars);

  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  const time = mins ? t('mins', mins, secs) : t('secs', secs);
  const accent = mix ? '#2E9E5B' : game.color;

  const s = el('main', 'results');
  s.style.setProperty('--accent', accent);
  s.append(mascot(stars === 3 ? 'happy' : stars === 2 ? 'glad' : 'idle', 120));
  const starRow = el('div', 'stars', [0, 1, 2].map((k) => `<span class="star${k < stars ? ' got' : ''}" style="--k:${k}">${icons.star}</span>`).join(''));
  starRow.setAttribute('role', 'img');
  starRow.setAttribute('aria-label', t('stars', stars));
  s.append(starRow, el('h1', '', t('great')[stars]), el('p', 'meta', `${mix ? t('today') : gameName(game.id)} · ${time}`));
  if (change && change.after !== change.before) {
    s.append(el('p', 'levelup', change.after > change.before ? `${t('levelUp')} ${levelDots(change.after)}` : t('easier')));
  } else if (change) {
    s.append(el('div', 'lv', levelDots(change.after)));
  }
  const actions = el('div', 'actions');
  actions.append(
    button('primary', icons.replay, t('again'), () => (mix ? playMix() : play([game], game.rounds))),
    button('secondary', icons.home, t('home'), home),
  );
  s.append(actions);
  show(s);

  fx.win();
  if (stars === 3) setTimeout(() => confetti(), 500);
  for (let k = 0; k < stars; k++) setTimeout(() => fx.star(k), 450 + k * 280);
}

applySettings();
home();
