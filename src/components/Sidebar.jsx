function sortRelationships(agent, agents, mode) {
  const mapped = agents
    .filter((candidate) => candidate.id !== agent.id)
    .map((candidate) => ({
      name: candidate.name,
      value: Math.round(agent.relationships.get(candidate.id) ?? 0)
    }))
    .sort((a, b) => (mode === 'friends' ? b.value - a.value : a.value - b.value));

  return mapped.slice(0, 3);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function Sidebar({ selectedAgent, agents }) {
  if (!selectedAgent) {
    return (
      <aside className="panel sidebar">
        <h2>Agent Inspector</h2>
        <p className="empty-text">Click an agent in the world to inspect stats and social ties.</p>
      </aside>
    );
  }

  const topFriends = sortRelationships(selectedAgent, agents, 'friends');
  const topEnemies = sortRelationships(selectedAgent, agents, 'enemies');

  return (
    <aside className="panel sidebar">
      <h2>{selectedAgent.name}</h2>
      <div className="stat-grid">
        <div><span>Energy</span><strong>{Math.round(selectedAgent.energy)}</strong></div>
        <div><span>Mood</span><strong>{selectedAgent.mood.toFixed(2)}</strong></div>
        <div><span>Aggression</span><strong>{formatPercent(selectedAgent.aggression)}</strong></div>
        <div><span>Sociability</span><strong>{formatPercent(selectedAgent.sociability)}</strong></div>
        <div><span>Curiosity</span><strong>{formatPercent(selectedAgent.curiosity)}</strong></div>
        <div><span>Behavior</span><strong>{selectedAgent.behavior}</strong></div>
      </div>

      <div className="relation-block">
        <h3>Top Friends</h3>
        {topFriends.map((friend) => (
          <p key={`f-${friend.name}`}>{friend.name}: <strong>{friend.value}</strong></p>
        ))}
      </div>

      <div className="relation-block">
        <h3>Top Enemies</h3>
        {topEnemies.map((enemy) => (
          <p key={`e-${enemy.name}`}>{enemy.name}: <strong>{enemy.value}</strong></p>
        ))}
      </div>
    </aside>
  );
}
