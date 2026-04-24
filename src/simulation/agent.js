import {
  AGENT_RADIUS,
  MAX_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { randomColor, randomInRange } from '../utils/helpers';

export const createAgent = ({ id, name, x, y, rng = Math.random }) => ({
  id,
  name,
  color: randomColor(rng),
  x,
  y,
  velocity: {
    x: randomInRange(-MAX_SPEED, MAX_SPEED, rng),
    y: randomInRange(-MAX_SPEED, MAX_SPEED, rng),
  },
  energy: randomInRange(55, 100, rng),
  mood: randomInRange(-0.2, 0.5, rng),
  aggression: randomInRange(0, 1, rng),
  sociability: randomInRange(0, 1, rng),
  curiosity: randomInRange(0, 1, rng),
  relationships: {},
  behavior: 'wander',
  behaviorTimer: randomInRange(2, 5, rng),
  behaviorCommitment: randomInRange(0.7, 2.2, rng),
  interactionCooldown: randomInRange(0.1, 1.4, rng),
  socialMomentum: 0,
  recentMoodDelta: 0,
  lastInteractionAt: 0,
});

export const keepInBounds = (agent) => {
  if (agent.x < AGENT_RADIUS) {
    agent.x = AGENT_RADIUS;
    agent.velocity.x *= -0.7;
  } else if (agent.x > WORLD_WIDTH - AGENT_RADIUS) {
    agent.x = WORLD_WIDTH - AGENT_RADIUS;
    agent.velocity.x *= -0.7;
  }

  if (agent.y < AGENT_RADIUS) {
    agent.y = AGENT_RADIUS;
    agent.velocity.y *= -0.7;
  } else if (agent.y > WORLD_HEIGHT - AGENT_RADIUS) {
    agent.y = WORLD_HEIGHT - AGENT_RADIUS;
    agent.velocity.y *= -0.7;
  }
};
