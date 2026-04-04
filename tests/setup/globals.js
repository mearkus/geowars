import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';
import { Script } from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../');

// ── Mock AudioContext ──────────────────────────────────────────────────────────
const mockGain = {
  gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
};
const mockOsc = {
  type: 'sine',
  frequency: { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};
const mockFilter = {
  type: 'lowpass',
  frequency: { value: 800 },
  connect: vi.fn(),
};
const mockCtxInstance = {
  state: 'running',
  currentTime: 0,
  destination: {},
  createGain: vi.fn(() => ({ ...mockGain })),
  createOscillator: vi.fn(() => ({ ...mockOsc })),
  createBiquadFilter: vi.fn(() => ({ ...mockFilter })),
  resume: vi.fn(),
};
global.AudioContext = vi.fn(() => mockCtxInstance);
global.webkitAudioContext = vi.fn(() => mockCtxInstance);

// ── Mock canvas ────────────────────────────────────────────────────────────────
const mockCtx2d = {
  fillRect: vi.fn(), clearRect: vi.fn(), strokeRect: vi.fn(),
  beginPath: vi.fn(), closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(),
  save: vi.fn(), restore: vi.fn(),
  translate: vi.fn(), rotate: vi.fn(),
  fillText: vi.fn(), strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '', strokeStyle: '', shadowColor: '', shadowBlur: 0,
  lineWidth: 1, globalAlpha: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
};
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx2d);
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600,
}));

// ── Mock requestAnimationFrame ─────────────────────────────────────────────────
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// ── Mock localStorage ──────────────────────────────────────────────────────────
const store = {};
global.localStorage = {
  getItem: vi.fn(k => store[k] ?? null),
  setItem: vi.fn((k, v) => { store[k] = String(v); }),
  removeItem: vi.fn(k => { delete store[k]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
};

// ── Mock window dimensions ─────────────────────────────────────────────────────
Object.defineProperty(window, 'innerWidth',  { value: 800, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

// ── Load game source files in order ───────────────────────────────────────────
// Each file defines globals (Vec2, rand, Enemy, etc.) — we eval them in order
// so they share the same global scope as the tests.
// ── Load game source files into global scope ───────────────────────────────────
// runInThisContext executes in the current V8 context so top-level declarations
// (class, const, function) become reachable via global after explicit assignment.
const srcFiles = ['core.js', 'entities.js', 'data.js'];
for (const file of srcFiles) {
  const raw = readFileSync(join(ROOT, 'src', file), 'utf8');
  // Strip 'use strict' so top-level class/const reach global scope via runInThisContext
  const code = raw.replace(/^['"]use strict['"];?\s*/m, '');
  new Script(code).runInThisContext();
}

// Pin every name onto global so tests can reference them without qualification
Object.assign(global, {
  Vec2, rand, randInt, clamp, lerp,
  AudioManager, Bullet, Particle, ParticleSystem, Grid,
  Enemy, Grunt, Wanderer, Pinwheel, Snake, Bloomer, Player,
  PHASES_DATA, LEVELS_DATA, getLevelData, createEnemy,
  WaveSpawner, ProfileManager,
});
