# Geo Wars

A Geometry Wars-style twin-stick shooter built as a single self-contained `index.html`. No build step required.

**Play:** https://mearkus.github.io/geowars/

---

## Features

- **30 levels** across 5 phases (Sector Alpha → Omega) + Endless mode
- **5 enemy types:** Grunt, Wanderer, Pinwheel, Snake, Bloomer (splits on death)
- **3 save slots** with persistent profiles (high score, level, kill count)
- **Kill multiplier** ×1–×20 with decay timer
- **Phone as controller** — scan a QR code to use your phone as a dual-stick gamepad over WebRTC
- Neon glow visuals, deforming grid, particle effects, screen shake, Web Audio synth
- Mobile-optimised: dual virtual joysticks, safe-area support, landscape layout

---

## Controls

| Input | Move | Aim / Fire |
|-------|------|------------|
| Keyboard | WASD / Arrow keys | IJKL |
| Mouse | WASD | Click & hold |
| Touch | Left virtual stick | Right virtual stick |
| Phone controller | Left joystick | Right joystick |

---

## Phone Controller

1. Open the game on a desktop/TV browser
2. From the main menu tap **PHONE CTRL**
3. Scan the QR code with your phone
4. Your phone becomes a dual-stick gamepad — no app install needed

Requires both devices on the same WiFi network (WebRTC peer-to-peer via [PeerJS](https://peerjs.com)).

---

## Running Locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Tests

```bash
npm install

# Unit tests (Vitest, no browser needed)
npm run test:unit

# E2E tests (Playwright — requires browser install)
npx playwright install
npm run test:e2e

# Both
npm run test:all
```

248 unit tests cover: Vec2, utils, enemies, player, wave spawner, profile manager, scoring.

---

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the workflow at `.github/workflows/pages.yml`.

---

## Architecture

Everything runs in `index.html` — CSS, game logic, and audio are all inline. Key classes:

| Class | Purpose |
|-------|---------|
| `Vec2` | 2D vector math |
| `InputManager` | Keyboard, mouse, touch, and remote (phone) input |
| `PeerManager` | WebRTC DataChannel for phone controller |
| `AudioManager` | Web Audio API synth sound effects |
| `Grid` | Deforming background grid |
| `Player` | Player ship with velocity smoothing |
| `Grunt/Wanderer/Pinwheel/Snake/Bloomer` | Enemy types |
| `WaveSpawner` | Level wave sequencing |
| `ProfileManager` | localStorage save slots |
| `Game` | State machine + render loop |

The `src/` directory contains modular source mirrors of the inline code — kept for reference but not used at runtime.
