import { describe, it, expect, beforeEach } from 'vitest';

const W = 800;
const H = 600;

describe('Bullet', () => {
  describe('constructor', () => {
    it('sets pos from x,y arguments', () => {
      const b = new Bullet(100, 200, 0, 0);
      expect(b.pos.x).toBe(100);
      expect(b.pos.y).toBe(200);
    });

    it('sets vel from vx,vy arguments', () => {
      const b = new Bullet(0, 0, 300, -400);
      expect(b.vel.x).toBe(300);
      expect(b.vel.y).toBe(-400);
    });

    it('dead starts false', () => {
      expect(new Bullet(0, 0, 1, 0).dead).toBe(false);
    });

    it('trail starts empty', () => {
      expect(new Bullet(0, 0, 1, 0).trail).toEqual([]);
    });

    it('radius is 3', () => {
      expect(new Bullet(0, 0, 0, 0).radius).toBe(3);
    });

    it('color is yellow (#ffff00)', () => {
      expect(new Bullet(0, 0, 0, 0).color).toBe('#ffff00');
    });

    it('gridStrength is -1.5', () => {
      expect(new Bullet(0, 0, 0, 0).gridStrength).toBe(-1.5);
    });
  });

  describe('update() — movement', () => {
    it('moves in the x direction by vel.x * dt', () => {
      const b = new Bullet(100, 100, 200, 0);
      b.update(0.5, W, H);
      expect(b.pos.x).toBeCloseTo(200, 5); // 100 + 200*0.5
    });

    it('moves in the y direction by vel.y * dt', () => {
      const b = new Bullet(100, 100, 0, -300);
      b.update(1 / 60, W, H);
      expect(b.pos.y).toBeCloseTo(100 + (-300) * (1 / 60), 5);
    });

    it('does not move when velocity is zero', () => {
      const b = new Bullet(250, 350, 0, 0);
      b.update(0.1, W, H);
      expect(b.pos.x).toBe(250);
      expect(b.pos.y).toBe(350);
    });
  });

  describe('update() — trail', () => {
    it('pushes a clone of pos into trail each frame', () => {
      const b = new Bullet(100, 100, 100, 0);
      b.update(0.1, W, H);
      expect(b.trail.length).toBe(1);
    });

    it('trail grows to at most 7 entries', () => {
      const b = new Bullet(400, 300, 10, 0);
      for (let i = 0; i < 20; i++) b.update(0.016, W, H);
      expect(b.trail.length).toBeLessThanOrEqual(7);
    });

    it('trail entry is a clone (distinct from current pos)', () => {
      const b = new Bullet(100, 100, 100, 0);
      b.update(0.1, W, H);
      const trailPoint = b.trail[0];
      expect(trailPoint).not.toBe(b.pos);
      expect(trailPoint.x).toBeCloseTo(100, 5); // captured before move
    });
  });

  describe('update() — dead flag (out of bounds)', () => {
    it('stays alive while inside the canvas', () => {
      const b = new Bullet(400, 300, 100, 0);
      b.update(0.016, W, H);
      expect(b.dead).toBe(false);
    });

    it('dies when it exits left (x < -10)', () => {
      const b = new Bullet(-11, 300, -1000, 0);
      b.update(0.016, W, H);
      expect(b.dead).toBe(true);
    });

    it('dies when it exits right (x > W + 10)', () => {
      const b = new Bullet(W + 11, 300, 1000, 0);
      b.update(0.016, W, H);
      expect(b.dead).toBe(true);
    });

    it('dies when it exits top (y < -10)', () => {
      const b = new Bullet(400, -11, 0, -1000);
      b.update(0.016, W, H);
      expect(b.dead).toBe(true);
    });

    it('dies when it exits bottom (y > H + 10)', () => {
      const b = new Bullet(400, H + 11, 0, 1000);
      b.update(0.016, W, H);
      expect(b.dead).toBe(true);
    });

    it('does not die when just inside the left margin (x = -9)', () => {
      const b = new Bullet(-9, 300, 0, 0); // stationary, inside margin
      b.update(0.1, W, H);
      expect(b.dead).toBe(false);
    });
  });
});

describe('createEnemy', () => {
  it('returns a Grunt for type "Grunt"', () => {
    expect(createEnemy('Grunt', 100, 100)).toBeInstanceOf(Grunt);
  });

  it('returns a Wanderer for type "Wanderer"', () => {
    expect(createEnemy('Wanderer', 100, 100)).toBeInstanceOf(Wanderer);
  });

  it('returns a Pinwheel for type "Pinwheel"', () => {
    expect(createEnemy('Pinwheel', 100, 100)).toBeInstanceOf(Pinwheel);
  });

  it('returns a Snake for type "Snake"', () => {
    expect(createEnemy('Snake', 100, 100)).toBeInstanceOf(Snake);
  });

  it('returns a Bloomer for type "Bloomer"', () => {
    expect(createEnemy('Bloomer', 100, 100, 'large')).toBeInstanceOf(Bloomer);
  });

  it('Bloomer sz is passed through correctly', () => {
    const b = createEnemy('Bloomer', 100, 100, 'medium');
    expect(b.sz).toBe('medium');
  });

  it('Bloomer defaults to large when sz is omitted', () => {
    const b = createEnemy('Bloomer', 100, 100);
    expect(b.sz).toBe('large');
  });

  it('unknown type falls back to Grunt', () => {
    expect(createEnemy('Unknown', 100, 100)).toBeInstanceOf(Grunt);
  });

  it('enemy is placed at the given x,y position', () => {
    const e = createEnemy('Grunt', 123, 456);
    expect(e.pos.x).toBe(123);
    expect(e.pos.y).toBe(456);
  });
});

describe('Enemy base — clampBounds()', () => {
  it('clamps pos.x to [margin, W-margin]', () => {
    const e = new Grunt(-999, 300);
    e.clampBounds(800, 600);
    expect(e.pos.x).toBe(12);
  });

  it('clamps pos.x upper bound', () => {
    const e = new Grunt(9999, 300);
    e.clampBounds(800, 600);
    expect(e.pos.x).toBe(788); // 800 - 12
  });

  it('clamps pos.y to [margin, H-margin]', () => {
    const e = new Grunt(400, -999);
    e.clampBounds(800, 600);
    expect(e.pos.y).toBe(12);
  });

  it('clamps pos.y upper bound', () => {
    const e = new Grunt(400, 9999);
    e.clampBounds(800, 600);
    expect(e.pos.y).toBe(588); // 600 - 12
  });

  it('does not move a point already inside bounds', () => {
    const e = new Grunt(400, 300);
    e.clampBounds(800, 600);
    expect(e.pos.x).toBe(400);
    expect(e.pos.y).toBe(300);
  });

  it('respects custom margin argument', () => {
    const e = new Grunt(0, 300);
    e.clampBounds(800, 600, 20);
    expect(e.pos.x).toBe(20);
  });
});
