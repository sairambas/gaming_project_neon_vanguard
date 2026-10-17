/**
 * Neon Vanguard - Enemy Entities & Wave Spawner
 */
class Enemy {
  constructor(x, y, type = 'drone') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;
    this.angle = 0;

    // Archetype setup
    switch (type) {
      case 'speeder': // Fast, low HP
        this.radius = 12;
        this.speed = 3.6;
        this.maxHp = 25;
        this.color = '#ffe600';
        this.scoreValue = 75;
        this.shootCooldown = 0;
        break;

      case 'shooter': // Ranged shooter
        this.radius = 16;
        this.speed = 2.0;
        this.maxHp = 45;
        this.color = '#00f0ff';
        this.scoreValue = 120;
        this.shootCooldown = Math.floor(Math.random() * 60) + 90;
        break;

      case 'titan': // Heavy tank
        this.radius = 28;
        this.speed = 1.3;
        this.maxHp = 200;
        this.color = '#bf00ff';
        this.scoreValue = 350;
        this.shootCooldown = 120;
        break;

      case 'drone': // Standard chaser
      default:
        this.radius = 14;
        this.speed = 2.6;
        this.maxHp = 35;
        this.color = '#ff0055';
        this.scoreValue = 50;
        this.shootCooldown = 0;
        break;
    }

    this.hp = this.maxHp;
    this.hitFlash = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 6;
    return this.hp <= 0;
  }
}

class EnemyManager {
  constructor() {
    this.enemies = [];
    this.enemyBullets = [];
    this.wave = 1;
    this.waveState = 'intermission'; // 'spawning', 'active', 'intermission'
    this.waveTimer = 120; // 2s countdown before wave 1
    this.totalKills = 0;
  }

  reset() {
    this.enemies = [];
    this.enemyBullets = [];
    this.wave = 1;
    this.waveState = 'intermission';
    this.waveTimer = 120;
    this.totalKills = 0;
  }

  startNextWave(level) {
    this.waveState = 'active';
    if (window.audio) window.audio.playWaveStart();
    level.addFloatingText(`WAVE ${this.wave} INCOMING!`, level.width / 2 - 80, level.height / 2, '#00f0ff');

    const totalEnemies = 6 + this.wave * 4;
    for (let i = 0; i < totalEnemies; i++) {
      // Pick type based on wave progression
      let type = 'drone';
      const roll = Math.random();
      if (this.wave >= 2 && roll < 0.25) {
        type = 'speeder';
      } else if (this.wave >= 3 && roll < 0.45) {
        type = 'shooter';
      } else if (this.wave >= 4 && roll < 0.6) {
        type = 'titan';
      }

      // Spawn at arena edge
      const edge = Math.floor(Math.random() * 4);
      let sx = 0, sy = 0;
      const margin = 40;
      if (edge === 0) { sx = Math.random() * level.width; sy = margin; }
      else if (edge === 1) { sx = level.width - margin; sy = Math.random() * level.height; }
      else if (edge === 2) { sx = Math.random() * level.width; sy = level.height - margin; }
      else { sx = margin; sy = Math.random() * level.height; }

      this.enemies.push(new Enemy(sx, sy, type));
    }
  }

  update(player, level, onScoreAdded) {
    // 1. Wave Progression
    if (this.waveState === 'intermission') {
      this.waveTimer--;
      if (this.waveTimer <= 0) {
        this.startNextWave(level);
      }
    } else if (this.waveState === 'active' && this.enemies.length === 0) {
      // Wave cleared
      this.wave++;
      this.waveState = 'intermission';
      this.waveTimer = 160; // short breather
      level.addFloatingText('SECTOR SECURED', player.x - 60, player.y - 40, '#00ff66');
      if (window.audio) window.audio.playPowerup();
    }

    // 2. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hitFlash > 0) e.hitFlash--;

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.angle = Math.atan2(dy, dx);

      // Flocking / Boid-like separation between enemies
      let sepX = 0;
      let sepY = 0;
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const odx = e.x - other.x;
        const ody = e.y - other.y;
        const odist = Math.hypot(odx, ody);
        const minSpace = e.radius + other.radius + 6;
        if (odist < minSpace && odist > 0) {
          sepX += (odx / odist) * (minSpace - odist) * 0.1;
          sepY += (ody / odist) * (minSpace - odist) * 0.1;
        }
      }

