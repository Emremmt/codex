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
const DENSITY_INTERVAL = 15;
const GROUND_Y = 590;

const enemyTypes = [
  { name: 'Goblin', hp: 110, speed: 58, damage: 30, size: 22, color: '#8ac46e' },
  { name: 'Ork', hp: 190, speed: 44, damage: 48, size: 30, color: '#6f9f46' },
  { name: 'Troll', hp: 320, speed: 30, damage: 72, size: 38, color: '#6b766f' },
  { name: 'Alev İblisi', hp: 260, speed: 52, damage: 84, size: 30, color: '#ca6a3a' },
  { name: 'Buz Wraith', hp: 300, speed: 50, damage: 66, size: 32, color: '#8ad7eb' },
  { name: 'Taş Golem', hp: 520, speed: 24, damage: 110, size: 46, color: '#8d867f' },
  { name: 'Mini Ejder', hp: 420, speed: 46, damage: 118, size: 40, color: '#b84d66' },
];

const state = {
  started: false,
  gameOver: false,
  playerName: 'Komutan',
  level: 1,
  gold: 350,
  levelTime: LEVEL_DURATION,
  intermission: false,
  intermissionTime: 0,
  densityStep: 0,
  spawnTick: 0,
  enemies: [],
  projectiles: [],
  clickBursts: [],
  player: {
    clickDamage: 90,
    splashRadius: 66,
    meteorUnlocked: false,
  },
  castle: {
    x: 230,
    y: GROUND_Y,
    maxHp: 2200,
    hp: 2200,
    baseAutoDamage: 60,
    towers: 2,
    archers: 2,
    ballistae: 0,
    catapults: 0,
    knights: 1,
    mages: 0,
    moatLevel: 0,
    gateArmor: 0,
    frostAura: false,
    defenseCooldown: 0,
  },
};

const upgrades = {
  wall: { cost: 260, apply: () => { state.castle.maxHp += 500; state.castle.hp += 500; } },
  moat: { cost: 220, apply: () => { state.castle.moatLevel += 1; } },
  reinforce: { cost: 280, apply: () => { state.castle.gateArmor += 1; state.castle.maxHp += 180; state.castle.hp += 180; } },
  archer: { cost: 170, apply: () => { state.castle.archers += 1; state.castle.baseAutoDamage += 8; } },
  ballista: { cost: 260, apply: () => { state.castle.ballistae += 1; } },
  catapult: { cost: 300, apply: () => { state.castle.catapults += 1; } },
  tower: { cost: 210, apply: () => { state.castle.towers += 1; state.castle.baseAutoDamage += 14; } },
  knight: { cost: 190, apply: () => { state.castle.knights += 1; } },
  mage: { cost: 260, apply: () => { state.castle.mages += 1; } },
  frost: { cost: 240, apply: () => { state.castle.frostAura = true; } },
  click: { cost: 160, apply: () => { state.player.clickDamage += 24; } },
  splash: { cost: 180, apply: () => { state.player.splashRadius += 18; } },
  meteor: { cost: 320, apply: () => { state.player.meteorUnlocked = true; } },
};

function updateHud() {
  playerNameEl.textContent = `Komutan: ${state.playerName}`;
  levelEl.textContent = `Seviye: ${state.level}`;
  timeEl.textContent = state.intermission
    ? `Sonraki Dalga: ${state.intermissionTime.toFixed(1)}`
    : `Kalan Süre: ${Math.ceil(state.levelTime)}`;
  goldEl.textContent = `Altın: ${Math.floor(state.gold)}`;
  castleHpEl.textContent = `Kale Canı: ${Math.max(0, Math.ceil(state.castle.hp))} / ${state.castle.maxHp}`;
}

function spawnEnemy() {
  const unlocked = Math.min(enemyTypes.length, 1 + Math.floor(state.level / 1.3));
  const type = enemyTypes[Math.floor(Math.random() * unlocked)];
  const scale = 1 + (state.level - 1) * 0.23;
  state.enemies.push({
    name: type.name,
    x: canvas.width + 70,
    y: GROUND_Y + (Math.random() * 26 - 13),
    hp: type.hp * scale,
    maxHp: type.hp * scale,
    speed: type.speed + state.level * 1.7,
    damage: type.damage * (1 + (state.level - 1) * 0.14),
    size: type.size,
    color: type.color,
    chilled: 0,
  });
}

