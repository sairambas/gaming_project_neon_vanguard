/**
 * Neon Vanguard - Main Game Controller, Loop & State Machine
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // DOM UI Elements
    this.scoreEl = document.getElementById('score-val');
    this.waveEl = document.getElementById('wave-val');
    this.highScoreEl = document.getElementById('high-score-val');
    this.hpBarEl = document.getElementById('hp-bar');
    this.dashBarEl = document.getElementById('dash-bar');

    this.startOverlay = document.getElementById('start-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalWaveEl = document.getElementById('final-wave');
    this.finalKillsEl = document.getElementById('final-kills');

    // High Score
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('neon_vanguard_highscore') || '0', 10);
    this.highScoreEl.innerText = this.highScore.toLocaleString();

    // Game State: 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'MENU';

    // Camera & Screen Shake
    this.camera = {
      x: 0,
      y: 0,
      viewWidth: window.innerWidth,
      viewHeight: window.innerHeight,
      shake: 0
    };

    // Subsystems
    this.level = new Level(2000, 1600);
    this.player = new Player(1000, 800);
    this.enemyManager = new EnemyManager();

    // Input States
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, rightClick: false };

    this.initEvents();
    this.resizeCanvas();
    this.lastTime = performance.now();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.viewWidth = window.innerWidth;
    this.camera.viewHeight = window.innerHeight;
  }

  initEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Audio init on keypress
      if (window.audio) window.audio.init();

      // Pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'PLAYING') {
          this.state = 'PAUSED';
          this.pauseOverlay.classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
          this.state = 'PLAYING';
          this.pauseOverlay.classList.add('hidden');
        }
      }

      // Mute toggle
      if (e.code === 'KeyM') {
        if (window.audio) {
          const isMuted = window.audio.toggleMute();
          this.level.addFloatingText(isMuted ? 'AUDIO MUTED' : 'AUDIO ENABLED', this.player.x - 40, this.player.y - 30, '#00f0ff');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (window.audio) window.audio.init();
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightClick = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightClick = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Buttons
    document.getElementById('btn-start').addEventListener('click', () => {
      if (window.audio) window.audio.init();
      this.startGame();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      if (window.audio) window.audio.init();
      this.startGame();
    });
  }

  startGame() {
    this.score = 0;
    this.scoreEl.innerText = '0';
    this.waveEl.innerText = '1';

    this.player.reset();
    this.level.reset();
    this.enemyManager.reset();

    this.startOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');

    this.state = 'PLAYING';
  }

  gameOver() {
    this.state = 'GAMEOVER';
    if (window.audio) window.audio.playGameOver();

    // Check high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_vanguard_highscore', this.highScore.toString());
      this.highScoreEl.innerText = this.highScore.toLocaleString();
    }

    this.finalScoreEl.innerText = this.score.toLocaleString();
    this.finalWaveEl.innerText = this.enemyManager.wave.toString();
    this.finalKillsEl.innerText = this.enemyManager.totalKills.toString();

    this.gameoverOverlay.classList.remove('hidden');
  }

  addScore(amount) {
    this.score += amount;
    this.scoreEl.innerText = this.score.toLocaleString();
  }

  updateCamera() {
    // Smooth camera tracking on player
    const targetX = this.player.x - this.camera.viewWidth / 2;
    const targetY = this.player.y - this.camera.viewHeight / 2;

    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    // Apply & decay screen shake
    if (this.camera.shake > 0) {
      this.camera.x += (Math.random() - 0.5) * this.camera.shake;
      this.camera.y += (Math.random() - 0.5) * this.camera.shake;
      this.camera.shake *= 0.88;
      if (this.camera.shake < 0.2) this.camera.shake = 0;
    }
  }

  updateHUD() {
    // Health bar
    const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
    this.hpBarEl.style.width = `${hpRatio * 100}%`;

    // Dash bar
    const dashRatio = 1 - (this.player.dashCooldown / this.player.maxDashCooldown);
    this.dashBarEl.style.width = `${Math.min(100, dashRatio * 100)}%`;

    // Wave indicator
    this.waveEl.innerText = this.enemyManager.wave.toString();
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      // 1. Update entities
      this.player.update(this.keys, this.mouse, this.level, this.camera);
      this.level.update(dt);
      this.enemyManager.update(this.player, this.level, (scoreVal) => {
        this.addScore(scoreVal);
        this.camera.shake = 4;
      });

      // 2. Camera & HUD
      this.updateCamera();
      this.updateHUD();

      // Check player death
      if (this.player.hp <= 0) {
        this.gameOver();
      }
    }

    // 3. Render frame
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw scene layers in world coordinates
    this.level.draw(this.ctx, this.camera);
    this.enemyManager.draw(this.ctx, this.camera);
    this.player.draw(this.ctx, this.camera);

    // Crosshair rendering
    this.ctx.save();
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
    this.ctx.moveTo(this.mouse.x - 12, this.mouse.y);
    this.ctx.lineTo(this.mouse.x + 12, this.mouse.y);
    this.ctx.moveTo(this.mouse.x, this.mouse.y - 12);
    this.ctx.lineTo(this.mouse.x, this.mouse.y + 12);
    this.ctx.stroke();
    this.ctx.restore();
  }
}

// Instantiate game on load
window.addEventListener('load', () => {
  window.game = new Game();
});
