import { NAMES } from '../simulation/constants';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const randomInRange = (min, max, rng = Math.random) => min + rng() * (max - min);

export const randomItem = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

export const randomName = (usedNames, rng = Math.random) => {
  const pool = NAMES.filter((name) => !usedNames.has(name));
  return pool.length ? randomItem(pool, rng) : `${randomItem(NAMES, rng)}-${Math.floor(rng() * 999)}`;
};

export const randomColor = (rng = Math.random) => {
  const hue = Math.floor(rng() * 360);
  return `hsl(${hue} 88% 64%)`;
};

export const formatMood = (mood) => {
  if (mood > 0.45) return 'Positive';
  if (mood < -0.45) return 'Hostile';
  return 'Neutral';
};

export const topRelationships = (agent, direction = 'friend') => {
  const entries = Object.entries(agent.relationships || {});
  const sorted = entries.sort((a, b) => (direction === 'friend' ? b[1] - a[1] : a[1] - b[1]));
  return sorted.slice(0, 3);
};
