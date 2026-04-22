export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 600;
export const INITIAL_AGENT_COUNT = 15;
export const AGENT_RADIUS = 10;
export const INTERACTION_RADIUS = 70;
export const MAX_EVENTS = 120;

export const SPEED_OPTIONS = [1, 2, 3];

export const AGENT_NAMES = [
  'Nova', 'Ash', 'Milo', 'Zara', 'Luna', 'Kai', 'Iris', 'Orion',
  'Sage', 'Riven', 'Skye', 'Ember', 'Atlas', 'Vera', 'Finn', 'Juno',
  'Theo', 'Nia', 'Remy', 'Lyra', 'Kian', 'Ayla', 'Dax', 'Mira'
];

export const EVENT_TEMPLATES = {
  positive: [
    '{a} greeted {b} warmly',
    '{a} shared a laugh with {b}',
    '{a} encouraged {b}'
  ],
  negative: [
    '{a} insulted {b}',
    '{a} argued with {b}',
    '{a} snubbed {b}'
  ],
  neutral: [
    '{a} nodded at {b}',
    '{a} observed {b} quietly',
    '{a} crossed paths with {b}'
  ],
  avoid: [
    '{a} avoided {b}',
    '{a} kept distance from {b}',
    '{a} turned away from {b}'
  ]
};