function shootDefenses() {
  if (!state.enemies.length) return;
  const targets = [...state.enemies].sort((a, b) => a.x - b.x);
  const autoDamage = state.castle.baseAutoDamage + state.level * 3;

  for (let i = 0; i < state.castle.archers + state.castle.towers; i += 1) {
    const t = targets[i % targets.length];
    state.projectiles.push({
      x: state.castle.x + 150,
      y: state.castle.y - 280 + i * 8,
      tx: t.x,
      ty: t.y - t.size,
      speed: 360,
      damage: autoDamage,
      radius: 4,
      color: '#ffe8a0',
    });
  }

  for (let i = 0; i < state.castle.ballistae; i += 1) {
    const t = targets[(i * 2) % targets.length];
    state.projectiles.push({
      x: state.castle.x + 130,
      y: state.castle.y - 150,
      tx: t.x,
      ty: t.y - t.size,
      speed: 300,
      damage: autoDamage + 95,
      radius: 8,
      color: '#ffab62',
      pierce: 2,
    });
  }

  for (let i = 0; i < state.castle.catapults; i += 1) {
    const t = targets[(i * 3) % targets.length];
    state.projectiles.push({
      x: state.castle.x + 60 + i * 24,
      y: state.castle.y - 70,
      tx: t.x,
      ty: t.y - t.size,
      speed: 240,
      damage: autoDamage + 120,
      splash: 86,
      radius: 12,
      color: '#ffd07a',
    });
  }

  if (state.castle.mages > 0) {
    const nearest = targets[0];
    state.projectiles.push({
      x: state.castle.x + 120,
      y: state.castle.y - 230,
      tx: nearest.x,
      ty: nearest.y - nearest.size,
      speed: 280,
      damage: autoDamage + state.castle.mages * 30,
      splash: 70,
      radius: 9,
      color: '#96d8ff',
      chill: state.castle.frostAura,
    });
  }
}

function applyLevelRewards() {
  const reward = 220 + state.level * 90;
  state.gold += reward;
  state.level += 1;
  state.levelTime = LEVEL_DURATION;
  state.densityStep = 0;

  state.castle.maxHp += 180;
  state.castle.hp = Math.min(state.castle.maxHp, state.castle.hp + 260);
  state.castle.baseAutoDamage += 10;

  state.intermission = true;
  state.intermissionTime = 5;
  phaseEl.textContent = `Muhteşem ${state.playerName}! Seviye temizlendi, +${reward} altın.`;
}

function drawWorld() {
  ctx.fillStyle = '#80d9ff';
  ctx.fillRect(0, 0, canvas.width, 320);

  ctx.fillStyle = '#b9e9ff';
  ctx.beginPath(); ctx.ellipse(290, 120, 250, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(850, 85, 300, 58, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1460, 125, 260, 50, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#6a8e6b';
  ctx.beginPath(); ctx.ellipse(360, 420, 480, 170, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1200, 450, 700, 220, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#365739';
  ctx.fillRect(0, 320, canvas.width, canvas.height - 320);

  ctx.fillStyle = '#b99552';
  ctx.fillRect(0, GROUND_Y + 5, canvas.width, 8);

  if (state.castle.moatLevel > 0) {
    ctx.fillStyle = '#2b81b7';
    ctx.fillRect(state.castle.x + 190, GROUND_Y - 8, 120 + state.castle.moatLevel * 35, 16);
  }
}

function drawCastle() {
  const { x, y } = state.castle;

  ctx.fillStyle = '#a7adbe';
  ctx.fillRect(x - 135, y - 330, 280, 330);

  ctx.fillStyle = '#7e869d';
  ctx.fillRect(x - 200, y - 280, 70, 280);
  ctx.fillRect(x + 145, y - 280, 70, 280);

  ctx.fillStyle = '#687088';
  for (let i = -196; i <= 200; i += 25) {
    ctx.fillRect(x + i, y - 352, 15, 22);
  }

  ctx.fillStyle = '#5d3217';
  ctx.fillRect(x - 40, y - 130, 80, 130);

  ctx.strokeStyle = '#e6cb83';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 50 + i * 32, y - 130);
    ctx.lineTo(x - 50 + i * 32, y - 10);
    ctx.stroke();
  }

  ctx.fillStyle = '#c03b3b';
  ctx.beginPath();
  ctx.moveTo(x - 165, y - 300);
  ctx.lineTo(x - 120, y - 280);
  ctx.lineTo(x - 165, y - 260);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < state.castle.archers + state.castle.towers; i += 1) {
    ctx.fillStyle = '#ffd56b';
    ctx.beginPath();
    ctx.arc(x - 95 + (i % 8) * 24, y - 300 - Math.floor(i / 8) * 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.castle.catapults; i += 1) {
    ctx.fillStyle = '#8f663d';
    ctx.fillRect(x - 75 + i * 30, y - 55, 24, 12);
    ctx.strokeStyle = '#dfbf7a';
    ctx.beginPath();
    ctx.moveTo(x - 73 + i * 30, y - 55);
    ctx.lineTo(x - 63 + i * 30, y - 78);
    ctx.stroke();
  }
}

function drawEnemy(enemy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y - enemy.size, enemy.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(enemy.x - enemy.size * 0.85, enemy.y - enemy.size * 0.1, enemy.size * 1.7, enemy.size * 1.9);

  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = '#341919';
  ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 35, enemy.size * 2, 6);
  ctx.fillStyle = enemy.chilled > 0 ? '#9ee8ff' : '#7dff8f';
  ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 35, enemy.size * 2 * ratio, 6);
}

