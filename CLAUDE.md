# Geo Wars — Claude Code Guide

## Project structure

Single-file game: all logic lives in `index.html`. The `src/` directory contains modular mirrors kept for reference but **not used at runtime** — changes must be made in `index.html`.

```
index.html          ← THE game (edit this)
src/                ← reference mirrors only (do not deploy)
tests/unit/         ← Vitest unit tests
tests/e2e/          ← Playwright E2E tests
tests/setup/        ← globals.js loads game classes into test scope
.github/workflows/  ← GitHub Pages auto-deploy on push to main
```

## Running tests

```bash
npm install
npm run test:unit   # fast, no browser — run this after every change
npm run test:e2e    # requires: npx playwright install
```

All 248 unit tests must pass before committing. The unit tests use `vm.Script.runInThisContext()` to load game globals — see `tests/setup/globals.js`.

## Branching & PRs

- Work on feature branches (`claude/feature-name`), never directly on `main`
- Open a PR to `main`; merging triggers automatic GitHub Pages deploy
- The pending PRs to merge are tracked in the open PRs on GitHub

## Key conventions

- **No build step** — keep `index.html` self-contained; do not introduce bundlers or transpilers
- **No new files** for game logic — extend `index.html` only
- Game state machine states: `profile_select | phase_select | menu | pairing | playing | level_clear | phase_clear | gameover | paused`
- Click zones are rebuilt every frame via `_addZone()`. Zones registered first win on overlap.
- `InputManager.update()` short-circuits to remote input when `_remoteInput !== null` (phone controller active)
- `e.preventDefault()` is intentionally absent from touch handlers — `touch-action: none` on the canvas handles scroll/zoom prevention, and we need click events to synthesise for menus

## Phone controller

- Desktop: `Game` creates a `PeerManager`, shows QR code in `'pairing'` state
- Phone: detects `?controller=PEERID` in URL, runs `_initControllerMode()` instead of the game
- Message format: `{ lx, ly, rx, ry, s }` (~40 bytes, sent on every touch event)
- Works on same-WiFi (STUN); cross-network needs a TURN server (not currently configured)

## Deployment

Push to `main` → GitHub Actions runs `.github/workflows/pages.yml` → deploys to `gh-pages` branch → served at `https://mearkus.github.io/geowars/`.
