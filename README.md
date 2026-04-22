# Controlled Chaos

Controlled Chaos is a browser-based AI life simulator MVP built with React + Vite + HTML5 Canvas. Autonomous agents wander, form relationships, and generate emergent social events in real time.

## Features

- 2D world simulation with **15 initial agents**
- Agent personality model: aggression, sociability, curiosity, mood, energy
- Behavior loop: wander, seek interaction, avoid enemy, rest
- Proximity-based interactions and relationship changes
- Live event narration via local templates (`generateEventNarration`)
- Canvas rendering with glow effects and smooth animation loop
- UI controls: Pause/Resume, Reset, speed (1x/2x/3x), Spawn new agent
- Agent inspector sidebar + top friends/enemies

## Setup

```bash
npm install
npm run dev
```

The app opens on the local Vite dev URL.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push repository to GitHub.
2. Ensure `package.json` includes:
   - `"build": "vite build"`
   - `"deploy": "npm run build && gh-pages -d dist"`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```
5. In GitHub repo settings, ensure Pages is configured to serve from `gh-pages` branch.

## Tweak points

- **Agent count:** `src/simulation/constants.js` → `INITIAL_AGENT_COUNT`
- **Behavior traits + thresholds:** `src/simulation/engine.js` (`chooseBehavior`, `maybeInteract`)
- **World size:** `src/simulation/constants.js` → `WORLD_WIDTH`, `WORLD_HEIGHT`
- **Interaction radius:** `src/simulation/constants.js` → `INTERACTION_RADIUS`
- **Event narration templates:** `src/simulation/constants.js` → `EVENT_TEMPLATES`
