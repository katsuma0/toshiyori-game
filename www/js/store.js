// Everything lives in localStorage on the phone. No accounts, no network, so the
// App Store privacy label can honestly say "Data Not Collected".

const KEY = 'brain-garden-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const data = Object.assign(
  { settings: { sound: true, haptics: true, bigText: false }, levels: {}, best: {}, played: {} },
  load(),
);

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

export function playedToday(id) {
  return data.played[id] === today();
}

export function hasPlayed(id) {
  return !!data.played[id];
}
