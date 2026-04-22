import { AGENT_RADIUS, WORLD_HEIGHT, WORLD_WIDTH, AGENT_NAMES } from './constants';
import { clamp, randRange, randomColor } from '../utils/helpers';

let nextId = 1;

function randomVelocity() {
  const angle = Math.random() * Math.PI * 2;
  const speed = randRange(15, 45);
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}

export function createAgent(usedNames = new Set()) {
  const available = AGENT_NAMES.filter((name) => !usedNames.has(name));
  const name = available.length ? available[Math.floor(Math.random() * available.length)] : `Agent ${nextId}`;

  const agent = {
    id: nextId++,
    name,
    color: randomColor(),
    x: randRange(AGENT_RADIUS * 2, WORLD_WIDTH - AGENT_RADIUS * 2),
    y: randRange(AGENT_RADIUS * 2, WORLD_HEIGHT - AGENT_RADIUS * 2),
    velocity: randomVelocity(),
    energy: randRange(45, 100),
    mood: randRange(-0.1, 0.6),
    aggression: randRange(0.1, 0.9),
    sociability: randRange(0.1, 0.9),
    curiosity: randRange(0.1, 0.9),
    relationships: new Map(),
    behavior: 'wander',
    behaviorTimer: randRange(0.8, 2.4),
    interactCooldown: randRange(0.4, 1.8),
    pulse: Math.random() * Math.PI * 2
  };

  return agent;
}

export function resetAgentIds() {
  nextId = 1;
}

export function updateEnergyAndMood(agent, dt) {
  const energyDrain = agent.behavior === 'rest' ? -12 : 4 + agent.sociability * 2;
  agent.energy = clamp(agent.energy - energyDrain * dt, 0, 100);

  const moodDrift = (agent.energy - 50) / 400 + (Math.random() - 0.5) * 0.02;
  agent.mood = clamp(agent.mood + moodDrift * dt * 10, -1, 1);
}
