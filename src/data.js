const PHASES_DATA = [
  { name: 'SECTOR ALPHA', color: '#00ffff', start: 0,  end: 5  },
  { name: 'SECTOR BETA',  color: '#44ff88', start: 6,  end: 11 },
  { name: 'SECTOR GAMMA', color: '#ffff44', start: 12, end: 17 },
  { name: 'SECTOR DELTA', color: '#ff8844', start: 18, end: 23 },
  { name: 'SECTOR OMEGA', color: '#ff44ff', start: 24, end: 29 },
];

const LEVELS_DATA = [
  // Phase 0 - SECTOR ALPHA (indices 0-5)
  { name:'First Contact',  phase:0, spawns:[{t:'Grunt',n:6,d:0,s:0.5}] },
  { name:'The Swarm',      phase:0, spawns:[{t:'Grunt',n:14,d:0,s:0.25}] },
  { name:'Drifters',       phase:0, spawns:[{t:'Grunt',n:8,d:0,s:0.4},{t:'Wanderer',n:4,d:1,s:0.5}] },
  { name:'Hex Field',      phase:0, spawns:[{t:'Grunt',n:6,d:0,s:0.4},{t:'Wanderer',n:8,d:0.5,s:0.4}] },
  { name:'Spin Cycle',     phase:0, spawns:[{t:'Grunt',n:4,d:0,s:0.5},{t:'Wanderer',n:4,d:0.8,s:0.5},{t:'Pinwheel',n:2,d:1.5,s:0.8}] },
  { name:'Sector Clear',   phase:0, spawns:[{t:'Grunt',n:10,d:0,s:0.3},{t:'Wanderer',n:6,d:1,s:0.4},{t:'Pinwheel',n:3,d:2,s:0.7}] },
  // Phase 1 - SECTOR BETA (indices 6-11)
  { name:'Serpentine',     phase:1, spawns:[{t:'Grunt',n:10,d:0,s:0.3},{t:'Snake',n:4,d:1,s:0.6}] },
  { name:'Bloom',          phase:1, spawns:[{t:'Grunt',n:8,d:0,s:0.35},{t:'Wanderer',n:4,d:0.8,s:0.5},{t:'Bloomer',n:2,d:1.5,s:0.8,sz:'large'}] },
  { name:'Pinwheel Storm', phase:1, spawns:[{t:'Grunt',n:6,d:0,s:0.4},{t:'Pinwheel',n:6,d:0.6,s:0.5}] },
  { name:'Snake Pit',      phase:1, spawns:[{t:'Snake',n:8,d:0,s:0.4},{t:'Wanderer',n:6,d:1,s:0.4}] },
  { name:'Cascade',        phase:1, spawns:[{t:'Bloomer',n:3,d:0,s:0.7,sz:'large'},{t:'Grunt',n:8,d:1.5,s:0.35}] },
  { name:'Beta Gauntlet',  phase:1, spawns:[{t:'Grunt',n:12,d:0,s:0.25},{t:'Wanderer',n:6,d:1,s:0.35},{t:'Pinwheel',n:4,d:2,s:0.5},{t:'Snake',n:4,d:3,s:0.5},{t:'Bloomer',n:2,d:4,s:0.8,sz:'large'}] },
  // Phase 2 - SECTOR GAMMA (indices 12-17)
  { name:'Convergence',    phase:2, spawns:[{t:'Grunt',n:20,d:0,s:0.18}] },
  { name:'Chaos Web',      phase:2, spawns:[{t:'Snake',n:8,d:0,s:0.4},{t:'Wanderer',n:4,d:1,s:0.4},{t:'Pinwheel',n:4,d:2,s:0.5}] },
  { name:'Big Bang',       phase:2, spawns:[{t:'Bloomer',n:5,d:0,s:0.5,sz:'large'},{t:'Wanderer',n:6,d:2,s:0.4}] },
  { name:'Death Spiral',   phase:2, spawns:[{t:'Snake',n:10,d:0,s:0.3},{t:'Grunt',n:8,d:1,s:0.3},{t:'Pinwheel',n:4,d:2.5,s:0.5}] },
  { name:'Overload',       phase:2, spawns:[{t:'Bloomer',n:6,d:0,s:0.5,sz:'large'},{t:'Pinwheel',n:6,d:2,s:0.4},{t:'Grunt',n:6,d:3.5,s:0.3}] },
  { name:'Gamma Gauntlet', phase:2, spawns:[{t:'Grunt',n:16,d:0,s:0.22},{t:'Wanderer',n:8,d:1.5,s:0.3},{t:'Snake',n:6,d:3,s:0.4},{t:'Pinwheel',n:6,d:4.5,s:0.4},{t:'Bloomer',n:4,d:6,s:0.6,sz:'large'}] },
  // Phase 3 - SECTOR DELTA (indices 18-23)
  { name:'The Flood',      phase:3, spawns:[{t:'Grunt',n:30,d:0,s:0.15}] },
  { name:'Pinwheel Array', phase:3, spawns:[{t:'Pinwheel',n:10,d:0,s:0.35},{t:'Wanderer',n:10,d:2,s:0.3}] },
  { name:'Bloom Tsunami',  phase:3, spawns:[{t:'Bloomer',n:8,d:0,s:0.35,sz:'large'}] },
  { name:'Viper Nest',     phase:3, spawns:[{t:'Snake',n:16,d:0,s:0.25}] },
  { name:'All Hands',      phase:3, spawns:[{t:'Grunt',n:10,d:0,s:0.28},{t:'Wanderer',n:8,d:1.5,s:0.3},{t:'Pinwheel',n:6,d:3,s:0.4},{t:'Snake',n:6,d:4.5,s:0.35},{t:'Bloomer',n:4,d:6,s:0.55,sz:'large'}] },
  { name:'Delta Gauntlet', phase:3, spawns:[{t:'Grunt',n:20,d:0,s:0.2},{t:'Wanderer',n:12,d:2,s:0.25},{t:'Pinwheel',n:8,d:4,s:0.35},{t:'Snake',n:10,d:6,s:0.28},{t:'Bloomer',n:6,d:8,s:0.5,sz:'large'}] },
  // Phase 4 - SECTOR OMEGA (indices 24-29)
  { name:'Omega Rush',     phase:4, spawns:[{t:'Grunt',n:30,d:0,s:0.12},{t:'Wanderer',n:10,d:1,s:0.22}] },
  { name:'Pinwheel Hell',  phase:4, spawns:[{t:'Pinwheel',n:15,d:0,s:0.28}] },
  { name:'Fractal Bloom',  phase:4, spawns:[{t:'Bloomer',n:10,d:0,s:0.3,sz:'large'}] },
  { name:'Serpent God',    phase:4, spawns:[{t:'Snake',n:20,d:0,s:0.2},{t:'Pinwheel',n:10,d:3,s:0.3}] },
  { name:'Total War',      phase:4, spawns:[{t:'Grunt',n:20,d:0,s:0.18},{t:'Wanderer',n:12,d:2,s:0.22},{t:'Pinwheel',n:10,d:4,s:0.3},{t:'Snake',n:12,d:6,s:0.22},{t:'Bloomer',n:8,d:8.5,s:0.4,sz:'large'}] },
  { name:'OMEGA FINALE',   phase:4, spawns:[{t:'Grunt',n:25,d:0,s:0.15},{t:'Wanderer',n:15,d:1.5,s:0.2},{t:'Pinwheel',n:12,d:3.5,s:0.28},{t:'Snake',n:15,d:6,s:0.2},{t:'Bloomer',n:10,d:9,s:0.35,sz:'large'}] },
];

