import { formatMood, topRelationships } from '../utils/helpers';

function trendArrow(value = 0) {
  if (value > 1) return '↗';
  if (value < -1) return '↘';
  return '→';
}

function RelationshipList({ title, data, agentsById, trends }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul className="relation-list">
        {data.length === 0 ? <li className="muted">None yet</li> : data.map(([id, score]) => (
          <li key={`${title}-${id}`}>
            <span>{agentsById[id]?.name ?? `Agent ${id}`} <em className="trend">{trendArrow(trends?.[id])}</em></span>
            <strong>{Math.round(score)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentInteractionList({ selectedAgent, agentsById }) {
  const entries = Object.entries(selectedAgent.recentInteractions || {})
    .map(([id, value]) => ({
      id,
      memory: value?.memory ?? 0,
      streak: value?.streak ?? 0,
      streakKind: value?.streakKind ?? 'neutral',
    }))
    .sort((a, b) => Math.abs(b.memory) - Math.abs(a.memory))
    .slice(0, 5);

  return (
    <div>
      <h4>Recent Dynamics</h4>
      <ul className="relation-list">
        {entries.length === 0 ? <li className="muted">No strong dynamics yet</li> : entries.map((entry) => (
          <li key={`memory-${entry.id}`}>
            <span>
              {agentsById[entry.id]?.name ?? `Agent ${entry.id}`}
              <em className="trend">{entry.streakKind === 'positive' ? '★' : entry.streakKind === 'negative' ? '⚠' : '•'}</em>
            </span>
            <strong>{entry.memory.toFixed(2)} ({entry.streak})</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sidebar({ selectedAgent, agentsById }) {
  if (!selectedAgent) {
    return (
      <aside className="panel sidebar">
        <h3>Agent Inspector</h3>
        <p className="muted">Click an agent to inspect personality, mood, and social ties.</p>
      </aside>
    );
  }

  const friends = topRelationships(selectedAgent, 'friend').filter(([, score]) => score > 0);
  const enemies = topRelationships(selectedAgent, 'enemy').filter(([, score]) => score < 0);

  return (
    <aside className="panel sidebar">
      <h3>{selectedAgent.name}</h3>
      <div className="stat-grid">
        <p><span>Energy</span><strong>{Math.round(selectedAgent.energy)}</strong></p>
        <p><span>Mood</span><strong>{formatMood(selectedAgent.mood)}</strong></p>
        <p><span>Aggression</span><strong>{selectedAgent.aggression.toFixed(2)}</strong></p>
        <p><span>Sociability</span><strong>{selectedAgent.sociability.toFixed(2)}</strong></p>
        <p><span>Curiosity</span><strong>{selectedAgent.curiosity.toFixed(2)}</strong></p>
        <p><span>Behavior</span><strong>{selectedAgent.behavior}</strong></p>
      </div>
      <RelationshipList title="Top Friends" data={friends} agentsById={agentsById} trends={selectedAgent.relationshipTrends} />
      <RelationshipList title="Top Enemies" data={enemies} agentsById={agentsById} trends={selectedAgent.relationshipTrends} />
      <RecentInteractionList selectedAgent={selectedAgent} agentsById={agentsById} />
    </aside>
  );
}
