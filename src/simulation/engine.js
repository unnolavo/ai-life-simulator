import {
  AGENT_RADIUS,
  ARC_STREAK_THRESHOLD,
  AVOIDANCE_RADIUS,
  ENERGY_DRAIN_RATE,
  ENERGY_RECOVERY_RATE,
  EVENT_COOLDOWN,
  INITIAL_AGENT_COUNT,
  INTERACTION_RADIUS,
  MAX_AGENTS,
  MAX_SPEED,
  MEMORY_DECAY_PER_SECOND,
  NEIGHBOR_RADIUS,
  SCENARIOS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { createAgent, keepInBounds } from './agent';
import { clamp, randomInRange, randomName } from '../utils/helpers';

const EVENT_TEMPLATES = {
  positive: ['{a} greeted {b} warmly', '{a} shared a clever idea with {b}', '{a} encouraged {b}'],
  negative: ['{a} insulted {b}', '{a} shoved past {b}', '{a} mocked {b}'],
  avoid: ['{a} avoided {b}', '{a} kept distance from {b}', '{a} ignored {b}'],
  curious: ['{a} asked {b} a curious question', '{a} followed {b} to investigate', '{a} studied {b} closely'],
  arc_friendship: ['{a} and {b} seem to be building a friendship', '{a} and {b} keep backing each other up'],
  arc_rivalry: ['{a} and {b} have become rivals', '{a} and {b} are locked in a feud'],
  arc_reconcile: ['{a} and {b} finally reconciled', '{a} and {b} cooled off after repeated clashes'],
};

const magnitude = (v) => Math.hypot(v.x, v.y);
const normalize = (v) => {
  const mag = magnitude(v);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const toNumericSeed = (seedLike) => {
  const raw = Number(seedLike);
  if (Number.isFinite(raw)) return Math.abs(Math.floor(raw)) || 1;
  return Date.now() % 2147483647;
};

const sentimentForKind = (kind) => {
  if (kind === 'positive') return 'positive';
  if (kind === 'negative' || kind === 'avoid') return 'negative';
  return 'neutral';
};

export const generateEventNarration = (eventData, rng = Math.random) => {
  const key = eventData.arcType ? `arc_${eventData.arcType}` : eventData.kind;
  const list = EVENT_TEMPLATES[key] || EVENT_TEMPLATES.curious;
  const template = list[Math.floor(rng() * list.length)];
  return template.replace('{a}', eventData.actor).replace('{b}', eventData.target);
};

export const createSimulationEngine = ({ onEvent, seed = Date.now(), scenario = 'balanced' } = {}) => {
  const state = {
    agents: [],
    time: 0,
    nextAgentId: 1,
    speed: 1,
    paused: false,
    selectedAgentId: null,
    eventLog: [],
    interactionsCount: 0,
    seed: toNumericSeed(seed),
    scenario,
    rng: Math.random,
  };

  const rand = () => state.rng();
  const randRange = (min, max) => randomInRange(min, max, rand);

  const pushEvent = (event) => {
    const fullEvent = { id: `${Date.now()}-${rand()}`, timestamp: Date.now(), ...event };
    state.eventLog.unshift(fullEvent);
    state.eventLog = state.eventLog.slice(0, 120);
    state.interactionsCount += 1;
    onEvent?.(fullEvent);
  };

  const addAgent = (spawnNearCenter = false) => {
    if (state.agents.length >= MAX_AGENTS) return null;
    const usedNames = new Set(state.agents.map((a) => a.name));
    const x = spawnNearCenter ? randRange(WORLD_WIDTH * 0.35, WORLD_WIDTH * 0.65) : randRange(30, WORLD_WIDTH - 30);
    const y = spawnNearCenter ? randRange(WORLD_HEIGHT * 0.35, WORLD_HEIGHT * 0.65) : randRange(30, WORLD_HEIGHT - 30);
    const agent = createAgent({ id: state.nextAgentId++, name: randomName(usedNames, rand), x, y, rng: rand });
    state.agents.push(agent);

    state.agents.forEach((other) => {
      if (other.id !== agent.id) {
        other.relationships[agent.id] = randRange(-25, 25);
        other.relationshipTrends[agent.id] = 0;
        other.recentInteractions[agent.id] = { memory: 0, streakKind: 'neutral', streak: 0, lastArcAt: -999 };
        agent.relationships[other.id] = randRange(-25, 25);
        agent.relationshipTrends[other.id] = 0;
        agent.recentInteractions[other.id] = { memory: 0, streakKind: 'neutral', streak: 0, lastArcAt: -999 };
      }
    });
    return agent;
  };

  const applyScenario = () => {
    const preset = SCENARIOS[state.scenario] || SCENARIOS.balanced;
    state.agents.forEach((agent) => {
      agent.mood = clamp(agent.mood + preset.moodBias, -1, 1);
    });

    const ids = state.agents.map((a) => a.id);
    for (let i = 0; i < preset.hostilePairs; i += 1) {
      const a = state.agents[Math.floor(rand() * ids.length)];
      const b = state.agents[Math.floor(rand() * ids.length)];
      if (!a || !b || a.id === b.id) continue;
      a.relationships[b.id] = -randRange(55, 90);
      b.relationships[a.id] = -randRange(55, 90);
    }

    for (let i = 0; i < preset.alliedPairs; i += 1) {
      const a = state.agents[Math.floor(rand() * ids.length)];
      const b = state.agents[Math.floor(rand() * ids.length)];
      if (!a || !b || a.id === b.id) continue;
      a.relationships[b.id] = randRange(55, 90);
      b.relationships[a.id] = randRange(55, 90);
    }
  };

  const reset = () => {
    state.rng = mulberry32(state.seed);
    state.agents = [];
    state.time = 0;
    state.nextAgentId = 1;
    state.eventLog = [];
    state.interactionsCount = 0;

    for (let i = 0; i < INITIAL_AGENT_COUNT; i += 1) addAgent(i < 5);
    applyScenario();
  };

  const updateBehavior = (agent, dt) => {
    agent.behaviorTimer -= dt;
    agent.behaviorCommitment = Math.max(0, agent.behaviorCommitment - dt);
    agent.socialMomentum = clamp(agent.socialMomentum * (1 - dt * 0.4), -1, 1);

    let memorySignal = 0;
    Object.values(agent.recentInteractions).forEach((entry) => {
      entry.memory *= Math.max(0, 1 - dt * MEMORY_DECAY_PER_SECOND);
      memorySignal += entry.memory;
    });

    const enemies = Object.entries(agent.relationships)
      .filter(([, score]) => score < -50)
      .map(([id]) => Number(id));

    if (agent.energy < 20) {
      agent.behavior = 'rest';
      return;
    }
    if (agent.behaviorCommitment > 0) return;

    if (enemies.length > 0 && rand() < 0.65 + Math.max(0, -agent.mood) * 0.2 + Math.max(0, -memorySignal) * 0.1) {
      agent.behavior = 'avoid enemy';
      agent.behaviorCommitment = randRange(0.7, 1.6);
      return;
    }

    if (agent.behaviorTimer <= 0) {
      agent.behaviorTimer = randRange(1.6, 4.5);
      const desire = agent.sociability * 0.4 + agent.curiosity * 0.3 + ((agent.mood + 1) / 2) * 0.2 + Math.max(0, agent.socialMomentum) * 0.1 + Math.max(0, memorySignal) * 0.08;
      agent.behavior = rand() < desire ? 'seek interaction' : 'wander';
      agent.behaviorCommitment = randRange(0.6, 1.6);
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
    const prevMood = agent.mood;
    if (agent.behavior === 'rest') {
      agent.energy = clamp(agent.energy + ENERGY_RECOVERY_RATE * dt, 0, 100);
      agent.mood = clamp(agent.mood + dt * 0.08, -1, 1);
      if (rand() < 0.03) steerToward(agent, randRange(0, WORLD_WIDTH), randRange(0, WORLD_HEIGHT), 8, dt);
    } else {
      agent.energy = clamp(agent.energy - ENERGY_DRAIN_RATE * (1 + magnitude(agent.velocity) / MAX_SPEED) * dt, 0, 100);
      if (rand() < 0.18) {
        const jitter = normalize({ x: randRange(-1, 1), y: randRange(-1, 1) });
        agent.velocity.x += jitter.x * 19;
        agent.velocity.y += jitter.y * 19;
      }
    }
    agent.recentMoodDelta = clamp(agent.recentMoodDelta * 0.9 + (agent.mood - prevMood), -1, 1);
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
      steerToward(agent, nearest.x, nearest.y, 28 + agent.sociability * 24 + Math.max(0, agent.socialMomentum) * 8, dt);
    }
  };

  const pushArcIfNeeded = (agentA, agentB, entry, sentiment) => {
    if (entry.streak < ARC_STREAK_THRESHOLD) return;
    if (state.time - entry.lastArcAt < 8) return;

    let arcType = null;
    if (sentiment === 'positive') arcType = 'friendship';
    if (sentiment === 'negative') arcType = 'rivalry';
    if (sentiment === 'positive' && entry.lastNegativeStreak >= ARC_STREAK_THRESHOLD) arcType = 'reconcile';

    if (!arcType) return;
    entry.lastArcAt = state.time;
    pushEvent({
      kind: 'arc',
      arcType,
      text: generateEventNarration({ kind: 'arc', arcType, actor: agentA.name, target: agentB.name }, rand),
      agents: [agentA.id, agentB.id],
    });
  };

  const updateInteractionMemory = (observer, other, delta, kind, relationDelta) => {
    const memory = observer.recentInteractions[other.id] || { memory: 0, streakKind: 'neutral', streak: 0, lastArcAt: -999, lastNegativeStreak: 0 };
    const sentiment = sentimentForKind(kind);

    memory.memory = clamp(memory.memory * 0.8 + delta / 16, -2, 2);
    if (sentiment === memory.streakKind) {
      memory.streak += 1;
    } else if (sentiment !== 'neutral') {
      if (memory.streakKind === 'negative') memory.lastNegativeStreak = memory.streak;
      memory.streakKind = sentiment;
      memory.streak = 1;
    }

    observer.recentInteractions[other.id] = memory;
    observer.relationshipTrends[other.id] = relationDelta;
    pushArcIfNeeded(observer, other, memory, sentiment);
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
      kind = rand() < 0.5 ? 'negative' : 'avoid';
      delta = -randRange(6, 14);
      agentA.mood = clamp(agentA.mood - 0.07, -1, 1);
      agentB.mood = clamp(agentB.mood - 0.09, -1, 1);
      agentA.socialMomentum = clamp(agentA.socialMomentum - 0.16, -1, 1);
      agentB.socialMomentum = clamp(agentB.socialMomentum - 0.11, -1, 1);
    } else if (relationAB > 35 || vibe > hostility + 0.2) {
      kind = 'positive';
      delta = randRange(5, 12);
      agentA.mood = clamp(agentA.mood + 0.08, -1, 1);
      agentB.mood = clamp(agentB.mood + 0.05, -1, 1);
      agentA.socialMomentum = clamp(agentA.socialMomentum + 0.18, -1, 1);
      agentB.socialMomentum = clamp(agentB.socialMomentum + 0.12, -1, 1);
    } else {
      delta = randRange(-4, 6);
      agentA.mood = clamp(agentA.mood + delta * 0.003, -1, 1);
    }

    const nextAB = clamp(relationAB + delta, -100, 100);
    const nextBA = clamp(relationBA + delta * 0.8, -100, 100);
    agentA.relationships[agentB.id] = nextAB;
    agentB.relationships[agentA.id] = nextBA;

    updateInteractionMemory(agentA, agentB, delta, kind, nextAB - relationAB);
    updateInteractionMemory(agentB, agentA, delta * 0.8, kind, nextBA - relationBA);

    agentA.lastInteractionAt = state.time;
    agentB.lastInteractionAt = state.time;
    agentA.interactionCooldown = EVENT_COOLDOWN + randRange(0.2, 1.1);
    agentB.interactionCooldown = EVENT_COOLDOWN + randRange(0.2, 1.1);

    pushEvent({ kind, text: generateEventNarration({ kind, actor: agentA.name, target: agentB.name }, rand), agents: [agentA.id, agentB.id] });
  };

  const update = (dtInput) => {
    if (state.paused) return;
    const dt = Math.min(0.05, dtInput * state.speed);
    state.time += dt;

    for (const agent of state.agents) {
      agent.interactionCooldown = Math.max(0, agent.interactionCooldown - dt);
      updateBehavior(agent, dt);
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
          const actor = rand() < 0.5 ? a : b;
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
      const glow = 7 + ((agent.mood + 1) / 2) * 8 + Math.max(0, agent.socialMomentum) * 4;
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

  const getDebugSnapshot = () => {
    const totalEnergy = state.agents.reduce((sum, a) => sum + a.energy, 0);
    const avgEnergy = state.agents.length ? totalEnergy / state.agents.length : 0;
    return {
      seed: state.seed,
      scenario: state.scenario,
      simTime: state.time,
      agentCount: state.agents.length,
      interactions: state.interactionsCount,
      avgEnergy,
    };
  };

  reset();

  return {
    state,
    update,
    draw,
    reset,
    addAgent,
    pickAgentAt,
    getDebugSnapshot,
    setPaused: (paused) => { state.paused = paused; },
    setSpeed: (speed) => { state.speed = speed; },
    setSelectedAgent: (id) => { state.selectedAgentId = id; },
    setSeed: (seedValue) => { state.seed = toNumericSeed(seedValue); },
    setScenario: (nextScenario) => { state.scenario = SCENARIOS[nextScenario] ? nextScenario : 'balanced'; },
  };
};
