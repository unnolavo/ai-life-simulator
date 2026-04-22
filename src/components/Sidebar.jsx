import { formatMood } from '../utils/helpers'

function relationshipRows(selectedAgent, agents, count = 3, invert = false) {
  const items = [...selectedAgent.relationships.entries()]
    .map(([id, value]) => ({
      id,
      value,
      name: agents.find((agent) => agent.id === id)?.name ?? `Agent ${id}`
    }))
    .sort((a, b) => (invert ? a.value - b.value : b.value - a.value))
    .slice(0, count)

  return items
}

export default function Sidebar({ selectedAgent, agents }) {
  if (!selectedAgent) {
    return (
      <aside className="panel sidebar">
        <h3>Agent Details</h3>
        <p className="empty">Click an agent in the simulation to inspect them.</p>
      </aside>
    )
  }

  const friends = relationshipRows(selectedAgent, agents, 3, false)
  const enemies = relationshipRows(selectedAgent, agents, 3, true)

  return (
    <aside className="panel sidebar">
      <h3>{selectedAgent.name}</h3>
      <p className="stat">Energy: {selectedAgent.energy.toFixed(0)}</p>
      <p className="stat">Mood: {formatMood(selectedAgent.mood)} ({selectedAgent.mood.toFixed(2)})</p>
      <p className="stat">Aggression: {selectedAgent.aggression.toFixed(2)}</p>
      <p className="stat">Sociability: {selectedAgent.sociability.toFixed(2)}</p>
      <p className="stat">Curiosity: {selectedAgent.curiosity.toFixed(2)}</p>
      <p className="stat">Behavior: {selectedAgent.behavior}</p>

      <div className="relationship-grid">
        <div>
          <h4>Top Friends</h4>
          <ul>
            {friends.map((friend) => (
              <li key={`friend-${friend.id}`}>{friend.name} <span>{friend.value.toFixed(0)}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Top Enemies</h4>
          <ul>
            {enemies.map((enemy) => (
              <li key={`enemy-${enemy.id}`}>{enemy.name} <span>{enemy.value.toFixed(0)}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
