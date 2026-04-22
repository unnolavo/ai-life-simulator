import { BEHAVIOR, BASE_SPEED, MAX_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from './constants'
import { clamp, hslColorFromSeed, randFloat } from '../utils/helpers'

export function createAgent(id, name) {
  const heading = randFloat(0, Math.PI * 2)
  return {
    id,
    name,
    color: hslColorFromSeed(id + 3),
    x: randFloat(WORLD_WIDTH * 0.2, WORLD_WIDTH * 0.8),
    y: randFloat(WORLD_HEIGHT * 0.2, WORLD_HEIGHT * 0.8),
    vx: Math.cos(heading) * BASE_SPEED,
    vy: Math.sin(heading) * BASE_SPEED,
    energy: randFloat(55, 100),
    mood: randFloat(-0.25, 0.4),
    aggression: randFloat(0.05, 0.95),
    sociability: randFloat(0.1, 0.95),
    curiosity: randFloat(0.1, 1),
    behavior: BEHAVIOR.WANDER,
    relationships: new Map(),
    cooldownUntil: 0,
    targetId: null,
    radius: 8
  }
}

export function applyBounds(agent) {
  const padding = 12
  if (agent.x < padding || agent.x > WORLD_WIDTH - padding) agent.vx *= -0.9
  if (agent.y < padding || agent.y > WORLD_HEIGHT - padding) agent.vy *= -0.9
  agent.x = clamp(agent.x, padding, WORLD_WIDTH - padding)
  agent.y = clamp(agent.y, padding, WORLD_HEIGHT - padding)
}

export function limitSpeed(agent) {
  const speed = Math.hypot(agent.vx, agent.vy)
  if (speed > MAX_SPEED) {
    const scale = MAX_SPEED / speed
    agent.vx *= scale
    agent.vy *= scale
  }
}
