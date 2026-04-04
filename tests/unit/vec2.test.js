import { describe, it, expect } from 'vitest';

describe('Vec2', () => {
  describe('constructor', () => {
    it('defaults to (0, 0)', () => {
      const v = new Vec2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('accepts x and y arguments', () => {
      const v = new Vec2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('accepts negative values', () => {
      const v = new Vec2(-5, -10);
      expect(v.x).toBe(-5);
      expect(v.y).toBe(-10);
    });
  });

  describe('clone', () => {
    it('returns a new Vec2 with the same values', () => {
      const a = new Vec2(7, -3);
      const b = a.clone();
      expect(b.x).toBe(7);
      expect(b.y).toBe(-3);
    });

    it('returns a distinct object (not the same reference)', () => {
      const a = new Vec2(1, 2);
      const b = a.clone();
      expect(b).not.toBe(a);
    });

    it('mutating clone does not affect original', () => {
      const a = new Vec2(1, 2);
      const b = a.clone();
      b.x = 99;
      expect(a.x).toBe(1);
    });
  });

  describe('set', () => {
    it('updates x and y in place', () => {
      const v = new Vec2(0, 0);
      v.set(5, 10);
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
    });

    it('returns the same Vec2 instance for chaining', () => {
      const v = new Vec2();
      const result = v.set(3, 4);
      expect(result).toBe(v);
    });
  });

  describe('add', () => {
    it('returns a new Vec2 with summed components', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      const c = a.add(b);
      expect(c.x).toBe(4);
      expect(c.y).toBe(6);
    });

    it('does not mutate the original vectors', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      a.add(b);
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
    });

    it('returns a new object reference', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      expect(a.add(b)).not.toBe(a);
    });
  });

  describe('sub', () => {
    it('returns a new Vec2 with difference of components', () => {
      const a = new Vec2(5, 7);
      const b = new Vec2(2, 3);
      const c = a.sub(b);
      expect(c.x).toBe(3);
      expect(c.y).toBe(4);
    });

    it('handles negative results', () => {
      const a = new Vec2(1, 1);
      const b = new Vec2(5, 3);
      const c = a.sub(b);
      expect(c.x).toBe(-4);
      expect(c.y).toBe(-2);
    });

    it('does not mutate the original vectors', () => {
      const a = new Vec2(5, 7);
      const b = new Vec2(2, 3);
      a.sub(b);
      expect(a.x).toBe(5);
      expect(a.y).toBe(7);
    });
  });

  describe('scale', () => {
    it('multiplies both components by a scalar', () => {
      const v = new Vec2(3, 4);
      const r = v.scale(2);
      expect(r.x).toBe(6);
      expect(r.y).toBe(8);
    });

    it('scales by zero returns (0, 0)', () => {
      const v = new Vec2(3, 4);
      const r = v.scale(0);
      expect(r.x).toBe(0);
      expect(r.y).toBe(0);
    });

    it('scales by negative scalar', () => {
      const v = new Vec2(2, -3);
      const r = v.scale(-1);
      expect(r.x).toBe(-2);
      expect(r.y).toBe(3);
    });

    it('does not mutate the original', () => {
      const v = new Vec2(3, 4);
      v.scale(10);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  describe('dot', () => {
    it('computes dot product correctly', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      expect(a.dot(b)).toBe(11); // 1*3 + 2*4 = 11
    });

    it('perpendicular vectors have dot product 0', () => {
      const a = new Vec2(1, 0);
      const b = new Vec2(0, 1);
      expect(a.dot(b)).toBe(0);
    });

    it('dot product of parallel vectors equals product of magnitudes', () => {
      const a = new Vec2(3, 0);
      const b = new Vec2(5, 0);
      expect(a.dot(b)).toBe(15);
    });

    it('dot product with itself equals lenSq', () => {
      const v = new Vec2(3, 4);
      expect(v.dot(v)).toBe(v.lenSq());
    });
  });

  describe('len', () => {
    it('returns correct length for 3-4-5 triangle', () => {
      const v = new Vec2(3, 4);
      expect(v.len()).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      const v = new Vec2(0, 0);
      expect(v.len()).toBe(0);
    });

    it('returns 1 for unit vector (1, 0)', () => {
      const v = new Vec2(1, 0);
      expect(v.len()).toBe(1);
    });
  });

  describe('lenSq', () => {
    it('returns squared length', () => {
      const v = new Vec2(3, 4);
      expect(v.lenSq()).toBe(25);
    });

    it('returns 0 for zero vector', () => {
      const v = new Vec2(0, 0);
      expect(v.lenSq()).toBe(0);
    });

    it('avoids square root: lenSq equals len squared', () => {
      const v = new Vec2(5, 12);
      expect(v.lenSq()).toBeCloseTo(v.len() * v.len(), 10);
    });
  });

  describe('norm', () => {
    it('returns a unit vector with length 1', () => {
      const v = new Vec2(3, 4);
      const n = v.norm();
      expect(n.len()).toBeCloseTo(1, 10);
    });

    it('preserves direction', () => {
      const v = new Vec2(0, 5);
      const n = v.norm();
      expect(n.x).toBeCloseTo(0, 10);
      expect(n.y).toBeCloseTo(1, 10);
    });

    it('zero vector returns (0, 0) without throwing', () => {
      const v = new Vec2(0, 0);
      const n = v.norm();
      expect(n.x).toBe(0);
      expect(n.y).toBe(0);
    });

    it('returns a new Vec2 (does not mutate)', () => {
      const v = new Vec2(3, 4);
      const n = v.norm();
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
      expect(n).not.toBe(v);
    });
  });

  describe('angle', () => {
    it('right vector (1, 0) → angle 0', () => {
      const v = new Vec2(1, 0);
      expect(v.angle()).toBeCloseTo(0, 10);
    });

    it('up vector (0, -1) → angle -PI/2', () => {
      const v = new Vec2(0, -1);
      expect(v.angle()).toBeCloseTo(-Math.PI / 2, 10);
    });

    it('left vector (-1, 0) → angle PI', () => {
      const v = new Vec2(-1, 0);
      expect(Math.abs(v.angle())).toBeCloseTo(Math.PI, 10);
    });

    it('down vector (0, 1) → angle PI/2', () => {
      const v = new Vec2(0, 1);
      expect(v.angle()).toBeCloseTo(Math.PI / 2, 10);
    });

    it('diagonal (1, 1) → angle PI/4', () => {
      const v = new Vec2(1, 1);
      expect(v.angle()).toBeCloseTo(Math.PI / 4, 10);
    });
  });

  describe('distTo', () => {
    it('distance between two points is correct', () => {
      const a = new Vec2(0, 0);
      const b = new Vec2(3, 4);
      expect(a.distTo(b)).toBe(5);
    });

    it('distance from self is 0', () => {
      const v = new Vec2(7, 3);
      expect(v.distTo(v)).toBe(0);
    });

    it('distance is symmetric', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(4, 6);
      expect(a.distTo(b)).toBeCloseTo(b.distTo(a), 10);
    });
  });

  describe('static fromAngle', () => {
    it('angle 0 returns (1, 0) with default len=1', () => {
      const v = Vec2.fromAngle(0);
      expect(v.x).toBeCloseTo(1, 10);
      expect(v.y).toBeCloseTo(0, 10);
    });

    it('angle PI/2 returns (0, 1)', () => {
      const v = Vec2.fromAngle(Math.PI / 2);
      expect(v.x).toBeCloseTo(0, 10);
      expect(v.y).toBeCloseTo(1, 10);
    });

    it('respects the len parameter', () => {
      const v = Vec2.fromAngle(0, 5);
      expect(v.x).toBeCloseTo(5, 10);
      expect(v.y).toBeCloseTo(0, 10);
    });

    it('x component equals cos(a) * len', () => {
      const a = 1.23;
      const len = 7;
      const v = Vec2.fromAngle(a, len);
      expect(v.x).toBeCloseTo(Math.cos(a) * len, 10);
    });

    it('y component equals sin(a) * len', () => {
      const a = 1.23;
      const len = 7;
      const v = Vec2.fromAngle(a, len);
      expect(v.y).toBeCloseTo(Math.sin(a) * len, 10);
    });
  });

  describe('static lerp', () => {
    it('t=0 returns point a', () => {
      const a = new Vec2(0, 0);
      const b = new Vec2(10, 20);
      const r = Vec2.lerp(a, b, 0);
      expect(r.x).toBeCloseTo(0, 10);
      expect(r.y).toBeCloseTo(0, 10);
    });

    it('t=1 returns point b', () => {
      const a = new Vec2(0, 0);
      const b = new Vec2(10, 20);
      const r = Vec2.lerp(a, b, 1);
      expect(r.x).toBeCloseTo(10, 10);
      expect(r.y).toBeCloseTo(20, 10);
    });

    it('t=0.5 returns midpoint', () => {
      const a = new Vec2(0, 0);
      const b = new Vec2(10, 20);
      const r = Vec2.lerp(a, b, 0.5);
      expect(r.x).toBeCloseTo(5, 10);
      expect(r.y).toBeCloseTo(10, 10);
    });

    it('returns a new Vec2 (does not mutate a or b)', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      const r = Vec2.lerp(a, b, 0.5);
      expect(r).not.toBe(a);
      expect(r).not.toBe(b);
      expect(a.x).toBe(1);
      expect(b.x).toBe(3);
    });
  });
});
