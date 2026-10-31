// English and Japanese. Every line is kept to a few words: the picture and the
// animation should explain the game, the text only confirms it.

import { settings, save } from './store.js';

const STR = {
  en: {
    today: 'Play',
    todaySub: '5 games, mixed',
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    home: 'Home',
    again: 'Again',
    sound: 'Sound',
    buzz: 'Buzz',
    bigText: 'Big text',
    lang: '日本語',
    great: ['', 'Nice try!', 'Well done!', 'Excellent!'],
    levelUp: 'Level up!',
    easier: 'A bit easier next time',
    secs: (s) => `${s} sec`,
    mins: (m, s) => `${m} min ${s} sec`,
    watch: 'Watch',
    yourTurn: 'Your turn',
    which: 'Which one?',
    stars: (n) => `${n} of 3 stars`,
    level: (n) => `Level ${n}`,
    played: 'Played today',
    g: {
      order: ['Count Up', 'Tap 1, 2, 3…'],
      sum: ['Add Up', (n) => `Two that make ${n}`],
      odd: ['Odd One', 'Find the different one'],
      lights: ['Lights', 'Repeat the lights'],
      pairs: ['Pairs', 'Find the pairs'],
      flash: ['Flash', 'Remember the number'],
      heavy: ['Heaviest', 'Which is heaviest?'],
      blocks: ['Blocks', 'How many blocks?'],
      coins: ['Coins', 'How much money?'],
      copy: ['Copy', 'Make it the same'],
    },
  },
  ja: {
    today: 'あそぶ',
    todaySub: '5つのゲーム',
    morning: 'おはようございます',
    afternoon: 'こんにちは',
    evening: 'こんばんは',
    home: 'ホーム',
    again: 'もう一度',
    sound: '音',
    buzz: '振動',
    bigText: '文字拡大',
    lang: 'English',
    great: ['', 'がんばりました', 'よくできました', 'すばらしい！'],
    levelUp: 'レベルアップ！',
    easier: '次は少しやさしく',
    secs: (s) => `${s}秒`,
    mins: (m, s) => `${m}分${s}秒`,
    watch: '見て',
    yourTurn: 'どうぞ',
    which: 'どれでしたか？',
    stars: (n) => `星 ${n} つ`,
    level: (n) => `レベル ${n}`,
    played: '今日あそびました',
    g: {
      order: ['じゅんばん', '小さい順にタッチ'],
      sum: ['たし算', (n) => `たして ${n} になる2つ`],
      odd: ['なかまはずれ', 'ちがうのはどれ？'],
      lights: ['ひかり', '光った順にタッチ'],
      pairs: ['ペア', '同じ絵を2枚'],
      flash: ['フラッシュ', '数字をおぼえて'],
      heavy: ['おもさ', 'いちばん重いのは？'],
      blocks: ['つみき', 'つみきは何個？'],
      coins: ['おかね', 'ぜんぶでいくら？'],
      copy: ['まねっこ', '同じ形にしよう'],
    },
  },
};

export function lang() {
  if (settings.lang) return settings.lang;
  return (navigator.language || 'en').startsWith('ja') ? 'ja' : 'en';
}

export function setLang(l) {
  settings.lang = l;
  save();
  document.documentElement.lang = l === 'ja' ? 'ja' : 'en-CA';
}

export function t(key, ...args) {
  const v = STR[lang()][key];
  return typeof v === 'function' ? v(...args) : v;
}

export function gameName(id) {
  return STR[lang()].g[id][0];
}

export function gameHow(id, ...args) {
  const v = STR[lang()].g[id][1];
  return typeof v === 'function' ? v(...args) : v;
}

export const locale = () => (lang() === 'ja' ? 'ja-JP' : 'en-CA');
