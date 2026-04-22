import { useEffect, useMemo, useRef, useState } from 'react'
import SimulationCanvas from './components/SimulationCanvas'
import Sidebar from './components/Sidebar'
import EventLog from './components/EventLog'
import { SimulationEngine } from './simulation/engine'
import { SPEED_OPTIONS, UI_TICK_MS } from './simulation/constants'

function HeaderControls({ snapshot, onTogglePause, onReset, onSpeed, onSpawn }) {
  return (
    <header className="header panel">
      <div>
        <h1>Controlled Chaos</h1>
        <p className="sub">Autonomous agents, local simulation, emergent social behavior.</p>
      </div>
      <div className="controls">
        <button onClick={onTogglePause}>{snapshot.isPaused ? 'Resume' : 'Pause'}</button>
        <button onClick={onReset}>Reset</button>
        <button onClick={onSpawn}>Spawn Agent</button>
        <label>
          Speed
          <select value={snapshot.speed} onChange={(e) => onSpeed(Number(e.target.value))}>
            {SPEED_OPTIONS.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
          </select>
        </label>
      </div>
    </header>
  )
}

export default function App() {
  const engineRef = useRef(new SimulationEngine())
  const [snapshot, setSnapshot] = useState(engineRef.current.getSnapshot())

  useEffect(() => {
    const tick = setInterval(() => {
      setSnapshot(engineRef.current.getSnapshot())
    }, UI_TICK_MS)

    return () => clearInterval(tick)
  }, [])

  const actions = useMemo(() => ({
    onTogglePause: () => {
      engineRef.current.togglePause()
      setSnapshot(engineRef.current.getSnapshot())
    },
    onReset: () => {
      engineRef.current.reset()
      setSnapshot(engineRef.current.getSnapshot())
    },
    onSpeed: (speed) => {
      engineRef.current.setSpeed(speed)
      setSnapshot(engineRef.current.getSnapshot())
    },
    onSpawn: () => {
      engineRef.current.spawnAgent()
      setSnapshot(engineRef.current.getSnapshot())
    },
    onSelect: (id) => {
      engineRef.current.selectAgent(id)
      setSnapshot(engineRef.current.getSnapshot())
    }
  }), [])

  return (
    <div className="app-shell">
      <HeaderControls snapshot={snapshot} {...actions} />
      <main className="main-grid">
        <section className="panel canvas-panel">
          <SimulationCanvas engineRef={engineRef} snapshot={snapshot} onSelect={actions.onSelect} />
        </section>
        <Sidebar selectedAgent={snapshot.selectedAgent} agents={snapshot.agents} />
      </main>
      <EventLog events={snapshot.events} />
    </div>
  )
}
