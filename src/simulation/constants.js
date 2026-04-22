export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 620;
export const INITIAL_AGENT_COUNT = 15;
export const AGENT_RADIUS = 8;
export const INTERACTION_RADIUS = 70;
export const AVOIDANCE_RADIUS = 24;
export const MAX_SPEED = 68;
export const MAX_FORCE = 40;
export const ENERGY_DRAIN_RATE = 3;
export const ENERGY_RECOVERY_RATE = 10;
export const REST_THRESHOLD = 20;
export const INTERACTION_COOLDOWN = 2.6;
export const UI_UPDATE_INTERVAL = 0.25;

export const AGENT_NAMES = [
  'Nova',
  'Ash',
  'Milo',
  'Zara',
  'Luna',
  'Kai',
  'Iris',
  'Orion',
  'Sage',
  'Niko',
  'Skye',
  'Remy',
  'Tara',
  'Juno',
  'Ezra',
  'Finn',
  'Lyra',
  'Theo',
  'Aria',
  'Rhea',
];

export const EVENT_TEMPLATES = {
  positive: [
    '{a} greeted {b} warmly',
    '{a} shared a joke with {b}',
    '{a} offered help to {b}',
  ],
  neutral: [
    '{a} nodded at {b}',
    '{a} and {b} crossed paths quietly',
    '{a} observed {b} curiously',
  ],
  negative: [
    '{a} insulted {b}',
    '{a} avoided {b}',
    '{a} challenged {b}',
  ],
};
