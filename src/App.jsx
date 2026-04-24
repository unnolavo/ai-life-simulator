import { useEffect, useMemo, useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import { createSimulationEngine } from './simulation/engine';
import { SCENARIOS, UI_UPDATE_INTERVAL } from './simulation/constants';

const initialSeed = String(Date.now() % 1000000);

export default function App() {
  const [events, setEvents] = useState([]);
  const engine = useMemo(
    () => createSimulationEngine({ onEvent: (event) => setEvents((prev) => [event, ...prev].slice(0, 120)), seed: Number(initialSeed), scenario: 'balanced' }),
    [],
  );

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [seedInput, setSeedInput] = useState(initialSeed);
  const [scenario, setScenario] = useState('balanced');
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
  const debug = engine.getDebugSnapshot();

  const resetSimulation = () => {
    engine.setSeed(Number(seedInput));
    engine.setScenario(scenario);
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
          <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
            {Object.entries(SCENARIOS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
          <input
            aria-label="Seed"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Seed"
            className="seed-input"
          />
          <button type="button" onClick={spawnAgent}>Spawn New Agent</button>
        </div>
      </header>

      <section className="main-grid">
        <SimulationCanvas engine={engine} onSelectAgent={setSelectedAgentId} />
        <Sidebar selectedAgent={selectedAgent} agentsById={agentsById} />
      </section>

      <section className="panel debug-panel">
        <h3>Debug Snapshot</h3>
        <div className="debug-grid">
          <p><span>Scenario</span><strong>{debug.scenario}</strong></p>
          <p><span>Seed</span><strong>{debug.seed}</strong></p>
          <p><span>Sim Time</span><strong>{debug.simTime.toFixed(1)}s</strong></p>
          <p><span>Interactions</span><strong>{debug.interactions}</strong></p>
          <p><span>Avg Energy</span><strong>{debug.avgEnergy.toFixed(1)}</strong></p>
          <p><span>Agent Count</span><strong>{debug.agentCount}</strong></p>
        </div>
      </section>

      <EventLog events={events} />
    </main>
  );
}
