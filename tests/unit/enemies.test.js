import { describe, it, expect, beforeEach } from 'vitest';

const W = 800;
const H = 600;

describe('Grunt', () => {
  let grunt;
  let playerPos;

  beforeEach(() => {
    grunt = new Grunt(400, 300);
    playerPos = new Vec2(400, 300);
  });

  it('constructor sets color to #ff3333', () => {
    expect(grunt.color).toBe('#ff3333');
  });

  it('constructor sets size to 11', () => {
    expect(grunt.size).toBe(11);
  });

  it('constructor sets hp to 1', () => {
    expect(grunt.hp).toBe(1);
  });

  it('constructor sets score to 50', () => {
    expect(grunt.score).toBe(50);
  });

  it('constructor sets dead to false', () => {
    expect(grunt.dead).toBe(false);
  });

  it('constructor sets pendingBullets to null', () => {
    expect(grunt.pendingBullets).toBeNull();
  });

  it('update(): vel points toward playerPos', () => {
    const enemy = new Grunt(100, 100);
    const target = new Vec2(500, 100);
    enemy.update(0.016, target, W, H);
    // velocity x should be positive (moving right toward target)
    expect(enemy.vel.x).toBeGreaterThan(0);
    expect(enemy.vel.y).toBeCloseTo(0, 0);
  });

  it('update(): vel is normalized to speed when player is directly below', () => {
    const enemy = new Grunt(400, 100);
    const target = new Vec2(400, 500);
    enemy.update(0.016, target, W, H);
    expect(enemy.vel.x).toBeCloseTo(0, 1);
    expect(enemy.vel.y).toBeGreaterThan(0);
  });

  it('hit() returns false when hp goes from 2 to 1', () => {
    const enemy = new Grunt(400, 300);
    enemy.hp = 2;
    const result = enemy.hit();
    expect(result).toBe(false);
    expect(enemy.hp).toBe(1);
    expect(enemy.dead).toBe(false);
  });

  it('hit() returns true and sets dead=true when hp goes from 1 to 0', () => {
    const enemy = new Grunt(400, 300);
    enemy.hp = 1;
    const result = enemy.hit();
    expect(result).toBe(true);
    expect(enemy.dead).toBe(true);
  });

  it('flash is set after hit()', () => {
    const enemy = new Grunt(400, 300);
    expect(enemy.flash).toBe(0);
    enemy.hit();
    expect(enemy.flash).toBeGreaterThan(0);
  });

  it('collides() returns true when distance < size + r', () => {
    const enemy = new Grunt(400, 300);
    const pos = new Vec2(405, 300); // 5 units away, size=11, r=5 → threshold=16 > 5
    expect(enemy.collides(pos, 5)).toBe(true);
  });

  it('collides() returns false when distance >= size + r', () => {
    const enemy = new Grunt(400, 300);
    const pos = new Vec2(450, 300); // 50 units away, size=11, r=5 → threshold=16 < 50
    expect(enemy.collides(pos, 5)).toBe(false);
  });

  it('collides() returns false at exact boundary distance', () => {
    const enemy = new Grunt(400, 300);
    // distTo = size + r exactly → not less than, so false
    const r = 5;
    const pos = new Vec2(400 + enemy.size + r, 300);
    expect(enemy.collides(pos, r)).toBe(false);
  });
});

