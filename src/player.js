/**
 * Neon Vanguard - Player Entity
 * Handles input, vector physics, abilities (Dash, Blaster), and rendering.
 */
class Player {
  constructor(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.angle = 0;

    // Attributes
    this.maxSpeed = 6;
    this.accel = 0.8;
    this.friction = 0.88;

    this.maxHp = 100;
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;

    // Dash Ability
    this.maxDashCooldown = 80; // frames (~1.3s)
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashSpeed = 16;

    // Weapon
    this.bullets = [];
    this.fireRate = 8; // frames per shot (~7.5 shots/sec)
    this.fireCooldown = 0;
    this.powerupTimer = 0; // triple shot buff
  }

  update(keys, mouse, level, camera) {
    // 1. Aim toward mouse in world coordinates
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

    // 2. Dash Handling
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.isDashing) {
      this.dashTimer--;
      // Spawn cyan ghost particle trail
      level.particles.push({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: this.radius * 0.9,
        color: '#00f0ff',
        alpha: 0.7,
        decay: 0.08
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Normal Movement
      let moveX = 0;
      let moveY = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      this.vx += moveX * this.accel;
      this.vy += moveY * this.accel;

      // Clamp max normal speed
      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (currentSpeed > this.maxSpeed) {
        this.vx = (this.vx / currentSpeed) * this.maxSpeed;
        this.vy = (this.vy / currentSpeed) * this.maxSpeed;
      }

      this.vx *= this.friction;
      this.vy *= this.friction;

      // Trigger Dash
      if ((keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space'] || mouse.rightClick) && this.dashCooldown === 0) {
        let dashDirX = moveX;
        let dashDirY = moveY;
        if (dashDirX === 0 && dashDirY === 0) {
          // Dash toward aim if standing still
          dashDirX = Math.cos(this.angle);
          dashDirY = Math.sin(this.angle);
        }
        const len = Math.hypot(dashDirX, dashDirY) || 1;
        this.vx = (dashDirX / len) * this.dashSpeed;
        this.vy = (dashDirY / len) * this.dashSpeed;

        this.isDashing = true;
        this.dashTimer = 10;
        this.dashCooldown = this.maxDashCooldown;
        if (window.audio) window.audio.playDash();
        level.spawnSparks(this.x, this.y, 14, '#00f0ff');
      }

      // Thruster exhaust particles when moving
      if (currentSpeed > 0.5 && Math.random() < 0.6) {
        const exhaustAngle = Math.atan2(this.vy, this.vx) + Math.PI + (Math.random() - 0.5) * 0.4;
        level.particles.push({
          x: this.x - Math.cos(this.angle) * 12,
          y: this.y - Math.sin(this.angle) * 12,
          vx: Math.cos(exhaustAngle) * (Math.random() * 2 + 1),
          vy: Math.sin(exhaustAngle) * (Math.random() * 2 + 1),
          radius: Math.random() * 3 + 1,
          color: '#00ffff',
          alpha: 0.8,
          decay: 0.05
        });
      }
    }

    // 3. Apply Velocity & Resolve Obstacle Collisions
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    // Obstacle collision resolution (Axis separation)
    for (const obs of level.obstacles) {
      if (level.checkCircleRectCollision(nextX, this.y, this.radius, obs)) {
        this.vx = 0;
        nextX = this.x;
      }
      if (level.checkCircleRectCollision(this.x, nextY, this.radius, obs)) {
        this.vy = 0;
        nextY = this.y;
      }
    }

    // Arena boundary clamps
    this.x = Math.max(this.radius, Math.min(level.width - this.radius, nextX));
    this.y = Math.max(this.radius, Math.min(level.height - this.radius, nextY));

    // 4. Weapons & Shooting
    if (this.powerupTimer > 0) this.powerupTimer--;
    if (this.fireCooldown > 0) this.fireCooldown--;

    if (mouse.isDown && this.fireCooldown <= 0) {
      this.fireWeapon(level);
      this.fireCooldown = this.fireRate;
    }

    // 5. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Check bullet hit obstacles
      let hitWall = false;
      if (b.x < 0 || b.x > level.width || b.y < 0 || b.y > level.height) {
        hitWall = true;
      } else {
        for (const obs of level.obstacles) {
          if (level.checkCircleRectCollision(b.x, b.y, b.radius, obs)) {
            hitWall = true;
            break;
          }
        }
      }

      if (hitWall || b.life <= 0) {
        level.spawnSparks(b.x, b.y, 4, '#00f0ff');
        this.bullets.splice(i, 1);
      }
    }

    // 6. Invulnerability Flash
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // 7. Check Pickup Collisions
    for (let i = level.pickups.length - 1; i >= 0; i--) {
      const pk = level.pickups[i];
      const dist = Math.hypot(this.x - pk.x, this.y - pk.y);
      if (dist < this.radius + pk.radius) {
        if (pk.type === 'health') {
          this.hp = Math.min(this.maxHp, this.hp + 30);
          level.addFloatingText('+30 HP', this.x, this.y - 20, '#00ff66');
        } else if (pk.type === 'power') {
          this.powerupTimer = 400; // ~6.6 seconds of triple shot
          level.addFloatingText('TRIPLE BLASTER!', this.x, this.y - 20, '#ffe600');
        }
        if (window.audio) window.audio.playPowerup();
        level.spawnSparks(pk.x, pk.y, 16, '#ffe600');
        level.pickups.splice(i, 1);
      }
    }
  }

  fireWeapon(level) {
    if (window.audio) window.audio.playShoot();

    const bulletSpeed = 14;
    const baseAngle = this.angle;

    const spawnBullet = (ang) => {
      const muzzleX = this.x + Math.cos(ang) * (this.radius + 8);
      const muzzleY = this.y + Math.sin(ang) * (this.radius + 8);
      this.bullets.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(ang) * bulletSpeed,
        vy: Math.sin(ang) * bulletSpeed,
        radius: 4,
        life: 50,
        damage: 25
      });
      level.spawnSparks(muzzleX, muzzleY, 3, '#00f0ff');
    };

