import { describe, it, expect } from 'vitest';

describe('clamp', () => {
  it('returns lo when value is below lo', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, -10, 10)).toBe(-10);
  });

  it('returns hi when value is above hi', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(999, 0, 100)).toBe(100);
  });

  it('returns the value unchanged when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('handles floating point values', () => {
    expect(clamp(0.5, 0, 1)).toBeCloseTo(0.5, 10);
    expect(clamp(-0.1, 0, 1)).toBeCloseTo(0, 10);
    expect(clamp(1.1, 0, 1)).toBeCloseTo(1, 10);
  });

  it('handles equal lo and hi (degenerate range)', () => {
    expect(clamp(5, 7, 7)).toBe(7);
    expect(clamp(7, 7, 7)).toBe(7);
    expect(clamp(9, 7, 7)).toBe(7);
  });
});

describe('lerp', () => {
  it('t=0 returns a', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(-5, 5, 0)).toBe(-5);
  });

  it('t=1 returns b', () => {
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(-5, 5, 1)).toBe(5);
  });

  it('t=0.5 returns midpoint', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('t=0.25 returns quarter point', () => {
    expect(lerp(0, 100, 0.25)).toBeCloseTo(25, 10);
  });

  it('works with negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBeCloseTo(0, 10);
    expect(lerp(-20, -10, 0.5)).toBeCloseTo(-15, 10);
  });

  it('works when a equals b', () => {
    expect(lerp(5, 5, 0.5)).toBe(5);
  });
});

describe('rand', () => {
  it('always returns a value in [min, max)', () => {
    const min = 5;
    const max = 15;
    for (let i = 0; i < 100; i++) {
      const r = rand(min, max);
      expect(r).toBeGreaterThanOrEqual(min);
      expect(r).toBeLessThan(max);
    }
  });

  it('returns a number', () => {
    expect(typeof rand(0, 1)).toBe('number');
  });

  it('works with negative range', () => {
    for (let i = 0; i < 100; i++) {
      const r = rand(-10, -5);
      expect(r).toBeGreaterThanOrEqual(-10);
      expect(r).toBeLessThan(-5);
    }
  });

  it('works when min equals max (returns min)', () => {
    // When min === max, max - min === 0, Math.random() * 0 + min === min
    expect(rand(5, 5)).toBe(5);
  });
});

describe('randInt', () => {
  it('always returns an integer in [min, max] inclusive', () => {
    const min = 3;
    const max = 8;
    for (let i = 0; i < 100; i++) {
      const r = randInt(min, max);
      expect(r).toBeGreaterThanOrEqual(min);
      expect(r).toBeLessThanOrEqual(max);
      expect(Number.isInteger(r)).toBe(true);
    }
  });

  it('returns a number', () => {
    expect(typeof randInt(0, 10)).toBe('number');
  });

  it('works with min === max', () => {
    for (let i = 0; i < 20; i++) {
      expect(randInt(5, 5)).toBe(5);
    }
  });

  it('covers both endpoints over many runs', () => {
    const min = 0;
    const max = 1;
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 200; i++) {
      const r = randInt(min, max);
      if (r === min) sawMin = true;
      if (r === max) sawMax = true;
    }
    // With 200 trials each should appear with very high probability
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });

  it('works with negative range', () => {
    for (let i = 0; i < 100; i++) {
      const r = randInt(-5, -1);
      expect(r).toBeGreaterThanOrEqual(-5);
      expect(r).toBeLessThanOrEqual(-1);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
});
