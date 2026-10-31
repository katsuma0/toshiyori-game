// Sound and touch feedback. Every sound is synthesized so the app ships no audio
// files, and every note sits between about 160 and 1050 Hz because high pitches
// are the first thing age-related hearing loss takes away.

import { settings } from './store.js';
import { burst } from './particles.js';

let ctx = null;
let master = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    // Gentle compression keeps chords from clipping on small phone speakers.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
  }
  // iOS leaves the context 'interrupted' after a phone call or alarm, not just
  // 'suspended', so any state but running gets a nudge on the next sound.
  if (ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {});
  return ctx;
}

// iOS keeps audio locked until the first touch, so wake it on the first one.
export function unlockAudio() {
  const a = audio();
  if (!a) return;
  const b = a.createBuffer(1, 1, 22050);
  const s = a.createBufferSource();
  s.buffer = b;
  s.connect(master);
  s.start(0);
}

// A soft marimba: a sine fundamental plus a quiet, fast decaying fourth harmonic
// gives the wooden "tok" without any harshness.
function note(freq, { at = 0, dur = 0.5, vol = 0.22, type = 'sine', bright = 0.35 } = {}) {
  if (!settings.sound) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01 + at;

  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);

  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.05);

  if (bright > 0) {
    const g2 = a.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(vol * bright, t + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.12, dur));
    g2.connect(master);
    const o2 = a.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(freq * 4, t);
    o2.connect(g2);
    o2.start(t);
    o2.stop(t + 0.2);
  }
}

const C4 = 261.63;
const PENTA = [0, 2, 4, 7, 9];
// Major pentatonic never sounds wrong in any order, which matters when the
// player taps tiles at their own pace.
function penta(i) {
  const oct = Math.floor(i / 5);
  return C4 * Math.pow(2, (oct * 12 + PENTA[((i % 5) + 5) % 5]) / 12);
}

// Haptics: Capacitor's native Haptics plugin on iPhone, the Vibration API on
// Android browsers, silence everywhere else.
const cap = window.Capacitor;
const H = cap?.isNativePlatform?.()
  ? cap.Plugins?.Haptics ?? cap.registerPlugin?.('Haptics')
  : null;

function vib(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function impact(style, fallback) {
  if (!settings.haptics) return;
  if (H) H.impact({ style }).catch(() => {});
  else vib(fallback);
}

function notify(type, fallback) {
  if (!settings.haptics) return;
  if (H) H.notification({ type }).catch(() => {});
  else vib(fallback);
}

export const fx = {
  // Button presses in menus.
  press() {
    impact('LIGHT', 8);
    note(penta(7), { dur: 0.18, vol: 0.12 });
  },
  // A light tap on a tile that is not right or wrong yet.
  select(i = 4) {
    // Copy can ask for a high step at level 5; cap it at the top of the range.
    i = Math.min(i, 10);
    impact('LIGHT', 10);
    note(penta(i), { dur: 0.3, vol: 0.18 });
  },
  // Correct step inside a sequence. step 0..n-1 climbs two octaves.
  step(i, n, at) {
    impact('MEDIUM', 15);
    burst(at, '#2E9E5B', 8);
    const idx = n > 1 ? Math.round((i * 10) / (n - 1)) : 5;
    note(penta(idx), { dur: 0.6, vol: 0.24 });
  },
  // Plays a specific light during the memory game.
  light(i) {
    impact('LIGHT', 12);
    note(penta(i + 3), { dur: 0.7, vol: 0.24 });
  },
  good(at) {
    impact('MEDIUM', 20);
    burst(at);
    note(penta(7), { dur: 0.5, vol: 0.2 });
    note(penta(9), { at: 0.09, dur: 0.7, vol: 0.2 });
  },
  // Wrong answers get a low, soft "bonk" and a double tick. Never a buzzer.
  bad() {
    notify('WARNING', [30, 60, 30]);
    note(196, { dur: 0.25, vol: 0.2, type: 'triangle', bright: 0 });
    note(165, { at: 0.12, dur: 0.35, vol: 0.2, type: 'triangle', bright: 0 });
  },
  round() {
    impact('HEAVY', 30);
    [5, 7, 9].forEach((s, k) => note(penta(s), { at: k * 0.08, dur: 0.6, vol: 0.18 }));
  },
  // Card flip: a quick soft paper "fwip".
  flip() {
    impact('LIGHT', 8);
    note(penta(3), { dur: 0.12, vol: 0.1, type: 'triangle', bright: 0 });
  },
  // Coins and blocks landing.
  clink(i = 0) {
    note(penta(8 + (i % 3)), { dur: 0.25, vol: 0.08, bright: 0.6 });
  },
  star(k) {
    impact(k === 2 ? 'HEAVY' : 'MEDIUM', 25);
    note(penta(5 + k * 2), { dur: 0.8, vol: 0.22 });
  },
  win() {
    notify('SUCCESS', [30, 50, 30, 50, 80]);
    [5, 7, 9, 10].forEach((s, k) => note(penta(s), { at: k * 0.11, dur: 0.9, vol: 0.18 }));
  },
};
