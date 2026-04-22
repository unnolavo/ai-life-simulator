import { useEffect, useMemo, useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import { createSimulationEngine } from './simulation/engine';
import { SPEED_OPTIONS } from './simulation/constants';

export default function App() {
  const engine = useMemo(() => createSimulationEngine(), []);
  const [snapshot, setSnapshot] = useState(engine.getState());
  const [paused, setPaused] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const unsub = engine.subscribe((state) => {
      setSnapshot({ ...state, agents: [...state.agents], events: [...state.events] });
    });

    const interval = setInterval(() => {
      const state = engine.getState();
      setSnapshot({ ...state, agents: [...state.agents], events: [...state.events] });
    }, 250);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [engine]);

  const selectedAgent = snapshot.agents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <div className="app-shell">
      <header className="header panel">
        <h1>Controlled Chaos</h1>
        <div className="controls">
          <button type="button" onClick={() => setPaused((value) => !value)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => {
              engine.reset();
              setSelectedAgentId(null);
            }}
          >
            Reset Simulation
          </button>
          <button type="button" onClick={() => engine.spawnAgent()}>Spawn New Agent</button>
          <label>
            Speed
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              {SPEED_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}x</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="layout">
        <section className="simulation-column">
          <SimulationCanvas
            engine={engine}
            paused={paused}
            speed={speed}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
          <EventLog events={snapshot.events} />
        </section>
        <Sidebar selectedAgent={selectedAgent} agents={snapshot.agents} />
      </main>
    </div>
  );
}
