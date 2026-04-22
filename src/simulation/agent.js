import {
  AGENT_RADIUS,
  AVOIDANCE_RADIUS,
  ENERGY_DRAIN_RATE,
  ENERGY_RECOVERY_RATE,
  INTERACTION_COOLDOWN,
  MAX_FORCE,
  MAX_SPEED,
  REST_THRESHOLD,
} from './constants';
import { clamp, rand } from '../utils/helpers';

const randomVelocity = () => {
  const angle = rand(0, Math.PI * 2);
  const speed = rand(18, MAX_SPEED);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
};

export class Agent {
  constructor({ id, name, color, x, y, allAgentIds }) {
    const { vx, vy } = randomVelocity();
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.energy = rand(45, 100);
    this.mood = rand(-0.15, 0.4);
    this.aggression = rand(0, 1);
    this.sociability = rand(0, 1);
    this.curiosity = rand(0, 1);
    this.relationships = new Map();
    allAgentIds.forEach((agentId) => {
      if (agentId !== id) this.relationships.set(agentId, rand(-20, 20));
    });

    this.state = 'wander';
    this.wanderAngle = rand(0, Math.PI * 2);
    this.lastInteractionAt = -100;
  }

  canInteract(now) {
    return now - this.lastInteractionAt >= INTERACTION_COOLDOWN;
  }

  setInteraction(now) {
    this.lastInteractionAt = now;
  }

  updateState(nearestEnemyDist, nearbyFriendDist) {
    if (this.energy < REST_THRESHOLD) {
      this.state = 'rest';
      return;
    }

    if (nearestEnemyDist < 130) {
      this.state = 'avoid';
      return;
    }

    const sociabilityImpulse = this.sociability * 0.7 + this.curiosity * 0.3 + this.mood * 0.2;
    if (nearbyFriendDist < 170 && sociabilityImpulse > 0.35) {
      this.state = 'seek';
      return;
    }

    this.state = 'wander';
  }

  applySteering(forceX, forceY, delta) {
    this.vx += clamp(forceX, -MAX_FORCE, MAX_FORCE) * delta;
    this.vy += clamp(forceY, -MAX_FORCE, MAX_FORCE) * delta;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }
  }

  wander(delta) {
    this.wanderAngle += rand(-1.3, 1.3) * delta;
    this.applySteering(Math.cos(this.wanderAngle) * 18, Math.sin(this.wanderAngle) * 18, delta);
  }

  avoid(agent, delta) {
    const dx = this.x - agent.x;
    const dy = this.y - agent.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.applySteering((dx / dist) * 52, (dy / dist) * 52, delta);
  }

  seek(agent, delta) {
    const dx = agent.x - this.x;
    const dy = agent.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.applySteering((dx / dist) * 38, (dy / dist) * 38, delta);
  }

  separateFrom(nearbyAgents, delta) {
    let forceX = 0;
    let forceY = 0;
    nearbyAgents.forEach((other) => {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < AVOIDANCE_RADIUS) {
        const strength = (AVOIDANCE_RADIUS - dist) / AVOIDANCE_RADIUS;
        forceX += (dx / dist) * strength * 80;
        forceY += (dy / dist) * strength * 80;
      }
    });
    this.applySteering(forceX, forceY, delta);
  }

  updateEnergy(delta) {
    if (this.state === 'rest') {
      this.energy = clamp(this.energy + ENERGY_RECOVERY_RATE * delta, 0, 100);
      this.mood = clamp(this.mood + 0.06 * delta, -1, 1);
      this.vx *= 0.93;
      this.vy *= 0.93;
      return;
    }
    this.energy = clamp(this.energy - ENERGY_DRAIN_RATE * delta, 0, 100);
  }

  integrate(delta, bounds) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;

    if (this.x < AGENT_RADIUS || this.x > bounds.width - AGENT_RADIUS) {
      this.vx *= -1;
      this.x = clamp(this.x, AGENT_RADIUS, bounds.width - AGENT_RADIUS);
    }

    if (this.y < AGENT_RADIUS || this.y > bounds.height - AGENT_RADIUS) {
      this.vy *= -1;
      this.y = clamp(this.y, AGENT_RADIUS, bounds.height - AGENT_RADIUS);
    }
  }
}
