const ui = {
  level: document.getElementById('level'),
  time: document.getElementById('time'),
  gold: document.getElementById('gold'),
  hp: document.getElementById('castleHp'),
  phase: document.getElementById('phase'),
  playerName: document.getElementById('playerName'),
  startOverlay: document.getElementById('startOverlay'),
  playerNameInput: document.getElementById('playerNameInput'),
  startBtn: document.getElementById('startBtn'),
  cameraMode: document.getElementById('cameraMode'),
  root: document.getElementById('game3d'),
};

const LEVEL_DURATION = 60;
const DENSITY_INTERVAL = 15;

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
  player: { clickDamage: 80 },
  castle: {
    hp: 2200,
    maxHp: 2200,
    archers: 2,
    ballista: 0,
    catapult: 0,
    knights: 1,
    mages: 0,
    frost: false,
    baseDamage: 55,
    cooldown: 0,
  },
  enemies: [],
  projectiles: [],
  cameraMode: 'siege',
};

const enemyTypes = [
  { name: 'Goblin', hp: 120, speed: 15, damage: 30, color: 0x75c15a, scale: 1.0 },
  { name: 'Ork', hp: 190, speed: 11, damage: 48, color: 0x5f9740, scale: 1.2 },
  { name: 'Troll', hp: 320, speed: 8, damage: 72, color: 0x7a7a7a, scale: 1.6 },
  { name: 'Alev Iblisi', hp: 280, speed: 12, damage: 86, color: 0xce622f, scale: 1.3 },
  { name: 'Buz Wraith', hp: 300, speed: 13, damage: 70, color: 0x8ad7eb, scale: 1.25 },
  { name: 'Tas Golem', hp: 520, speed: 6, damage: 115, color: 0x8c857d, scale: 1.9 },
  { name: 'Mini Ejder', hp: 460, speed: 10, damage: 125, color: 0xb84d66, scale: 1.75 },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 160, 420);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
ui.root.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;

const hemi = new THREE.HemisphereLight(0xffffff, 0x335533, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 1.2);
sun.position.set(80, 120, 40);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 220),
  new THREE.MeshStandardMaterial({ color: 0x3c6e35 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function makeCastle() {
  const group = new THREE.Group();
  group.position.set(-240, 0, 0);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9da5b4, roughness: 0.9 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x7c8699, roughness: 0.9 });

  const keep = new THREE.Mesh(new THREE.BoxGeometry(70, 65, 52), stoneMat);
  keep.position.set(0, 33, 0);
  keep.castShadow = true;
  group.add(keep);

  const towerGeo = new THREE.CylinderGeometry(14, 14, 74, 18);
  const t1 = new THREE.Mesh(towerGeo, darkStone);
  const t2 = t1.clone();
  t1.position.set(-44, 37, -24);
  t2.position.set(-44, 37, 24);
  const t3 = t1.clone();
  const t4 = t2.clone();
  t3.position.set(44, 37, -24);
  t4.position.set(44, 37, 24);
  [t1, t2, t3, t4].forEach((t) => { t.castShadow = true; group.add(t); });

  const gate = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 20), new THREE.MeshStandardMaterial({ color: 0x5c3218 }));
  gate.position.set(35, 11, 0);
  group.add(gate);

  const wall = new THREE.Mesh(new THREE.BoxGeometry(32, 30, 110), darkStone);
  wall.position.set(70, 15, 0);
  wall.castShadow = true;
  group.add(wall);

  return group;
}

const castle = makeCastle();
scene.add(castle);

const moat = new THREE.Mesh(
  new THREE.BoxGeometry(24, 1.2, 115),
  new THREE.MeshStandardMaterial({ color: 0x246fa4, transparent: true, opacity: 0.85 })
);
moat.position.set(-138, 0.6, 0);
scene.add(moat);

const enemyGroup = new THREE.Group();
scene.add(enemyGroup);
const projectileGroup = new THREE.Group();
scene.add(projectileGroup);

function resize() {
  const w = ui.root.clientWidth;
  const h = ui.root.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function spawnEnemy() {
  const unlocked = Math.min(enemyTypes.length, 1 + Math.floor(state.level / 1.2));
  const type = enemyTypes[Math.floor(Math.random() * unlocked)];
  const scale = 1 + (state.level - 1) * 0.2;

  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(5 * type.scale, 8 * type.scale, 4, 8),
    new THREE.MeshStandardMaterial({ color: type.color })
  );
  mesh.castShadow = true;
  mesh.position.set(260 + Math.random() * 40, 8 * type.scale, (Math.random() - 0.5) * 80);
  enemyGroup.add(mesh);

  state.enemies.push({
    mesh,
    hp: type.hp * scale,
    maxHp: type.hp * scale,
    speed: type.speed + state.level * 0.8,
    damage: type.damage * (1 + (state.level - 1) * 0.14),
    chilled: 0,
  });
}

