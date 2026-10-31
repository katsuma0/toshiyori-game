// Everything lives in localStorage on the phone. No accounts, no network, so the
// App Store privacy label can honestly say "Data Not Collected".

const KEY = 'brain-garden-v2';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const data = Object.assign(
  { levels: {}, best: {}, played: {}, seen: {}, streak: {} },
  load(),
);
// Older saves may lack newer keys; fill them so nothing reads undefined.
data.settings = Object.assign({ sound: true, haptics: true, bigText: false }, data.settings);
for (const k of ['levels', 'best', 'played', 'seen', 'streak']) data[k] = data[k] || {};

export const settings = data.settings;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private mode or full storage. The game still works, it just forgets.
  }
}

export const today = () => new Date().toLocaleDateString('en-CA');

export function levelOf(id) {
  return data.levels[id] || 1;
}

export function record(id, stars) {
  const before = levelOf(id);
  let after = before;
  if (stars === 3) after = Math.min(5, before + 1);
  else if (stars === 1) after = Math.max(1, before - 1);
  data.levels[id] = after;
  data.best[id] = Math.max(data.best[id] || 0, stars);
  data.played[id] = today();
  save();
  return { before, after };
}

export function markPlayed(id) {
  data.played[id] = today();
  save();
}

export function playedToday(id) {
  return data.played[id] === today();
}

// Seen means the player has met this game at least once, alone or in Play,
// so the quicker first-time hint stops.
export function markSeen(id) {
  data.seen[id] = 1;
  save();
}

export function hasSeen(id) {
  return !!data.seen[id] || !!data.played[id];
}

// Play gives each game one round, too little to judge on its own. Three
// clean rounds in a row move that game up; two rough ones move it down.
export function recordMixRound(id, mistakes) {
  let s = data.streak[id] || 0;
  let lv = levelOf(id);
  if (mistakes === 0) s = Math.max(0, s) + 1;
  else if (mistakes >= 3) s = Math.min(0, s) - 1;
  if (s >= 3) { lv = Math.min(5, lv + 1); s = 0; }
  if (s <= -2) { lv = Math.max(1, lv - 1); s = 0; }
  data.levels[id] = lv;
  data.streak[id] = s;
  save();
}
