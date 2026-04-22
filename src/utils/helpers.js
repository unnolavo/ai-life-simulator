import { EVENT_TEMPLATES } from '../simulation/constants';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min, max) => Math.random() * (max - min) + min;
export const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateEventNarration = (eventData) => {
  const { actorName, targetName, sentiment } = eventData;
  const bucket = sentiment > 0.25 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';
  const template = randomChoice(EVENT_TEMPLATES[bucket]);
  return template.replace('{a}', actorName).replace('{b}', targetName);
};

export const sortRelationships = (relationships, topN = 3, descending = true) => {
  const sorted = [...relationships].sort((a, b) => (descending ? b.value - a.value : a.value - b.value));
  return sorted.slice(0, topN);
};
