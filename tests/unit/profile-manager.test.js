import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helpers to build a minimal mock Supabase client
function makeSb({ profileData = null, insertData = null, scoresData = [] } = {}) {
  // Each `.from()` call returns a chainable builder.
  const selectChain = {
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profileData }),
    order:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockResolvedValue({ data: scoresData }),
    select: vi.fn().mockReturnThis(),
  };
  const insertChain = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: insertData }),
  };
  const updateChain = {
    eq: vi.fn().mockResolvedValue({ data: null }),
  };

  const fromMock = vi.fn(() => ({
    select: vi.fn(() => selectChain),
    insert: vi.fn(() => insertChain),
    update: vi.fn(() => updateChain),
  }));

  return {
    from: fromMock,
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  };
}

describe('ProfileManager', () => {
  let pm;
  const fakeSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  };

  beforeEach(() => {
    global._sb = null; // reset to no-op mode before each test
    pm = new ProfileManager();
  });

  afterEach(() => {
    global._sb = null;
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  describe('initial state', () => {
    it('profile is null', () => {
      expect(pm.profile).toBeNull();
    });

    it('userId is null', () => {
      expect(pm.userId).toBeNull();
    });

    it('email is null', () => {
      expect(pm.email).toBeNull();
    });

    it('leaderboard is empty array', () => {
      expect(pm.leaderboard).toEqual([]);
    });

    it('getActive() returns null', () => {
      expect(pm.getActive()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // load() — with no _sb (graceful no-op)
  // ---------------------------------------------------------------------------
  describe('load() — _sb is null', () => {
    it('does not throw and leaves profile null', async () => {
      await expect(pm.load(fakeSession)).resolves.toBeUndefined();
      expect(pm.profile).toBeNull();
    });

    it('does not set userId or email', async () => {
      await pm.load(fakeSession);
      expect(pm.userId).toBeNull();
      expect(pm.email).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // load() — existing profile row
  // ---------------------------------------------------------------------------
  describe('load() — existing profile in DB', () => {
    const existingProfile = {
      id: 'user-123',
      name: 'ACE',
      high_score: 5000,
      highest_level: 3,
      total_kills: 200,
      total_games: 10,
      unlocked_phases: [true, true, false, false, false],
    };

    beforeEach(() => {
      global._sb = makeSb({ profileData: existingProfile, scoresData: [] });
    });

    it('sets userId and email from session', async () => {
      await pm.load(fakeSession);
      expect(pm.userId).toBe('user-123');
      expect(pm.email).toBe('test@example.com');
    });

    it('loads profile from DB', async () => {
      await pm.load(fakeSession);
      expect(pm.profile).toEqual(existingProfile);
    });

    it('getActive() returns the loaded profile', async () => {
      await pm.load(fakeSession);
      expect(pm.getActive()).toBe(pm.profile);
    });

    it('loads leaderboard after profile load', async () => {
      const scores = [{ name: 'ACE', score: 5000, level: 3, created_at: '2026-01-01' }];
      global._sb = makeSb({ profileData: existingProfile, scoresData: scores });
      await pm.load(fakeSession);
      expect(pm.leaderboard).toEqual(scores);
    });
  });

  // ---------------------------------------------------------------------------
  // load() — new user (no profile row yet)
  // ---------------------------------------------------------------------------
  describe('load() — new user, no existing profile', () => {
    const newProfile = {
      id: 'user-123',
      name: 'PLAYER',
      high_score: 0,
      highest_level: 0,
      total_kills: 0,
      total_games: 0,
      unlocked_phases: [true, false, false, false, false],
    };

    beforeEach(() => {
      global._sb = makeSb({ profileData: null, insertData: newProfile });
    });

    it('creates a new profile row when none exists', async () => {
      await pm.load(fakeSession);
      expect(pm.profile).toEqual(newProfile);
    });

    it('new profile has name PLAYER', async () => {
      await pm.load(fakeSession);
      expect(pm.profile.name).toBe('PLAYER');
    });
  });

  // ---------------------------------------------------------------------------
  // updateActive()
  // ---------------------------------------------------------------------------
  describe('updateActive()', () => {
    it('does nothing if _sb is null', async () => {
      pm.profile = { name: 'ACE', total_kills: 10 };
      pm.userId  = 'user-123';
      await expect(pm.updateActive({ total_kills: 20 })).resolves.toBeUndefined();
      // Local mutation still happens because _sb check is after Object.assign? No — check is first.
      expect(pm.profile.total_kills).toBe(10); // unchanged
    });

    it('merges updates into local profile', async () => {
      global._sb = makeSb();
      pm.profile = { name: 'ACE', total_kills: 10 };
      pm.userId  = 'user-123';
      await pm.updateActive({ total_kills: 50, name: 'KING' });
      expect(pm.profile.total_kills).toBe(50);
      expect(pm.profile.name).toBe('KING');
    });

    it('calls _sb.from("profiles").update(...).eq(id)', async () => {
      const sb = makeSb();
      global._sb = sb;
      pm.profile = { name: 'ACE' };
      pm.userId  = 'user-123';
      await pm.updateActive({ name: 'KING' });
      expect(sb.from).toHaveBeenCalledWith('profiles');
    });

    it('does nothing if profile is null', async () => {
      global._sb = makeSb();
      pm.profile = null;
      await expect(pm.updateActive({ name: 'X' })).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // submitScore()
  // ---------------------------------------------------------------------------
  describe('submitScore()', () => {
    it('does nothing if _sb is null', async () => {
      pm.userId  = 'user-123';
      pm.profile = { name: 'ACE' };
      await expect(pm.submitScore(1000, 5)).resolves.toBeUndefined();
    });

    it('does nothing if userId is null', async () => {
      global._sb = makeSb();
      pm.userId  = null;
      await expect(pm.submitScore(1000, 5)).resolves.toBeUndefined();
    });

    it('inserts a score row', async () => {
      const sb = makeSb();
      global._sb = sb;
      pm.userId  = 'user-123';
      pm.profile = { name: 'ACE' };
      await pm.submitScore(999, 4);
      expect(sb.from).toHaveBeenCalledWith('scores');
    });

    it('refreshes leaderboard after submitting', async () => {
      const scores = [{ name: 'ACE', score: 999, level: 4, created_at: '2026-01-01' }];
      const sb = makeSb({ scoresData: scores });
      global._sb = sb;
      pm.userId  = 'user-123';
      pm.profile = { name: 'ACE' };
      await pm.submitScore(999, 4);
      expect(pm.leaderboard).toEqual(scores);
    });
  });

  // ---------------------------------------------------------------------------
  // loadLeaderboard()
  // ---------------------------------------------------------------------------
  describe('loadLeaderboard()', () => {
    it('does nothing if _sb is null', async () => {
      await expect(pm.loadLeaderboard()).resolves.toBeUndefined();
      expect(pm.leaderboard).toEqual([]);
    });

    it('populates leaderboard from DB', async () => {
      const scores = [
        { name: 'TOP', score: 9000, level: 10, created_at: '2026-01-01' },
        { name: 'MID', score: 4500, level: 5,  created_at: '2026-01-02' },
      ];
      global._sb = makeSb({ scoresData: scores });
      await pm.loadLeaderboard();
      expect(pm.leaderboard).toEqual(scores);
    });

    it('sets leaderboard to [] when DB returns null', async () => {
      global._sb = makeSb({ scoresData: null });
      // Override to return null
      global._sb.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order:  vi.fn().mockReturnThis(),
        limit:  vi.fn().mockResolvedValue({ data: null }),
      }));
      await pm.loadLeaderboard();
      expect(pm.leaderboard).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // firstUnlockedPhase()
  // ---------------------------------------------------------------------------
  describe('firstUnlockedPhase()', () => {
    it('returns 0 when profile is null', () => {
      pm.profile = null;
      expect(pm.firstUnlockedPhase()).toBe(0);
    });

    it('returns 0 when only phase 0 is unlocked', () => {
      pm.profile = { unlocked_phases: [true, false, false, false, false] };
      expect(pm.firstUnlockedPhase()).toBe(0);
    });

    it('returns 2 when phases 0-2 are unlocked', () => {
      pm.profile = { unlocked_phases: [true, true, true, false, false] };
      expect(pm.firstUnlockedPhase()).toBe(2);
    });

    it('returns 4 when all phases are unlocked', () => {
      pm.profile = { unlocked_phases: [true, true, true, true, true] };
      expect(pm.firstUnlockedPhase()).toBe(4);
    });

    it('returns 1 when phases 0-1 are unlocked', () => {
      pm.profile = { unlocked_phases: [true, true, false, false, false] };
      expect(pm.firstUnlockedPhase()).toBe(1);
    });

    it('falls back to [true,false,false,false,false] when unlocked_phases is missing', () => {
      pm.profile = { name: 'ACE' }; // no unlocked_phases field
      expect(pm.firstUnlockedPhase()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // rename()
  // ---------------------------------------------------------------------------
  describe('rename()', () => {
    it('calls updateActive with the new name', async () => {
      global._sb = makeSb();
      pm.profile = { name: 'OLD' };
      pm.userId  = 'user-123';
      await pm.rename('NEW');
      expect(pm.profile.name).toBe('NEW');
    });
  });

  // ---------------------------------------------------------------------------
  // signOut()
  // ---------------------------------------------------------------------------
  describe('signOut()', () => {
    it('clears profile, userId, and email', async () => {
      pm.profile = { name: 'ACE' };
      pm.userId  = 'user-123';
      pm.email   = 'test@example.com';
      await pm.signOut();
      expect(pm.profile).toBeNull();
      expect(pm.userId).toBeNull();
      expect(pm.email).toBeNull();
    });

    it('calls _sb.auth.signOut when _sb is set', async () => {
      const sb = makeSb();
      global._sb = sb;
      await pm.signOut();
      expect(sb.auth.signOut).toHaveBeenCalled();
    });

    it('does not throw when _sb is null', async () => {
      await expect(pm.signOut()).resolves.toBeUndefined();
    });
  });
});
