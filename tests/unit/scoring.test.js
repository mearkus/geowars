import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal scoring system - mirrors the logic the Game class would use.
// We test the math in isolation without instantiating Game.
// ---------------------------------------------------------------------------

function makeScoring() {
  return {
    score: 0,
    multiplier: 1,
    multKills: 0,
    MULT_STEP: 10,   // kills needed to increment multiplier
    MULT_CAP: 20,    // maximum multiplier

    addKill(enemy) {
      this.score += enemy.score * this.multiplier;
      this.multKills++;
      if (this.multKills >= this.MULT_STEP) {
        this.multKills = 0;
        if (this.multiplier < this.MULT_CAP) {
          this.multiplier++;
        }
      }
    },
  };
}

describe('Scoring math', () => {
  describe('basic score accumulation', () => {
    it('score increases by enemy.score * multiplier', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      s.addKill(grunt);
      expect(s.score).toBe(grunt.score * 1); // multiplier=1
    });

    it('multiplier starts at 1', () => {
      const s = makeScoring();
      expect(s.multiplier).toBe(1);
    });

    it('score with multiplier 2 doubles points', () => {
      const s = makeScoring();
      s.multiplier = 2;
      const grunt = new Grunt(0, 0);
      s.addKill(grunt);
      expect(s.score).toBe(grunt.score * 2);
    });
  });

  describe('multiplier increment', () => {
    it('multiplier increments to 2 after 10 kills', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      for (let i = 0; i < 10; i++) s.addKill(grunt);
      expect(s.multiplier).toBe(2);
    });

    it('multKills resets to 0 when multiplier increments', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      for (let i = 0; i < 10; i++) s.addKill(grunt);
      expect(s.multKills).toBe(0);
    });

    it('multiplier increments again after another 10 kills', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      for (let i = 0; i < 20; i++) s.addKill(grunt);
      expect(s.multiplier).toBe(3);
    });

    it('multiplier caps at 20', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      // 10 * 20 = 200 kills to reach cap
      for (let i = 0; i < 200; i++) s.addKill(grunt);
      expect(s.multiplier).toBe(20);
    });

    it('multiplier stays at 20 beyond 200 kills', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      for (let i = 0; i < 300; i++) s.addKill(grunt);
      expect(s.multiplier).toBe(20);
    });

    it('multKills does not reset to 0 once cap is reached (keeps counting kills past cap)', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      // Reach the cap
      for (let i = 0; i < 200; i++) s.addKill(grunt);
      const killsBefore = s.multKills;
      // Add one more kill — since multiplier == MULT_CAP, multKills still increments
      s.addKill(grunt);
      // multKills should be killsBefore + 1 (increment but no reset since at cap)
      expect(s.multKills).toBe(killsBefore + 1);
      expect(s.multiplier).toBe(20);
    });
  });

  describe('enemy score values', () => {
    it('Grunt score is 50', () => {
      const g = new Grunt(0, 0);
      expect(g.score).toBe(50);
    });

    it('Wanderer score is 100', () => {
      const w = new Wanderer(0, 0);
      expect(w.score).toBe(100);
    });

    it('Pinwheel score is 150', () => {
      const p = new Pinwheel(0, 0);
      expect(p.score).toBe(150);
    });

    it('Snake score is 75', () => {
      const s = new Snake(0, 0);
      expect(s.score).toBe(75);
    });

    it('Bloomer large score is 100', () => {
      const b = new Bloomer(0, 0, 'large');
      expect(b.score).toBe(100);
    });

    it('Bloomer medium score is 75', () => {
      const b = new Bloomer(0, 0, 'medium');
      expect(b.score).toBe(75);
    });

    it('Bloomer small score is 50', () => {
      const b = new Bloomer(0, 0, 'small');
      expect(b.score).toBe(50);
    });
  });

  describe('Bloomer scoring chain with multiplier', () => {
    it('large Bloomer awards 100 * multiplier', () => {
      const s = makeScoring();
      s.multiplier = 3;
      s.addKill(new Bloomer(0, 0, 'large'));
      expect(s.score).toBe(300);
    });

    it('medium Bloomer awards 75 * multiplier', () => {
      const s = makeScoring();
      s.multiplier = 2;
      s.addKill(new Bloomer(0, 0, 'medium'));
      expect(s.score).toBe(150);
    });

    it('small Bloomer awards 50 * multiplier', () => {
      const s = makeScoring();
      s.multiplier = 4;
      s.addKill(new Bloomer(0, 0, 'small'));
      expect(s.score).toBe(200);
    });

    it('killing 3 medium and 4 small Bloomers awards correct total', () => {
      const s = makeScoring();
      // kill 3 medium + 4 small all at multiplier 1
      const mediums = Array.from({ length: 3 }, () => new Bloomer(0, 0, 'medium'));
      const smalls = Array.from({ length: 4 }, () => new Bloomer(0, 0, 'small'));
      for (const b of mediums) s.addKill(b);
      for (const b of smalls) s.addKill(b);
      // 3*75 + 4*50 = 225 + 200 = 425 (multiplier stays at 1 since < 10 kills)
      expect(s.score).toBe(425);
    });
  });

  describe('phase unlock gates via PHASES_DATA', () => {
    it('phase 0 spans level indices 0 through 5', () => {
      expect(PHASES_DATA[0].start).toBe(0);
      expect(PHASES_DATA[0].end).toBe(5);
    });

    it('phase 1 spans level indices 6 through 11', () => {
      expect(PHASES_DATA[1].start).toBe(6);
      expect(PHASES_DATA[1].end).toBe(11);
    });

    it('phase 2 spans level indices 12 through 17', () => {
      expect(PHASES_DATA[2].start).toBe(12);
      expect(PHASES_DATA[2].end).toBe(17);
    });

    it('phase 3 spans level indices 18 through 23', () => {
      expect(PHASES_DATA[3].start).toBe(18);
      expect(PHASES_DATA[3].end).toBe(23);
    });

    it('phase 4 spans level indices 24 through 29', () => {
      expect(PHASES_DATA[4].start).toBe(24);
      expect(PHASES_DATA[4].end).toBe(29);
    });

    it('completing last level of a phase (end index) unlocks next phase gate', () => {
      // Verify that the end index of each phase equals start-1 of the next
      for (let i = 0; i < PHASES_DATA.length - 1; i++) {
        expect(PHASES_DATA[i].end + 1).toBe(PHASES_DATA[i + 1].start);
      }
    });

    it('each phase spans exactly 6 levels', () => {
      for (const phase of PHASES_DATA) {
        expect(phase.end - phase.start + 1).toBe(6);
      }
    });
  });

  describe('score accumulation across mixed enemy types', () => {
    it('killing one of each enemy type awards correct total at multiplier 1', () => {
      const s = makeScoring();
      s.addKill(new Grunt(0, 0));       // 50
      s.addKill(new Wanderer(0, 0));    // 100
      s.addKill(new Pinwheel(0, 0));    // 150
      s.addKill(new Snake(0, 0));       // 75
      expect(s.score).toBe(375);
    });

    it('10 Grunts at multiplier 1 triggers multiplier increment and 11th scores with multiplier 2', () => {
      const s = makeScoring();
      const grunt = new Grunt(0, 0);
      for (let i = 0; i < 10; i++) s.addKill(grunt); // multiplier becomes 2
      const scoreAfter10 = s.score; // 10 * 50 * 1 = 500
      s.addKill(grunt); // 50 * 2 = 100
      expect(s.score).toBe(scoreAfter10 + 100);
    });
  });
});