      // Archetype Movement Behaviors
      if (e.type === 'shooter') {
        // Keep a distance of ~300px
        const targetDist = 320;
        const distFactor = (dist - targetDist) / targetDist;
        e.vx = (dx / dist) * e.speed * distFactor + sepX;
        e.vy = (dy / dist) * e.speed * distFactor + sepY;

        // Shoot at player
        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 90;
          const bulletSpeed = 6;
          this.enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: (dx / dist) * bulletSpeed,
            vy: (dy / dist) * bulletSpeed,
            radius: 5,
            life: 140,
            color: '#ff0055'
          });
        }
      } else {
        // Direct Chaser
        e.vx = (dx / dist) * e.speed + sepX;
        e.vy = (dy / dist) * e.speed + sepY;
      }

      e.x += e.vx;
      e.y += e.vy;

      // Check collision with player
      if (dist < e.radius + player.radius) {
        const damage = e.type === 'titan' ? 30 : 15;
        player.takeDamage(damage, level);
      }

      // Check bullet hits from player
      for (let bIdx = player.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = player.bullets[bIdx];
        const bDist = Math.hypot(e.x - b.x, e.y - b.y);
        if (bDist < e.radius + b.radius) {
          player.bullets.splice(bIdx, 1);
          level.spawnSparks(b.x, b.y, 6, e.color);

          const isDead = e.takeDamage(b.damage);
          if (isDead) {
            this.totalKills++;
            onScoreAdded(e.scoreValue);
            level.spawnExplosion(e.x, e.y, e.color, e.type === 'titan' ? 45 : 22);
            level.addFloatingText(`+${e.scoreValue}`, e.x, e.y - 15, '#ffe600');
            if (window.audio) window.audio.playExplosion();

            // Chance to drop powerup or health
            const dropChance = Math.random();
            if (dropChance < 0.12) {
              level.spawnPickup(e.x, e.y, 'health');
            } else if (dropChance < 0.22) {
              level.spawnPickup(e.x, e.y, 'power');
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }
    }

    // 3. Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Hit player check
      const distToPlayer = Math.hypot(b.x - player.x, b.y - player.y);
      if (distToPlayer < b.radius + player.radius) {
        player.takeDamage(15, level);
        level.spawnSparks(b.x, b.y, 8, '#ff0055');
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || b.x < 0 || b.x > level.width || b.y < 0 || b.y > level.height) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    // Draw Enemy Projectiles
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    for (const b of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(b.x - camera.x, b.y - camera.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Enemies
    for (const e of this.enemies) {
      const sx = e.x - camera.x;
      const sy = e.y - camera.y;

      // Frustum culling
      if (sx < -60 || sx > camera.viewWidth + 60 || sy < -60 || sy > camera.viewHeight + 60) {
        continue;
      }

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(e.angle);

      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#140c18';
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;

      // Unique geometric silhouette per type
      ctx.beginPath();
      if (e.type === 'titan') {
        // Octagon
        const sides = 8;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * e.radius;
          const py = Math.sin(a) * e.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else if (e.type === 'speeder') {
        // Sharp dart
        ctx.moveTo(e.radius * 1.4, 0);
        ctx.lineTo(-e.radius, -e.radius * 0.7);
        ctx.lineTo(-e.radius * 0.5, 0);
        ctx.lineTo(-e.radius, e.radius * 0.7);
      } else if (e.type === 'shooter') {
        // Diamond turret
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(0, -e.radius);
        ctx.lineTo(-e.radius, 0);
        ctx.lineTo(0, e.radius);
      } else {
        // Regular drone inverted triangle
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.8, -e.radius * 0.8);
        ctx.lineTo(-e.radius * 0.8, e.radius * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mini Health bar if damaged
      if (e.hp < e.maxHp) {
        ctx.restore();
        ctx.save();
        ctx.translate(sx, sy);
        const barW = e.radius * 2;
        const barH = 3;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-barW / 2, -e.radius - 8, barW, barH);
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(-barW / 2, -e.radius - 8, barW * (e.hp / e.maxHp), barH);
      }

      ctx.restore();
    }
  }
}

window.EnemyManager = EnemyManager;
