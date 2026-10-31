import { el, rand, wait, replay } from '../util.js';
import { t } from '../i18n.js';
import { icons } from '../icons.js';

// A stopwatch. Start it, feel the seconds pass, stop it on the target. Low
// levels let you watch the hand; higher up it fades away and the count has
// to happen in your head.

// One lap of the dial is 15 seconds. A round stops itself 5 seconds after
// the target, and the latest target is 10, so the hand never starts a second
// lap and a very late stop can never look like an early one.
export const DIAL = 15;
export const GRACE = 5;
const SPAN = [null, [5, 5], [4, 7], [4, 8], [5, 9], [6, 10]];
// Milliseconds after Start before the hand and digits fade. null keeps them.
const FADE = [null, null, null, 2000, 1000, 0];
const PAUSE = 1600;

const lv = (level) => Math.min(5, Math.max(1, Math.round(level) || 1));
export const targetFor = (level) => rand(...SPAN[lv(level)]);
export const targetRange = (level) => SPAN[lv(level)].slice();
export const fadeAfter = (level) => FADE[lv(level)];
// The soft tick each second would hand over the answer once the hand is
// hidden, so only the two easiest levels hear it.
export const ticksAloud = (level) => lv(level) <= 2;

// Scoring works on whole hundredths, the same numbers the player reads, so a
// badge showing "+0.30" can never count as a miss.
export function grade(offCs) {
  const a = Math.abs(offCs);
  return a <= 30 ? 0 : a <= 80 ? 1 : 2;
}
export const score = (error) => grade(Math.round(Math.abs(error) * 100));
export const centis = (ms) => Math.max(0, Math.round(ms / 10));
export const clock = (cs) => `${Math.floor(cs / 100)}.${String(cs % 100).padStart(2, '0')}`;
// A true minus sign: the hyphen is too short to read at arm's length.
export const offText = (offCs) => (offCs ? `${offCs > 0 ? '+' : '−'}${clock(Math.abs(offCs))}` : '0.00');

export function result(ms, target) {
  const cs = centis(ms);
  const off = cs - target * 100;
  return { cs, off, mistakes: grade(off), text: clock(cs), offText: offText(off) };
}

// ---------- Drawing ----------

const CX = 100;
const CY = 120;
const PIE = 54;
const RING = 2 * Math.PI * (PIE / 2);
const f1 = (v) => v.toFixed(1);
const polar = (r, s) => {
  const a = (s / DIAL) * Math.PI * 2;
  return [CX + Math.sin(a) * r, CY - Math.cos(a) * r];
};
const line = (cls, s, r1, r2) => {
  const [x1, y1] = polar(r1, s);
  const [x2, y2] = polar(r2, s);
  return `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
};
const label = (cls, s, r, text) => {
  const [x, y] = polar(r, s);
  return `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" dy=".36em" text-anchor="middle">${text}</text>`;
};

// A flat stopwatch: crown on top, a pastel bezel, a white face with a tick
// for every second and the target marked on the bezel. The pie fills behind
// the hand so elapsed time reads as an amount, not just an angle.
function faceSVG(target) {
  let ticks = '';
  for (let s = 0; s < DIAL; s++) {
    if (s === target) continue;
    ticks += s % 5 ? line('sw-tick', s, 63, 70) : line('sw-tick major', s, 57, 70);
  }
  const nums = [5, 10].filter((s) => s !== target).map((s) => label('sw-num', s, 44, s)).join('');
  const [mx, my] = polar(86, target);
  return `<svg viewBox="0 0 200 220" aria-hidden="true">
    <g class="sw-crown"><rect class="sw-stem" x="92" y="14" width="16" height="16" rx="3"/><rect class="sw-knob" x="78" y="3" width="44" height="15" rx="7.5"/></g>
    <g transform="rotate(42 ${CX} ${CY})"><rect class="sw-stem" x="94" y="20" width="12" height="12" rx="3"/></g>
    <circle class="sw-bezel" cx="${CX}" cy="${CY}" r="96"/>
    <circle class="sw-dial" cx="${CX}" cy="${CY}" r="76"/>
    <circle class="sw-pie" cx="${CX}" cy="${CY}" r="${PIE / 2}" stroke-width="${PIE}" stroke-dasharray="${f1(RING)} ${f1(RING)}" stroke-dashoffset="${f1(RING)}" transform="rotate(-90 ${CX} ${CY})"/>
    ${ticks}${nums}
    ${line('sw-tick goal', target, 54, 72)}
    <g class="sw-flag"><circle cx="${f1(mx)}" cy="${f1(my)}" r="14"/>${label('sw-flag-num', target, 86, target)}</g>
    <g transform="translate(${CX} ${CY})"><g class="sw-hand"><g class="sw-hand-in">
      <path d="M0 14V-64"/><circle r="8.5"/><circle class="sw-pin" r="3"/>
    </g></g></g>
  </svg>`;
}

