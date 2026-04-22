# Controlled Chaos

Controlled Chaos is a browser-based AI life simulator MVP built with React + Vite + HTML5 Canvas. Autonomous agents wander, react to neighbors, update relationships, and generate local narrative events.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This project includes a `deploy` script that publishes `dist` using `gh-pages`.

1. Create a GitHub repository.
2. Push this project to the default branch.
3. (Optional) Update `vite.config.js` base path if your repo name is not `ai-life-simulator`.
4. Run:

```bash
GITHUB_PAGES=true npm run deploy
```

5. In GitHub repository settings, enable GitHub Pages from the `gh-pages` branch.

## Tuning knobs

You can tweak simulation behavior in these files:

- **Agent count**: `INITIAL_AGENT_COUNT` in `src/simulation/constants.js`
- **Behavior traits and transitions**: `src/simulation/agent.js`
- **World size**: `WORLD_WIDTH`, `WORLD_HEIGHT` in `src/simulation/constants.js`
- **Interaction radius**: `INTERACTION_RADIUS` in `src/simulation/constants.js`

## Architecture notes

- Simulation loop runs via `requestAnimationFrame` inside `SimulationCanvas`.
- Per-frame state lives in `SimulationEngine` and `Agent` classes, not React state.
- UI snapshots update at a lower frequency using `UI_UPDATE_INTERVAL`.
- Event narration currently uses local templates via `generateEventNarration(eventData)` and can later be replaced with an API-backed implementation.
