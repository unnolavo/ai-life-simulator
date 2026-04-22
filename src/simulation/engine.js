import { Agent } from './agent';
import {
  AGENT_NAMES,
  AGENT_RADIUS,
  INITIAL_AGENT_COUNT,
  INTERACTION_RADIUS,
  UI_UPDATE_INTERVAL,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants';
import { clamp, generateEventNarration, rand, randomChoice, sortRelationships } from '../utils/helpers';

const palette = ['#7dd3fc', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'];

export class SimulationEngine {
  constructor({ onUiUpdate }) {
    this.onUiUpdate = onUiUpdate;
    this.time = 0;
    this.lastUiPush = 0;
    this.running = true;
    this.speed = 1;
    this.selectedAgentId = null;
    this.eventSeq = 0;
    this.events = [];
    this.bounds = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
    this.agents = [];
    this.reset();
  }

  setSize(width, height) {
    this.bounds.width = width;
    this.bounds.height = height;
  }

  setSelectedAgent(id) {
    this.selectedAgentId = id;
    this.pushUi(true);
  }

  setRunning(isRunning) {
    this.running = isRunning;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  reset() {
    this.time = 0;
    this.lastUiPush = 0;
    this.eventSeq = 0;
    this.events = [];
    const ids = Array.from({ length: INITIAL_AGENT_COUNT }, (_, i) => i + 1);

    this.agents = ids.map((id, idx) => {
      const name = AGENT_NAMES[idx % AGENT_NAMES.length];
      return new Agent({
        id,
        name,
        color: palette[idx % palette.length],
        x: rand(AGENT_RADIUS * 2, this.bounds.width - AGENT_RADIUS * 2),
        y: rand(AGENT_RADIUS * 2, this.bounds.height - AGENT_RADIUS * 2),
        allAgentIds: ids,
      });
    });
    this.selectedAgentId = this.agents[0]?.id ?? null;
    this.pushUi(true);
  }

  spawnAgent() {
    const id = Math.max(0, ...this.agents.map((a) => a.id)) + 1;
    const name = AGENT_NAMES[id % AGENT_NAMES.length] + `-${id}`;
    const agent = new Agent({
      id,
      name,
      color: randomChoice(palette),
      x: rand(AGENT_RADIUS * 2, this.bounds.width - AGENT_RADIUS * 2),
      y: rand(AGENT_RADIUS * 2, this.bounds.height - AGENT_RADIUS * 2),
      allAgentIds: this.agents.map((a) => a.id).concat(id),
    });

    this.agents.forEach((other) => {
      other.relationships.set(id, rand(-12, 12));
      agent.relationships.set(other.id, rand(-12, 12));
    });

    this.agents.push(agent);
    this.logEvent(`${agent.name} entered the simulation`);
    this.pushUi(true);
  }

  getAgentById(id) {
    return this.agents.find((a) => a.id === id) ?? null;
  }

  update(deltaInput) {
    if (!this.running) return;

    const delta = Math.min(0.05, deltaInput * this.speed);
    this.time += delta;

    for (const agent of this.agents) {
      let nearestEnemy = { dist: Infinity, ref: null };
      let nearestFriendly = { dist: Infinity, ref: null };
      const nearby = [];

      for (const other of this.agents) {
        if (other.id === agent.id) continue;
        const dx = other.x - agent.x;
        const dy = other.y - agent.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 40) nearby.push(other);

        const relation = agent.relationships.get(other.id) ?? 0;
        if (relation < -50 && dist < nearestEnemy.dist) nearestEnemy = { dist, ref: other };
        if (relation > 25 && dist < nearestFriendly.dist) nearestFriendly = { dist, ref: other };
      }

      agent.updateState(nearestEnemy.dist, nearestFriendly.dist);
      if (agent.state === 'wander') agent.wander(delta);
      if (agent.state === 'seek' && nearestFriendly.ref) agent.seek(nearestFriendly.ref, delta);
      if (agent.state === 'avoid' && nearestEnemy.ref) agent.avoid(nearestEnemy.ref, delta);
      agent.separateFrom(nearby, delta);
      agent.updateEnergy(delta);
      agent.integrate(delta, this.bounds);
    }

    this.resolveInteractions();
    if (this.time - this.lastUiPush > UI_UPDATE_INTERVAL) this.pushUi(false);
  }

  resolveInteractions() {
    for (let i = 0; i < this.agents.length; i += 1) {
      for (let j = i + 1; j < this.agents.length; j += 1) {
        const a = this.agents[i];
        const b = this.agents[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > INTERACTION_RADIUS) continue;
        if (!a.canInteract(this.time) || !b.canInteract(this.time)) continue;

        const affinityA = (a.relationships.get(b.id) ?? 0) / 100;
        const affinityB = (b.relationships.get(a.id) ?? 0) / 100;
        const sentiment =
          ((a.sociability + b.sociability) / 2 - (a.aggression + b.aggression) / 2) * 0.7 +
          ((a.mood + b.mood) / 2) * 0.3 +
          (affinityA + affinityB) * 0.2 +
          rand(-0.25, 0.25);

        const relationShift = clamp(Math.round(sentiment * 18), -9, 9);
        a.relationships.set(b.id, clamp((a.relationships.get(b.id) ?? 0) + relationShift, -100, 100));
        b.relationships.set(a.id, clamp((b.relationships.get(a.id) ?? 0) + relationShift, -100, 100));

        a.mood = clamp(a.mood + sentiment * 0.08, -1, 1);
        b.mood = clamp(b.mood + sentiment * 0.08, -1, 1);

        a.setInteraction(this.time);
        b.setInteraction(this.time);

        const narration = generateEventNarration({
          actorName: Math.random() > 0.5 ? a.name : b.name,
          targetName: Math.random() > 0.5 ? b.name : a.name,
          sentiment,
        });
        this.logEvent(narration);
      }
    }
  }

  logEvent(text) {
    this.eventSeq += 1;
    this.events.unshift({ id: this.eventSeq, time: this.time, text });
    this.events = this.events.slice(0, 80);
  }

  collectSelectedAgentData() {
    const agent = this.getAgentById(this.selectedAgentId);
    if (!agent) return null;

    const relationships = [...agent.relationships.entries()].map(([agentId, value]) => ({
      agentId,
      value,
      name: this.getAgentById(agentId)?.name ?? `Agent ${agentId}`,
    }));

    return {
      id: agent.id,
      name: agent.name,
      energy: agent.energy,
      mood: agent.mood,
      aggression: agent.aggression,
      sociability: agent.sociability,
      curiosity: agent.curiosity,
      state: agent.state,
      topFriends: sortRelationships(relationships, 3, true),
      topEnemies: sortRelationships(relationships, 3, false),
    };
  }

  pushUi(force) {
    if (!force && this.time - this.lastUiPush < UI_UPDATE_INTERVAL) return;
    this.lastUiPush = this.time;
    this.onUiUpdate({
      agents: this.agents,
      selectedAgent: this.collectSelectedAgentData(),
      events: this.events,
      stats: {
        avgMood: this.agents.reduce((acc, a) => acc + a.mood, 0) / this.agents.length,
      },
    });
  }
}