function goButton(state) {
  const icon = state === 'start' ? icons.play : icons.stopSquare;
  return `<span class="sw-go-icon">${icon}</span><span class="sw-go-label">${t(state === 'start' ? 'start' : 'stop')}</span>`;
}

const easeOut = (k) => 1 - (1 - k) ** 3;

export default {
  id: 'timer',
  cat: 'look',
  rounds: 3,

  round(ctx) {
    const { fx } = ctx;
    const level = lv(ctx.level);
    const target = targetFor(level);
    const fade = fadeAfter(level);
    const limit = (target + GRACE) * 1000;
    ctx.say(target);
    ctx.setHint(null);
    ctx.progress(0);

    const root = el('div', 'sw');
    const top = el('div', 'sw-top');
    const face = el('div', 'sw-face', faceSVG(target));
    const info = el('div', 'sw-info');
    const read = el('div', 'sw-read', '<span class="sw-digits"><b>0</b><small>.00</small></span><span class="sw-dots"><i></i><i></i><i></i></span>');
    const off = el('div', 'sw-off');
    const go = el('button', 'sw-go is-start', goButton('start'));
    go.type = 'button';
    go.dataset.role = 'go';
    go.dataset.ownClick = '1';
    go.setAttribute('aria-label', t('start'));
    info.append(read, off);
    top.append(face, info);
    root.append(top, el('div', 'sw-bottom'));
    root.lastChild.append(go);
    ctx.stage.append(root);

    const hand = face.querySelector('.sw-hand');
    const pie = face.querySelector('.sw-pie');
    const sec = read.querySelector('b');
    const frac = read.querySelector('small');
    const crown = face.querySelector('.sw-crown');

    let state = 'ready';
    let t0 = 0;
    let raf = 0;
    let lastSec = 0;
    let shownCs = 0;
    // Even the top level shows the hand at zero until Start, so the player
    // sees what is about to disappear.
    let blind = false;

    const draw = (ms) => {
      const f = Math.min(1, ms / (DIAL * 1000));
      hand.style.transform = `rotate(${(f * 360).toFixed(2)}deg)`;
      pie.style.strokeDashoffset = (RING * (1 - f)).toFixed(2);
    };
    const showDigits = (cs) => {
      shownCs = cs;
      const [s, c] = clock(cs).split('.');
      if (sec.textContent !== s) {
        sec.textContent = s;
        if (!blind && state === 'run') replay(sec, 'sw-beat');
      }
      frac.textContent = `.${c}`;
    };
    const press = () => {
      crown.classList.remove('down');
      void crown.getBoundingClientRect();
      crown.classList.add('down');
      setTimeout(() => crown.classList.remove('down'), 180);
    };

    return new Promise((resolve) => {
      let settled = false;
      const finish = (mistakes) => {
        if (settled) return;
        settled = true;
        cancelAnimationFrame(raf);
        resolve({ mistakes });
      };

      const frame = () => {
        if (!ctx.alive()) return finish(0);
        if (state !== 'run') return;
        const ms = Math.max(0, performance.now() - t0);
        if (ms >= limit) return stop(limit);
        if (!blind && fade !== null && ms >= fade) {
          blind = true;
          root.classList.add('blind');
        }
        // While hidden nothing moves, so the hand later springs from where
        // it faded to where the player stopped.
        if (!blind) {
          draw(ms);
          showDigits(centis(ms));
        }
        const s = Math.floor(ms / 1000);
        if (s > lastSec) {
          lastSec = s;
          if (ticksAloud(level)) fx.clink(s);
        }
        raf = requestAnimationFrame(frame);
      };

      const start = () => {
        state = 'run';
        t0 = performance.now();
        fx.select(4);
        press();
        ctx.progress(0.4);
        root.classList.add('running');
        go.classList.replace('is-start', 'is-stop');
        go.innerHTML = goButton('stop');
        go.setAttribute('aria-label', t('stop'));
        replay(go, 'sw-swap');
        raf = requestAnimationFrame(frame);
      };

      async function stop(ms) {
        state = 'done';
        cancelAnimationFrame(raf);
        const r = result(ms, target);
        const wasBlind = blind;
        press();
        ctx.progress(1);
        // The button is spent: take away its role so a fast second tap, or
        // the test bot, cannot reach for it while the result shows.
        go.removeAttribute('data-role');
        go.classList.add('is-done');
        go.disabled = true;
        root.classList.remove('running');
        root.classList.add('stopped');

        // Hand and pie spring to the stop; a hand that was already there gets a
        // little jolt instead, like a real stopwatch catching.
        hand.classList.add('settle');
        pie.classList.add('settle');
        draw(ms);
        blind = false;
        root.classList.remove('blind');
        if (wasBlind) {
          const from = shownCs;
          const t1 = performance.now();
          const roll = () => {
            if (!ctx.alive()) return;
            const k = Math.min(1, (performance.now() - t1) / 650);
            showDigits(Math.round(from + (r.cs - from) * easeOut(k)));
            if (k < 1) requestAnimationFrame(roll);
          };
          requestAnimationFrame(roll);
        } else {
          showDigits(r.cs);
          replay(hand.firstElementChild, 'jolt');
        }

        // Under the readout the badge lands where the button was, so it waits
        // for the button to clear first.
        const beside = getComputedStyle(info).getPropertyValue('--beside').trim() === '1';
        await wait(wasBlind ? 520 : beside ? 120 : 260);
        if (!ctx.alive()) return finish(0);
        off.innerHTML = `${r.mistakes === 0 ? `<span class="sw-off-icon">${icons.check}</span>` : ''}<span>${r.offText}</span>`;
        // Where the badge sits beside the readout, the readout first slides
        // over to make room (a transform, so no layout work), and the badge
        // pops into its final spot so the sparkles land on it.
        if (beside) {
          info.style.setProperty('--shift', `${(off.offsetWidth + 10) / 2}px`);
          info.classList.add('shift');
          await wait(260);
          if (!ctx.alive()) return finish(0);
        }
        const mood = ['good', 'near', 'far'][r.mistakes];
        off.classList.add('show', mood);
        root.classList.add(mood);
        if (r.mistakes === 0) {
          fx.good(off);
          replay(face, 'happy');
        } else if (r.mistakes === 1) {
          fx.select(6);
        } else {
          fx.bad();
        }
        await wait(PAUSE);
        finish(r.mistakes);
      }

      // Pointerdown so the press lands under the finger with no click delay.
      go.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tap();
      });
      // Keyboards and switch control send a click with no pointer behind it.
      go.addEventListener('click', (e) => e.detail === 0 && tap());
      function tap() {
        if (!ctx.alive()) return finish(0);
        if (state === 'ready') start();
        // A shaky double tap should not start and stop in one go.
        else if (state === 'run' && performance.now() - t0 > 300) stop(Math.min(limit, performance.now() - t0));
      }
    });
  },
};