function update(dt) {
  if (!state.started || state.gameOver) return;

  if (state.intermission) {
    state.intermissionTime -= dt;
    if (state.intermissionTime <= 0) {
      state.intermission = false;
      phaseEl.textContent = `Seviye ${state.level} başladı. ${state.playerName}, kaleni koru!`;
    }
    return;
  }

  state.levelTime -= dt;
  if (state.levelTime <= 0) return applyLevelRewards();

  const step = Math.floor((LEVEL_DURATION - state.levelTime) / DENSITY_INTERVAL);
  if (step > state.densityStep) {
    state.densityStep = step;
    phaseEl.textContent = `Kuşatma sertleşiyor! Yoğunluk ${state.densityStep}/4.`;
  }

  const spawnRate = Math.max(0.2, 1.55 - state.level * 0.045 - state.densityStep * 0.31);
  state.spawnTick += dt;
  while (state.spawnTick >= spawnRate) {
    state.spawnTick -= spawnRate;
    const batch = 1 + state.densityStep;
    for (let i = 0; i < batch; i += 1) spawnEnemy();
  }

  state.castle.defenseCooldown -= dt;
  if (state.castle.defenseCooldown <= 0) {
    shootDefenses();
    state.castle.defenseCooldown = Math.max(0.16, 0.82 - state.castle.archers * 0.02 - state.castle.towers * 0.03);
  }

  state.enemies.forEach((enemy) => {
    const chillFactor = enemy.chilled > 0 ? 0.72 : 1;
    enemy.x -= enemy.speed * chillFactor * dt;
    enemy.chilled = Math.max(0, enemy.chilled - dt);

    if (enemy.x <= state.castle.x + 180) {
      const mitigation = Math.min(0.55, state.castle.knights * 0.06 + state.castle.gateArmor * 0.08 + state.castle.moatLevel * 0.05);
      state.castle.hp -= enemy.damage * dt * (1 - mitigation);
    }
  });

  state.projectiles.forEach((p) => {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * p.speed * dt;
    p.y += (dy / len) * p.speed * dt;
  });

  for (const p of state.projectiles) {
    const hit = state.enemies.find((e) => Math.hypot(p.x - e.x, p.y - (e.y - e.size)) < e.size + p.radius);
    if (!hit) continue;

    hit.hp -= p.damage;
    if (p.chill) hit.chilled = Math.max(hit.chilled, 1.2);

    if (p.splash) {
      state.enemies.forEach((e) => {
        if (Math.hypot(e.x - hit.x, e.y - hit.y) < p.splash) {
          e.hp -= p.damage * 0.45;
          if (p.chill) e.chilled = Math.max(e.chilled, 0.9);
        }
      });
    }

    if (p.pierce && p.pierce > 0) {
      p.pierce -= 1;
      p.damage *= 0.75;
    } else {
      p.dead = true;
    }
  }

  for (const c of state.clickBursts) {
    state.enemies.forEach((e) => {
      const d = Math.hypot(c.x - e.x, c.y - (e.y - e.size));
      if (d < state.player.splashRadius) e.hp -= state.player.clickDamage;
      if (state.player.meteorUnlocked && d < state.player.splashRadius + 45) e.hp -= state.player.clickDamage * 0.6;
    });
  }
  state.clickBursts.length = 0;

  state.enemies = state.enemies.filter((e) => {
    if (e.hp <= 0) {
      state.gold += 14 + Math.floor(e.maxHp * 0.08);
      return false;
    }
    return e.x > -90;
  });

  state.projectiles = state.projectiles.filter((p) => !p.dead && p.x > -30 && p.x < canvas.width + 40);

  if (state.castle.hp <= 0) {
    state.castle.hp = 0;
    state.gameOver = true;
    phaseEl.textContent = `Kale düştü ${state.playerName}! Tekrar toplan ve yeniden dene.`;
  }
}

function render() {
  drawWorld();
  drawCastle();
  state.enemies.forEach(drawEnemy);

  state.projectiles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

canvas.addEventListener('click', (event) => {
  if (!state.started || state.gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  state.clickBursts.push({ x, y });
});

document.querySelectorAll('.market button').forEach((button) => {
  button.addEventListener('click', () => {
    if (!state.started || state.gameOver) return;

    const upgrade = upgrades[button.dataset.upgrade];
    if (!upgrade) return;

    if (state.gold < upgrade.cost) {
      phaseEl.textContent = `Yetersiz altın ${state.playerName}!`;
      return;
    }

    state.gold -= upgrade.cost;
    upgrade.apply();
    phaseEl.textContent = `${button.textContent.split('(')[0].trim()} satın alındı.`;
  });
});

startBtn.addEventListener('click', () => {
  state.playerName = playerNameInput.value.trim() || 'Komutan';
  state.started = true;
  startOverlay.classList.add('hidden');
  phaseEl.textContent = `Hoş geldin ${state.playerName}! Fantastik kuşatma başlıyor.`;
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  updateHud();
  requestAnimationFrame(loop);
}

updateHud();
requestAnimationFrame(loop);
