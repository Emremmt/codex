const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const goldEl = document.getElementById('gold');
const castleHpEl = document.getElementById('castleHp');
const phaseEl = document.getElementById('phase');
const playerNameEl = document.getElementById('playerName');
const startOverlay = document.getElementById('startOverlay');
const playerNameInput = document.getElementById('playerNameInput');
const startBtn = document.getElementById('startBtn');

const LEVEL_DURATION = 60;
const INTERVAL_STEP = 15;
const GROUND_Y = 500;

const enemyTypes = [
  { name: 'Zombi', speed: 35, hp: 125, damage: 40, color: '#6d9f62', size: 24 },
  { name: 'Koşucu', speed: 55, hp: 95, damage: 32, color: '#8fd16f', size: 20 },
  { name: 'İri Yaratık', speed: 28, hp: 240, damage: 68, color: '#78623b', size: 32 },
  { name: 'Zırhlı Dev', speed: 26, hp: 320, damage: 86, color: '#7d7f9a', size: 36 },
  { name: 'Veba Şefi', speed: 38, hp: 410, damage: 104, color: '#91515c', size: 40 },
];

const state = {
  started: false,
  playerName: 'Komutan',
  level: 1,
  gold: 250,
  levelTime: LEVEL_DURATION,
  isIntermission: false,
  intermissionTime: 0,
  enemies: [],
  projectiles: [],
  clicks: [],
  spawnTick: 0,
  densityStep: 0,
  gameOver: false,
  playerSplash: 0,
  castle: {
    x: 180,
    y: GROUND_Y,
    maxHp: 1300,
    hp: 1300,
    autoDamage: 55,
    cannons: 1,
    turrets: 2,
    catapults: 0,
    guards: 0,
    catapultDamage: 120,
    defenseCooldown: 0,
  },
  player: {
    clickDamage: 75,
  },
};

const upgrades = {
  turret: { cost: 140, apply: () => { state.castle.turrets += 1; state.castle.autoDamage += 10; } },
  cannon: { cost: 180, apply: () => { state.castle.cannons += 1; state.castle.autoDamage += 25; } },
  wall: {
    cost: 220,
    apply: () => {
      state.castle.maxHp += 350;
      state.castle.hp = Math.min(state.castle.maxHp, state.castle.hp + 350);
    },
  },
  click: { cost: 130, apply: () => { state.player.clickDamage += 20; } },
  splash: { cost: 170, apply: () => { state.playerSplash += 14; } },
  catapult: { cost: 260, apply: () => { state.castle.catapults += 1; } },
  guard: { cost: 210, apply: () => { state.castle.guards += 1; state.castle.maxHp += 80; state.castle.hp += 80; } },
  catapultDamage: { cost: 190, apply: () => { state.castle.catapultDamage += 30; } },
};

function spawnEnemy() {
  const unlockedCount = Math.min(enemyTypes.length, 1 + Math.floor((state.level - 1) / 1.5));
  const type = enemyTypes[Math.floor(Math.random() * unlockedCount)];
  const hpScale = 1 + (state.level - 1) * 0.24;
  state.enemies.push({
    x: canvas.width + 50,
    y: GROUND_Y + (Math.random() * 22 - 11),
    hp: type.hp * hpScale,
    maxHp: type.hp * hpScale,
    speed: type.speed + state.level * 2.3,
    damage: type.damage * (1 + (state.level - 1) * 0.15),
    color: type.color,
    size: type.size,
  });
}

function shootAutoProjectile() {
  if (!state.enemies.length) return;
  const shots = state.castle.turrets + state.castle.cannons;
  const sorted = [...state.enemies].sort((a, b) => a.x - b.x);

  for (let i = 0; i < shots; i += 1) {
    const target = sorted[i % sorted.length];
    state.projectiles.push({
      x: state.castle.x + 130,
      y: state.castle.y - 210 + i * 10,
      tx: target.x,
      ty: target.y - target.size,
      speed: 300,
      damage: state.castle.autoDamage,
      color: i < state.castle.turrets ? '#ffe79a' : '#ff8359',
      radius: i < state.castle.turrets ? 5 : 8,
    });
  }

  for (let i = 0; i < state.castle.catapults; i += 1) {
    const target = sorted[(i * 2) % sorted.length];
    state.projectiles.push({
      x: state.castle.x + 90,
      y: state.castle.y - 100,
      tx: target.x,
      ty: target.y - target.size,
      speed: 220,
      damage: state.castle.catapultDamage,
      splash: 65,
      color: '#ffcc66',
      radius: 11,
    });
  }
}

