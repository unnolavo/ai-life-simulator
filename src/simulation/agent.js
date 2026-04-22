import {
  AGENT_RADIUS,
  MAX_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { randomColor, randomInRange } from '../utils/helpers';

export const createAgent = ({ id, name, x, y }) => ({
  id,
  name,
  color: randomColor(),
  x,
  y,
  velocity: {
    x: randomInRange(-MAX_SPEED, MAX_SPEED),
    y: randomInRange(-MAX_SPEED, MAX_SPEED),
  },
  energy: randomInRange(55, 100),
  mood: randomInRange(-0.2, 0.5),
  aggression: randomInRange(0, 1),
  sociability: randomInRange(0, 1),
  curiosity: randomInRange(0, 1),
  relationships: {},
  behavior: 'wander',
  behaviorTimer: randomInRange(2, 5),
  interactionCooldown: randomInRange(0.1, 1.4),
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
