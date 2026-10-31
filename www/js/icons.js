// Inline SVG icons, drawn thick so they read at arm's length.

const svg = (body, vb = '0 0 48 48') =>
  `<svg viewBox="${vb}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  home: svg('<path d="M7 22 24 8l17 14"/><path d="M12 19v20h24V19"/><path d="M20 39V28h8v11"/>'),
  replay: svg('<path d="M10 24a14 14 0 1 0 4.1-9.9"/><path d="M9 6v9h9"/>'),
  soundOn: svg('<path d="M8 19h7l10-8v26l-10-8H8z" fill="currentColor"/><path d="M32 17a9 9 0 0 1 0 14"/><path d="M37 12a16 16 0 0 1 0 24"/>'),
  soundOff: svg('<path d="M8 19h7l10-8v26l-10-8H8z" fill="currentColor"/><path d="m33 19 10 10M43 19 33 29"/>'),
  vibrate: svg('<rect x="15" y="7" width="18" height="34" rx="4"/><path d="M8 17v14M41 17v14M3 21v6M45 21v6"/>'),
  vibrateOff: svg('<rect x="15" y="7" width="18" height="34" rx="4"/><path d="M6 6l36 36"/>'),
  text: svg('<path d="M6 38 15 12l9 26M9 29h12"/><path d="M28 38l6-17 6 17M30 32h8"/>'),
  check: svg('<path d="M10 25l9 9 19-20"/>'),
  eye: svg('<path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24z"/><circle cx="24" cy="24" r="6" fill="currentColor"/>'),
  hand: svg('<path d="M17 26V10a3 3 0 0 1 6 0v12"/><path d="M23 20a3 3 0 0 1 6 0v3"/><path d="M29 22a3 3 0 0 1 6 0v3"/><path d="M35 24a3 3 0 0 1 6 0v6c0 8-5 14-13 14h-2c-5 0-8-2-11-6l-6-8a3 3 0 0 1 4-4l4 4"/>'),
  star: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4l6 13 14 1.5-10.5 9.5 3 14L24 35l-12.5 7 3-14L4 18.5 18 17z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  arrow: svg('<path d="M10 24h28M28 14l10 10-10 10"/>'),

  globe: svg('<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 6 30 0 36M24 6c-6 6-6 30 0 36"/>'),
  play: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 9.5v29a2.5 2.5 0 0 0 3.8 2.1l23-14.5a2.5 2.5 0 0 0 0-4.2l-23-14.5A2.5 2.5 0 0 0 15 9.5z" fill="currentColor"/></svg>',

  // Game badges. Each one shows what the game is about without words.
  order: `<svg viewBox="0 0 48 48" aria-hidden="true"><g font-family="ui-rounded, system-ui, sans-serif" font-weight="900" font-size="15" fill="#fff" text-anchor="middle"><rect x="4" y="4" width="18" height="18" rx="6" fill="#ffffff40"/><text x="13" y="19">1</text><rect x="26" y="4" width="18" height="18" rx="6" fill="#ffffff40"/><text x="35" y="19">2</text><rect x="4" y="26" width="18" height="18" rx="6" fill="#ffffff40"/><text x="13" y="41">3</text><rect x="26" y="26" width="18" height="18" rx="6" fill="#ffffff40"/><text x="35" y="41">4</text></g></svg>`,
  sum: svg('<path d="M24 9v30M9 24h30" stroke="#fff" stroke-width="7"/>'),
  odd: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="#fff"><rect x="5" y="5" width="15" height="15" rx="4" opacity=".55"/><rect x="28" y="5" width="15" height="15" rx="4" opacity=".55"/><rect x="5" y="28" width="15" height="15" rx="4" opacity=".55"/><circle cx="35.5" cy="35.5" r="8.5"/></svg>`,
  lights: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="#fff"><rect x="4" y="4" width="11" height="11" rx="3" opacity=".45"/><rect x="18.5" y="4" width="11" height="11" rx="3"/><rect x="33" y="4" width="11" height="11" rx="3" opacity=".45"/><rect x="4" y="18.5" width="11" height="11" rx="3" opacity=".45"/><rect x="18.5" y="18.5" width="11" height="11" rx="3" opacity=".45"/><rect x="33" y="18.5" width="11" height="11" rx="3"/><rect x="4" y="33" width="11" height="11" rx="3"/><rect x="18.5" y="33" width="11" height="11" rx="3" opacity=".45"/><rect x="33" y="33" width="11" height="11" rx="3" opacity=".45"/></svg>`,
  pairs: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="9" width="18" height="26" rx="4" fill="#fff" transform="rotate(-8 14 22)"/><rect x="25" y="13" width="18" height="26" rx="4" fill="#fff" transform="rotate(8 34 26)"/><circle cx="14" cy="22" r="4.5" fill="#E64980" /><circle cx="34" cy="26" r="4.5" fill="#E64980"/></svg>`,
  flash: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="12" width="40" height="24" rx="7" fill="#fff"/><text x="24" y="30" text-anchor="middle" font-family="ui-rounded, system-ui, sans-serif" font-weight="900" font-size="15" fill="#C2255C">372</text></svg>`,
  heavy: svg('<path d="M24 8v32M14 40h20M8 16h32"/><path d="M8 16 3 28h10zM40 16l-5 12h10z" fill="#fff" stroke-width="3"/>'),
  blocks: `<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="#3B6FE0" stroke-width="1.5" stroke-linejoin="round"><path d="M24 6 36 12 24 18 12 12Z" fill="#fff"/><path d="M12 12 24 18V30L12 24Z" fill="#ffffffcc"/><path d="M36 12 24 18V30L36 24Z" fill="#ffffff99"/><path d="M12 24 24 30 12 36 0 30Z" fill="#fff"/><path d="M0 30 12 36V46L0 40Z" fill="#ffffffcc"/><path d="M24 30 12 36V46L24 40Z" fill="#ffffff99"/><path d="M36 24 48 30 36 36 24 30Z" fill="#fff"/><path d="M24 30 36 36V46L24 40Z" fill="#ffffffcc"/><path d="M48 30 36 36V46L48 40Z" fill="#ffffff99"/></g></svg>`,
  coins: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="28" r="13" fill="#ffffffaa"/><circle cx="30" cy="20" r="14" fill="#fff"/><circle cx="30" cy="20" r="9" fill="none" stroke="#C08A12" stroke-width="2.5"/></svg>`,
  copy: `<svg viewBox="0 0 48 48" aria-hidden="true" fill="#fff"><rect x="3" y="6" width="9" height="9" rx="2"/><rect x="13" y="16" width="9" height="9" rx="2"/><rect x="3" y="26" width="9" height="9" rx="2" opacity=".4"/><path d="M24 22h6" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="27" y="6" width="9" height="9" rx="2"/><rect x="37" y="16" width="9" height="9" rx="2"/><rect x="27" y="26" width="9" height="9" rx="2" opacity=".4"/></svg>`,
};
