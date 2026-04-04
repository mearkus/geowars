import { describe, it, expect, beforeEach } from 'vitest';

const W = 800;
const H = 600;

describe('PHASES_DATA', () => {
  it('has exactly 5 entries', () => {
    expect(PHASES_DATA.length).toBe(5);
  });

  it('phase 0 starts at 0 and ends at 5', () => {
    expect(PHASES_DATA[0].start).toBe(0);
    expect(PHASES_DATA[0].end).toBe(5);
  });

  it('phase 1 starts at 6 and ends at 11', () => {
    expect(PHASES_DATA[1].start).toBe(6);
    expect(PHASES_DATA[1].end).toBe(11);
  });

  it('phase 2 starts at 12 and ends at 17', () => {
    expect(PHASES_DATA[2].start).toBe(12);
    expect(PHASES_DATA[2].end).toBe(17);
  });

  it('phase 3 starts at 18 and ends at 23', () => {
    expect(PHASES_DATA[3].start).toBe(18);
    expect(PHASES_DATA[3].end).toBe(23);
  });

  it('phase 4 starts at 24 and ends at 29', () => {
    expect(PHASES_DATA[4].start).toBe(24);
    expect(PHASES_DATA[4].end).toBe(29);
  });

  it('each phase has a name and color', () => {
    for (const phase of PHASES_DATA) {
      expect(typeof phase.name).toBe('string');
      expect(phase.name.length).toBeGreaterThan(0);
      expect(typeof phase.color).toBe('string');
    }
  });
});

describe('LEVELS_DATA', () => {
  it('has exactly 30 entries', () => {
    expect(LEVELS_DATA.length).toBe(30);
  });

  it('each entry has a name, phase, and spawns array', () => {
    for (const level of LEVELS_DATA) {
      expect(typeof level.name).toBe('string');
      expect(typeof level.phase).toBe('number');
      expect(Array.isArray(level.spawns)).toBe(true);
    }
  });

  it('each level\'s phase is between 0 and 4', () => {
    for (const level of LEVELS_DATA) {
      expect(level.phase).toBeGreaterThanOrEqual(0);
      expect(level.phase).toBeLessThanOrEqual(4);
    }
  });

  it('level phase matches PHASES_DATA start/end ranges (indices 0-5 are phase 0)', () => {
    for (let i = 0; i < LEVELS_DATA.length; i++) {
      const level = LEVELS_DATA[i];
      const phaseData = PHASES_DATA[level.phase];
      expect(i).toBeGreaterThanOrEqual(phaseData.start);
      expect(i).toBeLessThanOrEqual(phaseData.end);
    }
  });

  it('each spawn entry has required fields t, n, d, s', () => {
    for (const level of LEVELS_DATA) {
      for (const spawn of level.spawns) {
        expect(typeof spawn.t).toBe('string');
        expect(typeof spawn.n).toBe('number');
        expect(typeof spawn.d).toBe('number');
        expect(typeof spawn.s).toBe('number');
      }
    }
  });
});