describe('Wanderer', () => {
  it('constructor sets color to #3399ff', () => {
    const w = new Wanderer(400, 300);
    expect(w.color).toBe('#3399ff');
  });

  it('constructor sets size to 13', () => {
    const w = new Wanderer(400, 300);
    expect(w.size).toBe(13);
  });

  it('constructor sets hp to 1', () => {
    const w = new Wanderer(400, 300);
    expect(w.hp).toBe(1);
  });

  it('constructor sets score to 100', () => {
    const w = new Wanderer(400, 300);
    expect(w.score).toBe(100);
  });

  it('pendingBullets is null (Wanderer does not shoot)', () => {
    const w = new Wanderer(400, 300);
    expect(w.pendingBullets).toBeNull();
  });

  it('bounces off left wall: pos.x < 15 → vel.x becomes positive', () => {
    const w = new Wanderer(400, 300);
    // Force position near left wall and vel moving left
    w.pos.x = 5;
    w.vel.x = -50;
    w.vel.y = 0;
    w.turnTimer = 999; // prevent random direction change
    w.update(0.016, new Vec2(400, 300), W, H);
    expect(w.vel.x).toBeGreaterThan(0);
  });

  it('bounces off top wall: pos.y < 15 → vel.y becomes positive', () => {
    const w = new Wanderer(400, 300);
    w.pos.y = 5;
    w.vel.x = 0;
    w.vel.y = -50;
    w.turnTimer = 999;
    w.update(0.016, new Vec2(400, 300), W, H);
    expect(w.vel.y).toBeGreaterThan(0);
  });

  it('bounces off right wall: pos.x > W-15 → vel.x becomes negative', () => {
    const w = new Wanderer(400, 300);
    w.pos.x = W - 5;
    w.vel.x = 50;
    w.vel.y = 0;
    w.turnTimer = 999;
    w.update(0.016, new Vec2(400, 300), W, H);
    expect(w.vel.x).toBeLessThan(0);
  });

  it('bounces off bottom wall: pos.y > H-15 → vel.y becomes negative', () => {
    const w = new Wanderer(400, 300);
    w.pos.y = H - 5;
    w.vel.x = 0;
    w.vel.y = 50;
    w.turnTimer = 999;
    w.update(0.016, new Vec2(400, 300), W, H);
    expect(w.vel.y).toBeLessThan(0);
  });
});

describe('Pinwheel', () => {
  it('constructor sets hp to 2', () => {
    const p = new Pinwheel(400, 300);
    expect(p.hp).toBe(2);
  });

  it('constructor sets pendingBullets to an empty array', () => {
    const p = new Pinwheel(400, 300);
    expect(Array.isArray(p.pendingBullets)).toBe(true);
    expect(p.pendingBullets.length).toBe(0);
  });

  it('constructor sets color to #ff44ff', () => {
    const p = new Pinwheel(400, 300);
    expect(p.color).toBe('#ff44ff');
  });

  it('constructor sets score to 150', () => {
    const p = new Pinwheel(400, 300);
    expect(p.score).toBe(150);
  });

  it('after shootTimer elapses: pendingBullets has exactly 4 Bullet instances', () => {
    const p = new Pinwheel(400, 300);
    // Force the shoot timer to expire immediately
    p.shootTimer = 0.001;
    p.update(0.016, new Vec2(400, 300), W, H);
    expect(p.pendingBullets.length).toBe(4);
    for (const b of p.pendingBullets) {
      expect(b).toBeInstanceOf(Bullet);
    }
  });

  it('each fired bullet has color #ff44ff', () => {
    const p = new Pinwheel(400, 300);
    p.shootTimer = 0.001;
    p.update(0.016, new Vec2(400, 300), W, H);
    for (const b of p.pendingBullets) {
      expect(b.color).toBe('#ff44ff');
    }
  });

  it('first hit() returns false (still alive)', () => {
    const p = new Pinwheel(400, 300);
    expect(p.hit()).toBe(false);
    expect(p.dead).toBe(false);
    expect(p.hp).toBe(1);
  });

  it('second hit() returns true (killed)', () => {
    const p = new Pinwheel(400, 300);
    p.hit();
    expect(p.hit()).toBe(true);
    expect(p.dead).toBe(true);
  });
});

describe('Snake', () => {
  it('constructor: segs starts empty', () => {
    const s = new Snake(400, 300);
    expect(s.segs).toEqual([]);
  });

  it('constructor sets color to #44ff88', () => {
    const s = new Snake(400, 300);
    expect(s.color).toBe('#44ff88');
  });

  it('constructor sets score to 75', () => {
    const s = new Snake(400, 300);
    expect(s.score).toBe(75);
  });

  it('constructor sets hp to 1', () => {
    const s = new Snake(400, 300);
    expect(s.hp).toBe(1);
  });

  it('update() accumulates segments over time (segTimer threshold is 0.04)', () => {
    const s = new Snake(400, 300);
    // Advance by more than segTimer threshold (0.04s)
    s.update(0.05, new Vec2(400, 300), W, H);
    expect(s.segs.length).toBeGreaterThan(0);
  });

  it('segments are not added when segTimer has not elapsed 0.04', () => {
    const s = new Snake(400, 300);
    // Advance by less than threshold
    s.update(0.01, new Vec2(400, 300), W, H);
    expect(s.segs.length).toBe(0);
  });

  it('angle changes continuously (turnSpeed applied each frame)', () => {
    const s = new Snake(400, 300);
    const initialAngle = s.angle;
    s.update(0.1, new Vec2(400, 300), W, H);
    // angle should have changed by turnSpeed * dt
    expect(s.angle).not.toBeCloseTo(initialAngle, 10);
  });

  it('segs are capped at 14 maximum', () => {
    const s = new Snake(400, 300);
    // Call update many times with dt > 0.04 each time
    for (let i = 0; i < 50; i++) {
      s.update(0.05, new Vec2(400, 300), W, H);
    }
    expect(s.segs.length).toBeLessThanOrEqual(14);
  });
});