function shootProjectile(from, target, damage, color, speed = 120, splash = 0, chill = false) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 10, 10),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25 })
  );
  mesh.position.copy(from);
  projectileGroup.add(mesh);

  state.projectiles.push({ mesh, target, damage, speed, splash, chill });
}

function castleFire() {
  if (!state.enemies.length) return;
  const sorted = [...state.enemies].sort((a, b) => a.mesh.position.x - b.mesh.position.x);
  const base = state.castle.baseDamage + state.level * 3;

  for (let i = 0; i < state.castle.archers; i += 1) {
    const t = sorted[i % sorted.length];
    shootProjectile(new THREE.Vector3(-170, 42, -24 + i * 10), t, base, 0xffe39d, 170);
  }
  for (let i = 0; i < state.castle.ballista; i += 1) {
    const t = sorted[(i * 2) % sorted.length];
    shootProjectile(new THREE.Vector3(-175, 30, -10 + i * 16), t, base + 80, 0xff9e58, 130);
  }
  for (let i = 0; i < state.castle.catapult; i += 1) {
    const t = sorted[(i * 3) % sorted.length];
    shootProjectile(new THREE.Vector3(-190, 16, i * 10), t, base + 100, 0xffd078, 95, 15);
  }
  for (let i = 0; i < state.castle.mages; i += 1) {
    const t = sorted[(i * 4) % sorted.length];
    shootProjectile(new THREE.Vector3(-165, 45, 14 + i * 8), t, base + 60, 0x8fdcff, 120, 12, state.castle.frost);
  }
}

function applyUpgrade(key) {
  const map = {
    wall: { cost: 260, fn: () => { state.castle.maxHp += 500; state.castle.hp += 500; } },
    archer: { cost: 170, fn: () => { state.castle.archers += 1; state.castle.baseDamage += 6; } },
    ballista: { cost: 260, fn: () => { state.castle.ballista += 1; } },
    catapult: { cost: 300, fn: () => { state.castle.catapult += 1; } },
    knight: { cost: 190, fn: () => { state.castle.knights += 1; } },
    mage: { cost: 260, fn: () => { state.castle.mages += 1; } },
    frost: { cost: 240, fn: () => { state.castle.frost = true; } },
    click: { cost: 160, fn: () => { state.player.clickDamage += 24; } },
  };
  const up = map[key];
  if (!up) return;
  if (state.gold < up.cost) { ui.phase.textContent = `Yetersiz altın ${state.playerName}!`; return; }
  state.gold -= up.cost;
  up.fn();
  ui.phase.textContent = 'Yükseltme satın alındı.';
}

document.querySelectorAll('.market button').forEach((button) => {
  button.addEventListener('click', () => {
    if (!state.started || state.gameOver) return;
    applyUpgrade(button.dataset.upgrade);
  });
});

renderer.domElement.addEventListener('click', (ev) => {
  if (!state.started || state.gameOver) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1
  );
  const ray = new THREE.Raycaster();
  ray.setFromCamera(mouse, camera);
  const meshes = state.enemies.map((e) => e.mesh);
  const hit = ray.intersectObjects(meshes)[0];
  if (!hit) return;
  const enemy = state.enemies.find((e) => e.mesh === hit.object);
  if (enemy) enemy.hp -= state.player.clickDamage;
});

function updateHud() {
  ui.playerName.textContent = `Komutan: ${state.playerName}`;
  ui.level.textContent = `Seviye: ${state.level}`;
  ui.time.textContent = state.intermission ? `Sonraki Dalga: ${state.intermissionTime.toFixed(1)}` : `Kalan Süre: ${Math.ceil(state.levelTime)}`;
  ui.gold.textContent = `Altın: ${Math.floor(state.gold)}`;
  ui.hp.textContent = `Kale Canı: ${Math.max(0, Math.ceil(state.castle.hp))} / ${state.castle.maxHp}`;
}

function applyCamera(dt) {
  const lead = state.enemies.reduce((a, b) => (a.mesh.position.x < b.mesh.position.x ? a : b), state.enemies[0] || null);

  controls.enabled = state.cameraMode === 'free';
  if (state.cameraMode === 'free') {
    controls.target.set(-130, 28, 0);
    controls.update();
    return;
  }

  const blend = Math.min(1, dt * 4);
  let pos = new THREE.Vector3();
  let look = new THREE.Vector3(-140, 25, 0);

  if (state.cameraMode === 'siege') {
    pos.set(-40, 70, 130);
  } else if (state.cameraMode === 'top') {
    pos.set(-60, 180, 0);
    look.set(-90, 0, 0);
  } else if (state.cameraMode === 'follow') {
    const tx = lead ? lead.mesh.position.x : -20;
    const tz = lead ? lead.mesh.position.z : 0;
    pos.set(tx - 50, 45, tz + 70);
    look.set(tx, 20, tz);
  }

  camera.position.lerp(pos, blend);
  camera.lookAt(look);
}

