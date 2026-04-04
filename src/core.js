// =============================================================================
// Vec2 — 2D vector math
// =============================================================================
class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale(s) {
    return new Vec2(this.x * s, this.y * s);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lenSq() {
    return this.x * this.x + this.y * this.y;
  }

  norm() {
    const l = this.len();
    if (l === 0) return new Vec2(0, 0);
    return new Vec2(this.x / l, this.y / l);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  distTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static fromAngle(a, len = 1) {
    return new Vec2(Math.cos(a) * len, Math.sin(a) * len);
  }

  static lerp(a, b, t) {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}

// =============================================================================
// Utils — math helpers
// =============================================================================
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp = (a, b, t) => a + (b - a) * t;

// =============================================================================
// AudioManager — Web Audio API synth sound effects
// =============================================================================
class AudioManager {
  constructor() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = AC ? new AC() : null;
    } catch (e) {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _master(vol = 0.12) {
    if (!this.ctx) return null;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.connect(this.ctx.destination);
    return g;
  }

  _osc(freq, type, dur, gainVal, master) {
    if (!this.ctx || !master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    g.gain.setValueAtTime(gainVal, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(g);
    g.connect(master);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  shoot() {
    if (!this.ctx) return;
    this.resume();
    const master = this._master(0.10);
    if (!master) return;
    this._osc(800, 'square', 0.06, 1.0, master);
  }

  explode(size = 1) {
    if (!this.ctx) return;
    this.resume();
    const master = this._master(0.18);
    if (!master) return;

    const now = this.ctx.currentTime;
    const dur = 0.25;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180 * size, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200 * size, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + dur);

    g.gain.setValueAtTime(1.0, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(master);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  die() {
    if (!this.ctx) return;
    this.resume();
    const master = this._master(0.15);
    if (!master) return;

    const delays = [0, 0.15, 0.30];
    for (const delay of delays) {
      const freq = rand(80, 200);
      const now = this.ctx.currentTime + delay;
      const dur = 0.18;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + dur);

      g.gain.setValueAtTime(0.8, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + dur + 0.01);
    }
  }

  levelUp() {
    if (!this.ctx) return;
    this.resume();
    const master = this._master(0.12);
    if (!master) return;

    const freqs = [440, 550, 660, 880];
    const noteDur = 0.08;
    freqs.forEach((freq, i) => {
      this._osc(freq, 'square', noteDur, 1.0, master);
      // Each note is scheduled by creating a separate timed oscillator
      const now = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      g.gain.setValueAtTime(1.0, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + noteDur);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + noteDur + 0.01);
    });
  }

  phaseComplete() {
    if (!this.ctx) return;
    this.resume();
    const master = this._master(0.12);
    if (!master) return;

    const freqs = [440, 550, 660, 770, 880, 1100];
    const noteDur = 0.10;
    freqs.forEach((freq, i) => {
      const now = this.ctx.currentTime + i * 0.10;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      g.gain.setValueAtTime(1.0, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + noteDur);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + noteDur + 0.01);
    });
  }
}

// =============================================================================
// InputManager — keyboard, mouse, and dual touch joystick input
// =============================================================================
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.left = new Vec2();
    this.right = new Vec2();
    this.shooting = false;
    this.keys = {};
    this.mouse = { pos: new Vec2(), down: false };
    this.leftStick = { id: null, origin: new Vec2(), pos: new Vec2() };
    this.rightStick = { id: null, origin: new Vec2(), pos: new Vec2() };
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    this.canvas.addEventListener('mousemove', e => {
      const r = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / r.width;
      const scaleY = this.canvas.height / r.height;
      this.mouse.pos.set(
        (e.clientX - r.left) * scaleX,
        (e.clientY - r.top) * scaleY
      );
    });

    this.canvas.addEventListener('mousedown', e => {
      this.mouse.down = true;
      const r = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / r.width;
      const scaleY = this.canvas.height / r.height;
      this.mouse.pos.set(
        (e.clientX - r.left) * scaleX,
        (e.clientY - r.top) * scaleY
      );
    });

    window.addEventListener('mouseup', () => { this.mouse.down = false; });

    this.canvas.addEventListener('touchstart', e => this._ts(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this._tm(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this._te(e), { passive: false });
    this.canvas.addEventListener('touchcancel', e => this._te(e), { passive: false });
  }

  _cp(touch) {
    const r = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / r.width;
    const scaleY = this.canvas.height / r.height;
    return new Vec2(
      (touch.clientX - r.left) * scaleX,
      (touch.clientY - r.top) * scaleY
    );
  }

  _ts(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const cp = this._cp(touch);
      if (cp.x < this.canvas.width / 2) {
        if (this.leftStick.id === null) {
          this.leftStick.id = touch.identifier;
          this.leftStick.origin.set(cp.x, cp.y);
          this.leftStick.pos.set(cp.x, cp.y);
        }
      } else {
        if (this.rightStick.id === null) {
          this.rightStick.id = touch.identifier;
          this.rightStick.origin.set(cp.x, cp.y);
          this.rightStick.pos.set(cp.x, cp.y);
        }
      }
    }
  }

  _tm(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const cp = this._cp(touch);
      if (touch.identifier === this.leftStick.id) {
        this.leftStick.pos.set(cp.x, cp.y);
      } else if (touch.identifier === this.rightStick.id) {
        this.rightStick.pos.set(cp.x, cp.y);
      }
    }
  }

  _te(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.leftStick.id) {
        this.leftStick.id = null;
        this.left.set(0, 0);
      } else if (touch.identifier === this.rightStick.id) {
        this.rightStick.id = null;
        this.right.set(0, 0);
        this.shooting = false;
      }
    }
  }

  update(playerPos) {
    const MAX_RADIUS = 65;

    // Left stick / WASD
    if (this.leftStick.id !== null) {
      const dx = this.leftStick.pos.x - this.leftStick.origin.x;
      const dy = this.leftStick.pos.y - this.leftStick.origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const clamped = Math.min(dist, MAX_RADIUS);
        const mag = clamped / MAX_RADIUS;
        this.left.set((dx / dist) * mag, (dy / dist) * mag);
      } else {
        this.left.set(0, 0);
      }
    } else {
      let lx = 0;
      let ly = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) ly -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) ly += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) lx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) lx += 1;
      if (lx !== 0 && ly !== 0) {
        const inv = 1 / Math.sqrt(2);
        lx *= inv;
        ly *= inv;
      }
      this.left.set(lx, ly);
    }

    // Right stick / mouse / IJKL
    if (this.rightStick.id !== null) {
      const dx = this.rightStick.pos.x - this.rightStick.origin.x;
      const dy = this.rightStick.pos.y - this.rightStick.origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.right.set(dx / dist, dy / dist);
        this.shooting = dist > 12;
      } else {
        this.right.set(0, 0);
        this.shooting = false;
      }
    } else if (this.mouse.down && playerPos) {
      const dx = this.mouse.pos.x - playerPos.x;
      const dy = this.mouse.pos.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.right.set(dx / dist, dy / dist);
      }
      this.shooting = dist > 15;
    } else {
      let rx = 0;
      let ry = 0;
      if (this.keys['KeyI']) ry -= 1;
      if (this.keys['KeyK']) ry += 1;
      if (this.keys['KeyJ']) rx -= 1;
      if (this.keys['KeyL']) rx += 1;
      const shooting = rx !== 0 || ry !== 0;
      if (rx !== 0 && ry !== 0) {
        const inv = 1 / Math.sqrt(2);
        rx *= inv;
        ry *= inv;
      }
      this.right.set(rx, ry);
      this.shooting = shooting;
    }
  }

  getLeftStick() {
    return this.leftStick.id !== null ? this.leftStick : null;
  }

  getRightStick() {
    return this.rightStick.id !== null ? this.rightStick : null;
  }
}