describe('Bloomer', () => {
  describe('large constructor', () => {
    it('sets size=22', () => {
      const b = new Bloomer(400, 300, 'large');
      expect(b.size).toBe(22);
    });

    it('sets hp=3', () => {
      const b = new Bloomer(400, 300, 'large');
      expect(b.hp).toBe(3);
    });

    it('sets score=100', () => {
      const b = new Bloomer(400, 300, 'large');
      expect(b.score).toBe(100);
    });

    it('sets pendingSpawns=[]', () => {
      const b = new Bloomer(400, 300, 'large');
      expect(Array.isArray(b.pendingSpawns)).toBe(true);
      expect(b.pendingSpawns.length).toBe(0);
    });

    it('defaults to large when no sz argument given', () => {
      const b = new Bloomer(400, 300);
      expect(b.size).toBe(22);
      expect(b.hp).toBe(3);
    });
  });

  describe('medium constructor', () => {
    it('sets size=14', () => {
      const b = new Bloomer(400, 300, 'medium');
      expect(b.size).toBe(14);
    });

    it('sets hp=2', () => {
      const b = new Bloomer(400, 300, 'medium');
      expect(b.hp).toBe(2);
    });

    it('sets score=75', () => {
      const b = new Bloomer(400, 300, 'medium');
      expect(b.score).toBe(75);
    });
  });

  describe('small constructor', () => {
    it('sets size=9', () => {
      const b = new Bloomer(400, 300, 'small');
      expect(b.size).toBe(9);
    });

    it('sets hp=1', () => {
      const b = new Bloomer(400, 300, 'small');
      expect(b.hp).toBe(1);
    });

    it('sets score=50', () => {
      const b = new Bloomer(400, 300, 'small');
      expect(b.score).toBe(50);
    });
  });

  describe('large hit() behavior', () => {
    it('requires 3 hits to kill', () => {
      const b = new Bloomer(400, 300, 'large');
      expect(b.hit()).toBe(false); // hp: 3→2
      expect(b.hit()).toBe(false); // hp: 2→1
      expect(b.hit()).toBe(true);  // hp: 1→0, killed
    });

    it('on kill, pendingSpawns has 3 medium Bloomers', () => {
      const b = new Bloomer(400, 300, 'large');
      b.hit(); b.hit(); b.hit();
      expect(b.pendingSpawns.length).toBe(3);
      for (const spawn of b.pendingSpawns) {
        expect(spawn).toBeInstanceOf(Bloomer);
        expect(spawn.sz).toBe('medium');
      }
    });

    it('pendingSpawns stays empty until killed', () => {
      const b = new Bloomer(400, 300, 'large');
      b.hit(); // hp: 3→2
      expect(b.pendingSpawns.length).toBe(0);
      b.hit(); // hp: 2→1
      expect(b.pendingSpawns.length).toBe(0);
    });
  });

  describe('medium hit() behavior', () => {
    it('requires 2 hits to kill', () => {
      const b = new Bloomer(400, 300, 'medium');
      expect(b.hit()).toBe(false); // hp: 2→1
      expect(b.hit()).toBe(true);  // hp: 1→0, killed
    });

    it('on kill, pendingSpawns has 4 small Bloomers', () => {
      const b = new Bloomer(400, 300, 'medium');
      b.hit(); b.hit();
      expect(b.pendingSpawns.length).toBe(4);
      for (const spawn of b.pendingSpawns) {
        expect(spawn).toBeInstanceOf(Bloomer);
        expect(spawn.sz).toBe('small');
      }
    });
  });

  describe('small hit() behavior', () => {
    it('requires 1 hit to kill', () => {
      const b = new Bloomer(400, 300, 'small');
      expect(b.hit()).toBe(true);
      expect(b.dead).toBe(true);
    });

    it('pendingSpawns remains empty after kill', () => {
      const b = new Bloomer(400, 300, 'small');
      b.hit();
      expect(b.pendingSpawns.length).toBe(0);
    });
  });
});