function getLevelData(idx) {
  if (idx < 30) return LEVELS_DATA[idx];
  const n = idx - 29; // 1, 2, 3, ...
  return {
    name: `ENDLESS ${n}`,
    phase: 4,
    spawns: [
      { t:'Grunt',    n: Math.min(8 + n*3, 50),             d:0,   s:0.15 },
      { t:'Wanderer', n: Math.min(n*2, 18),                  d:1,   s:0.25 },
      { t:'Pinwheel', n: Math.min(Math.floor(n/2), 12),      d:2.5, s:0.3  },
      { t:'Snake',    n: Math.min(Math.floor(n/2), 14),      d:4,   s:0.25 },
      { t:'Bloomer',  n: Math.min(Math.floor(n/3), 10),      d:6,   s:0.45, sz:'large' },
    ]
  };
}

function createEnemy(type, x, y, sz) {
  switch(type) {
    case 'Grunt':    return new Grunt(x, y);
    case 'Wanderer': return new Wanderer(x, y);
    case 'Pinwheel': return new Pinwheel(x, y);
    case 'Snake':    return new Snake(x, y);
    case 'Bloomer':  return new Bloomer(x, y, sz || 'large');
    default: return new Grunt(x, y);
  }
}

class WaveSpawner {
  constructor(levelIdx, W, H) {
    this.data = getLevelData(levelIdx);
    this.queue = [];
    this.elapsed = 0;
    this.done = false;

    const edgePos = () => {
      const side = randInt(0, 3);
      switch (side) {
        case 0: return new Vec2(rand(30, W - 30), 30);
        case 1: return new Vec2(W - 30, rand(30, H - 30));
        case 2: return new Vec2(rand(30, W - 30), H - 30);
        case 3: return new Vec2(30, rand(30, H - 30));
      }
    };

    for (const g of this.data.spawns) {
      for (let i = 0; i < g.n; i++) {
        const delay = g.d + i * g.s;
        const pos = edgePos();
        this.queue.push({ delay, create: () => createEnemy(g.t, pos.x, pos.y, g.sz) });
      }
    }

    this.queue.sort((a, b) => a.delay - b.delay);
  }

