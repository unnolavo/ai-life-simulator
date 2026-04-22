import { NAMES } from '../simulation/constants';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const randomInRange = (min, max) => min + Math.random() * (max - min);

export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const randomName = (usedNames) => {
  const pool = NAMES.filter((name) => !usedNames.has(name));
  return pool.length ? randomItem(pool) : `${randomItem(NAMES)}-${Math.floor(Math.random() * 999)}`;
};

export const randomColor = () => {
  const hue = Math.floor(Math.random() * 360);
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
