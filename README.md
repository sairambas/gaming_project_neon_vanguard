# 🚀 Neon Vanguard

An intense, retro-cyberpunk arena arcade game built with vanilla HTML5 Canvas, modern JavaScript, and procedural Web Audio API synthesis. Designed with an AI-assisted / vibe coding workflow.

![Gameplay Screenshot Preview](assets/preview.png) *(Optional: replace with your own screenshot)*

---

## 🕹️ Play Instantly

- **Zero dependencies**: No `npm install`, no build tools, no external asset downloads required.
- **Offline ready**: Open `index.html` in any web browser to play immediately.

---

## 🎮 Controls

| Action | Key / Input |
| :--- | :--- |
| **Move / Thrusters** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrow Keys</kbd> |
| **Aim** | <kbd>Mouse Cursor</kbd> |
| **Plasma Blaster** | <kbd>Left Click</kbd> or <kbd>Space</kbd> |
| **Hyper-Dash (Invulnerable)** | <kbd>Shift</kbd> or <kbd>Right Click</kbd> |
| **Pause Game** | <kbd>P</kbd> or <kbd>Esc</kbd> |
| **Toggle Sound** | <kbd>M</kbd> |

---

## ✨ Features

- **Vector Cyberpunk Visuals**: Dynamic lighting, engine thruster exhaust trails, particle explosions, and floating combat text.
- **Procedural Audio Synthesizer**: Custom retro sound effects (lasers, explosions, whooshes, and chimes) synthesized in real-time via the browser's Web Audio API.
- **Wave-Based Survival**:
  - **Drones**: Fast swarmers following pursuit vectors.
  - **Speeders**: High-velocity lunging darts.
  - **Shooters**: Distance-keeping ranged turrets.
  - **Titans**: Heavily armored octagonal bosses.
- **Powerups & Pickups**: Health repairs and Triple-Blaster weapon upgrades dropped dynamically.
- **Local Persistence**: Saves your high score to `localStorage`.

---

## 📁 Project Architecture

```text
game_project/
├── index.html        # Entry canvas, UI overlay & HUD
├── style.css         # Neon aesthetics, glow filters & modal styling
├── src/
│   ├── audio.js      # Procedural sound effect generator
│   ├── level.js      # Arena grid, obstacles, collision & particle engine
│   ├── player.js     # Ship physics, blaster & dash mechanics
│   ├── enemies.js    # Wave manager, enemy AI behaviors & flocking
│   └── main.js       # Game loop, camera lerping & state machine
└── assets/
    └── README.md     # Guide for adding custom sprites & MP3 audio
```

---

## 🌐 Deploy to GitHub Pages (Free Web Hosting)

1. Push this repository to GitHub.
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.
4. Your game will be live and playable at `https://<your-username>.github.io/<repo-name>/`!