function applyLevelRewards() {
  const levelReward = 180 + state.level * 80;
  state.gold += levelReward;
  state.level += 1;
  state.levelTime = LEVEL_DURATION;
  state.densityStep = 0;

  state.castle.maxHp += 140;
  state.castle.hp = Math.min(state.castle.maxHp, state.castle.hp + 240);
  state.castle.autoDamage += 12;

  phaseEl.textContent = `Tebrikler ${state.playerName}! Seviye geçildi, +${levelReward} altın!`;
  state.isIntermission = true;
  state.intermissionTime = 5;
}

function updateHud() {
  playerNameEl.textContent = `Komutan: ${state.playerName}`;
  levelEl.textContent = `Seviye: ${state.level}`;
  timeEl.textContent = state.isIntermission
    ? `Sonraki Seviye: ${state.intermissionTime.toFixed(1)}`
    : `Kalan Süre: ${Math.ceil(state.levelTime)}`;
  goldEl.textContent = `Altın: ${Math.floor(state.gold)}`;
  castleHpEl.textContent = `Kale Canı: ${Math.max(0, Math.ceil(state.castle.hp))} / ${state.castle.maxHp}`;
}

function drawWorld() {
  ctx.fillStyle = '#74c9ff';
  ctx.fillRect(0, 0, canvas.width, 280);
  ctx.fillStyle = '#95ddff';
  ctx.fillRect(80, 60, 260, 45);
  ctx.fillRect(480, 110, 320, 40);
  ctx.fillRect(980, 70, 280, 45);

  ctx.fillStyle = '#70b06f';
  ctx.beginPath();
  ctx.ellipse(350, 360, 500, 170, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1020, 380, 620, 180, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#457f4b';
  ctx.fillRect(0, 280, canvas.width, canvas.height - 280);
  ctx.fillStyle = '#c9a35a';
  ctx.fillRect(0, GROUND_Y + 4, canvas.width, 6);
}

function drawCastle() {
  const x = state.castle.x;
  const y = state.castle.y;

  ctx.fillStyle = '#a4a9be';
  ctx.fillRect(x - 100, y - 260, 200, 260);
  ctx.fillStyle = '#838aa4';
  ctx.fillRect(x - 145, y - 220, 50, 220);
  ctx.fillRect(x + 95, y - 220, 50, 220);

  ctx.fillStyle = '#717791';
  for (let i = -140; i <= 130; i += 24) ctx.fillRect(x + i, y - 276, 15, 18);

  ctx.fillStyle = '#5f3217';
  ctx.fillRect(x - 30, y - 95, 60, 95);

  for (let i = 0; i < state.castle.turrets; i += 1) {
    ctx.fillStyle = '#ffd56b';
    ctx.beginPath();
    ctx.arc(x - 70 + (i % 6) * 24, y - 230 - Math.floor(i / 6) * 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.castle.catapults; i += 1) {
    ctx.fillStyle = '#8c5f35';
    ctx.fillRect(x - 70 + i * 38, y - 40, 26, 12);
    ctx.strokeStyle = '#d9bf78';
    ctx.beginPath();
    ctx.moveTo(x - 70 + i * 38, y - 40);
    ctx.lineTo(x - 56 + i * 38, y - 64);
    ctx.stroke();
  }
}

function drawEnemy(enemy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y - enemy.size, enemy.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(enemy.x - enemy.size * 0.8, enemy.y - enemy.size * 0.2, enemy.size * 1.6, enemy.size * 1.8);

  const hpRatio = enemy.hp / enemy.maxHp;
  ctx.fillStyle = '#2e1a1a';
  ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 34, enemy.size * 2, 6);
  ctx.fillStyle = '#7cff7e';
  ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 34, enemy.size * 2 * hpRatio, 6);
}