    if (this.powerupTimer > 0) {
      // Triple Shot spread
      spawnBullet(baseAngle);
      spawnBullet(baseAngle - 0.16);
      spawnBullet(baseAngle + 0.16);
    } else {
      // Single Shot with tiny jitter
      const jitter = (Math.random() - 0.5) * 0.04;
      spawnBullet(baseAngle + jitter);
    }
  }

  takeDamage(amount, level) {
    if (this.isDashing || this.invulnerableTimer > 0) return false;

    this.hp -= amount;
    this.invulnerableTimer = 35;
    if (window.audio) window.audio.playHit();
    level.spawnSparks(this.x, this.y, 12, '#ff0055');
    level.addFloatingText(`-${amount}`, this.x, this.y - 25, '#ff0055');

    return this.hp <= 0;
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Draw Bullets
    ctx.save();
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x - camera.x, b.y - camera.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Invulnerability Blink
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // Ship Hull (Futuristic stealth fighter)
    ctx.shadowColor = this.isDashing ? '#00f0ff' : '#00ffff';
    ctx.shadowBlur = this.isDashing ? 20 : 10;
    ctx.fillStyle = this.isDashing ? '#ffffff' : '#0e1626';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(this.radius + 6, 0); // Tip
    ctx.lineTo(-this.radius, -this.radius * 0.85); // Wing Left
    ctx.lineTo(-this.radius * 0.4, 0); // Engine indent
    ctx.lineTo(-this.radius, this.radius * 0.85); // Wing Right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit neon core
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Wing cannons
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(0, -this.radius * 0.8, 6, 2);
    ctx.fillRect(0, this.radius * 0.8 - 2, 6, 2);

    ctx.restore();
  }
}

window.Player = Player;
