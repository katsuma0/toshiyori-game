// Little bursts and confetti, all on the Web Animations API so they run on the
// compositor and never stutter the game.

const layer = document.createElement('div');
layer.className = 'fx-layer';
document.body.append(layer);

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(target, colour = '#F5B301', count = 10) {
  if (reduce() || !target) return;
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    const size = 8 + Math.random() * 10;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${i % 3 ? colour : '#fff'}`;
    layer.append(p);
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const d = 50 + Math.random() * 50;
    p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0.9 },
      ],
      { duration: 550 + Math.random() * 200, easing: 'cubic-bezier(.15,.8,.3,1)' },
    ).onfinish = () => p.remove();
  }
}

export function confetti(n = 60) {
  if (reduce()) return;
  const colours = ['#F5B301', '#2E9E5B', '#E8590C', '#3B6FE0', '#D6336C', '#7C4DDB'];
  const w = window.innerWidth;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetto';
    p.style.cssText = `left:${Math.random() * w}px;background:${colours[i % colours.length]}`;
    layer.append(p);
    const drift = (Math.random() - 0.5) * 160;
    const spin = (Math.random() - 0.5) * 900;
    p.animate(
      [
        { transform: 'translate(0,-30px) rotate(0)', opacity: 1 },
        { transform: `translate(${drift}px, ${window.innerHeight + 40}px) rotate(${spin}deg)`, opacity: 1 },
      ],
      { duration: 1800 + Math.random() * 1400, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'backwards' },
    ).onfinish = () => p.remove();
  }
}

// A "+1" style word that floats up from a spot.
export function floatText(target, text, colour = '#15803D') {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const p = document.createElement('b');
  p.className = 'float-text';
  p.textContent = text;
  p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top}px;color:${colour}`;
  layer.append(p);
  p.animate(
    [
      { transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%,-30px) scale(1.1)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-50%,-70px) scale(1)', opacity: 0 },
    ],
    { duration: 900, easing: 'ease-out' },
  ).onfinish = () => p.remove();
}
