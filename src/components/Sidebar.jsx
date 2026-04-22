const pct = (value) => `${Math.round(value * 100)}%`;

export default function Sidebar({ selectedAgent, totalAgents, avgMood }) {
  if (!selectedAgent) {
    return (
      <aside className="panel sidebar">
        <h3>No Agent Selected</h3>
        <p>Click an agent on the map to inspect details.</p>
      </aside>
    );
  }

  return (
    <aside className="panel sidebar">
      <h3>{selectedAgent.name}</h3>
      <div className="subtle">State: {selectedAgent.state}</div>
      <div className="divider" />
      <ul className="stats-list">
        <li>
          <span>Energy</span>
          <strong>{Math.round(selectedAgent.energy)}</strong>
        </li>
        <li>
          <span>Mood</span>
          <strong>{selectedAgent.mood.toFixed(2)}</strong>
        </li>
        <li>
          <span>Aggression</span>
          <strong>{pct(selectedAgent.aggression / 1)}</strong>
        </li>
        <li>
          <span>Sociability</span>
          <strong>{pct(selectedAgent.sociability / 1)}</strong>
        </li>
        <li>
          <span>Curiosity</span>
          <strong>{pct(selectedAgent.curiosity / 1)}</strong>
        </li>
      </ul>

      <div className="divider" />
      <h4>Top 3 Friends</h4>
      <ul className="relationship-list good">
        {selectedAgent.topFriends.map((person) => (
          <li key={person.agentId}>
            <span>{person.name}</span>
            <strong>{Math.round(person.value)}</strong>
          </li>
        ))}
      </ul>

      <h4>Top 3 Enemies</h4>
      <ul className="relationship-list bad">
        {selectedAgent.topEnemies.map((person) => (
          <li key={person.agentId}>
            <span>{person.name}</span>
            <strong>{Math.round(person.value)}</strong>
          </li>
        ))}
      </ul>

      <div className="divider" />
      <div className="meta">
        <span>Agents: {totalAgents}</span>
        <span>Avg Mood: {avgMood.toFixed(2)}</span>
      </div>
    </aside>
  );
}
