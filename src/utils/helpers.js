export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

export function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 85% 62%)`;
}
