class Enemy {
  constructor(x, y) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2();
    this.dead = false;
    this.hp = 1;
    this.score = 50;
    this.size = 12;
    this.angle = 0;
    this.color = '#ff4444';
    this.gridStrength = 2;
    this.flash = 0;
    this.pendingBullets = null;
    this.pendingSpawns = null;
  }

  hit() {
    this.hp--;
    this.flash = 0.12;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  clampBounds(W, H, margin = 12) {
    this.pos.x = clamp(this.pos.x, margin, W - margin);
    this.pos.y = clamp(this.pos.y, margin, H - margin);
  }

  collides(pos, r) {
    return this.pos.distTo(pos) < this.size + r;
  }

  update(dt, playerPos, W, H) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.clampBounds(W, H);
    this.angle += dt * 2;
    if (this.flash > 0) this.flash -= dt;
  }

  drawBase(ctx, drawFn) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    const color = this.flash > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '28';
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    drawFn(ctx, this.size);
    ctx.restore();
  }

  draw(ctx) {
    this.drawBase(ctx, (ctx, s) => {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

class Grunt extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.color = '#ff3333';
    this.size = 11;
    this.score = 50;
    this.hp = 1;
    this.speed = rand(90, 135);
    this.gridStrength = 2;
  }

  update(dt, playerPos, W, H) {
    const dir = playerPos.clone().sub(this.pos);
    const n = dir.norm();
    this.vel.x = n.x * this.speed;
    this.vel.y = n.y * this.speed;
    super.update(dt, playerPos, W, H);
  }

  draw(ctx) {
    this.drawBase(ctx, (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
}

class Wanderer extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.color = '#3399ff';
    this.size = 13;
    this.score = 100;
    this.hp = 1;
    this.speed = rand(60, 95);
    this.rotSpeed = rand(2.5, 5) * (Math.random() < 0.5 ? 1 : -1);
    this.turnTimer = rand(0.6, 2.2);
    this.gridStrength = 1.5;
    const a = rand(0, Math.PI * 2);
    this.vel = new Vec2(Math.cos(a) * this.speed, Math.sin(a) * this.speed);
  }

  update(dt, playerPos, W, H) {
    this.angle += this.rotSpeed * dt;
    this.turnTimer -= dt;
    if (this.turnTimer <= 0) {
      this.speed = rand(60, 95);
      const a = rand(0, Math.PI * 2);
      this.vel = new Vec2(Math.cos(a) * this.speed, Math.sin(a) * this.speed);
      this.turnTimer = rand(0.8, 2.5);
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    const margin = 15;
    if (this.pos.x < margin) { this.vel.x = Math.abs(this.vel.x); this.pos.x = margin; }
    if (this.pos.x > W - margin) { this.vel.x = -Math.abs(this.vel.x); this.pos.x = W - margin; }
    if (this.pos.y < margin) { this.vel.y = Math.abs(this.vel.y); this.pos.y = margin; }
    if (this.pos.y > H - margin) { this.vel.y = -Math.abs(this.vel.y); this.pos.y = H - margin; }

    if (this.flash > 0) this.flash -= dt;
  }

  draw(ctx) {
    this.drawBase(ctx, (ctx, s) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * s;
        const py = Math.sin(a) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
}

class Pinwheel extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.color = '#ff44ff';
    this.size = 15;
    this.score = 150;
    this.hp = 2;
    this.speed = rand(45, 75);
    this.rotSpeed = rand(5, 9) * (Math.random() < 0.5 ? 1 : -1);
    this.shootTimer = rand(1.2, 2.5);
    this.pendingBullets = [];
    this.gridStrength = 4;
    const a = rand(0, Math.PI * 2);
    this.vel = new Vec2(Math.cos(a) * this.speed, Math.sin(a) * this.speed);
  }

  update(dt, playerPos, W, H) {
    this.angle += this.rotSpeed * dt;

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    const margin = 18;
    if (this.pos.x < margin) { this.vel.x = Math.abs(this.vel.x); this.pos.x = margin; }
    if (this.pos.x > W - margin) { this.vel.x = -Math.abs(this.vel.x); this.pos.x = W - margin; }
    if (this.pos.y < margin) { this.vel.y = Math.abs(this.vel.y); this.pos.y = margin; }
    if (this.pos.y > H - margin) { this.vel.y = -Math.abs(this.vel.y); this.pos.y = H - margin; }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = rand(1.5, 3.0);
      for (let i = 0; i < 4; i++) {
        const ai = this.angle + (i / 4) * Math.PI * 2;
        const bv = Vec2.fromAngle(ai, 160);
        const b = new Bullet(this.pos.x, this.pos.y, bv.x, bv.y);
        b.color = '#ff44ff';
        b.glowColor = '#aa00aa';
        this.pendingBullets.push(b);
      }
    }

    if (this.flash > 0) this.flash -= dt;
  }

  draw(ctx) {
    this.drawBase(ctx, (ctx, s) => {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const cx = Math.cos(a) * s * 0.55;
        const cy = Math.sin(a) * s * 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

class Snake extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.color = '#44ff88';
    this.size = 10;
    this.score = 75;
    this.hp = 1;
    this.speed = rand(110, 160);
    this.angle = rand(0, Math.PI * 2);
    this.turnSpeed = rand(1.8, 3.2) * (Math.random() < 0.5 ? 1 : -1);
    this.segs = [];
    this.segTimer = 0;
    this.gridStrength = 1.5;
  }

  update(dt, playerPos, W, H) {
    this.angle += this.turnSpeed * dt;

    const mv = Vec2.fromAngle(this.angle, this.speed);
    this.pos.x += mv.x * dt;
    this.pos.y += mv.y * dt;

    const margin = 12;
    if (this.pos.x < margin) {
      this.angle = Math.PI - this.angle;
      this.pos.x = margin;
    } else if (this.pos.x > W - margin) {
      this.angle = Math.PI - this.angle;
      this.pos.x = W - margin;
    }
    if (this.pos.y < margin) {
      this.angle = -this.angle;
      this.pos.y = margin;
    } else if (this.pos.y > H - margin) {
      this.angle = -this.angle;
      this.pos.y = H - margin;
    }

    this.segTimer += dt;
    if (this.segTimer > 0.04) {
      this.segTimer = 0;
      this.segs.push({ x: this.pos.x, y: this.pos.y });
      if (this.segs.length > 14) this.segs.shift();
    }

    if (this.flash > 0) this.flash -= dt;
  }

  draw(ctx) {
    const color = this.flash > 0 ? '#ffffff' : this.color;
    const len = this.segs.length;

    for (let i = 0; i < len; i++) {
      const seg = this.segs[i];
      const alpha = (i / len) * 0.65;
      const r = this.size * 0.55 * (i / len);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.size * 0.45, -this.size * 0.35, this.size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.size * 0.45, this.size * 0.35, this.size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class Bloomer extends Enemy {
  constructor(x, y, sz = 'large') {
    super(x, y);
    this.sz = sz;
    this.color = '#ffaa00';
    this.pendingSpawns = [];

    if (sz === 'large') {
      this.size = 22;
      this.score = 100;
      this.hp = 3;
      this.speed = rand(45, 75);
      this.gridStrength = 5;
    } else if (sz === 'medium') {
      this.size = 14;
      this.score = 75;
      this.hp = 2;
      this.speed = rand(80, 120);
      this.gridStrength = 3;
    } else {
      this.size = 9;
      this.score = 50;
      this.hp = 1;
      this.speed = rand(130, 170);
      this.gridStrength = 2;
    }

    this.rotSpeed = rand(1.5, 3.5) * (Math.random() < 0.5 ? 1 : -1);
    const a = rand(0, Math.PI * 2);
    this.vel = new Vec2(Math.cos(a) * this.speed, Math.sin(a) * this.speed);
  }

  hit() {
    const killed = super.hit();
    if (killed && this.sz !== 'small') {
      const nextSz = this.sz === 'large' ? 'medium' : 'small';
      const count = this.sz === 'large' ? 3 : 4;
      for (let i = 0; i < count; i++) {
        this.pendingSpawns.push(new Bloomer(this.pos.x, this.pos.y, nextSz));
      }
    }
    return killed;
  }

  update(dt, playerPos, W, H) {
    this.angle += this.rotSpeed * dt;

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    const margin = 18;
    if (this.pos.x < margin) { this.vel.x = Math.abs(this.vel.x); this.pos.x = margin; }
    if (this.pos.x > W - margin) { this.vel.x = -Math.abs(this.vel.x); this.pos.x = W - margin; }
    if (this.pos.y < margin) { this.vel.y = Math.abs(this.vel.y); this.pos.y = margin; }
    if (this.pos.y > H - margin) { this.vel.y = -Math.abs(this.vel.y); this.pos.y = H - margin; }

    if (this.flash > 0) this.flash -= dt;
  }

  draw(ctx) {
    this.drawBase(ctx, (ctx, s) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? s : s * 0.55;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
}

class Player {
  constructor(x, y) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2();
    this.angle = 0;
    this.size = 12;
    this.invincible = 0;
    this.fireT = 0;
    this.trail = [];
    this.trailT = 0;
    this.gridStrength = -8;
  }

  update(dt, input, W, H) {
    const tx = input.left.x * 290;
    const ty = input.left.y * 290;
    const f = 1 - Math.pow(0.01, dt);
    this.vel.x = lerp(this.vel.x, tx, f);
    this.vel.y = lerp(this.vel.y, ty, f);

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.x = clamp(this.pos.x, 14, W - 14);
    this.pos.y = clamp(this.pos.y, 14, H - 14);

    if (input.right.len() > 0.1) {
      this.angle = input.right.angle();
    } else if (this.vel.len() > 25) {
      this.angle = this.vel.angle();
    }

    if (this.invincible > 0) this.invincible = Math.max(0, this.invincible - dt);
    if (this.fireT > 0) this.fireT = Math.max(0, this.fireT - dt);

    this.trailT -= dt;
    if (this.trailT <= 0 && this.vel.len() > 25) {
      this.trailT = 0.03;
      this.trail.push({ x: this.pos.x, y: this.pos.y, life: 0.28 });
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }

  canFire() {
    return this.fireT <= 0;
  }

  fire(dir) {
    this.fireT = 0.08;
    const spread = (Math.random() - 0.5) * 0.08;
    const a = dir.angle() + spread;
    return new Bullet(this.pos.x, this.pos.y, Math.cos(a) * 610, Math.sin(a) * 610);
  }

  draw(ctx, blink) {
    if (this.invincible > 0 && blink) return;

    for (const t of this.trail) {
      const alpha = (t.life / 0.28) * 0.45;
      const r = 4 * (t.life / 0.28);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = '#00ffff';
    ctx.fillStyle = 'rgba(0,220,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-9, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (Math.random() < 0.65) {
      const flameLen = rand(14, 21);
      ctx.shadowColor = '#ff7700';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(-flameLen, 0);
      ctx.lineTo(-5, 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}
