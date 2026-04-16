const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const restartBtn = document.getElementById("restartBtn");

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  gravity: 0.42,
  lift: -7.2,
  speed: 2.5,
  gap: 165,
  pipeInterval: 1500,
};

const plane = {
  x: 95,
  y: WORLD.height / 2,
  w: 54,
  h: 30,
  vy: 0,
  rotation: 0,
};

let pipes = [];
let score = 0;
let bestScore = Number(localStorage.getItem("flappyPlaneBest") || 0);
let gameOver = false;
let started = false;
let lastPipeAt = 0;
let lastFrame = performance.now();

bestScoreEl.textContent = String(bestScore);

function reset() {
  pipes = [];
  score = 0;
  gameOver = false;
  started = false;
  lastPipeAt = 0;
  lastFrame = performance.now();

  plane.y = WORLD.height / 2;
  plane.vy = 0;
  plane.rotation = 0;

  scoreEl.textContent = "0";
  restartBtn.hidden = true;
}

function flap() {
  if (gameOver) return;
  started = true;
  plane.vy = WORLD.lift;
}

function createPipe(now) {
  const margin = 55;
  const topHeight = Math.random() * (WORLD.height - WORLD.gap - margin * 2) + margin;
  pipes.push({
    x: WORLD.width + 35,
    w: 70,
    top: topHeight,
    bottomY: topHeight + WORLD.gap,
    counted: false,
  });
  lastPipeAt = now;
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= cr * cr;
}

function update(dt, now) {
  if (!started || gameOver) return;

  plane.vy += WORLD.gravity;
  plane.y += plane.vy;
  plane.rotation = Math.max(-0.5, Math.min(1.2, plane.vy / 8));

  if (now - lastPipeAt >= WORLD.pipeInterval) {
    createPipe(now);
  }

  pipes.forEach((pipe) => {
    pipe.x -= WORLD.speed * dt;

    if (!pipe.counted && pipe.x + pipe.w < plane.x) {
      pipe.counted = true;
      score += 1;
      scoreEl.textContent = String(score);

      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("flappyPlaneBest", String(bestScore));
        bestScoreEl.textContent = String(bestScore);
      }
    }

    const noseX = plane.x + plane.w * 0.62;
    const noseY = plane.y + plane.h * 0.5;
    const noseR = 12;

    const hitTop = circleRectCollision(noseX, noseY, noseR, pipe.x, 0, pipe.w, pipe.top);
    const hitBottom = circleRectCollision(
      noseX,
      noseY,
      noseR,
      pipe.x,
      pipe.bottomY,
      pipe.w,
      WORLD.height - pipe.bottomY
    );

    if (hitTop || hitBottom) {
      gameOver = true;
      restartBtn.hidden = false;
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + pipe.w > -10);

  if (plane.y + plane.h >= WORLD.height || plane.y <= 0) {
    gameOver = true;
    restartBtn.hidden = false;
  }
}

function drawClouds() {
  ctx.fillStyle = "#ffffff99";
  const cloudData = [
    [50, 100, 24],
    [120, 140, 18],
    [300, 90, 22],
    [360, 130, 16],
  ];

  cloudData.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r, y + 4, r * 0.9, 0, Math.PI * 2);
    ctx.arc(x + r * 2, y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.fillStyle = "#28b452";
    ctx.fillRect(pipe.x, 0, pipe.w, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.w, WORLD.height - pipe.bottomY);

    ctx.fillStyle = "#1f8e40";
    ctx.fillRect(pipe.x - 4, pipe.top - 18, pipe.w + 8, 18);
    ctx.fillRect(pipe.x - 4, pipe.bottomY, pipe.w + 8, 18);
  });
}

function drawPlane() {
  ctx.save();
  ctx.translate(plane.x + plane.w / 2, plane.y + plane.h / 2);
  ctx.rotate(plane.rotation);

  // Body
  ctx.fillStyle = "#ff4747";
  ctx.fillRect(-plane.w / 2, -plane.h / 2, plane.w * 0.72, plane.h);

  // Nose
  ctx.fillStyle = "#ff9c2f";
  ctx.beginPath();
  ctx.moveTo(plane.w * 0.22, -plane.h / 2);
  ctx.lineTo(plane.w / 2, 0);
  ctx.lineTo(plane.w * 0.22, plane.h / 2);
  ctx.closePath();
  ctx.fill();

  // Wing
  ctx.fillStyle = "#f1f7ff";
  ctx.beginPath();
  ctx.moveTo(-plane.w * 0.1, 0);
  ctx.lineTo(plane.w * 0.1, -plane.h * 0.65);
  ctx.lineTo(plane.w * 0.18, 0);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.fillStyle = "#f1f7ff";
  ctx.beginPath();
  ctx.moveTo(-plane.w / 2, -plane.h / 2);
  ctx.lineTo(-plane.w * 0.35, -plane.h / 2);
  ctx.lineTo(-plane.w * 0.5, -plane.h * 0.95);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "#8cd7ff";
  ctx.beginPath();
  ctx.ellipse(plane.w * 0.02, -plane.h * 0.18, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#ccb95f";
  ctx.fillRect(0, WORLD.height - 18, WORLD.width, 18);
}

function drawOverlay() {
  if (gameOver) {
    ctx.fillStyle = "#0000008a";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OYUN BİTTİ", WORLD.width / 2, WORLD.height / 2 - 30);

    ctx.font = "24px sans-serif";
    ctx.fillText(`Skor: ${score}`, WORLD.width / 2, WORLD.height / 2 + 8);
    ctx.fillStyle = "#ffd447";
    ctx.fillText("Tekrar başlatmak için butona bas", WORLD.width / 2, WORLD.height / 2 + 48);
  } else if (!started) {
    ctx.fillStyle = "#0000004f";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Flappy Plane", WORLD.width / 2, WORLD.height / 2 - 18);

    ctx.font = "21px sans-serif";
    ctx.fillText("Başlamak için tıkla veya boşluk tuşuna bas", WORLD.width / 2, WORLD.height / 2 + 22);
  }
}

function draw() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawClouds();
  drawPipes();
  drawGround();
  drawPlane();
  drawOverlay();
}

function loop(now) {
  const dt = Math.min(2, (now - lastFrame) / 16.67);
  lastFrame = now;

  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});

canvas.addEventListener("pointerdown", flap);
restartBtn.addEventListener("click", reset);

reset();
requestAnimationFrame(loop);
