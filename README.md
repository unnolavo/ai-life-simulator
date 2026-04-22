# Controlled Chaos

Controlled Chaos is a browser-based AI life simulator built with **React + Vite + HTML5 Canvas**. Agents wander, seek social contact, avoid enemies, rest when tired, and continuously generate emergent relationship events.

## Quick Start

```bash
npm install
npm run dev
```

Then open the local Vite URL (usually `http://localhost:5173`).

## MVP Features

- 15 autonomous agents at startup
- Smooth canvas animation with delta-time updates
- Core behavior states:
  - wander
  - seek interaction
  - avoid enemy
  - rest
- Proximity-based interaction system with relationship + mood updates
- Live event log with local narration templates (`generateEventNarration`)
- Click-to-inspect sidebar with top friends and enemies
- Controls for pause/resume, reset, speed (1x/2x/3x), and spawn agent

## Project Structure

```txt
src/
  components/
    SimulationCanvas.jsx
    Sidebar.jsx
    EventLog.jsx
  simulation/
    engine.js
    agent.js
    constants.js
  utils/
    helpers.js
  App.jsx
  main.jsx
  styles.css
```

## Deploy to GitHub Pages

1. Update `base` in `vite.config.js` to your repo name if needed.
2. Ensure your repository is pushed to GitHub.
3. Run:

```bash
npm run deploy
```

This builds and publishes `dist/` using the `gh-pages` package.

## Tweak Points

- **Agent count**: `INITIAL_AGENT_COUNT` in `src/simulation/constants.js`
- **Behavior tuning**: agent trait setup in `src/simulation/agent.js` and behavior logic in `src/simulation/engine.js`
- **World size**: `WORLD_WIDTH` and `WORLD_HEIGHT` in `src/simulation/constants.js`
- **Interaction radius**: `INTERACTION_RADIUS` in `src/simulation/constants.js`

## Future AI Hook

`generateEventNarration(eventData)` currently uses local templates in `src/utils/helpers.js` and is designed to be swapped later for an API-backed narrative function.
