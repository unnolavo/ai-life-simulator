export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 620;
export const INITIAL_AGENT_COUNT = 15;
export const MAX_AGENTS = 40;
export const AGENT_RADIUS = 8;
export const INTERACTION_RADIUS = 42;
export const AVOIDANCE_RADIUS = 20;
export const NEIGHBOR_RADIUS = 130;
export const MAX_SPEED = 66;
export const ENERGY_DRAIN_RATE = 2.4;
export const ENERGY_RECOVERY_RATE = 13;
export const UI_UPDATE_INTERVAL = 140;
export const EVENT_COOLDOWN = 1.8;
export const ARC_STREAK_THRESHOLD = 3;
export const MEMORY_DECAY_PER_SECOND = 0.15;

export const SCENARIOS = {
  balanced: { label: 'Balanced', hostilePairs: 1, alliedPairs: 1, moodBias: 0 },
  social: { label: 'Social', hostilePairs: 0, alliedPairs: 3, moodBias: 0.2 },
  volatile: { label: 'Volatile', hostilePairs: 4, alliedPairs: 0, moodBias: -0.2 },
};

export const NAMES = [
  'Nova', 'Ash', 'Milo', 'Zara', 'Luna', 'Kai', 'Iris', 'Orion', 'Sage', 'Remy',
  'Juno', 'Skye', 'Atlas', 'Vera', 'Nico', 'Ember', 'Rin', 'Theo', 'Lyra', 'Ezra',
  'Piper', 'Ari', 'Cleo', 'Dune', 'Echo', 'Flint', 'Gale', 'Halo', 'Indy', 'Jett',
];