  update(dt) {
    this.elapsed += dt;
    const spawned = [];
    while (this.queue.length > 0 && this.queue[0].delay <= this.elapsed) {
      const entry = this.queue.shift();
      spawned.push(entry.create());
    }
    if (this.queue.length === 0) {
      this.done = true;
    }
    return spawned;
  }

  get totalCount() {
    return this.data.spawns.reduce((s, g) => s + g.n, 0);
  }
}

// ProfileManager — Supabase-backed user accounts + global leaderboard
// _sb must be defined in the outer scope (set to null in tests to skip DB calls)
class ProfileManager {
  constructor() {
    this.profile     = null;  // { id, name, high_score, highest_level, total_kills, total_games, unlocked_phases }
    this.userId      = null;
    this.email       = null;
    this.leaderboard = [];    // [{ name, score, level, created_at }, ...]
  }

  // Load profile from DB after sign-in. Creates the row if it doesn't exist yet.
  async load(session) {
    if (!_sb) return;
    this.userId = session.user.id;
    this.email  = session.user.email;

    let { data } = await _sb.from('profiles').select('*').eq('id', this.userId).single();

    if (!data) {
      const res = await _sb.from('profiles').insert({
        id: this.userId,
        name: 'PLAYER',
        high_score: 0,
        highest_level: 0,
        total_kills: 0,
        total_games: 0,
        unlocked_phases: [true, false, false, false, false]
      }).select().single();
      data = res.data;
    }

    this.profile = data;
    await this.loadLeaderboard();
  }

  getActive() { return this.profile; }

  async updateActive(updates) {
    if (!this.profile || !_sb) return;
    Object.assign(this.profile, updates);
    await _sb.from('profiles').update(updates).eq('id', this.userId);
  }

  async submitScore(score, level) {
    if (!_sb || !this.userId) return;
    await _sb.from('scores').insert({
      user_id: this.userId,
      name:    this.profile?.name ?? 'PLAYER',
      score,
      level
    });
    await this.loadLeaderboard();
  }

  async loadLeaderboard() {
    if (!_sb) return;
    const { data } = await _sb.from('scores')
      .select('name, score, level, created_at')
      .order('score', { ascending: false })
      .limit(10);
    this.leaderboard = data ?? [];
  }

  firstUnlockedPhase() {
    const p = this.profile;
    if (!p) return 0;
    const phases = p.unlocked_phases || [true, false, false, false, false];
    let highest = 0;
    for (let ph = 0; ph < phases.length; ph++) {
      if (phases[ph] === true) highest = ph;
    }
    return highest;
  }

  async rename(name) {
    await this.updateActive({ name });
  }

  async signOut() {
    if (_sb) await _sb.auth.signOut();
    this.profile  = null;
    this.userId   = null;
    this.email    = null;
  }
}
