import { useMemo, useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import { SimulationEngine } from './simulation/engine';

export default function App() {
  const [uiState, setUiState] = useState({
    selectedAgent: null,
    events: [],
    stats: { avgMood: 0 },
    agents: [],
  });

  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const engine = useMemo(
    () =>
      new SimulationEngine({
        onUiUpdate: (nextState) => {
          setUiState({ ...nextState, agents: [...nextState.agents] });
        },
      }),
    [],
  );

  const toggleRun = () => {
    const next = !isRunning;
    setIsRunning(next);
    engine.setRunning(next);
  };

  const reset = () => {
    engine.reset();
    setIsRunning(true);
    engine.setRunning(true);
  };

  const changeSpeed = (nextSpeed) => {
    setSpeed(nextSpeed);
    engine.setSpeed(nextSpeed);
  };

  return (
    <div className="app">
      <header className="header panel">
        <h1>Controlled Chaos</h1>
        <div className="controls">
          <button onClick={toggleRun}>{isRunning ? 'Pause' : 'Resume'}</button>
          <button onClick={reset}>Reset</button>
          <button onClick={() => engine.spawnAgent()}>Spawn Agent</button>

          <div className="speed-controls">
            {[1, 2, 3].map((value) => (
              <button
                key={value}
                className={speed === value ? 'active' : ''}
                onClick={() => changeSpeed(value)}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="main-stack">
          <SimulationCanvas engine={engine} selectedAgentId={uiState.selectedAgent?.id} />
          <EventLog events={uiState.events} />
        </section>

        <Sidebar
          selectedAgent={uiState.selectedAgent}
          totalAgents={uiState.agents.length}
          avgMood={uiState.stats.avgMood || 0}
        />
      </main>
    </div>
  );
}
