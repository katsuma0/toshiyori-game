import { el, sample, shuffle, wait, replay } from '../util.js';
import { t } from '../i18n.js';

// Classic matching pairs with real 3D card flips. Some misses are part of the
// game, so only misses beyond one per pair count against the stars.
const PICS = ['🍎', '🌻', '🐟', '🎈', '🍰', '🐱', '🚲', '🌙', '🍇', '🐢', '☂️', '🎵', '🍋', '🐞', '🏠', '⛵'];
const LEVELS = [null, [6, 3], [8, 4], [12, 4], [12, 4], [16, 4]];

export default {
  id: 'pairs',
  cat: 'memory',
  color: '#E64980',
  rounds: 1,

  round(ctx) {
    const [n, cols] = LEVELS[ctx.level];
    // Level 4 and up use look-alike pictures, so you have to remember the spot.
    const pics = ctx.level >= 4 ? sample(['🍎', '🍅', '🍒', '🍓', '🌻', '🌼', '🌷', '🌹'], n / 2) : sample(PICS, n / 2);
    const deck = shuffle([...pics, ...pics]);
    const grid = el('div', 'grid cards-grid');
    grid.style.setProperty('--cols', cols);
    grid.style.aspectRatio = `${cols * 0.8} / ${Math.ceil(n / cols)}`;
    let open = [];
    let found = 0;
    let misses = 0;

    return new Promise((resolve) => {
      const cards = deck.map((p, i) => {
        const c = el('button', 'flip-card', `<span class="face back"></span><span class="face front"><span class="emoji">${p}</span></span>`);
        c.type = 'button';
        c.dataset.value = p;
        c.style.setProperty('--i', i);
        // Face down, VoiceOver must hear "Card", not the picture underneath.
        const front = c.querySelector('.front');
        const hide = (down) => {
          front.setAttribute('aria-hidden', String(down));
          if (down) c.setAttribute('aria-label', t('card'));
          else c.removeAttribute('aria-label');
        };
        hide(true);
        new MutationObserver(() => hide(!c.classList.contains('up'))).observe(c, { attributes: true, attributeFilter: ['class'] });
        c.addEventListener('pointerdown', async (e) => {
          e.preventDefault();
          if (c.classList.contains('up') || open.length === 2) return;
          c.classList.add('up');
          ctx.fx.flip();
          open.push(c);
          if (open.length < 2) return;
          const [a, b] = open;
          if (a.dataset.value === b.dataset.value) {
            await wait(300);
            a.classList.add('matched');
            b.classList.add('matched');
            ctx.fx.good(b);
            found++;
            ctx.progress(found / (n / 2));
            open = [];
            if (found === n / 2) {
              await wait(600);
              resolve({ mistakes: Math.max(0, misses - n / 2) });
            }
          } else {
            misses++;
            await wait(900);
            ctx.fx.flip();
            replay(a, 'wobble');
            replay(b, 'wobble');
            a.classList.remove('up');
            b.classList.remove('up');
            open = [];
          }
        });
        grid.append(c);
        return c;
      });
      ctx.stage.append(grid);
      ctx.setHint(null);
      void cards;
    });
  },
};