// =============================================================================
// Particle — single visual particle
// =============================================================================
class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(vx, vy);
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }

  update(dt) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    const drag = Math.pow(0.9, dt * 60);
    this.vel.x *= drag;
    this.vel.y *= drag;
    this.life -= dt;
    if (this.life <= 0) {
      this.life = 0;
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    const t = this.life / this.maxLife;
    const alpha = t * t;
    const radius = this.size * t;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 2;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, Math.max(radius, 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// =============================================================================
// ParticleSystem — manages a pool of Particle instances
// =============================================================================
class ParticleSystem {
  constructor() {
    this.p = [];
  }

  emit(x, y, color, n, spd, szMin, szMax, liMin, liMax) {
    for (let i = 0; i < n; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(spd * 0.3, spd);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = rand(szMin, szMax);
      const life = rand(liMin, liMax);
      this.p.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  update(dt) {
    for (let i = this.p.length - 1; i >= 0; i--) {
      this.p[i].update(dt);
      if (this.p[i].dead) {
        this.p.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.p.length; i++) {
      this.p[i].draw(ctx);
    }
  }

  clear() {
    this.p = [];
  }
}

// =============================================================================
// Grid — animated background grid with spring deformation
// =============================================================================
class Grid {
  constructor(spacing = 44) {
    this.sp = spacing;
    this.nodes = [];
    this.W = 0;
    this.H = 0;
  }

  resize(W, H) {
    this.W = W;
    this.H = H;
    const sp = this.sp;
    const cols = Math.ceil(W / sp) + 2;
    const rows = Math.ceil(H / sp) + 2;
    this.nodes = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const ox = c * sp - sp;
        const oy = r * sp - sp;
        row.push({ ox, oy, x: ox, y: oy });
      }
      this.nodes.push(row);
    }
  }

  update(dt, entities) {
    const limit = Math.min(entities.length, 30);
    const rows = this.nodes.length;
    if (rows === 0) return;
    const cols = this.nodes[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const node = this.nodes[r][c];
        let fx = 0;
        let fy = 0;

        for (let e = 0; e < limit; e++) {
          const ent = entities[e];
          if (!ent.pos || ent.gridStrength === undefined) continue;
          const dx = node.ox - ent.pos.x;
          const dy = node.oy - ent.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 0) {
            const force = ent.gridStrength * 4000 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        node.x += (node.ox - node.x + clamp(fx, -18, 18)) * dt * 10;
        node.y += (node.oy - node.y + clamp(fy, -18, 18)) * dt * 10;
      }
    }
  }

  draw(ctx) {
    const rows = this.nodes.length;
    if (rows === 0) return;
    const cols = this.nodes[0].length;

    ctx.strokeStyle = 'rgba(0,80,180,0.3)';
    ctx.lineWidth = 0.8;

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const node = this.nodes[r][c];
        if (c === 0) {
          ctx.moveTo(node.x, node.y);
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
      ctx.stroke();
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const node = this.nodes[r][c];
        if (r === 0) {
          ctx.moveTo(node.x, node.y);
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
      ctx.stroke();
    }
  }
}

// =============================================================================
// Bullet — player projectile
// =============================================================================
class Bullet {
  constructor(x, y, vx, vy) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(vx, vy);
    this.dead = false;
    this.trail = [];
    this.gridStrength = -1.5;
    this.color = '#ffff00';
    this.glowColor = '#ff8800';
    this.radius = 3;
  }

  update(dt, W, H) {
    this.trail.push(this.pos.clone());
    if (this.trail.length > 7) {
      this.trail.shift();
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    const margin = 10;
    if (
      this.pos.x < -margin ||
      this.pos.x > W + margin ||
      this.pos.y < -margin ||
      this.pos.y > H + margin
    ) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const alpha = (i / this.trail.length) * 0.5;
      const trailRadius = Math.max(this.radius * (i / this.trail.length), 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, trailRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bullet
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
