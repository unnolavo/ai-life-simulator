import { useEffect, useMemo, useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import { createSimulationEngine } from './simulation/engine';
import { UI_UPDATE_INTERVAL } from './simulation/constants';

export default function App() {
  const [events, setEvents] = useState([]);
  const engine = useMemo(
    () => createSimulationEngine({ onEvent: (event) => setEvents((prev) => [event, ...prev].slice(0, 120)) }),
    [],
  );

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), UI_UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    engine.setPaused(paused);
  }, [paused, engine]);

  useEffect(() => {
    engine.setSpeed(speed);
  }, [speed, engine]);

  useEffect(() => {
    engine.setSelectedAgent(selectedAgentId);
  }, [selectedAgentId, engine]);

  const selectedAgent = engine.state.agents.find((agent) => agent.id === selectedAgentId) || null;
  const agentsById = Object.fromEntries(engine.state.agents.map((agent) => [agent.id, agent]));

  const resetSimulation = () => {
    engine.reset();
    setEvents([]);
    setSelectedAgentId(null);
  };

  const spawnAgent = () => {
    const created = engine.addAgent(true);
    if (created) setSelectedAgentId(created.id);
  };

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div>
          <h1>Controlled Chaos</h1>
          <p>Autonomous social agents in a tiny world.</p>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
          <button type="button" onClick={resetSimulation}>Reset Simulation</button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={1}>1x speed</option>
            <option value={2}>2x speed</option>
            <option value={3}>3x speed</option>
          </select>
          <button type="button" onClick={spawnAgent}>Spawn New Agent</button>
        </div>
      </header>

      <section className="main-grid">
        <SimulationCanvas engine={engine} onSelectAgent={setSelectedAgentId} />
        <Sidebar selectedAgent={selectedAgent} agentsById={agentsById} />
      </section>

      <EventLog events={events} />
    </main>
  );
}