function update(dt) {
  if (!state.started || state.gameOver) return;

  if (state.isIntermission) {
    state.intermissionTime -= dt;
    if (state.intermissionTime <= 0) {
      state.isIntermission = false;
      phaseEl.textContent = `Seviye ${state.level} başladı! Düşmanlar yaklaşıyor.`;
    }
    return;
  }

  state.levelTime -= dt;
  if (state.levelTime <= 0) return applyLevelRewards();

  const nextDensityStep = Math.floor((LEVEL_DURATION - state.levelTime) / INTERVAL_STEP);
  if (nextDensityStep > state.densityStep) {
    state.densityStep = nextDensityStep;
    phaseEl.textContent = `Yoğunluk arttı ${state.playerName}! Dalga ${state.densityStep}/4.`;
  }

  const spawnRate = Math.max(0.25, 1.7 - state.densityStep * 0.33 - state.level * 0.06);
  state.spawnTick += dt;
  while (state.spawnTick >= spawnRate) {
    state.spawnTick -= spawnRate;
    const extra = Math.max(1, state.densityStep + 1);
    for (let i = 0; i < extra; i += 1) spawnEnemy();
  }

  state.castle.defenseCooldown -= dt;
  if (state.castle.defenseCooldown <= 0) {
    shootAutoProjectile();
    state.castle.defenseCooldown = Math.max(0.18, 0.9 - state.castle.turrets * 0.03 - state.castle.catapults * 0.02);
  }

  state.enemies.forEach((enemy) => {
    enemy.x -= enemy.speed * dt;
    if (enemy.x <= state.castle.x + 120) {
      const guardReduction = Math.min(0.45, state.castle.guards * 0.06);
      state.castle.hp -= enemy.damage * dt * (1 - guardReduction);
    }
  });

  state.projectiles.forEach((projectile) => {
    const dx = projectile.tx - projectile.x;
    const dy = projectile.ty - projectile.y;
    const len = Math.hypot(dx, dy) || 1;
    projectile.x += (dx / len) * projectile.speed * dt;
    projectile.y += (dy / len) * projectile.speed * dt;
  });

  for (const projectile of state.projectiles) {
    const hit = state.enemies.find((enemy) => Math.hypot(projectile.x - enemy.x, projectile.y - (enemy.y - enemy.size)) < enemy.size + projectile.radius);
    if (hit) {
      hit.hp -= projectile.damage;
      if (projectile.splash) {
        state.enemies.forEach((enemy) => {
          if (Math.hypot(enemy.x - hit.x, enemy.y - hit.y) < projectile.splash) enemy.hp -= projectile.damage * 0.5;
        });
      }
      projectile.dead = true;
    }
  }

  for (const click of state.clicks) {
    state.enemies.forEach((enemy) => {
      const d = Math.hypot(click.x - enemy.x, click.y - (enemy.y - enemy.size));
      if (d < 64) enemy.hp -= state.player.clickDamage;
      if (state.playerSplash > 0 && d < 64 + state.playerSplash) enemy.hp -= state.player.clickDamage * 0.4;
    });
  }
  state.clicks.length = 0;

  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.hp <= 0) {
      state.gold += 12 + Math.floor(enemy.maxHp * 0.09);
      return false;
    }
    return enemy.x > -60;
  });

  state.projectiles = state.projectiles.filter((p) => !p.dead && p.x < canvas.width + 30 && p.x > -20);

  if (state.castle.hp <= 0) {
    state.castle.hp = 0;
    state.gameOver = true;
    phaseEl.textContent = `Kale düştü ${state.playerName}! Yeniden dene.`;
  }
}

function render() {
  drawWorld();
  drawCastle();
  state.enemies.forEach(drawEnemy);

  state.projectiles.forEach((projectile) => {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  updateHud();
  requestAnimationFrame(loop);
}

canvas.addEventListener('click', (event) => {
  if (!state.started || state.gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  state.clicks.push({ x, y });
});

document.querySelectorAll('.market button').forEach((button) => {
  button.addEventListener('click', () => {
    if (!state.started || state.gameOver) return;
    const key = button.dataset.upgrade;
    const upgrade = upgrades[key];
    if (!upgrade) return;
    if (state.gold < upgrade.cost) {
      phaseEl.textContent = `Yetersiz altın ${state.playerName}!`;
      return;
    }
    state.gold -= upgrade.cost;
    upgrade.apply();
    phaseEl.textContent = `${button.textContent.split('(')[0].trim()} alındı.`;
  });
});

startBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  state.playerName = name || 'Komutan';
  state.started = true;
  startOverlay.classList.add('hidden');
  phaseEl.textContent = `Hoş geldin ${state.playerName}! Kaleyi savun.`;
});

updateHud();
requestAnimationFrame(loop);
