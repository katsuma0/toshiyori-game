// Mame, a small bean sprout who lives in the garden. Original character: a
// round green bean, two leaves, dot eyes, pink cheeks. Moods are just classes,
// the motion lives in CSS.

export function mascot(mood = 'idle', size = 96) {
  const wrap = document.createElement('div');
  wrap.className = `mame ${mood}`;
  wrap.style.setProperty('--size', `${size}px`);
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
  <svg viewBox="0 0 120 120">
    <ellipse class="mame-shadow" cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".12"/>
    <g class="mame-body">
      <g class="mame-sprout">
        <path d="M60 34 C60 26 60 20 60 14" stroke="#3E8E41" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path class="leaf-l" d="M60 18 C48 6 32 10 30 20 C42 26 54 24 60 18Z" fill="#6CC070"/>
        <path class="leaf-r" d="M60 16 C70 2 88 4 92 14 C80 22 66 22 60 16Z" fill="#83D187"/>
      </g>
      <path d="M60 30 C88 30 100 52 100 74 C100 96 82 108 60 108 C38 108 20 96 20 74 C20 52 32 30 60 30Z" fill="#9AD27A"/>
      <path d="M60 30 C88 30 100 52 100 74 C100 96 82 108 60 108" fill="none" stroke="#7DBB5E" stroke-width="5" opacity=".7"/>
      <ellipse cx="44" cy="48" rx="10" ry="6" fill="#fff" opacity=".45" transform="rotate(-25 44 48)"/>
      <ellipse cx="38" cy="80" rx="8" ry="5" fill="#F49AA9" opacity=".8"/>
      <ellipse cx="82" cy="80" rx="8" ry="5" fill="#F49AA9" opacity=".8"/>
      <g class="mame-eyes" fill="#2B2D2F">
        <ellipse cx="47" cy="70" rx="5" ry="6.5"/>
        <ellipse cx="73" cy="70" rx="5" ry="6.5"/>
        <circle cx="48.5" cy="67.5" r="1.8" fill="#fff"/>
        <circle cx="74.5" cy="67.5" r="1.8" fill="#fff"/>
      </g>
      <path class="mame-mouth" d="M53 83 Q60 90 67 83" stroke="#2B2D2F" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    </g>
  </svg>`;
  return wrap;
}