ui.cameraMode.addEventListener('change', () => {
  state.cameraMode = ui.cameraMode.value;
  ui.phase.textContent = `Kamera modu: ${ui.cameraMode.options[ui.cameraMode.selectedIndex].text}`;
});

function levelComplete() {
  const reward = 220 + state.level * 90;
  state.gold += reward;
  state.level += 1;
  state.levelTime = LEVEL_DURATION;
  state.densityStep = 0;
  state.intermission = true;
  state.intermissionTime = 5;
  state.castle.maxHp += 160;
  state.castle.hp = Math.min(state.castle.maxHp, state.castle.hp + 260);
  ui.phase.textContent = `Harika ${state.playerName}! Seviye bitti, +${reward} altın.`;
}

function update(dt) {
  if (!state.started || state.gameOver) return;

  if (state.intermission) {
    state.intermissionTime -= dt;
    if (state.intermissionTime <= 0) {
      state.intermission = false;
      ui.phase.textContent = `Seviye ${state.level} başladı!`;
    }
    return;
  }

  state.levelTime -= dt;
  if (state.levelTime <= 0) return levelComplete();

  const step = Math.floor((LEVEL_DURATION - state.levelTime) / DENSITY_INTERVAL);
  if (step > state.densityStep) {
    state.densityStep = step;
    ui.phase.textContent = `Kuşatma yoğunluğu arttı (${step}/4)!`;
  }

  const spawnRate = Math.max(0.25, 1.6 - state.level * 0.04 - state.densityStep * 0.3);
  state.spawnTick += dt;
  while (state.spawnTick >= spawnRate) {
    state.spawnTick -= spawnRate;
    for (let i = 0; i < 1 + state.densityStep; i += 1) spawnEnemy();
  }

  state.castle.cooldown -= dt;
  if (state.castle.cooldown <= 0) {
    castleFire();
    state.castle.cooldown = Math.max(0.2, 0.9 - state.castle.archers * 0.02);
  }

  state.enemies.forEach((e) => {
    const chill = e.chilled > 0 ? 0.72 : 1;
    e.mesh.position.x -= e.speed * chill * dt;
    e.chilled = Math.max(0, e.chilled - dt);

    if (e.mesh.position.x <= -150) {
      const mitigation = Math.min(0.55, state.castle.knights * 0.07);
      state.castle.hp -= e.damage * dt * (1 - mitigation);
    }
  });

  state.projectiles.forEach((p) => {
    if (!p.target || !state.enemies.includes(p.target)) { p.dead = true; return; }
    const dir = new THREE.Vector3().subVectors(p.target.mesh.position, p.mesh.position);
    const dist = dir.length();
    if (dist < 2.3) {
      p.target.hp -= p.damage;
      if (p.chill) p.target.chilled = 1.2;
      if (p.splash > 0) {
        state.enemies.forEach((e) => {
          if (e === p.target) return;
          const d = e.mesh.position.distanceTo(p.target.mesh.position);
          if (d < p.splash) {
            e.hp -= p.damage * 0.45;
            if (p.chill) e.chilled = 0.9;
          }
        });
      }
      p.dead = true;
      return;
    }
    dir.normalize();
    p.mesh.position.addScaledVector(dir, p.speed * dt);
  });

  state.enemies = state.enemies.filter((e) => {
    if (e.hp <= 0) {
      state.gold += 12 + Math.floor(e.maxHp * 0.08);
      enemyGroup.remove(e.mesh);
      return false;
    }
    if (e.mesh.position.x < -280) {
      enemyGroup.remove(e.mesh);
      return false;
    }
    return true;
  });

  state.projectiles = state.projectiles.filter((p) => {
    if (p.dead) {
      projectileGroup.remove(p.mesh);
      return false;
    }
    return true;
  });

  if (state.castle.hp <= 0) {
    state.castle.hp = 0;
    state.gameOver = true;
    ui.phase.textContent = `Kale düştü ${state.playerName}!`;
  }
}

ui.startBtn.addEventListener('click', () => {
  state.playerName = ui.playerNameInput.value.trim() || 'Komutan';
  state.started = true;
  ui.startOverlay.classList.add('hidden');
  ui.phase.textContent = `Hoş geldin ${state.playerName}! 3D kuşatma başladı.`;
});

camera.position.set(-40, 70, 130);
camera.lookAt(-140, 25, 0);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  updateHud();
  applyCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

updateHud();
requestAnimationFrame(loop);
