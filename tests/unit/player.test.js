import { describe, it, expect, beforeEach } from 'vitest';

const W = 800;
const H = 600;

function makeInput(overrides = {}) {
  return {
    left: new Vec2(0, 0),
    right: new Vec2(0, 0),
    shooting: false,
    ...overrides,
  };
}

describe('Player', () => {
  let player;
  let input;

  beforeEach(() => {
    player = new Player(400, 300);
    input = makeInput();
  });

  describe('constructor', () => {
    it('sets pos correctly', () => {
      const p = new Player(100, 200);
      expect(p.pos.x).toBe(100);
      expect(p.pos.y).toBe(200);
    });

    it('sets invincible to 0', () => {
      expect(player.invincible).toBe(0);
    });

    it('sets fireT to 0', () => {
      expect(player.fireT).toBe(0);
    });

    it('sets vel to (0, 0)', () => {
      expect(player.vel.x).toBe(0);
      expect(player.vel.y).toBe(0);
    });

    it('has size 12', () => {
      expect(player.size).toBe(12);
    });
  });

  describe('canFire()', () => {
    it('returns true initially', () => {
      expect(player.canFire()).toBe(true);
    });

    it('returns false immediately after fire()', () => {
      player.fire(new Vec2(1, 0));
      expect(player.canFire()).toBe(false);
    });

    it('returns true again after fireT elapses via update', () => {
      player.fire(new Vec2(1, 0));
      expect(player.canFire()).toBe(false);
      // fireT is set to 0.08 by fire(); advance by more than that
      player.update(0.1, input, W, H);
      expect(player.canFire()).toBe(true);
    });

    it('remains false if dt is less than fireT', () => {
      player.fire(new Vec2(1, 0));
      player.update(0.01, input, W, H); // 0.01 < 0.08
      expect(player.canFire()).toBe(false);
    });
  });

  describe('fire()', () => {
    it('returns a Bullet instance', () => {
      const bullet = player.fire(new Vec2(1, 0));
      expect(bullet).toBeInstanceOf(Bullet);
    });

    it('bullet starts at player position', () => {
      const bullet = player.fire(new Vec2(1, 0));
      expect(bullet.pos.x).toBeCloseTo(player.pos.x, 5);
      expect(bullet.pos.y).toBeCloseTo(player.pos.y, 5);
    });

    it('bullet velocity direction matches fire direction (approximately)', () => {
      const dir = new Vec2(1, 0);
      const bullet = player.fire(dir);
      // vel.x should be positive (rightward), vel.y near 0 with small spread
      expect(bullet.vel.x).toBeGreaterThan(0);
      // speed is approximately 610
      const speed = Math.sqrt(bullet.vel.x * bullet.vel.x + bullet.vel.y * bullet.vel.y);
      expect(speed).toBeCloseTo(610, 0);
    });

    it('bullet has non-zero velocity', () => {
      const bullet = player.fire(new Vec2(0, 1));
      const speed = Math.sqrt(bullet.vel.x * bullet.vel.x + bullet.vel.y * bullet.vel.y);
      expect(speed).toBeGreaterThan(0);
    });

    it('sets fireT > 0 after firing', () => {
      expect(player.fireT).toBe(0);
      player.fire(new Vec2(1, 0));
      expect(player.fireT).toBeGreaterThan(0);
    });

    it('fireT is set to 0.08', () => {
      player.fire(new Vec2(1, 0));
      expect(player.fireT).toBeCloseTo(0.08, 10);
    });
  });

  describe('update() movement', () => {
    it('left input (1,0) → vel.x increases (moves right)', () => {
      const inp = makeInput({ left: new Vec2(1, 0) });
      player.update(0.1, inp, W, H);
      expect(player.vel.x).toBeGreaterThan(0);
    });

    it('left input (0,1) → vel.y increases (moves down)', () => {
      const inp = makeInput({ left: new Vec2(0, 1) });
      player.update(0.1, inp, W, H);
      expect(player.vel.y).toBeGreaterThan(0);
    });

    it('no input → velocity decays toward 0', () => {
      // Give velocity first
      player.vel.x = 200;
      player.update(0.1, input, W, H);
      // With no input, target velocity is 0, so vel should be closer to 0
      expect(player.vel.x).toBeGreaterThan(0);
      expect(player.vel.x).toBeLessThan(200);
    });

    it('pos is clamped: never goes below 14 on x', () => {
      const inp = makeInput({ left: new Vec2(-1, 0) });
      player.pos.x = 14;
      player.vel.x = -500;
      // update should clamp position
      player.update(0.1, inp, W, H);
      expect(player.pos.x).toBeGreaterThanOrEqual(14);
    });

    it('pos is clamped: never goes above W-14 on x', () => {
      player.pos.x = W - 14;
      player.vel.x = 500;
      player.update(0.1, input, W, H);
      expect(player.pos.x).toBeLessThanOrEqual(W - 14);
    });

    it('pos is clamped: never goes below 14 on y', () => {
      player.pos.y = 14;
      player.vel.y = -500;
      player.update(0.1, input, W, H);
      expect(player.pos.y).toBeGreaterThanOrEqual(14);
    });

    it('pos is clamped: never goes above H-14 on y', () => {
      player.pos.y = H - 14;
      player.vel.y = 500;
      player.update(0.1, input, W, H);
      expect(player.pos.y).toBeLessThanOrEqual(H - 14);
    });
  });

  describe('invincible', () => {
    it('invincible > 0 does not crash update', () => {
      player.invincible = 2.0;
      expect(() => player.update(0.016, input, W, H)).not.toThrow();
    });

    it('invincible decreases over time via update', () => {
      player.invincible = 2.0;
      player.update(0.1, input, W, H);
      expect(player.invincible).toBeLessThan(2.0);
    });

    it('invincible never goes below 0', () => {
      player.invincible = 0.01;
      player.update(1.0, input, W, H);
      expect(player.invincible).toBe(0);
    });
  });

  describe('velocity convergence toward target', () => {
    it('vel.x approaches 290 with full left input (1,0) over time', () => {
      const inp = makeInput({ left: new Vec2(1, 0) });
      // Simulate several frames
      for (let i = 0; i < 30; i++) {
        player.update(0.05, inp, W, H);
      }
      // Should be approaching the target of 290
      expect(player.vel.x).toBeGreaterThan(200);
    });
  });
});
