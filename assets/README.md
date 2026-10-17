# Assets Directory

This folder is reserved for external assets (images, sprite sheets, sound effects, and background music).

## Current Architecture
The game currently uses **procedural graphics and sound**:
- **Visuals**: Rendered dynamically using HTML5 Canvas vector primitives with neon glows, particle physics, and geometry.
- **Audio**: Generated in real-time using the **Web Audio API** in `src/audio.js` (zero download latency, 100% offline).

## Dropping in Custom Assets

### 1. Sprites & Textures
Place `.png` or `.webp` files here (e.g. `player.png`, `enemies.png`, `tiles.png`).
In `src/player.js` and `src/enemies.js`, replace canvas shape drawing with:
```javascript
const sprite = new Image();
sprite.src = 'assets/player.png';
ctx.drawImage(sprite, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
```

### 2. Audio & BGM
Place `.mp3` or `.ogg` sound files here (e.g. `laser.mp3`, `bgm.mp3`).
In `src/audio.js`:
```javascript
const bgm = new Audio('assets/bgm.mp3');
bgm.loop = true;
bgm.play();
```
