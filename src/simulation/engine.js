import {
  AGENT_RADIUS,
  AVOIDANCE_RADIUS,
  ENERGY_DRAIN_RATE,
  ENERGY_RECOVERY_RATE,
  EVENT_COOLDOWN,
  INITIAL_AGENT_COUNT,
  INTERACTION_RADIUS,
  MAX_AGENTS,
  MAX_SPEED,
  NEIGHBOR_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { createAgent, keepInBounds } from './agent';
import { clamp, randomInRange, randomName } from '../utils/helpers';

const EVENT_TEMPLATES = {
  positive: [
    '{a} greeted {b} warmly',
    '{a} shared a clever idea with {b}',
    '{a} encouraged {b}',
  ],
  negative: [
    '{a} insulted {b}',
    '{a} shoved past {b}',
    '{a} mocked {b}',
  ],
  avoid: [
    '{a} avoided {b}',
    '{a} kept distance from {b}',
    '{a} ignored {b}',
  ],
  curious: [
    '{a} asked {b} a curious question',
    '{a} followed {b} to investigate',
    '{a} studied {b} closely',
  ],
};

const magnitude = (v) => Math.hypot(v.x, v.y);

const normalize = (v) => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

const pickTemplate = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateEventNarration = (eventData) => {
  const template = pickTemplate(EVENT_TEMPLATES[eventData.kind] || EVENT_TEMPLATES.curious);
  return template
    .replace('{a}', eventData.actor)
    .replace('{b}', eventData.target);
};

export const createSimulationEngine = ({ onEvent } = {}) => {
  const state = {
    agents: [],
    time: 0,
    nextAgentId: 1,
    speed: 1,
    paused: false,
    selectedAgentId: null,
    eventLog: [],
  };

  const pushEvent = (event) => {
    const fullEvent = { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), ...event };
    state.eventLog.unshift(fullEvent);
    state.eventLog = state.eventLog.slice(0, 120);
    onEvent?.(fullEvent);
  };

  const addAgent = (spawnNearCenter = false) => {
    if (state.agents.length >= MAX_AGENTS) return null;
    const usedNames = new Set(state.agents.map((a) => a.name));
    const x = spawnNearCenter ? randomInRange(WORLD_WIDTH * 0.35, WORLD_WIDTH * 0.65) : randomInRange(30, WORLD_WIDTH - 30);
    const y = spawnNearCenter ? randomInRange(WORLD_HEIGHT * 0.35, WORLD_HEIGHT * 0.65) : randomInRange(30, WORLD_HEIGHT - 30);
    const agent = createAgent({ id: state.nextAgentId++, name: randomName(usedNames), x, y });
    state.agents.push(agent);
    state.agents.forEach((other) => {
      if (other.id !== agent.id) {
        const relationA = randomInRange(-25, 25);
        const relationB = randomInRange(-25, 25);
        other.relationships[agent.id] = relationA;
        agent.relationships[other.id] = relationB;
      }
    });
    return agent;
  };

  const reset = () => {
    state.agents = [];
    state.time = 0;
    state.nextAgentId = 1;
    state.eventLog = [];
    for (let i = 0; i < INITIAL_AGENT_COUNT; i += 1) {
      addAgent(i < 5);
    }
    if (state.agents.length >= 2) {
      state.agents[0].relationships[state.agents[1].id] = -70;
      state.agents[1].relationships[state.agents[0].id] = -65;
      state.agents[2].relationships[state.agents[3].id] = 80;
      state.agents[3].relationships[state.agents[2].id] = 75;
    }
  };

  const updateBehaviors = (agent, dt) => {
    agent.behaviorTimer -= dt;
    const enemies = Object.entries(agent.relationships)
      .filter(([, score]) => score < -50)
      .map(([id]) => Number(id));

    if (agent.energy < 20) {
      agent.behavior = 'rest';
      return;
    }
    if (enemies.length > 0 && Math.random() < 0.7) {
      agent.behavior = 'avoid enemy';
      return;
    }
    if (agent.behaviorTimer <= 0) {
      agent.behaviorTimer = randomInRange(1.6, 4.5);
      const desire = agent.sociability * 0.45 + agent.curiosity * 0.35 + ((agent.mood + 1) / 2) * 0.2;
      agent.behavior = Math.random() < desire ? 'seek interaction' : 'wander';
    }
  };

  const steerToward = (agent, targetX, targetY, force, dt) => {
    const desired = normalize({ x: targetX - agent.x, y: targetY - agent.y });
    agent.velocity.x += desired.x * force * dt;
    agent.velocity.y += desired.y * force * dt;
  };

  const applyMovement = (agent, dt) => {
    const drag = agent.behavior === 'rest' ? 0.83 : 0.97;
    agent.velocity.x *= drag;
    agent.velocity.y *= drag;

    const speed = magnitude(agent.velocity);
    const maxSpeed = agent.behavior === 'rest' ? MAX_SPEED * 0.3 : MAX_SPEED;
    if (speed > maxSpeed) {
      const n = normalize(agent.velocity);
      agent.velocity.x = n.x * maxSpeed;
      agent.velocity.y = n.y * maxSpeed;
    }

    agent.x += agent.velocity.x * dt;
    agent.y += agent.velocity.y * dt;
    keepInBounds(agent);
  };

  const updateAgentDrives = (agent, dt) => {
    if (agent.behavior === 'rest') {
      agent.energy = clamp(agent.energy + ENERGY_RECOVERY_RATE * dt, 0, 100);
      agent.mood = clamp(agent.mood + dt * 0.08, -1, 1);
      if (Math.random() < 0.03) {
        steerToward(agent, randomInRange(0, WORLD_WIDTH), randomInRange(0, WORLD_HEIGHT), 8, dt);
      }
    } else {
      agent.energy = clamp(agent.energy - ENERGY_DRAIN_RATE * (1 + magnitude(agent.velocity) / MAX_SPEED) * dt, 0, 100);
      if (Math.random() < 0.18) {
        const jitter = {
          x: randomInRange(-1, 1),
          y: randomInRange(-1, 1),
        };
        const unit = normalize(jitter);
        agent.velocity.x += unit.x * 19;
        agent.velocity.y += unit.y * 19;
      }
    }
  };

  const processNeighbors = (agent, dt) => {
    let nearest = null;
    let nearestDistance = Infinity;
    let strongestEnemy = null;
    let enemyDistance = Infinity;

    for (const other of state.agents) {
      if (other.id === agent.id) continue;
      const dx = other.x - agent.x;
      const dy = other.y - agent.y;
      const dist = Math.hypot(dx, dy);

      if (dist < nearestDistance) {
        nearest = other;
        nearestDistance = dist;
      }

      const relation = agent.relationships[other.id] ?? 0;
      if (relation < -50 && dist < enemyDistance) {
        strongestEnemy = other;
        enemyDistance = dist;
      }

      if (dist < AVOIDANCE_RADIUS && dist > 0) {
        const push = normalize({ x: -dx, y: -dy });
        const amount = ((AVOIDANCE_RADIUS - dist) / AVOIDANCE_RADIUS) * 54;
        agent.velocity.x += push.x * amount * dt;
        agent.velocity.y += push.y * amount * dt;
      }
    }

    if (agent.behavior === 'avoid enemy' && strongestEnemy) {
      steerToward(agent, agent.x - (strongestEnemy.x - agent.x), agent.y - (strongestEnemy.y - agent.y), 65, dt);
      return;
    }

    if (agent.behavior === 'seek interaction' && nearest && nearestDistance < NEIGHBOR_RADIUS) {
      steerToward(agent, nearest.x, nearest.y, 32 + agent.sociability * 20, dt);
    }
  };

  const processInteraction = (agentA, agentB) => {
    if (agentA.interactionCooldown > 0 || agentB.interactionCooldown > 0) return;

    const relationAB = agentA.relationships[agentB.id] ?? 0;
    const relationBA = agentB.relationships[agentA.id] ?? 0;
    const vibe = (agentA.sociability + agentA.curiosity - agentA.aggression) * 0.5 + agentA.mood;
    const hostility = (agentA.aggression + (relationAB < 0 ? Math.abs(relationAB) / 100 : 0)) * 0.65;

    let delta = 0;
    let kind = 'curious';
    if (relationAB < -35 || hostility > vibe + 0.3) {
      kind = Math.random() < 0.5 ? 'negative' : 'avoid';
      delta = -randomInRange(6, 14);
      agentA.mood = clamp(agentA.mood - 0.07, -1, 1);
      agentB.mood = clamp(agentB.mood - 0.09, -1, 1);
    } else if (relationAB > 35 || vibe > hostility + 0.2) {
      kind = 'positive';
      delta = randomInRange(5, 12);
      agentA.mood = clamp(agentA.mood + 0.08, -1, 1);
      agentB.mood = clamp(agentB.mood + 0.05, -1, 1);
    } else {
      delta = randomInRange(-4, 6);
      agentA.mood = clamp(agentA.mood + delta * 0.003, -1, 1);
    }

    agentA.relationships[agentB.id] = clamp(relationAB + delta, -100, 100);
    agentB.relationships[agentA.id] = clamp(relationBA + delta * 0.8, -100, 100);

    agentA.interactionCooldown = EVENT_COOLDOWN + randomInRange(0.2, 1.1);
    agentB.interactionCooldown = EVENT_COOLDOWN + randomInRange(0.2, 1.1);

    pushEvent({
      kind,
      text: generateEventNarration({ kind, actor: agentA.name, target: agentB.name }),
      agents: [agentA.id, agentB.id],
    });
  };

  const update = (dtInput) => {
    if (state.paused) return;
    const dt = Math.min(0.05, dtInput * state.speed);
    state.time += dt;

    for (const agent of state.agents) {
      agent.interactionCooldown = Math.max(0, agent.interactionCooldown - dt);
      updateBehaviors(agent, dt);
      processNeighbors(agent, dt);
      updateAgentDrives(agent, dt);
      applyMovement(agent, dt);
    }

    for (let i = 0; i < state.agents.length; i += 1) {
      const a = state.agents[i];
      for (let j = i + 1; j < state.agents.length; j += 1) {
        const b = state.agents[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy <= INTERACTION_RADIUS * INTERACTION_RADIUS) {
          const actor = Math.random() < 0.5 ? a : b;
          const target = actor.id === a.id ? b : a;
          processInteraction(actor, target);
        }
      }
    }
  };

  const draw = (ctx) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (const agent of state.agents) {
      const glow = 7 + ((agent.mood + 1) / 2) * 8;
      ctx.beginPath();
      ctx.fillStyle = agent.color;
      ctx.shadowColor = agent.color;
      ctx.shadowBlur = glow;
      ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      if (agent.id === state.selectedAgentId) {
        ctx.beginPath();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(250, 250, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.arc(agent.x, agent.y, AGENT_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  };

  const pickAgentAt = (x, y) => state.agents.find((agent) => (agent.x - x) ** 2 + (agent.y - y) ** 2 <= (AGENT_RADIUS + 4) ** 2) || null;

  reset();

  return {
    state,
    update,
    draw,
    reset,
    addAgent,
    pickAgentAt,
    setPaused: (paused) => {
      state.paused = paused;
    },
    setSpeed: (speed) => {
      state.speed = speed;
    },
    setSelectedAgent: (id) => {
      state.selectedAgentId = id;
    },
  };
};
