// Inline SVG icons, drawn thick so they read at arm's length. Everything uses
// currentColor so a badge can be a pastel tile with a deep-coloured picture.

const svg = (body, vb = '0 0 48 48') =>
  `<svg viewBox="${vb}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const fill = (body) => `<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor">${body}</svg>`;
const num = (x, y, s, size = 15) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="ui-rounded, system-ui, sans-serif" font-weight="900" font-size="${size}" fill="currentColor">${s}</text>`;

export const icons = {
  home: svg('<path d="M7 22 24 8l17 14"/><path d="M12 19v20h24V19"/><path d="M20 39V28h8v11"/>'),
  replay: svg('<path d="M10 24a14 14 0 1 0 4.1-9.9"/><path d="M9 6v9h9"/>'),
  soundOn: svg('<path d="M8 19h7l10-8v26l-10-8H8z" fill="currentColor"/><path d="M32 17a9 9 0 0 1 0 14"/><path d="M37 12a16 16 0 0 1 0 24"/>'),
  vibrate: svg('<rect x="15" y="7" width="18" height="34" rx="4"/><path d="M8 17v14M41 17v14M3 21v6M45 21v6"/>'),
  text: svg('<path d="M6 38 15 12l9 26M9 29h12"/><path d="M28 38l6-17 6 17M30 32h8"/>'),
  globe: svg('<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 6 30 0 36M24 6c-6 6-6 30 0 36"/>'),
  gear: svg('<circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/><circle cx="24" cy="24" r="13"/>'),
  close: svg('<path d="M13 13l22 22M35 13 13 35"/>'),
  check: svg('<path d="M10 25l9 9 19-20"/>'),
  eye: svg('<path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24z"/><circle cx="24" cy="24" r="6" fill="currentColor"/>'),
  hand: svg('<path d="M17 26V10a3 3 0 0 1 6 0v12"/><path d="M23 20a3 3 0 0 1 6 0v3"/><path d="M29 22a3 3 0 0 1 6 0v3"/><path d="M35 24a3 3 0 0 1 6 0v6c0 8-5 14-13 14h-2c-5 0-8-2-11-6l-6-8a3 3 0 0 1 4-4l4 4"/>'),
  star: fill('<path d="M24 4l6 13 14 1.5-10.5 9.5 3 14L24 35l-12.5 7 3-14L4 18.5 18 17z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'),
  play: fill('<path d="M15 9.5v29a2.5 2.5 0 0 0 3.8 2.1l23-14.5a2.5 2.5 0 0 0 0-4.2l-23-14.5A2.5 2.5 0 0 0 15 9.5z"/>'),
  stopSquare: fill('<rect x="12" y="12" width="24" height="24" rx="5"/>'),

  // Game badges. Each one shows what the game is about without words.
  order: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="currentColor" opacity=".22"><rect x="4" y="4" width="18" height="18" rx="6"/><rect x="26" y="4" width="18" height="18" rx="6"/><rect x="4" y="26" width="18" height="18" rx="6"/><rect x="26" y="26" width="18" height="18" rx="6"/></g>${num(13, 19, 1)}${num(35, 19, 2)}${num(13, 41, 3)}${num(35, 41, 4)}</svg>`,
  sum: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="currentColor" opacity=".22"><rect x="2" y="12" width="20" height="24" rx="6"/><rect x="26" y="12" width="20" height="24" rx="6"/></g>${num(12, 30, 3, 16)}${num(36, 30, 7, 16)}</svg>`,
  plus: svg('<path d="M24 9v30M9 24h30" stroke-width="7"/>'),
  minus: svg('<path d="M9 24h30" stroke-width="7"/>'),
  times: svg('<path d="M13 13l22 22M35 13 13 35" stroke-width="7"/>'),
  divide: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor"><rect x="8" y="21" width="32" height="6.5" rx="3.2"/><circle cx="24" cy="11" r="4.6"/><circle cx="24" cy="37.5" r="4.6"/></svg>`,
  coins: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="28" r="13" fill="currentColor" opacity=".35"/><circle cx="30" cy="20" r="14" fill="currentColor"/><circle cx="30" cy="20" r="8.5" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/></svg>`,
  odd: fill('<rect x="5" y="5" width="15" height="15" rx="4" opacity=".35"/><rect x="28" y="5" width="15" height="15" rx="4" opacity=".35"/><rect x="5" y="28" width="15" height="15" rx="4" opacity=".35"/><circle cx="35.5" cy="35.5" r="8.5"/>'),
  copy: fill('<rect x="3" y="6" width="9" height="9" rx="2"/><rect x="13" y="16" width="9" height="9" rx="2"/><rect x="3" y="26" width="9" height="9" rx="2" opacity=".3"/><rect x="27" y="6" width="9" height="9" rx="2"/><rect x="37" y="16" width="9" height="9" rx="2"/><rect x="27" y="26" width="9" height="9" rx="2" opacity=".3"/>'),
  lights: fill('<rect x="4" y="4" width="11" height="11" rx="3" opacity=".3"/><rect x="18.5" y="4" width="11" height="11" rx="3"/><rect x="33" y="4" width="11" height="11" rx="3" opacity=".3"/><rect x="4" y="18.5" width="11" height="11" rx="3" opacity=".3"/><rect x="18.5" y="18.5" width="11" height="11" rx="3" opacity=".3"/><rect x="33" y="18.5" width="11" height="11" rx="3"/><rect x="4" y="33" width="11" height="11" rx="3"/><rect x="18.5" y="33" width="11" height="11" rx="3" opacity=".3"/><rect x="33" y="33" width="11" height="11" rx="3" opacity=".3"/>'),
  pairs: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor"><rect x="5" y="9" width="18" height="26" rx="4" opacity=".35" transform="rotate(-8 14 22)"/><rect x="25" y="13" width="18" height="26" rx="4" opacity=".35" transform="rotate(8 34 26)"/><circle cx="14" cy="22" r="4.5"/><circle cx="34" cy="26" r="4.5"/></svg>`,
  flash: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="12" width="42" height="24" rx="7" fill="currentColor" opacity=".22"/>${num(24, 30, 372, 15)}</svg>`,
  blocks: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M24 6 36 12 24 18 12 12Z" opacity=".35"/><path d="M12 12 24 18V30L12 24Z" opacity=".65"/><path d="M36 12 24 18V30L36 24Z"/><path d="M12 24 24 30 12 36 0 30Z" opacity=".35"/><path d="M0 30 12 36V46L0 40Z" opacity=".65"/><path d="M24 30 12 36V46L24 40Z"/><path d="M36 24 48 30 36 36 24 30Z" opacity=".35"/><path d="M24 30 36 36V46L24 40Z" opacity=".65"/><path d="M48 30 36 36V46L48 40Z"/></svg>`,
  train: svg('<rect x="11" y="7" width="26" height="26" rx="6" fill="currentColor" stroke="none" opacity=".9"/><rect x="16" y="12" width="16" height="9" rx="2" fill="#fff" stroke="none"/><path d="M15 33 10 41M33 33l5 8M9 41h30" stroke-width="3.5"/>'),
  timer: svg('<circle cx="24" cy="27" r="16"/><path d="M24 27V18M20 5h8M24 5v6M37 13l3-3"/>'),
};
