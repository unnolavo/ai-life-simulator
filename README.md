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

1. Install dependencies.
2. Run:

```bash
npm run deploy
```

This publishes `dist/` to the `gh-pages` branch using the `gh-pages` package.

## Controls

- **Pause / Resume** simulation
- **Reset Simulation**
- **Simulation speed**: 1x / 2x / 3x
- **Spawn New Agent**
- **Scenario presets**: Balanced / Social / Volatile
- **Seeded reset** for reproducible runs
- **Selected events only** toggle to focus on one agent
- Click any agent on the canvas to inspect details in the sidebar

## Tuning knobs

Update these files to tweak behavior:

- **Agent count**: `INITIAL_AGENT_COUNT` in `src/simulation/constants.js`
- **Behavior traits / motion tuning**: values in `src/simulation/engine.js` and defaults in `src/simulation/agent.js`
- **World size**: `WORLD_WIDTH` and `WORLD_HEIGHT` in `src/simulation/constants.js`
- **Interaction radius**: `INTERACTION_RADIUS` in `src/simulation/constants.js`
- **Memory/arc sensitivity**: `ARC_STREAK_THRESHOLD` and `MEMORY_DECAY_PER_SECOND` in `src/simulation/constants.js`

## Architecture

- `src/simulation/*`: simulation engine and agent logic (kept outside React render loop)
- `src/components/*`: canvas, sidebar, and event log UI
- `src/utils/helpers.js`: utilities and formatting

## Future AI hook

`generateEventNarration(eventData)` in `src/simulation/engine.js` currently uses local templates, and is structured to swap in API narration later.


## Troubleshooting GitHub Pages (blank/white screen)

If Pages loads a white screen, the most common cause is broken JS/CSS asset paths.

- This project now uses `base: './'` in `vite.config.js`, which is safe for repo-name changes and subpath hosting.
- Rebuild and redeploy after pulling latest changes:

```bash
npm install
npm run deploy
```

- Then hard-refresh the page (`Ctrl+Shift+R` / `Cmd+Shift+R`) to clear stale cached assets.


## Recommended Pages setup (prevents white screens)

Use **GitHub Actions** as the Pages source (Settings → Pages → Build and deployment → Source = `GitHub Actions`).

Why: deploying a code branch directly serves raw `index.html` + `src/main.jsx` (unbuilt JSX), which can produce a blank white page even when there are no 404s.

This repo includes `.github/workflows/deploy-pages.yml` to build with Vite and publish `dist/` automatically.


## Debug Snapshot

A lightweight debug panel shows scenario, seed, simulation time, interactions, average energy, and agent count to make tuning faster.


## Event arcs and memory

Agents now maintain short-term interaction memory, and repeated positive/negative streaks can emit higher-level arc events (friendship, rivalry, reconciliation).
