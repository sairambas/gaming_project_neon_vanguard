/**
 * Neon Vanguard - Level, Arena, Obstacles, Pickups & Particle Systems
 */
class Level {
  constructor(width = 1800, height = 1400) {
    this.width = width;
    this.height = height;
    this.gridSize = 60;

    // Arena Obstacles (Pillars & Barrier blocks)
    this.obstacles = [
      { x: 450, y: 350, w: 100, h: 100 },
      { x: 1250, y: 350, w: 100, h: 100 },
      { x: 450, y: 950, w: 100, h: 100 },
      { x: 1250, y: 950, w: 100, h: 100 },
      { x: 820, y: 620, w: 160, h: 160 } // Center power core
    ];

    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.time = 0;
  }

  reset() {
    this.particles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.time = 0;
  }

  // Spawns cosmetic or pickup items
  spawnPickup(x, y, type = 'health') {
    this.pickups.push({
      x,
      y,
      type, // 'health', 'power', 'shield'
      radius: 12,
      pulse: Math.random() * Math.PI,
      lifetime: 900 // 15 seconds at 60fps
    });
  }

  spawnExplosion(x, y, color = '#ff0055', count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }

  spawnSparks(x, y, count = 8, color = '#00f0ff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color,
        alpha: 1,
        decay: Math.random() * 0.05 + 0.03
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffe600') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.2,
      lifetime: 50
    });
  }

  // Collision with obstacles
  checkCircleRectCollision(cx, cy, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const distX = cx - closestX;
    const distY = cy - closestY;
    return (distX * distX + distY * distY) < (radius * radius);
  }

  isPointInObstacle(x, y) {
    for (const obs of this.obstacles) {
      if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
        return true;
      }
    }
    return false;
  }

  update(dt) {
    this.time += dt;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 1 / ft.lifetime;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.pulse += 0.05;
      pk.lifetime--;
      if (pk.lifetime <= 0) {
        this.pickups.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    // 1. Draw Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;

    const startX = Math.floor(camera.x / this.gridSize) * this.gridSize;
    const endX = camera.x + camera.viewWidth + this.gridSize;
    const startY = Math.floor(camera.y / this.gridSize) * this.gridSize;
    const endY = camera.y + camera.viewHeight + this.gridSize;

    ctx.beginPath();
    for (let x = Math.max(0, startX); x <= Math.min(this.width, endX); x += this.gridSize) {
      ctx.moveTo(x - camera.x, Math.max(0, startY) - camera.y);
      ctx.lineTo(x - camera.x, Math.min(this.height, endY) - camera.y);
    }
    for (let y = Math.max(0, startY); y <= Math.min(this.height, endY); y += this.gridSize) {
      ctx.moveTo(Math.max(0, startX) - camera.x, y - camera.y);
      ctx.lineTo(Math.min(this.width, endX) - camera.x, y - camera.y);
    }
    ctx.stroke();

    // 2. Arena Boundary Wall
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.strokeRect(-camera.x, -camera.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // 3. Draw Obstacles
    for (const obs of this.obstacles) {
      const screenX = obs.x - camera.x;
      const screenY = obs.y - camera.y;

      // Obstacle interior fill
      ctx.fillStyle = '#0f1422';
      ctx.fillRect(screenX, screenY, obs.w, obs.h);

      // Glowing border
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, obs.w, obs.h);

      // Tech details inside pillar
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fillRect(screenX + 8, screenY + 8, obs.w - 16, obs.h - 16);

      // Pulsing center glyph
      const pulseSize = 10 + Math.sin(this.time * 3) * 3;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(screenX + obs.w / 2, screenY + obs.h / 2, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Pickups
    for (const pk of this.pickups) {
      const sx = pk.x - camera.x;
      const sy = pk.y - camera.y;
      const r = pk.radius + Math.sin(pk.pulse) * 3;

      ctx.save();
      ctx.translate(sx, sy);

      if (pk.type === 'health') {
        ctx.fillStyle = '#00ff66';
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 12;
        // Cross
        ctx.fillRect(-r * 0.7, -r * 0.25, r * 1.4, r * 0.5);
        ctx.fillRect(-r * 0.25, -r * 0.7, r * 0.5, r * 1.4);
      } else if (pk.type === 'power') {
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 12;
        // Diamond
        ctx.rotate(this.time * 2);
        ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      }
      ctx.restore();
    }

    // 5. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 6. Draw Floating Text
    for (const ft of this.floatingTexts) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

window.Level = Level;
