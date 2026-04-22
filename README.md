# Controlled Chaos (MVP)

A browser-based AI life simulator where autonomous agents wander, interact, form relationships, and display emergent social behavior in real time.

## Setup

```bash
npm install
npm run dev
```

Open the local URL from Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Ensure your GitHub repo name matches the Vite base path in `vite.config.js` (currently `/ai-life-simulator/`).
2. Install dependencies.
3. Run:

```bash
npm run deploy
```

This publishes `dist/` to the `gh-pages` branch using the `gh-pages` package.

## Controls

- **Pause / Resume** simulation
- **Reset Simulation**
- **Simulation speed**: 1x / 2x / 3x
- **Spawn New Agent**
- Click any agent on the canvas to inspect details in the sidebar

## Tuning knobs

Update these files to tweak behavior:

- **Agent count**: `INITIAL_AGENT_COUNT` in `src/simulation/constants.js`
- **Behavior traits / motion tuning**: values in `src/simulation/engine.js` and defaults in `src/simulation/agent.js`
- **World size**: `WORLD_WIDTH` and `WORLD_HEIGHT` in `src/simulation/constants.js`
- **Interaction radius**: `INTERACTION_RADIUS` in `src/simulation/constants.js`

## Architecture

- `src/simulation/*`: simulation engine and agent logic (kept outside React render loop)
- `src/components/*`: canvas, sidebar, and event log UI
- `src/utils/helpers.js`: utilities and formatting

## Future AI hook

`generateEventNarration(eventData)` in `src/simulation/engine.js` currently uses local templates, and is structured to swap in API narration later.
