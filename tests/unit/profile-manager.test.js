import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProfileManager', () => {
  let pm;

  beforeEach(() => {
    localStorage.clear();
    // Reset mock call counts after clearing
    vi.clearAllMocks();
    pm = new ProfileManager();
  });

  describe('get()', () => {
    it('get(0) returns null on fresh manager with no localStorage data', () => {
      expect(pm.get(0)).toBeNull();
    });

    it('get(1) returns null on fresh manager', () => {
      expect(pm.get(1)).toBeNull();
    });

    it('get(2) returns null on fresh manager', () => {
      expect(pm.get(2)).toBeNull();
    });
  });

  describe('create()', () => {
    it('returns a profile with name PLAYER 1 for index 0', () => {
      const profile = pm.create(0);
      expect(profile.name).toBe('PLAYER 1');
    });

    it('returns a profile with name PLAYER 2 for index 1', () => {
      const profile = pm.create(1);
      expect(profile.name).toBe('PLAYER 2');
    });

    it('returns a profile with name PLAYER 3 for index 2', () => {
      const profile = pm.create(2);
      expect(profile.name).toBe('PLAYER 3');
    });

    it('returns a profile with highScore 0', () => {
      const profile = pm.create(0);
      expect(profile.highScore).toBe(0);
    });

    it('returns a profile with unlockedPhases=[true,false,false,false,false]', () => {
      const profile = pm.create(0);
      expect(profile.unlockedPhases).toEqual([true, false, false, false, false]);
    });

    it('returns a profile with highestLevel 0', () => {
      const profile = pm.create(0);
      expect(profile.highestLevel).toBe(0);
    });

    it('stores the profile (get(0) returns it after create)', () => {
      pm.create(0);
      expect(pm.get(0)).not.toBeNull();
    });
  });

  describe('getOrCreate()', () => {
    it('creates a profile if it does not exist', () => {
      const profile = pm.getOrCreate(0);
      expect(profile).not.toBeNull();
      expect(profile.name).toBe('PLAYER 1');
    });

    it('returns the existing profile if already set', () => {
      const created = pm.create(0);
      created.highScore = 9999;
      const retrieved = pm.getOrCreate(0);
      expect(retrieved.highScore).toBe(9999);
    });

    it('returns the same object reference if profile exists', () => {
      pm.create(0);
      const a = pm.getOrCreate(0);
      const b = pm.getOrCreate(0);
      expect(a).toBe(b);
    });
  });

  describe('update()', () => {
    it('updates highScore and persists via localStorage.setItem', () => {
      pm.create(0);
      vi.clearAllMocks();
      pm.update(0, { highScore: 1000 });
      expect(pm.get(0).highScore).toBe(1000);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('persists with the correct key gw_profile_0', () => {
      pm.create(0);
      vi.clearAllMocks();
      pm.update(0, { highScore: 500 });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gw_profile_0',
        expect.any(String)
      );
    });

    it('merges updates without overwriting other fields', () => {
      pm.create(0);
      pm.update(0, { highScore: 2500 });
      expect(pm.get(0).name).toBe('PLAYER 1');
      expect(pm.get(0).highScore).toBe(2500);
    });

    it('does nothing if profile does not exist', () => {
      // Profile 0 was not created, update should not throw
      expect(() => pm.update(0, { highScore: 100 })).not.toThrow();
      expect(pm.get(0)).toBeNull();
    });
  });

  describe('save()', () => {
    it('calls localStorage.setItem with key gw_profile_0', () => {
      pm.create(0);
      vi.clearAllMocks();
      pm.save(0);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gw_profile_0',
        expect.any(String)
      );
    });

    it('calls localStorage.setItem with key gw_profile_1', () => {
      pm.create(1);
      vi.clearAllMocks();
      pm.save(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gw_profile_1',
        expect.any(String)
      );
    });
  });

  describe('persistence across instances', () => {
    it('profile survives: create, new ProfileManager, get(0) returns profile', () => {
      pm.create(0);
      // Create a new ProfileManager which loads from localStorage
      const pm2 = new ProfileManager();
      const profile = pm2.get(0);
      expect(profile).not.toBeNull();
      expect(profile.name).toBe('PLAYER 1');
    });

    it('highScore update is persisted and loaded by new ProfileManager', () => {
      pm.create(0);
      pm.update(0, { highScore: 7777 });
      const pm2 = new ProfileManager();
      expect(pm2.get(0).highScore).toBe(7777);
    });
  });

  describe('firstUnlockedPhase()', () => {
    it('returns 0 by default (only phase 0 unlocked)', () => {
      pm.create(0);
      expect(pm.firstUnlockedPhase(0)).toBe(0);
    });

    it('returns 2 when unlockedPhases=[true,true,true,false,false]', () => {
      pm.create(0);
      pm.update(0, { unlockedPhases: [true, true, true, false, false] });
      expect(pm.firstUnlockedPhase(0)).toBe(2);
    });

    it('returns 4 when all phases are unlocked', () => {
      pm.create(0);
      pm.update(0, { unlockedPhases: [true, true, true, true, true] });
      expect(pm.firstUnlockedPhase(0)).toBe(4);
    });

    it('returns 0 when profile does not exist', () => {
      // No profile created; profiles[0] is null
      expect(pm.firstUnlockedPhase(0)).toBe(0);
    });

    it('returns 1 when unlockedPhases=[true,true,false,false,false]', () => {
      pm.create(0);
      pm.update(0, { unlockedPhases: [true, true, false, false, false] });
      expect(pm.firstUnlockedPhase(0)).toBe(1);
    });
  });

  describe('getActive()', () => {
    it('returns profiles[active] which defaults to profiles[0]', () => {
      pm.create(0);
      const active = pm.getActive();
      expect(active).toBe(pm.get(0));
    });

    it('returns null when active profile (0) has not been created', () => {
      expect(pm.getActive()).toBeNull();
    });

    it('returns profiles[1] when active is set to 1', () => {
      pm.create(0);
      pm.create(1);
      pm.active = 1;
      expect(pm.getActive()).toBe(pm.get(1));
    });
  });

  describe('active property', () => {
    it('defaults to 0', () => {
      expect(pm.active).toBe(0);
    });
  });
});