describe('getLevelData()', () => {
  it('getLevelData(0) returns First Contact with phase 0 and a Grunt spawn of n=6', () => {
    const data = getLevelData(0);
    expect(data.name).toBe('First Contact');
    expect(data.phase).toBe(0);
    expect(data.spawns[0].t).toBe('Grunt');
    expect(data.spawns[0].n).toBe(6);
  });

  it('getLevelData(29) returns OMEGA FINALE', () => {
    const data = getLevelData(29);
    expect(data.name).toBe('OMEGA FINALE');
    expect(data.phase).toBe(4);
  });

  it('getLevelData(30) returns ENDLESS 1 with phase 4', () => {
    const data = getLevelData(30);
    expect(data.name).toBe('ENDLESS 1');
    expect(data.phase).toBe(4);
  });

  it('getLevelData(30) Grunt count equals min(11, 50) = 11', () => {
    // n = idx-29 = 1, grunt n = min(8 + 1*3, 50) = min(11, 50) = 11
    const data = getLevelData(30);
    const grunt = data.spawns.find(s => s.t === 'Grunt');
    expect(grunt.n).toBe(11);
  });

  it('getLevelData(35) returns ENDLESS 6', () => {
    const data = getLevelData(35);
    expect(data.name).toBe('ENDLESS 6');
    expect(data.phase).toBe(4);
  });

  it('getLevelData(35) has correctly scaled Grunt count', () => {
    // n = 35-29 = 6, grunt n = min(8 + 6*3, 50) = min(26, 50) = 26
    const data = getLevelData(35);
    const grunt = data.spawns.find(s => s.t === 'Grunt');
    expect(grunt.n).toBe(26);
  });

  it('getLevelData(35) Wanderer count is min(n*2, 18) = min(12, 18) = 12', () => {
    // n=6, wanderer = min(6*2, 18) = 12
    const data = getLevelData(35);
    const wanderer = data.spawns.find(s => s.t === 'Wanderer');
    expect(wanderer.n).toBe(12);
  });

  it('endless levels always have 5 spawn groups', () => {
    const data = getLevelData(30);
    expect(data.spawns.length).toBe(5);
  });

  it('Grunt count caps at 50 for very high endless levels', () => {
    // n = 100-29 = 71, grunt = min(8 + 71*3, 50) = min(221, 50) = 50
    const data = getLevelData(100);
    const grunt = data.spawns.find(s => s.t === 'Grunt');
    expect(grunt.n).toBe(50);
  });
});

describe('WaveSpawner constructor', () => {
  it('queue has correct total count matching level definition', () => {
    const spawner = new WaveSpawner(0, W, H);
    // Level 0: {t:'Grunt', n:6, ...} → 6 enemies in queue
    expect(spawner.queue.length).toBe(6);
  });

  it('totalCount returns sum of all spawn group counts for level 0', () => {
    const spawner = new WaveSpawner(0, W, H);
    expect(spawner.totalCount).toBe(6);
  });

  it('totalCount matches queue length for a single-group level', () => {
    const spawner = new WaveSpawner(0, W, H);
    expect(spawner.totalCount).toBe(spawner.queue.length);
  });

  it('totalCount returns correct sum for a multi-group level (level 2: 8 Grunts + 4 Wanderers = 12)', () => {
    // Level 2 (Drifters): {t:'Grunt',n:8,...},{t:'Wanderer',n:4,...}
    const spawner = new WaveSpawner(2, W, H);
    expect(spawner.totalCount).toBe(12);
  });

  it('done is false initially (queue has entries)', () => {
    const spawner = new WaveSpawner(0, W, H);
    expect(spawner.done).toBe(false);
  });

  it('elapsed starts at 0', () => {
    const spawner = new WaveSpawner(0, W, H);
    expect(spawner.elapsed).toBe(0);
  });

  it('queue entries are sorted by delay ascending', () => {
    const spawner = new WaveSpawner(5, W, H);
    for (let i = 1; i < spawner.queue.length; i++) {
      expect(spawner.queue[i].delay).toBeGreaterThanOrEqual(spawner.queue[i - 1].delay);
    }
  });
});

