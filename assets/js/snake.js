// assets/js/snake.js
(() => {
  "use strict";

  // Prevent double init (hot reload / multiple script tags)
  if (window.__naimSnakeInit) return;
  window.__naimSnakeInit = true;

  const canvas = document.getElementById("snakeCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const scoreEl = document.getElementById("snakeScore");
  const highEl = document.getElementById("snakeHighScore");
  const startBtn = document.getElementById("snakeStartBtn");
  const resetBtn = document.getElementById("snakeResetBtn");

  const GRID = 21;

  // runtime state
  let CELL = 20;
  let snake = null;
  let dir = null;
  let nextDir = null;
  let food = null;
  let score = 0;
  let running = false;
  let loopId = null;
  let speed = 120;

  let highScore = Number(localStorage.getItem("snakeHighScore") || 0);
  if (highEl) highEl.textContent = String(highScore);

  const cssVar = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };

  const hexToRgba = (hex, a = 1) => {
    const h = (hex || "").replace("#", "").trim();
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const randCell = () => ({
    x: Math.floor(Math.random() * GRID),
    y: Math.floor(Math.random() * GRID),
  });

  const samePos = (a, b) => a.x === b.x && a.y === b.y;

  const placeFood = () => {
    let f;
    do {
      f = randCell();
    } while (snake && snake.some((s) => samePos(s, f)));
    food = f;
  };

  const roundRect = (x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  const drawGrid = (boardSize) => {
    ctx.clearRect(0, 0, boardSize, boardSize);

    const gridLine = cssVar("--grid-line", "rgba(255,255,255,.06)");
    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 1;

    ctx.save();
    ctx.globalAlpha = 0.6;

    for (let i = 0; i <= GRID; i++) {
      // vertical
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, GRID * CELL);
      ctx.stroke();

      // horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(GRID * CELL, i * CELL);
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = (showText = false, isGameOver = false) => {
    // ✅ hard-guards to prevent "reading x of undefined"
    if (!snake || snake.length === 0 || !food || !dir || !nextDir) return;
    if (!Number.isFinite(CELL) || CELL <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const boardSize = Math.floor(Math.min(rect.width, rect.height));
    if (!boardSize) return;

    drawGrid(boardSize);

    const accent1 = cssVar("--accent-1", "#60a5fa");
    const accent2 = cssVar("--accent-2", "#a78bfa");
    const textColor = cssVar("--text", "#e5e7eb");
    const glass = cssVar("--glass", "rgba(255,255,255,.06)");

    // Food
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = hexToRgba(accent1, 0.65);
    ctx.fillStyle = hexToRgba(accent1, 0.95);
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * CELL, (food.y + 0.5) * CELL, CELL * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      if (!s) continue;

      const px = s.x * CELL;
      const py = s.y * CELL;

      const t = i === 0 ? 1 : Math.max(0.25, 1 - i / 22);
      ctx.fillStyle = hexToRgba(accent2, 0.25 + t * 0.6);
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.lineWidth = 1;

      roundRect(px + 2, py + 2, CELL - 4, CELL - 4, 10);
      ctx.fill();
      ctx.stroke();
    }

    // Overlay text
    if (showText) {
      const W = boardSize;
      const H = boardSize;

      ctx.save();
      ctx.fillStyle = glass;
      roundRect(40, H / 2 - 60, W - 80, 120, 18);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = "800 24px Poppins, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(isGameOver ? "Game Over" : "Snake Game", W / 2, H / 2 - 10);

      ctx.font = "500 14px Poppins, system-ui";
      ctx.fillStyle = cssVar("--muted", "rgba(229,231,235,.85)");
      ctx.fillText("Press Space or Start", W / 2, H / 2 + 18);
      ctx.restore();
    }
  };

  const updateStartBtn = () => {
    if (startBtn) startBtn.textContent = running ? "Pause" : "Start";
  };

  const pause = () => {
    running = false;
    updateStartBtn();
    if (loopId) clearTimeout(loopId);
    loopId = null;
  };

  const gameOver = () => {
    pause();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", String(highScore));
      if (highEl) highEl.textContent = String(highScore);
    }
    draw(true, true);
  };

  const setDirection = (d) => {
    if (!dir) return;
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  };

  const tick = () => {
    if (!running) return;

    dir = nextDir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // wall
    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      return gameOver();
    }

    // self collision
    const willEat = samePos(newHead, food);
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    if (bodyToCheck.some((s) => samePos(s, newHead))) return gameOver();

    snake.unshift(newHead);

    if (willEat) {
      score += 10;
      if (scoreEl) scoreEl.textContent = String(score);
      speed = Math.max(70, speed - 2);
      placeFood();
    } else {
      snake.pop();
    }

    draw(false);
    loopId = setTimeout(tick, speed);
  };

  const start = () => {
    if (running) return;
    running = true;
    updateStartBtn();
    tick();
  };

  const toggle = () => (running ? pause() : start());

  const reset = () => {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speed = 120;
    running = false;

    if (scoreEl) scoreEl.textContent = "0";
    placeFood();
    updateStartBtn();

    // draw only after we have layout + CELL
    draw(true);
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height));
    if (!size) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);

    // Scale to DPR, draw using CSS-pixel coordinates
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    CELL = size / GRID;

    // ✅ DO NOT draw here unless fully initialized (fixes your error)
    if (snake && food && dir && nextDir) draw(true);
  };

  // Keyboard
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    if (k === "arrowup" || k === "w") setDirection({ x: 0, y: -1 });
    if (k === "arrowdown" || k === "s") setDirection({ x: 0, y: 1 });
    if (k === "arrowleft" || k === "a") setDirection({ x: -1, y: 0 });
    if (k === "arrowright" || k === "d") setDirection({ x: 1, y: 0 });

    if (e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  // Buttons
  if (startBtn) startBtn.addEventListener("click", toggle);
  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      reset();
      start();
    });

  // Mobile pad buttons
  document.querySelectorAll(".padBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-dir");
      if (d === "up") setDirection({ x: 0, y: -1 });
      if (d === "down") setDirection({ x: 0, y: 1 });
      if (d === "left") setDirection({ x: -1, y: 0 });
      if (d === "right") setDirection({ x: 1, y: 0 });
    });
  });

  // Pause when tab hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });

  // Resize
  window.addEventListener("resize", resizeCanvas);

  // Init order: size first, then reset (so draw has CELL)
  resizeCanvas();
  reset();
})();
