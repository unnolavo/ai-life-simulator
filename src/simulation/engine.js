import {
  AGENT_RADIUS,
  INITIAL_AGENT_COUNT,
  INTERACTION_RADIUS,
  MAX_EVENTS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  EVENT_TEMPLATES
} from './constants';
import { createAgent, resetAgentIds, updateEnergyAndMood } from './agent';
import { clamp, distance, normalize, pickRandom, randRange } from '../utils/helpers';

export function generateEventNarration(eventData) {
  const source = EVENT_TEMPLATES[eventData.type] || EVENT_TEMPLATES.neutral;
  const template = pickRandom(source);
  return template.replace('{a}', eventData.a.name).replace('{b}', eventData.b.name);
}

export function createSimulationEngine() {
  let agents = [];
  let events = [];
  let speedMultiplier = 1;
  const subscribers = new Set();

  function buildInitialAgents(count = INITIAL_AGENT_COUNT) {
    const used = new Set();
    agents = Array.from({ length: count }, () => {
      const agent = createAgent(used);
      used.add(agent.name);
      return agent;
    });

    for (const a of agents) {
      for (const b of agents) {
        if (a.id !== b.id) a.relationships.set(b.id, randRange(-10, 15));
      }
    }

    events = [];
    emit();
  }

  function emit() {
    const payload = {
      agents,
      events,
      world: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
    };
    subscribers.forEach((cb) => cb(payload));
  }

  function setSpeed(speed) {
    speedMultiplier = speed;
  }

  function spawnAgent() {
    const used = new Set(agents.map((a) => a.name));
    const agent = createAgent(used);
    agents.forEach((other) => {
      const val = randRange(-20, 20);
      agent.relationships.set(other.id, val);
      other.relationships.set(agent.id, val * randRange(0.6, 1.2));
    });
    agents.push(agent);
    addEvent({ type: 'neutral', a: agent, b: agents[Math.floor(Math.random() * (agents.length - 1))] });
    emit();
  }

  function getAgentById(id) {
    return agents.find((a) => a.id === id) ?? null;
  }

  function subscribe(cb) {
    subscribers.add(cb);
    cb({ agents, events, world: { width: WORLD_WIDTH, height: WORLD_HEIGHT } });
    return () => subscribers.delete(cb);
  }

  function reset() {
    resetAgentIds();
    buildInitialAgents(INITIAL_AGENT_COUNT);
  }

  function addEvent(eventData) {
    const narration = generateEventNarration(eventData);
    events.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: narration,
      ts: Date.now(),
      type: eventData.type
    });
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  }

  function chooseBehavior(agent) {
    const enemiesNearby = agents.some((other) => {
      if (other.id === agent.id) return false;
      return distance(agent, other) < INTERACTION_RADIUS * 1.5 && (agent.relationships.get(other.id) ?? 0) < -50;
    });

    if (agent.energy < 20) return 'rest';
    if (enemiesNearby) return 'avoid enemy';

    const socialDrive = agent.sociability + Math.max(0, agent.mood * 0.5);
    if (socialDrive > 0.85 || Math.random() < socialDrive * 0.04) return 'seek interaction';
    return 'wander';
  }

  function steerAgent(agent, dt) {
    agent.behaviorTimer -= dt;
    agent.interactCooldown -= dt;
    if (agent.behaviorTimer <= 0) {
      agent.behavior = chooseBehavior(agent);
      agent.behaviorTimer = randRange(0.9, 2.5);
    }

    const closeAgents = agents.filter((other) => other.id !== agent.id && distance(agent, other) < INTERACTION_RADIUS * 1.6);

    let fx = (Math.random() - 0.5) * 50 * agent.curiosity;
    let fy = (Math.random() - 0.5) * 50 * agent.curiosity;

    if (agent.behavior === 'rest') {
      fx *= 0.15;
      fy *= 0.15;
      agent.energy = clamp(agent.energy + 20 * dt, 0, 100);
    }

    if (agent.behavior === 'seek interaction' && closeAgents.length) {
      const target = closeAgents.reduce((best, candidate) => {
        const rel = agent.relationships.get(candidate.id) ?? 0;
        const bestRel = agent.relationships.get(best.id) ?? -Infinity;
        return rel > bestRel ? candidate : best;
      }, closeAgents[0]);
      const dir = normalize(target.x - agent.x, target.y - agent.y);
      fx += dir.x * 90;
      fy += dir.y * 90;
    }

    if (agent.behavior === 'avoid enemy') {
      const enemy = closeAgents
        .filter((other) => (agent.relationships.get(other.id) ?? 0) < -50)
        .sort((a, b) => distance(agent, a) - distance(agent, b))[0];
      if (enemy) {
        const dir = normalize(agent.x - enemy.x, agent.y - enemy.y);
        fx += dir.x * 140;
        fy += dir.y * 140;
      }
    }

    closeAgents.forEach((other) => {
      const d = distance(agent, other);
      if (d < AGENT_RADIUS * 2.4) {
        const away = normalize(agent.x - other.x, agent.y - other.y);
        const strength = (AGENT_RADIUS * 2.4 - d) * 12;
        fx += away.x * strength;
        fy += away.y * strength;
      } else if (d < INTERACTION_RADIUS && Math.random() < 0.008) {
        const toward = normalize(other.x - agent.x, other.y - agent.y);
        fx += toward.x * 25 * agent.sociability;
        fy += toward.y * 25 * agent.sociability;
      }
    });

    agent.velocity.x = clamp(agent.velocity.x + fx * dt, -80, 80);
    agent.velocity.y = clamp(agent.velocity.y + fy * dt, -80, 80);

    agent.x += agent.velocity.x * dt;
    agent.y += agent.velocity.y * dt;

    if (agent.x < AGENT_RADIUS || agent.x > WORLD_WIDTH - AGENT_RADIUS) {
      agent.velocity.x *= -0.9;
      agent.x = clamp(agent.x, AGENT_RADIUS, WORLD_WIDTH - AGENT_RADIUS);
    }
    if (agent.y < AGENT_RADIUS || agent.y > WORLD_HEIGHT - AGENT_RADIUS) {
      agent.velocity.y *= -0.9;
      agent.y = clamp(agent.y, AGENT_RADIUS, WORLD_HEIGHT - AGENT_RADIUS);
    }

    agent.pulse += dt * (1 + agent.curiosity);
    updateEnergyAndMood(agent, dt);
  }

  function maybeInteract(agent) {
    if (agent.interactCooldown > 0) return;
    const nearby = agents.filter((other) => other.id !== agent.id && distance(agent, other) < INTERACTION_RADIUS);
    if (!nearby.length) return;

    const other = nearby[Math.floor(Math.random() * nearby.length)];
    const rel = agent.relationships.get(other.id) ?? 0;
    let type = 'neutral';
    let delta = randRange(-3, 4);

    if ((agent.relationships.get(other.id) ?? 0) < -50 && Math.random() < 0.55) {
      type = 'avoid';
      delta = randRange(-5, -1);
      agent.behavior = 'avoid enemy';
    } else if (agent.aggression > 0.65 && Math.random() < 0.45) {
      type = 'negative';
      delta = randRange(-12, -4);
    } else if (agent.sociability + agent.mood > 0.8 || rel > 30) {
      type = 'positive';
      delta = randRange(6, 14);
    }

    const nextRel = clamp(rel + delta, -100, 100);
    const reciprocal = clamp((other.relationships.get(agent.id) ?? 0) + delta * randRange(0.7, 1.05), -100, 100);

    agent.relationships.set(other.id, nextRel);
    other.relationships.set(agent.id, reciprocal);

    agent.mood = clamp(agent.mood + delta / 120, -1, 1);
    other.mood = clamp(other.mood + delta / 140, -1, 1);

    agent.interactCooldown = randRange(0.8, 2.2);

    addEvent({ type, a: agent, b: other });
  }

  function tick(deltaTime) {
    const dt = Math.min(deltaTime * speedMultiplier, 0.05);

    agents.forEach((agent) => steerAgent(agent, dt));
    agents.forEach((agent) => maybeInteract(agent));
  }

  reset();

  return {
    subscribe,
    tick,
    setSpeed,
    spawnAgent,
    getAgentById,
    reset,
    getState: () => ({ agents, events, world: { width: WORLD_WIDTH, height: WORLD_HEIGHT } })
  };
}