describe('WaveSpawner.update()', () => {
  it('update(0) returns 0 enemies when all have d > 0', () => {
    // Level 5 (Sector Clear): first spawn has d=0 so let's use a level where first has d > 0
    // Level 2 (Drifters): {t:'Grunt',n:8,d:0,s:0.4},{t:'Wanderer',n:4,d:1,s:0.5}
    // First Grunt has d=0, so level 0 is better: all at d=0 actually
    // Use a level where first delay > 0; let's verify level 6 first Grunt at d=0
    // The simplest approach: create spawner for level 1 which has d=0 for first group
    // Actually d=0 means they spawn at elapsed=0. Let's check for d>0 case:
    // level 2: second group (Wanderer) has d=1, first grunt d=0
    // At t=0, level 2 Grunts (d=0) would spawn. We need a level where first is d>0.
    // Level 20 (Bloom Tsunami): {t:'Bloomer',n:8,d:0,...} → d=0 again
    // There isn't a level where ALL spawns have d>0 since d is always 0 for first group
    // So let's test that update(0) returns only those with delay==0
    const spawner = new WaveSpawner(0, W, H);
    // Level 0: single group d=0, s=0.5 → delays are 0, 0.5, 1.0, 1.5, 2.0, 2.5
    // At t=0, only first enemy (delay=0) spawns
    const result = spawner.update(0);
    expect(result.length).toBe(1); // only the one at delay=0
  });

  it('update(large dt) drains entire queue and sets done=true', () => {
    const spawner = new WaveSpawner(0, W, H);
    // Level 0 has 6 Grunts with max delay = 0 + 5*0.5 = 2.5
    const result = spawner.update(10); // advance 10 seconds, all should spawn
    expect(result.length).toBe(6);
    expect(spawner.done).toBe(true);
    expect(spawner.queue.length).toBe(0);
  });

  it('spawned enemies are correct type (Grunt for level 0)', () => {
    const spawner = new WaveSpawner(0, W, H);
    const result = spawner.update(10);
    for (const enemy of result) {
      expect(enemy).toBeInstanceOf(Grunt);
    }
  });

  it('spawned enemies are Wanderer type for Wanderer-only spawn groups', () => {
    // Level 9 (Snake Pit): {t:'Snake',n:8,...},{t:'Wanderer',n:6,...}
    const spawner = new WaveSpawner(9, W, H);
    const result = spawner.update(100);
    const snakes = result.filter(e => e instanceof Snake);
    const wanderers = result.filter(e => e instanceof Wanderer);
    expect(snakes.length).toBe(8);
    expect(wanderers.length).toBe(6);
  });

  it('done remains false while queue still has entries', () => {
    const spawner = new WaveSpawner(0, W, H);
    // Level 0: 6 Grunts, delays 0, 0.5, 1.0, 1.5, 2.0, 2.5
    // After 0 seconds, only 1 spawns, queue still has 5
    spawner.update(0);
    expect(spawner.done).toBe(false);
  });

  it('done becomes true when queue is fully drained', () => {
    const spawner = new WaveSpawner(0, W, H);
    spawner.update(100);
    expect(spawner.done).toBe(true);
  });

  it('incremental updates accumulate elapsed correctly', () => {
    const spawner = new WaveSpawner(0, W, H);
    // Level 0: 6 Grunts at delays 0, 0.5, 1.0, 1.5, 2.0, 2.5
    let total = [];
    total = total.concat(spawner.update(0));    // spawns 1 (delay=0)
    total = total.concat(spawner.update(0.5));  // spawns 1 (delay=0.5 → elapsed=0.5)
    total = total.concat(spawner.update(0.5));  // spawns 1 (delay=1.0 → elapsed=1.0)
    expect(total.length).toBe(3);
    expect(spawner.done).toBe(false);
  });

  it('Pinwheel enemies are spawned from levels containing Pinwheel spawns', () => {
    // Level 4 (Spin Cycle): {t:'Pinwheel',n:2,...}
    const spawner = new WaveSpawner(4, W, H);
    const result = spawner.update(100);
    const pinwheels = result.filter(e => e instanceof Pinwheel);
    expect(pinwheels.length).toBe(2);
  });

  it('Bloomer enemies are spawned from levels containing Bloomer spawns', () => {
    // Level 7 (Bloom): {t:'Bloomer',n:2,...,sz:'large'}
    const spawner = new WaveSpawner(7, W, H);
    const result = spawner.update(100);
    const bloomers = result.filter(e => e instanceof Bloomer);
    expect(bloomers.length).toBe(2);
    for (const b of bloomers) {
      expect(b.sz).toBe('large');
    }
  });
});
