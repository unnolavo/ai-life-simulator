const NAMES = [
  'Nova', 'Ash', 'Milo', 'Zara', 'Luna', 'Kai', 'Iris', 'Jett', 'Sage', 'Orion',
  'Vera', 'Ezra', 'Nia', 'Rowan', 'Skye', 'Atlas', 'Ember', 'Rhea', 'Dax', 'Lyra'
]

const EVENT_TEMPLATES = {
  warm: ['{a} greeted {b} warmly', '{a} shared a laugh with {b}', '{a} praised {b}'],
  neutral: ['{a} nodded at {b}', '{a} crossed paths with {b}', '{a} briefly chatted with {b}'],
  tense: ['{a} argued with {b}', '{a} insulted {b}', '{a} avoided {b}']
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function randFloat(min, max) {
  return Math.random() * (max - min) + min
}

export function randInt(min, max) {
  return Math.floor(randFloat(min, max + 1))
}

export function choice(items) {
  return items[Math.floor(Math.random() * items.length)]
}

export function generateName(used = new Set()) {
  const available = NAMES.filter((name) => !used.has(name))
  if (available.length > 0) return choice(available)
  return `${choice(NAMES)}-${randInt(10, 999)}`
}

export function hslColorFromSeed(seed) {
  const hue = (seed * 57) % 360
  return `hsl(${hue}, 80%, 65%)`
}

export function distanceSq(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export function formatMood(mood) {
  if (mood > 0.35) return 'Positive'
  if (mood < -0.35) return 'Irritable'
  return 'Neutral'
}

export function generateEventNarration(eventData) {
  const category = eventData.delta > 6 ? 'warm' : eventData.delta < -6 ? 'tense' : 'neutral'
  const template = choice(EVENT_TEMPLATES[category])
  return template.replace('{a}', eventData.actorName).replace('{b}', eventData.targetName)
}
