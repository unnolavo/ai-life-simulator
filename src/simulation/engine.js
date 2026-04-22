import {
  AVOIDANCE_RADIUS,
  BASE_SPEED,
  BEHAVIOR,
  INITIAL_AGENT_COUNT,
  INTERACTION_RADIUS,
  MAX_EVENT_LOG,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from './constants'
import { createAgent, applyBounds, limitSpeed } from './agent'
import { choice, clamp, distanceSq, generateEventNarration, generateName, randFloat } from '../utils/helpers'

function initRelationships(agent, agents) {
  for (const other of agents) {
    if (other.id !== agent.id && !agent.relationships.has(other.id)) {
      agent.relationships.set(other.id, randFloat(-15, 15))
    }
  }
}

function pickNearbyTarget(agent, agents, minRel = -100, maxRel = 100) {
  let best = null
  let bestScore = -Infinity
  for (const other of agents) {
    if (other.id === agent.id) continue
    const rel = agent.relationships.get(other.id) ?? 0
    if (rel < minRel || rel > maxRel) continue
    const d2 = distanceSq(agent, other)
    if (d2 > 220 * 220) continue
    const score = rel - d2 * 0.002
    if (score > bestScore) {
      best = other
      bestScore = score
    }
  }
  return best
}

function updateBehavior(agent, agents) {
  if (agent.energy < 20) {
    agent.behavior = BEHAVIOR.REST
    agent.targetId = null
    return
  }

  const hostile = pickNearbyTarget(agent, agents, -100, -51)
  if (hostile) {
    agent.behavior = BEHAVIOR.AVOID
    agent.targetId = hostile.id
    return
  }

  const seekBias = agent.sociability * 0.55 + agent.curiosity * 0.3 + Math.max(0, agent.mood) * 0.15
  if (Math.random() < seekBias * 0.08) {
    const pal = pickNearbyTarget(agent, agents, -30, 100)
    if (pal) {
      agent.behavior = BEHAVIOR.SEEK
      agent.targetId = pal.id
      return
    }
  }

  agent.behavior = BEHAVIOR.WANDER
  agent.targetId = null
}

function applyAvoidance(agent, agents, dt) {
  const avoid2 = AVOIDANCE_RADIUS * AVOIDANCE_RADIUS
  for (const other of agents) {
    if (other.id === agent.id) continue
    const dx = agent.x - other.x
    const dy = agent.y - other.y
    const d2 = dx * dx + dy * dy
    if (d2 > 0 && d2 < avoid2) {
      const force = (avoid2 - d2) / avoid2
      const invD = 1 / Math.sqrt(d2)
      agent.vx += dx * invD * force * 120 * dt
      agent.vy += dy * invD * force * 120 * dt
    }
  }
}

function moveAgent(agent, agents, dt) {
  updateBehavior(agent, agents)

  if (agent.behavior === BEHAVIOR.REST) {
    agent.vx *= 0.94
    agent.vy *= 0.94
    agent.energy = clamp(agent.energy + 12 * dt, 0, 100)
    agent.mood = clamp(agent.mood + 0.08 * dt, -1, 1)
  } else {
    agent.energy = clamp(agent.energy - (1.8 + Math.abs(agent.vx + agent.vy) * 0.002) * dt, 0, 100)

    if (agent.behavior === BEHAVIOR.SEEK || agent.behavior === BEHAVIOR.AVOID) {
      const target = agents.find((a) => a.id === agent.targetId)
      if (target) {
        const dx = target.x - agent.x
        const dy = target.y - agent.y
        const dist = Math.hypot(dx, dy) || 1
        const dir = agent.behavior === BEHAVIOR.AVOID ? -1 : 1
        agent.vx += (dx / dist) * dir * 26 * dt
        agent.vy += (dy / dist) * dir * 26 * dt
      }
    }

    const jitter = 0.9 + agent.curiosity * 1.6
    agent.vx += randFloat(-8, 8) * jitter * dt
    agent.vy += randFloat(-8, 8) * jitter * dt
    const drift = BASE_SPEED * (0.6 + agent.curiosity * 0.7)
    agent.vx += (Math.cos((agent.id + performance.now() * 0.0002) * 1.7) * drift - agent.vx) * 0.03 * dt * 60
    agent.vy += (Math.sin((agent.id + performance.now() * 0.00016) * 1.4) * drift - agent.vy) * 0.03 * dt * 60
  }

  applyAvoidance(agent, agents, dt)
  limitSpeed(agent)
  agent.x += agent.vx * dt
  agent.y += agent.vy * dt
  applyBounds(agent)
}

export class SimulationEngine {
  constructor() {
    this.time = 0
    this.speed = 1
    this.isPaused = false
    this.lastEventAt = 0
    this.agents = []
    this.events = []
    this.selectedId = null
    this.reset(INITIAL_AGENT_COUNT)
  }

  reset(agentCount = INITIAL_AGENT_COUNT) {
    this.time = 0
    this.lastEventAt = 0
    this.events = []
    this.selectedId = null
    const usedNames = new Set()
    this.agents = Array.from({ length: agentCount }, (_, i) => {
      const name = generateName(usedNames)
      usedNames.add(name)
      return createAgent(i + 1, name)
    })
    this.agents.forEach((agent) => initRelationships(agent, this.agents))
  }

  setSpeed(speed) {
    this.speed = speed
  }

  togglePause() {
    this.isPaused = !this.isPaused
  }

  selectAgent(agentId) {
    this.selectedId = agentId
  }

  spawnAgent() {
    const id = this.agents.length ? this.agents[this.agents.length - 1].id + 1 : 1
    const usedNames = new Set(this.agents.map((a) => a.name))
    const agent = createAgent(id, generateName(usedNames))
    initRelationships(agent, this.agents)
    this.agents.forEach((other) => {
      other.relationships.set(agent.id, randFloat(-12, 12))
    })
    this.agents.push(agent)
  }

  maybeInteract(dt) {
    this.lastEventAt += dt
    const radius2 = INTERACTION_RADIUS * INTERACTION_RADIUS
    if (this.lastEventAt < 0.24) return

    const candidates = []
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const a = this.agents[i]
        const b = this.agents[j]
        if (distanceSq(a, b) < radius2 && this.time > a.cooldownUntil && this.time > b.cooldownUntil) {
          candidates.push([a, b])
        }
      }
    }

    if (!candidates.length) return

    const [a, b] = choice(candidates)
    const relation = a.relationships.get(b.id) ?? 0
    const affinity = (a.sociability + b.sociability) * 0.5 - (a.aggression + b.aggression) * 0.35 + (a.mood + b.mood) * 0.25
    const delta = clamp((Math.random() - 0.45 + affinity) * 16, -12, 12)
    const shift = relation + delta
    a.relationships.set(b.id, clamp(shift, -100, 100))
    b.relationships.set(a.id, clamp((b.relationships.get(a.id) ?? 0) + delta * 0.9, -100, 100))

    a.mood = clamp(a.mood + delta * 0.01, -1, 1)
    b.mood = clamp(b.mood + delta * 0.008, -1, 1)

    a.cooldownUntil = this.time + 0.8
    b.cooldownUntil = this.time + 0.8
    this.lastEventAt = 0

    const text = generateEventNarration({ actorName: a.name, targetName: b.name, delta })
    this.events.unshift({ id: `${this.time}-${a.id}-${b.id}`, time: this.time, text })
    if (this.events.length > MAX_EVENT_LOG) this.events.length = MAX_EVENT_LOG
  }

  step(deltaSec) {
    if (this.isPaused) return
    const dt = Math.min(deltaSec * this.speed, 0.05)
    this.time += dt
    for (const agent of this.agents) moveAgent(agent, this.agents, dt)
    this.maybeInteract(dt)
  }

  getAgentById(id) {
    return this.agents.find((a) => a.id === id) || null
  }

  getSnapshot() {
    const selectedAgent = this.getAgentById(this.selectedId)
    return {
      time: this.time,
      agents: this.agents,
      events: this.events,
      selectedAgent,
      isPaused: this.isPaused,
      speed: this.speed,
      world: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
    }
  }
}
