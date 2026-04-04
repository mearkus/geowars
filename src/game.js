// =============================================================================
// Game — main game controller
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.ctx = this.canvas.getContext('2d');
    this.nameInput = document.getElementById('nameInput');

    this.audio = new AudioManager();
    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.grid = new Grid(44);
    this.profiles = new ProfileManager();

    // State machine
    this.state = 'profile_select'; // profile_select | phase_select | menu | playing | level_clear | phase_clear | gameover

    // Game state
    this.score = 0;
    this.lives = 3;
    this.multiplier = 1;
    this.multKills = 0;
    this.multTimer = 0;
    this.currentLevelIdx = 0;

    // Timers
    this.levelClearTimer = 0;
    this.phaseClearTimer = 0;
    this.stateTimer = 0;

    // Entities
    this.player = null;
    this.enemies = [];
    this.bullets = [];       // player bullets
    this.enemyBullets = [];
    this.spawner = null;

    // Rendering
    this.screenShake = 0;
    this.frameCount = 0;
    this.lastTime = 0;

    // UI
    this.clickZones = [];   // rebuilt each frame: [{x,y,w,h,action,longPress?,slot?}]
    this.pressStart = 0;
    this.pressSlot = -1;
    this._longPressHandled = false;
    this.renamingSlot = -1;

    // Level clear state
    this.bonusAwarded = 0;
    this.isPhaseEnd = false;
    this.phaseClearPhase = 0;
    this.isNewBest = false;

    this._setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame(t => { this.lastTime = t; this.loop(t); });
  }

  _setupEvents() {
    // Single click handler — never re-registered
    this.canvas.addEventListener('click', e => this._onClick(e));

    // Long-press for profile rename (500ms hold)
    this.canvas.addEventListener('pointerdown', e => {
      this.pressStart = performance.now();
      this.pressSlot = -1;
      this._longPressHandled = false;
      const pos = this._canvasPos(e);
      for (const zone of this.clickZones) {
        if (zone.longPress && this._inZone(pos, zone)) {
          this.pressSlot = zone.slot;
          break;
        }
      }
    });

    this.canvas.addEventListener('pointermove', () => {
      this.pressSlot = -1;
    });

    this.canvas.addEventListener('pointerup', e => {
      const held = performance.now() - this.pressStart;
      if (held >= 480 && this.pressSlot >= 0 && this.state === 'profile_select') {
        this._longPressHandled = true;
        this._startRename(this.pressSlot);
      }
      this.pressSlot = -1;
    });

    // Name input confirm
    this.nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._confirmRename();
    });
    this.nameInput.addEventListener('blur', () => {
      if (this.renamingSlot >= 0) this._confirmRename();
    });
  }

  _canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / r.width;
    const scaleY = this.canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY
    };
  }

  _inZone(pos, z) {
    return pos.x >= z.x && pos.x <= z.x + z.w && pos.y >= z.y && pos.y <= z.y + z.h;
  }

  _onClick(e) {
    if (this._longPressHandled) {
      this._longPressHandled = false;
      return;
    }
    if (this.renamingSlot >= 0) return;
    this.audio.resume();
    const pos = this._canvasPos(e);
    for (const zone of this.clickZones) {
      if (!zone.longPress && this._inZone(pos, zone)) {
        zone.action();
        return;
      }
    }
  }

  _addZone(x, y, w, h, action, longPress = false, slot = -1) {
    this.clickZones.push({ x, y, w, h, action, longPress, slot });
  }

  _startRename(slot) {
    this.renamingSlot = slot;
    this.profiles.getOrCreate(slot);
    this.nameInput.style.display = 'block';
    this.nameInput.value = this.profiles.get(slot).name;
    this.nameInput.focus();
    this.nameInput.select();
  }

  _confirmRename() {
    const slot = this.renamingSlot;
    this.renamingSlot = -1;
    this.nameInput.style.display = 'none';
    if (slot < 0) return;
    const name = this.nameInput.value.trim().toUpperCase().substring(0, 12) || `PLAYER ${slot + 1}`;
    this.profiles.update(slot, { name });
  }

  resize() {
    this.W = this.canvas.width = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this.grid.resize(this.W, this.H);
  }

  setState(s) {
    this.state = s;
    this.stateTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // Game flow methods
  // ---------------------------------------------------------------------------

  startGame(levelIdx) {
    // Reset
    this.score = 0;
    this.lives = 3;
    this.multiplier = 1;
    this.multKills = 0;
    this.multTimer = 0;

    // Clear
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.particles.clear();

    this.player = new Player(this.W / 2, this.H / 2);

    // Update profile
    const prof = this.profiles.getActive();
    if (prof) {
      this.profiles.update(this.profiles.active, {
        totalGamesPlayed: (prof.totalGamesPlayed || 0) + 1,
        lastPlayed: Date.now()
      });
    }

    this.startLevel(levelIdx);
  }

  startLevel(idx) {
    this.currentLevelIdx = idx;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.spawner = new WaveSpawner(idx, this.W, this.H);
    this.setState('playing');
  }

  killPlayer() {
    if (this.player && this.player.invincible > 0) return;
    this.audio.die();
    this._explode(this.player.pos.x, this.player.pos.y, '#00ffff', 40, 300);
    this.screenShake = 0.9;
    this.lives--;
    if (this.lives <= 0) {
      this._gameOver();
    } else {
      this.player.pos.set(this.W / 2, this.H / 2);
      this.player.vel.set(0, 0);
      this.player.invincible = 2.5;
      this.bullets = [];
    }
  }

  _gameOver() {
    const prof = this.profiles.getActive();
    const oldHighScore = prof ? (prof.highScore || 0) : 0;
    const oldHighestLevel = prof ? (prof.highestLevel || 0) : 0;
    this.isNewBest = this.score > oldHighScore;

    if (prof) {
      this.profiles.update(this.profiles.active, {
        highScore: Math.max(oldHighScore, this.score),
        highestLevel: Math.max(oldHighestLevel, this.currentLevelIdx)
      });
    }

    this.setState('gameover');
  }

  _levelClear() {
    const bonus = this.lives * 1000;
    this.score += bonus;
    this.bonusAwarded = bonus;
    this.audio.levelUp();

    // Save progress
    const prof = this.profiles.getActive();
    const oldHighScore = prof ? (prof.highScore || 0) : 0;
    const oldHighestLevel = prof ? (prof.highestLevel || 0) : 0;
    if (prof) {
      this.profiles.update(this.profiles.active, {
        highestLevel: Math.max(oldHighestLevel, this.currentLevelIdx + 1),
        highScore: Math.max(oldHighScore, this.score)
      });
    }

    // Check if this is the last level of a phase
    const safeLevelIdx = Math.min(this.currentLevelIdx, 29);
    const curPhase = LEVELS_DATA[safeLevelIdx].phase;
    const phaseEnd = PHASES_DATA[curPhase].end;

    if (this.currentLevelIdx === phaseEnd && curPhase < 4) {
      // Unlock next phase in profile
      const activeProfData = this.profiles.getActive();
      if (activeProfData) {
        const newUnlocked = [...(activeProfData.unlockedPhases || [true, false, false, false, false])];
        newUnlocked[curPhase + 1] = true;
        this.profiles.update(this.profiles.active, { unlockedPhases: newUnlocked });
      }
      this.isPhaseEnd = true;
      this.phaseClearPhase = curPhase;
      this.levelClearTimer = 3.0;
      this.setState('level_clear');
      return;
    }

    this.isPhaseEnd = false;
    this.levelClearTimer = 3.0;
    this.setState('level_clear');
  }

  _explode(x, y, color, n, spd) {
    this.particles.emit(x, y, color, n, spd, 2, 5, 0.3, 0.8);
    // Shockwave: 6 directions, 3 particles each
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bv = Vec2.fromAngle(a, spd * 0.6);
      this.particles.emit(
        x + bv.x * 0.1, y + bv.y * 0.1,
        color, 3, spd * 0.55,
        1, 3, 0.2, 0.5
      );
    }
  }

  addMultiplier() {
    this.multKills++;
    this.multTimer = 3.0;
    if (this.multKills >= 10) {
      this.multiplier = Math.min(20, this.multiplier + 1);
      this.multKills = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // update(dt)
  // ---------------------------------------------------------------------------

  update(dt) {
    this.frameCount++;

    if (this.state === 'playing') {
      this.input.update(this.player ? this.player.pos : null);
      this._updateGame(dt);
    } else if (this.state === 'level_clear') {
      this.levelClearTimer -= dt;
      if (this.levelClearTimer <= 0) {
        if (this.isPhaseEnd) {
          this.phaseClearTimer = 5.0;
          this.setState('phase_clear');
        } else {
          this.startLevel(this.currentLevelIdx + 1);
        }
      }
    } else if (this.state === 'phase_clear') {
      this.phaseClearTimer -= dt;
      if (this.phaseClearTimer <= 0) {
        const nextPhase = this.phaseClearPhase + 1;
        if (nextPhase >= 5) {
          this.startLevel(30); // endless mode
        } else {
          this.startLevel(PHASES_DATA[nextPhase].start);
        }
      }
    }

    this.particles.update(dt);
    this.screenShake *= Math.pow(0.04, dt);
    this.stateTimer += dt;
  }

  _updateGame(dt) {
    // Multiplier decay
    if (this.multTimer > 0) {
      this.multTimer -= dt;
      if (this.multTimer <= 0 && this.multiplier > 1) {
        this.multiplier = 1;
        this.multKills = 0;
      }
    }

    // Player
    if (this.player) {
      this.player.update(dt, this.input, this.W, this.H);
    }

    // Fire
    if (this.player && this.input.shooting && this.input.right.len() > 0.1 && this.player.canFire()) {
      this.bullets.push(this.player.fire(this.input.right));
      this.audio.shoot();
    }

    // Player bullets update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(dt, this.W, this.H);
      if (this.bullets[i].dead) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemy bullets update + player collision
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.update(dt, this.W, this.H);
      if (eb.dead) {
        this.enemyBullets.splice(i, 1);
      } else if (this.player && eb.pos.distTo(this.player.pos) < this.player.size + 3) {
        this.enemyBullets.splice(i, 1);
        this.killPlayer();
      }
    }

    // Spawner
    if (this.spawner) {
      const newEnemies = this.spawner.update(dt);
      for (const e of newEnemies) {
        this.enemies.push(e);
      }
    }

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player ? this.player.pos : new Vec2(this.W / 2, this.H / 2), this.W, this.H);

      // Flush pinwheel bullets
      if (e.pendingBullets && e.pendingBullets.length > 0) {
        for (const b of e.pendingBullets) {
          this.enemyBullets.push(b);
        }
        e.pendingBullets = [];
      }

      // Collision with player
      if (this.player && e.collides(this.player.pos, this.player.size)) {
        this.killPlayer();
      }

      // Collision with player bullets
      let enemyKilled = false;
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (b.pos.distTo(e.pos) < e.size + 4) {
          b.dead = true;
          const killed = e.hit();
          if (killed) {
            this.score += e.score * this.multiplier;
            this.addMultiplier();

            // Update profile kills
            const prof = this.profiles.getActive();
            if (prof) {
              this.profiles.update(this.profiles.active, {
                totalKills: (prof.totalKills || 0) + 1
              });
            }

            this.audio.explode(e.size / 14);
            this._explode(e.pos.x, e.pos.y, e.color, 18, 210);
            this.screenShake = Math.min(this.screenShake + 0.12, 0.45);

            // Spawn children (e.g. Bloomer splits)
            if (e.pendingSpawns && e.pendingSpawns.length > 0) {
              for (const spawn of e.pendingSpawns) {
                this.enemies.push(spawn);
              }
            }

            this.enemies.splice(i, 1);
            enemyKilled = true;
          } else {
            this._explode(e.pos.x, e.pos.y, '#ffffff', 5, 80);
          }
          break;
        }
      }

      if (enemyKilled) continue;
    }

    // Level complete check
    if (this.spawner && this.spawner.done && this.enemies.length === 0) {
      this._levelClear();
    }

    // Grid
    const gridEnts = [
      ...(this.player ? [this.player] : []),
      ...this.bullets.slice(0, 15),
      ...this.enemies.slice(0, 15)
    ];
    this.grid.update(dt, gridEnts);
  }

  // ---------------------------------------------------------------------------
  // draw()
  // ---------------------------------------------------------------------------

  draw() {
    const { ctx, W, H } = this;
    this.clickZones = [];

    ctx.save();

    // Screen shake
    if (this.screenShake > 0.01) {
      const mag = this.screenShake * 12;
      ctx.translate(
        (Math.random() * 2 - 1) * mag,
        (Math.random() * 2 - 1) * mag
      );
    }

    // Background
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);
    this.grid.draw(ctx);

    switch (this.state) {
      case 'profile_select': this._drawProfileSelect(ctx); break;
      case 'phase_select':   this._drawPhaseSelect(ctx);   break;
      case 'menu':           this._drawMenu(ctx);           break;
      case 'playing':        this._drawPlaying(ctx);        break;
      case 'level_clear':
        this._drawPlaying(ctx);
        this._drawLevelClear(ctx);
        break;
      case 'phase_clear':    this._drawPhaseClear(ctx);    break;
      case 'gameover':       this._drawGameOver(ctx);       break;
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Drawing helpers
  // ---------------------------------------------------------------------------

  _neonText(ctx, text, x, y, color, size, align = 'center') {
    ctx.save();
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.6;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _neonRect(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '22';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  _button(ctx, text, x, y, w, h, color, action) {
    this._neonRect(ctx, x, y, w, h, color);
    this._neonText(ctx, text, x + w / 2, y + h / 2, color, Math.min(h * 0.42, 20));
    this._addZone(x, y, w, h, action);
  }

  // ---------------------------------------------------------------------------
  // Screen drawing methods
  // ---------------------------------------------------------------------------

  _drawProfileSelect(ctx) {
    const { W, H } = this;

    // Title
    this._neonText(ctx, 'GEOMETRY WARS', W / 2, H * 0.12, '#00ffff', 34);
    this._neonText(ctx, 'SELECT PROFILE', W / 2, H * 0.12 + 48, '#8888ff', 18);
    this._neonText(ctx, 'HOLD CARD TO RENAME', W / 2, H * 0.12 + 78, '#445566', 12);

    const cardW = Math.min(W * 0.8, 380);
    const cardH = 90;
    const cardX = W / 2 - cardW / 2;
    const startY = H * 0.3;
    const gap = 108;

    for (let i = 0; i < 3; i++) {
      const cy = startY + i * gap;
      const isActive = (i === this.profiles.active);
      const color = isActive ? '#00ffff' : '#446688';
      const prof = this.profiles.get(i);

      this._neonRect(ctx, cardX, cy, cardW, cardH, color);

      if (prof) {
        // Profile name
        this._neonText(ctx, prof.name, cardX + 18, cy + 26, color, 17, 'left');
        // Stats
        const statsStr = `HI: ${prof.highScore || 0}  |  LEVEL: ${(prof.highestLevel || 0) + 1}  |  KILLS: ${prof.totalKills || 0}`;
        this._neonText(ctx, statsStr, cardX + 18, cy + 58, '#667799', 11, 'left');
      } else {
        this._neonText(ctx, `SLOT ${i + 1} — EMPTY`, cardX + 18, cy + 26, '#446688', 15, 'left');
        this._neonText(ctx, 'TAP TO CREATE  |  HOLD TO RENAME', cardX + 18, cy + 58, '#334455', 11, 'left');
      }

      // Regular click: select profile
      const slotIdx = i;
      this._addZone(cardX, cy, cardW, cardH, () => {
        this.profiles.active = slotIdx;
        this.profiles.getOrCreate(slotIdx);
        this.setState('menu');
      });

      // Long-press zone
      this._addZone(cardX, cy, cardW, cardH, () => {}, true, i);
    }
  }

  _drawPhaseSelect(ctx) {
    const { W, H } = this;

    this._neonText(ctx, 'SELECT PHASE', W / 2, H * 0.1, '#00ffff', 26);
    const activeProf = this.profiles.getActive();
    const profName = activeProf ? activeProf.name : 'PLAYER';
    this._neonText(ctx, profName, W / 2, H * 0.1 + 36, '#8888ff', 14);

    const tileW = Math.min(W * 0.85, 360);
    const tileH = 68;
    const tileX = W / 2 - tileW / 2;
    const startY = H * 0.24;
    const gap = 80;

    for (let ph = 0; ph < 5; ph++) {
      const pd = PHASES_DATA[ph];
      const cy = startY + ph * gap;
      const unlockedPhases = activeProf ? activeProf.unlockedPhases : [true, false, false, false, false];
      const unlocked = unlockedPhases ? (unlockedPhases[ph] || ph === 0) : (ph === 0);

      if (unlocked) {
        this._neonRect(ctx, tileX, cy, tileW, tileH, pd.color);
        this._neonText(ctx, pd.name, tileX + 14, cy + 22, pd.color, 16, 'left');
        const startLvl = pd.start + 1;
        const endLvl = pd.end + 1;
        this._neonText(ctx, `LEVELS ${startLvl}–${endLvl}`, tileX + 14, cy + 50, pd.color + 'aa', 12, 'left');

        const phIdx = ph;
        this._addZone(tileX, cy, tileW, tileH, () => {
          this.startGame(PHASES_DATA[phIdx].start);
        });
      } else {
        // Locked
        ctx.save();
        ctx.strokeStyle = '#334455';
        ctx.fillStyle = '#222233';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tileX, cy, tileW, tileH);
        ctx.fillRect(tileX, cy, tileW, tileH);
        ctx.restore();

        this._neonText(ctx, `${pd.name}  [LOCKED]`, tileX + 14, cy + 22, '#445566', 14, 'left');
        const prevPhase = PHASES_DATA[ph - 1];
        this._neonText(ctx, `Clear ${prevPhase ? prevPhase.name : ''} to unlock`, tileX + 14, cy + 50, '#334455', 11, 'left');
      }
    }

    // Back button
    const btnW = 160;
    const btnH = 44;
    this._button(ctx, 'BACK', W / 2 - btnW / 2, H - 80, btnW, btnH, '#446688', () => {
      this.setState('menu');
    });
  }

  _drawMenu(ctx) {
    const { W, H } = this;
    const pulse = 0.9 + 0.1 * Math.sin(this.stateTimer * 2);

    ctx.save();
    ctx.globalAlpha = pulse;
    this._neonText(ctx, 'GEOMETRY WARS', W / 2, H * 0.2, '#00ffff', 36);
    ctx.restore();

    this._neonText(ctx, 'MOBILE EDITION', W / 2, H * 0.3, '#6666cc', 16);

    const activeProf = this.profiles.getActive();
    if (activeProf) {
      this._neonText(ctx, activeProf.name, W / 2, H * 0.42, '#00ffff', 15);
      this._neonText(ctx, `HI: ${activeProf.highScore || 0}  |  KILLS: ${activeProf.totalKills || 0}`, W / 2, H * 0.47, '#667799', 12);
    }

    const btnW = Math.min(W * 0.6, 280);
    const btnH = 52;
    const btnX = W / 2 - btnW / 2;

    // PLAY button: start from beginning of highest unlocked phase
    const highestPhase = activeProf ? this.profiles.firstUnlockedPhase(this.profiles.active) : 0;
    this._button(ctx, 'PLAY', btnX, H * 0.58, btnW, btnH, '#00ffff', () => {
      this.startGame(PHASES_DATA[highestPhase].start);
    });

    this._button(ctx, 'LEVEL SELECT', btnX, H * 0.68, btnW, btnH, '#44ff88', () => {
      this.setState('phase_select');
    });

    this._button(ctx, 'CHANGE PROFILE', btnX, H * 0.77, btnW, btnH, '#8888ff', () => {
      this.setState('profile_select');
    });

    // Controls hint
    this._neonText(ctx, 'WASD / LEFT STICK: MOVE   ·   IJKL / RIGHT STICK / MOUSE: SHOOT', W / 2, H - 24, '#334455', 11);
  }

  _drawPlaying(ctx) {
    const { W, H } = this;

    this.particles.draw(ctx);

    // Enemy bullets
    for (const b of this.enemyBullets) {
      ctx.save();
      ctx.fillStyle = '#ff44ff';
      ctx.shadowColor = '#ff44ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Player bullets
    for (const b of this.bullets) {
      b.draw(ctx);
    }

    // Enemies
    for (const e of this.enemies) {
      e.draw(ctx);
    }

    // Player
    if (this.player) {
      this.player.draw(ctx, this.frameCount % 5 < 2);
    }

    this._drawHUD(ctx);
    this._drawJoysticks(ctx);

    // Wave intro text (fade in/out during first 1.8s of spawner)
    if (this.spawner && this.spawner.elapsed < 1.8) {
      const ld = getLevelData(this.currentLevelIdx);
      const alpha = Math.sin((this.spawner.elapsed / 1.8) * Math.PI);
      ctx.save();
      ctx.globalAlpha = alpha;
      this._neonText(ctx, `LEVEL ${this.currentLevelIdx + 1}`, W / 2, H / 2 - 30, '#ffffff', 30);
      this._neonText(ctx, ld.name, W / 2, H / 2 + 14, '#aaaaff', 18);
      ctx.restore();
    }
  }

  _drawHUD(ctx) {
    const { W, H } = this;

    // Score (top-left)
    this._neonText(ctx, String(this.score), 20, 28, '#ffffff', 24, 'left');

    // Hi score below
    const activeProf = this.profiles.getActive();
    if (activeProf) {
      this._neonText(ctx, `HI ${activeProf.highScore || 0}`, 20, 52, '#8888ff', 13, 'left');
    }

    // Multiplier (top-center)
    if (this.multiplier > 1 || this.multKills > 0) {
      this._neonText(ctx, `×${this.multiplier}`, W / 2, 26, '#ffff00', 22);

      // Progress bar
      const bw = 90;
      const bh = 4;
      const bx = W / 2 - 45;
      const by = 40;
      const fill = this.multKills / 10;

      ctx.save();
      ctx.fillStyle = '#333300';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 8;
      ctx.fillRect(bx, by, bw * fill, bh);
      ctx.restore();
    }

    // Lives (top-right): mini ship icons
    for (let i = 0; i < this.lives; i++) {
      const sx = W - 20 - i * 28;
      const sy = 28;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-Math.PI / 2);
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#00ffff';
      ctx.fillStyle = 'rgba(0,220,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Level + phase name (top-right, below lives)
    const ld = getLevelData(this.currentLevelIdx);
    const phData = PHASES_DATA[Math.min(ld.phase, 4)];
    this._neonText(ctx, `LVL ${this.currentLevelIdx + 1} · ${phData.name}`, W - 16, 56, phData.color, 12, 'right');
  }

  _drawJoysticks(ctx) {
    const MAX = 65;

    const drawStick = (stick) => {
      if (!stick) return;
      const { origin, pos } = stick;

      ctx.save();

      // Outer ring
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, MAX, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thumb
      const dx = clamp(pos.x - origin.x, -MAX, MAX);
      const dy = clamp(pos.y - origin.y, -MAX, MAX);
      const len = Math.sqrt(dx * dx + dy * dy);
      let tx, ty;
      if (len > MAX) {
        tx = origin.x + (dx / len) * MAX;
        ty = origin.y + (dy / len) * MAX;
      } else {
        tx = pos.x;
        ty = pos.y;
      }

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(tx, ty, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    drawStick(this.input.getLeftStick());
    drawStick(this.input.getRightStick());
  }

  _drawLevelClear(ctx) {
    const { W, H } = this;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    this._neonText(ctx, `LEVEL ${this.currentLevelIdx + 1} CLEAR!`, W / 2, H / 2 - 50, '#00ff88', 34);
    this._neonText(ctx, `BONUS +${this.bonusAwarded}`, W / 2, H / 2, '#ffff44', 22);
    this._neonText(ctx, `SCORE: ${this.score}`, W / 2, H / 2 + 44, '#ffffff', 18);
    this._neonText(ctx, `NEXT IN ${Math.ceil(this.levelClearTimer)}…`, W / 2, H / 2 + 80, '#666688', 15);
  }

  _drawPhaseClear(ctx) {
    const { W, H } = this;
    const ph = PHASES_DATA[this.phaseClearPhase];
    const pulse = 0.85 + 0.15 * Math.sin(this.stateTimer * 3);

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    this._neonText(ctx, 'PHASE COMPLETE!', W / 2, H / 2 - 80, ph.color, 36);
    this._neonText(ctx, ph.name, W / 2, H / 2 - 30, ph.color, 26);
    ctx.globalAlpha = 1;
    this._neonText(ctx, `SCORE: ${this.score}`, W / 2, H / 2 + 30, '#ffffff', 22);

    if (this.phaseClearPhase + 1 < 5) {
      const next = PHASES_DATA[this.phaseClearPhase + 1];
      this._neonText(ctx, `UNLOCKED: ${next.name}`, W / 2, H / 2 + 70, next.color, 17);
    }

    this._neonText(ctx, `CONTINUING IN ${Math.ceil(this.phaseClearTimer)}…`, W / 2, H / 2 + 110, '#555577', 14);
    ctx.restore();
  }

  _drawGameOver(ctx) {
    const { W, H } = this;

    ctx.fillStyle = 'rgba(0,0,8,0.72)';
    ctx.fillRect(0, 0, W, H);

    this._neonText(ctx, 'GAME OVER', W / 2, H * 0.22, '#ff3333', 44);
    this._neonText(ctx, `SCORE: ${this.score}`, W / 2, H * 0.35, '#ffffff', 24);
    this._neonText(ctx, `LEVEL: ${this.currentLevelIdx + 1}`, W / 2, H * 0.43, '#aaaaff', 18);

    if (this.isNewBest) {
      const pulseAlpha = 0.6 + 0.4 * Math.abs(Math.sin(this.stateTimer * 4));
      ctx.save();
      ctx.globalAlpha = pulseAlpha;
      this._neonText(ctx, 'NEW BEST!', W / 2, H * 0.51, '#ffff00', 22);
      ctx.restore();
    }

    const btnW = Math.min(W * 0.55, 260);
    const btnH = 50;
    const btnX = W / 2 - btnW / 2;

    const activeProf = this.profiles.getActive();
    const firstUnlocked = activeProf ? this.profiles.firstUnlockedPhase(this.profiles.active) : 0;

    this._button(ctx, 'PLAY AGAIN', btnX, H * 0.62, btnW, btnH, '#00ffff', () => {
      this.startGame(PHASES_DATA[firstUnlocked].start);
    });

    this._button(ctx, 'MAIN MENU', btnX, H * 0.72, btnW, btnH, '#8888ff', () => {
      this.setState('menu');
    });
  }

  // ---------------------------------------------------------------------------
  // loop(ts)
  // ---------------------------------------------------------------------------

  loop(ts) {
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
}

// =============================================================================
// Initialization
// =============================================================================
window.addEventListener('DOMContentLoaded', () => new Game());
