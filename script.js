const canvas = document.getElementById('rangeCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const ui = {
  difficultyLabel: document.getElementById('difficultyLabel'),
  round: document.getElementById('round'),
  shots: document.getElementById('shots'),
  hits: document.getElementById('hits'),
  streak: document.getElementById('streak'),
  distance: document.getElementById('distance'),
  ammo: document.getElementById('ammo'),
  magSize: document.getElementById('magSize'),
  money: document.getElementById('money'),
  penalty: document.getElementById('penalty'),
  log: document.getElementById('log'),
  difficultySelect: document.getElementById('difficultySelect'),
  pickupBtn: document.getElementById('pickupBtn'),
  reloadBtn: document.getElementById('reloadBtn'),
  weaponRack: document.getElementById('weaponRack'),
  intermission: document.getElementById('intermission'),
  tabWeapon: document.getElementById('tabWeapon'),
  tabCosmetic: document.getElementById('tabCosmetic'),
  weaponStore: document.getElementById('weaponStore'),
  cosmeticStore: document.getElementById('cosmeticStore'),
  nextRoundBtn: document.getElementById('nextRoundBtn'),
};

const weapons = [
  { id: 'm1', name: 'M1 Garand (WWII)', mag: 8, recoil: 1.1, baseSpread: 10, fireRate: 450, price: 0, unlockRound: 1 },
  { id: 'mp40', name: 'MP40 (WWII)', mag: 32, recoil: 1.25, baseSpread: 12, fireRate: 540, price: 0, unlockRound: 1 },
  { id: 'ak47', name: 'AK-47', mag: 30, recoil: 1.42, baseSpread: 11, fireRate: 600, price: 8, unlockRound: 2 },
  { id: 'm4', name: 'M4A1', mag: 30, recoil: 1.08, baseSpread: 9, fireRate: 700, price: 10, unlockRound: 3 },
  { id: 'hk', name: 'HK416', mag: 30, recoil: 1.03, baseSpread: 8, fireRate: 700, price: 12, unlockRound: 4 },
  { id: 'scar', name: 'SCAR-H', mag: 20, recoil: 1.55, baseSpread: 10, fireRate: 560, price: 14, unlockRound: 6 },
  { id: 'dragunov', name: 'Dragunov (Sniper)', mag: 10, recoil: 1.3, baseSpread: 6, fireRate: 150, price: 16, unlockRound: 10, sniper: true },
  { id: 'awm', name: 'AWM (Sniper)', mag: 5, recoil: 1.8, baseSpread: 4.5, fireRate: 45, price: 20, unlockRound: 10, sniper: true },
];

const cosmetics = [
  { id: 'range-blue', name: 'Mavi Atış Alanı', price: 6, type: 'rangeTheme', value: 'blue' },
  { id: 'range-gray', name: 'Gri Atış Alanı', price: 8, type: 'rangeTheme', value: 'gray' },
  { id: 'target-neon', name: 'Neon Hedef Renkleri', price: 7, type: 'targetTheme', value: 'neon' },
  { id: 'target-rgb', name: 'Renkli Hedef Paketi', price: 9, type: 'targetTheme', value: 'rgb' },
];

const difficultyConfig = {
  easy: { label: 'Kolay', baseTargetSize: 74, hostageRate: 0.08 },
  medium: { label: 'Orta', baseTargetSize: 64, hostageRate: 0.15 },
  hard: { label: 'Zor', baseTargetSize: 54, hostageRate: 0.2 },
};

const state = {
  round: 1,
  shotsThisRound: 0,
  totalHits: 0,
  streak: 0,
  distanceMeters: 25,
  money: 0,
  penalty: 0,
  successfulShots: 0,
  baseDifficulty: 'medium',
  dynamicDifficulty: 1,
  weaponIndex: 0,
  ownedWeapons: new Set(['m1', 'mp40']),
  boughtCosmetics: new Set(),
  cosmetics: { rangeTheme: 'default', targetTheme: 'default' },
  ammo: 0,
  isReloading: false,
  lastShot: 0,
  recoilOffset: 0,
  target: null,
  mouseX: canvas.width / 2,
  mouseY: canvas.height / 2,
  isZooming: false,
  zoomLerp: 0,
  weaponPicked: false,
  casings: [],
  swayTime: 0,
  intermission: false,
};

function currentWeapon() { return weapons[state.weaponIndex]; }
function currentDifficulty() { return difficultyConfig[state.baseDifficulty]; }
function longRangeMode() { return Boolean(currentWeapon().sniper && state.round >= 10); }

const sound = {
  ctx: null,
  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    return this.ctx;
  },
  tone(freq, duration, type = 'sine', gain = 0.03, when = 0) {
    const ctxRef = this.ensure();
    if (!ctxRef) return;
    const t = ctxRef.currentTime + when;
    const osc = ctxRef.createOscillator();
    const amp = ctxRef.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(ctxRef.destination);
    osc.start(t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.stop(t + duration);
  },
  shoot() {
    this.tone(130 + Math.random() * 30, 0.08, 'sawtooth', 0.085);
    this.tone(220 + Math.random() * 40, 0.04, 'triangle', 0.05, 0.01);
  },
  reload() {
    this.tone(380, 0.03, 'square', 0.04);
    this.tone(300, 0.04, 'square', 0.04, 0.04);
    this.tone(420, 0.05, 'triangle', 0.03, 0.08);
  },
  hitStrong() {
    this.tone(680, 0.05, 'triangle', 0.05);
    this.tone(920, 0.06, 'sine', 0.03, 0.01);
  },
  hitWeak() {
    this.tone(420, 0.05, 'triangle', 0.045);
  },
  miss() {
    this.tone(190, 0.05, 'sine', 0.03);
  },
  penalty() {
    this.tone(120, 0.15, 'square', 0.06);
  },
};

function calcEffectiveWeaponStats() {
  const weapon = currentWeapon();
  return {
    mag: weapon.mag,
    spread: weapon.baseSpread,
    recoil: weapon.recoil,
    minShotDelay: 60000 / weapon.fireRate,
  };
}

function log(msg, cls = '') {
  const li = document.createElement('li');
  li.textContent = `[Tur ${state.round}] ${msg}`;
  if (cls) li.className = cls;
  ui.log.prepend(li);
}

function spawnTarget() {
  const diff = currentDifficulty();
  const sizePenalty = Math.floor((state.distanceMeters - 25) / 6) + Math.floor(state.round / 3);
  const targetSize = Math.max(20, diff.baseTargetSize - sizePenalty * 2);
  const hostageChance = Math.min(0.7, diff.hostageRate + state.round * 0.025);

  state.target = {
    x: canvas.width * 0.5,
    y: longRangeMode() ? 175 : 235,
    size: targetSize,
    isHostageScene: Math.random() < hostageChance,
    hostageOffsetX: targetSize * 1.1,
    hostageOffsetY: targetSize * 0.2,
  };
}

function drawRangeScene() {
  const rangeThemes = {
    default: ['#d8ba3f', '#96790f'],
    blue: ['#7ea5d9', '#334f85'],
    gray: ['#afb4be', '#6f7680'],
  };
  const [floorTop, floorBottom] = rangeThemes[state.cosmetics.rangeTheme] || rangeThemes.default;
  const horizonY = longRangeMode() ? 150 : 190;

  const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  wallGrad.addColorStop(0, '#d3d9df');
  wallGrad.addColorStop(1, '#a9adb3');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvas.width, horizonY);

  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
  floorGrad.addColorStop(0, floorTop);
  floorGrad.addColorStop(1, floorBottom);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

  ctx.fillStyle = '#191c24';
  ctx.fillRect(0, horizonY - 48, 220, canvas.height);
  ctx.fillRect(canvas.width - 220, horizonY - 48, 220, canvas.height);

  ctx.strokeStyle = 'rgba(20,20,20,0.45)';
  ctx.lineWidth = 5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + i * 180, canvas.height);
    ctx.lineTo(canvas.width / 2 + i * (longRangeMode() ? 16 : 36), horizonY + 18);
    ctx.stroke();
  }
}

function getTargetColors() {
  if (state.cosmetics.targetTheme === 'neon') return ['#1cf7ff', '#ff32d6', '#d7ff4a'];
  if (state.cosmetics.targetTheme === 'rgb') return ['#ff3d3d', '#3dff74', '#3d7eff'];
  return ['#ece8de', '#202020', '#b20a0a'];
}

function drawTarget(target) {
  const distScale = 1 - Math.min(0.52, (state.distanceMeters - 25) / 130);
  const s = target.size * distScale;
  const [base, ring, center] = getTargetColors();

  ctx.fillStyle = '#111';
  ctx.fillRect(target.x - 8, target.y - 8, 16, 300);

  ctx.fillStyle = base;
  ctx.fillRect(target.x - s * 1.1, target.y - s * 1.2, s * 2.2, s * 2.4);

  ctx.strokeStyle = ring;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(target.x, target.y, s * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(target.x, target.y, s * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(target.x, target.y, s * 0.12, 0, Math.PI * 2);
  ctx.fill();

  if (target.isHostageScene) {
    const hx = target.x + target.hostageOffsetX;
    const hy = target.y + target.hostageOffsetY;
    ctx.fillStyle = '#456f9b';
    ctx.beginPath();
    ctx.ellipse(hx, hy + s * 0.2, s * 0.55, s * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c3a3';
    ctx.beginPath();
    ctx.arc(hx, hy - s * 0.72, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBenchWeapon() {
  const x = canvas.width * 0.5;
  const y = canvas.height - 56;
  ctx.fillStyle = '#6b5441';
  ctx.fillRect(0, canvas.height - 140, canvas.width, 140);
  ctx.fillStyle = '#8c7158';
  ctx.fillRect(0, canvas.height - 140, canvas.width, 28);

  if (!state.weaponPicked) {
    ctx.fillStyle = '#1f2329';
    ctx.fillRect(x - 210, y - 32, 420, 30);
    ctx.fillRect(x - 30, y - 100, 60, 70);
    ctx.fillRect(x + 160, y - 30, 80, 20);
    ctx.fillStyle = '#e9edf5';
    ctx.font = '34px sans-serif';
    ctx.fillText('Silah masada: E ile al', x - 160, y - 126);
  }
}

function drawHandsAndWeapon() {
  if (!state.weaponPicked) return;
  const zoom = state.zoomLerp;
  const swayX = Math.sin(state.swayTime * 0.003) * (4 + zoom);
  const swayY = Math.cos(state.swayTime * 0.002) * (2 + zoom);
  const baseX = canvas.width / 2 + swayX;
  const baseY = canvas.height - 170 + swayY + state.recoilOffset * 0.38;
  const gunScale = 1 + zoom * 0.2;

  ctx.fillStyle = '#d4a282';
  ctx.beginPath();
  ctx.ellipse(baseX + 295, baseY + 136, 150, 68, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(baseX - 286, baseY + 150, 140, 62, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1c2128';
  ctx.fillRect(baseX - 320 * gunScale, baseY - 26, 640 * gunScale, 56);
  ctx.fillRect(baseX - 52, baseY - 122, 104, 102);
  ctx.fillRect(baseX + 290 * gunScale, baseY - 18, 76, 24);

  ctx.fillStyle = '#bac5d4';
  ctx.fillRect(baseX - 32, baseY - 140, 64, 18);
  ctx.fillRect(baseX + 286 * gunScale, baseY - 32, 12, 26);

  if (state.isZooming) {
    const r = longRangeMode() ? 220 : 180;
    ctx.save();
    ctx.beginPath();
    ctx.arc(state.mouseX, state.mouseY, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#d6f1ff';
    ctx.fillRect(state.mouseX - r, state.mouseY - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,248,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(state.mouseX, state.mouseY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawReticle() {
  if (!state.weaponPicked) return;
  const stats = calcEffectiveWeaponStats();
  const zoomMul = 1 - state.zoomLerp * 0.55;
  const spread = (stats.spread * zoomMul + Math.abs(state.recoilOffset) * 0.4) * 2.2;

  ctx.strokeStyle = '#e8f2ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(state.mouseX - spread - 18, state.mouseY);
  ctx.lineTo(state.mouseX - spread + 8, state.mouseY);
  ctx.moveTo(state.mouseX + spread - 8, state.mouseY);
  ctx.lineTo(state.mouseX + spread + 18, state.mouseY);
  ctx.moveTo(state.mouseX, state.mouseY - spread - 18);
  ctx.lineTo(state.mouseX, state.mouseY - spread + 8);
  ctx.moveTo(state.mouseX, state.mouseY + spread - 8);
  ctx.lineTo(state.mouseX, state.mouseY + spread + 18);
  ctx.stroke();
}

function spawnCasing() {
  state.casings.push({
    x: canvas.width / 2 + 200,
    y: canvas.height - 300,
    vx: 5 + Math.random() * 2.5,
    vy: -8 - Math.random() * 2,
    angle: 0,
    spin: 0.35 + Math.random() * 0.2,
    life: 240,
  });
}

function updateCasings() {
  state.casings = state.casings.filter((c) => c.life > 0);
  for (const c of state.casings) {
    c.vy += 0.28;
    c.x += c.vx;
    c.y += c.vy;
    c.angle += c.spin;
    c.life -= 1;
    if (c.y > canvas.height - 40) {
      c.y = canvas.height - 40;
      c.vy *= -0.35;
      c.vx *= 0.78;
      c.spin *= 0.8;
    }
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = '#d5b15a';
    ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  }
}

function renderWeaponRack() {
  ui.weaponRack.innerHTML = '';
  weapons.forEach((weapon, index) => {
    const owned = state.ownedWeapons.has(weapon.id);
    const lockedByRound = state.round < weapon.unlockRound;

    const card = document.createElement('div');
    card.className = `weapon-card ${owned ? '' : 'locked'} ${index === state.weaponIndex ? 'active' : ''}`;

    card.innerHTML = `
      <div class="top">
        <strong>${weapon.name}</strong>
        <span>${(!owned || lockedByRound) ? '🔒' : '✅'}</span>
      </div>
      <small>${weapon.sniper ? 'Uzak Mesafe / Sniper' : 'Standart'} ${lockedByRound ? `(Tur ${weapon.unlockRound})` : ''}</small>
      <div class="weapon-shape"></div>
    `;

    card.addEventListener('click', () => {
      if (!owned) {
        log('Bu silah henüz sende değil. Tur sonu mağazadan aç.', 'warn');
        return;
      }
      state.weaponIndex = index;
      state.weaponPicked = false;
      state.ammo = 0;
      if (weapon.sniper && state.round >= 10) state.distanceMeters = Math.max(state.distanceMeters, 80);
      refreshUI();
      renderWeaponRack();
      spawnTarget();
    });

    ui.weaponRack.append(card);
  });
}

function refreshUI() {
  const stats = calcEffectiveWeaponStats();
  ui.difficultyLabel.textContent = `${currentDifficulty().label} (+Tur x${state.dynamicDifficulty.toFixed(2)})`;
  ui.round.textContent = state.round;
  ui.shots.textContent = state.shotsThisRound;
  ui.hits.textContent = state.totalHits;
  ui.streak.textContent = state.streak;
  ui.distance.textContent = state.distanceMeters;
  ui.ammo.textContent = state.ammo;
  ui.magSize.textContent = stats.mag;
  ui.money.textContent = state.money.toFixed(1);
  ui.penalty.textContent = state.penalty;
  ui.pickupBtn.disabled = state.weaponPicked;
  ui.pickupBtn.textContent = state.weaponPicked ? 'Silah Elde' : 'Silahı Al (E)';
}

function refillMag() { state.ammo = calcEffectiveWeaponStats().mag; }

function endRoundIntermission() {
  state.intermission = true;
  ui.intermission.classList.remove('hidden');
  renderStores();
}

function roundCheck() {
  if (state.shotsThisRound < 10) return;
  state.money += 1;
  log('Tur tamamlandı: +$1 tur ödülü.', 'good');

  state.round += 1;
  state.shotsThisRound = 0;
  state.streak = 0;
  state.dynamicDifficulty += 0.12;

  if (state.round >= 10) {
    log('10+ tur: sniper silahlar mağazada açıldı ve uzak mesafe aktif.', 'warn');
  }

  endRoundIntermission();
}

function handleHostageHit() {
  state.penalty += 1;
  state.money = Math.max(0, state.money - 2);
  state.streak = 0;
  log('Rehine vuruldu! -$2 ceza.', 'bad');
  sound.penalty();
}

function processHit(outcome) {
  if (outcome === 'hostage') return handleHostageHit();

  state.totalHits += 1;
  state.successfulShots += 1;
  state.streak += 1;

  if (outcome === 'strong') {
    state.money += 0.35;
    log('Başarılı atış! (merkez)', 'good');
    sound.hitStrong();
  } else {
    state.money += 0.15;
    log('Zayıf atış! (dış halka)', 'warn');
    sound.hitWeak();
  }

  if (state.streak % 3 === 0) {
    state.money += 1;
    log('3 ardışık isabet: +$1 bonus.', 'good');
  }

  if (state.successfulShots % 5 === 0) {
    state.distanceMeters += longRangeMode() ? 10 : 5;
    log(`5 başarılı atış: hedef ${state.distanceMeters}m mesafeye çekildi.`, 'warn');
  }
}

function shoot() {
  if (state.intermission) return;
  const now = performance.now();
  const stats = calcEffectiveWeaponStats();

  if (!state.weaponPicked) return log('Önce silahı masadan al (E).', 'warn');
  if (state.isReloading) return;
  if (state.ammo <= 0) {
    log('Mermi bitti, R ile doldur.', 'bad');
    sound.miss();
    return;
  }
  if (now - state.lastShot < stats.minShotDelay) return;

  state.lastShot = now;
  state.ammo -= 1;
  state.shotsThisRound += 1;
  state.recoilOffset += 13 * stats.recoil * (state.isZooming ? 0.7 : 1);
  spawnCasing();
  sound.shoot();

  const spread = (stats.spread + (state.distanceMeters - 25) * 0.08 + state.round * 0.3) * (state.isZooming ? 0.55 : 1);
  const shotX = state.mouseX + (Math.random() - 0.5) * spread * 2;
  const shotY = state.mouseY + (Math.random() - 0.5) * spread * 2;

  const t = state.target;
  const distScale = 1 - Math.min(0.52, (state.distanceMeters - 25) / 130);
  const outerRadius = t.size * 0.65 * distScale;
  const centerRadius = t.size * 0.2 * distScale;
  const hostileDist = Math.hypot(shotX - t.x, shotY - t.y);

  let outcome = 'miss';
  if (hostileDist < centerRadius) outcome = 'strong';
  else if (hostileDist < outerRadius) outcome = 'weak';

  if (outcome === 'miss' && t.isHostageScene) {
    const hx = t.x + t.hostageOffsetX;
    const hy = t.y + t.hostageOffsetY;
    if (Math.hypot(shotX - hx, shotY - hy) < t.size * 0.42 * distScale) outcome = 'hostage';
  }

  if (outcome === 'miss') {
    state.streak = 0;
    log('Iskaladın.', 'bad');
    sound.miss();
  } else {
    processHit(outcome);
    if (outcome !== 'hostage') state.target.isHostageScene = Math.random() < Math.min(0.85, currentDifficulty().hostageRate + state.round * 0.03);
  }

  roundCheck();
  refreshUI();
}

function reload() {
  if (!state.weaponPicked || state.isReloading || state.intermission) return;
  if (state.ammo === calcEffectiveWeaponStats().mag) return;
  state.isReloading = true;
  sound.reload();
  log('Şarjör değiştiriliyor...', 'warn');
  setTimeout(() => {
    refillMag();
    state.isReloading = false;
    log('Şarjör dolu.', 'good');
    refreshUI();
  }, 1000);
}

function pickupWeapon() {
  if (state.weaponPicked || state.intermission) return;
  state.weaponPicked = true;
  refillMag();
  sound.tone(510, 0.05, 'triangle', 0.04);
  log(`${currentWeapon().name} masadan alındı.`, 'good');
  refreshUI();
}

function buyWeapon(id) {
  const weapon = weapons.find((w) => w.id === id);
  if (!weapon) return;
  if (state.round < weapon.unlockRound) return log(`Bu silah Tur ${weapon.unlockRound} sonrası açılır.`, 'warn');
  if (state.ownedWeapons.has(id)) return;
  if (state.money < weapon.price) return log('Yetersiz bakiye.', 'bad');
  state.money -= weapon.price;
  state.ownedWeapons.add(id);
  log(`${weapon.name} satın alındı.`, 'good');
  renderStores();
  renderWeaponRack();
  refreshUI();
}

function buyCosmetic(id) {
  const item = cosmetics.find((c) => c.id === id);
  if (!item || state.boughtCosmetics.has(id)) return;
  if (state.money < item.price) return log('Yetersiz bakiye.', 'bad');
  state.money -= item.price;
  state.boughtCosmetics.add(id);
  state.cosmetics[item.type] = item.value;
  log(`${item.name} aktif edildi.`, 'good');
  renderStores();
  refreshUI();
}

function renderStores() {
  ui.weaponStore.innerHTML = '';
  weapons.forEach((weapon) => {
    if (weapon.price === 0) return;
    const item = document.createElement('div');
    item.className = 'store-item';
    const available = state.round >= weapon.unlockRound;
    const owned = state.ownedWeapons.has(weapon.id);
    item.innerHTML = `<strong>${weapon.name}</strong><p>$${weapon.price} ${available ? '' : `| Tur ${weapon.unlockRound}`}</p>`;
    const btn = document.createElement('button');
    btn.textContent = owned ? 'Alındı' : available ? 'Satın Al' : 'Kilitli 🔒';
    btn.disabled = owned || !available;
    btn.addEventListener('click', () => buyWeapon(weapon.id));
    item.append(btn);
    ui.weaponStore.append(item);
  });

  ui.cosmeticStore.innerHTML = '';
  cosmetics.forEach((itemCfg) => {
    const item = document.createElement('div');
    item.className = 'store-item';
    const owned = state.boughtCosmetics.has(itemCfg.id);
    item.innerHTML = `<strong>${itemCfg.name}</strong><p>$${itemCfg.price}</p>`;
    const btn = document.createElement('button');
    btn.textContent = owned ? 'Alındı' : 'Satın Al';
    btn.disabled = owned;
    btn.addEventListener('click', () => buyCosmetic(itemCfg.id));
    item.append(btn);
    ui.cosmeticStore.append(item);
  });
}

function switchIntermissionTab(tab) {
  const weaponMode = tab === 'weapon';
  ui.tabWeapon.classList.toggle('active', weaponMode);
  ui.tabCosmetic.classList.toggle('active', !weaponMode);
  ui.weaponStore.classList.toggle('hidden', !weaponMode);
  ui.cosmeticStore.classList.toggle('hidden', weaponMode);
}

function continueNextRound() {
  state.intermission = false;
  ui.intermission.classList.add('hidden');
  if (longRangeMode()) state.distanceMeters = Math.max(80, state.distanceMeters);
  spawnTarget();
  renderWeaponRack();
  refreshUI();
}

function bindEvents() {
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = ((event.clientX - rect.left) * canvas.width) / rect.width;
    state.mouseY = ((event.clientY - rect.top) * canvas.height) / rect.height;
  });

  canvas.addEventListener('mousedown', (event) => {
    sound.ensure();
    if (event.button === 0) shoot();
    if (event.button === 2) state.isZooming = true;
  });
  canvas.addEventListener('mouseup', (event) => {
    if (event.button === 2) state.isZooming = false;
  });
  canvas.addEventListener('mouseleave', () => { state.isZooming = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('keydown', (e) => {
    sound.ensure();
    if (e.code === 'KeyR') reload();
    if (e.code === 'KeyE') pickupWeapon();
    if (e.code === 'Space') {
      e.preventDefault();
      shoot();
    }
  });

  ui.pickupBtn.addEventListener('click', pickupWeapon);
  ui.reloadBtn.addEventListener('click', reload);
  ui.difficultySelect.addEventListener('change', (e) => {
    state.baseDifficulty = e.target.value;
    spawnTarget();
    refreshUI();
  });

  ui.tabWeapon.addEventListener('click', () => switchIntermissionTab('weapon'));
  ui.tabCosmetic.addEventListener('click', () => switchIntermissionTab('cosmetic'));
  ui.nextRoundBtn.addEventListener('click', continueNextRound);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.swayTime += 16;
  state.zoomLerp += ((state.isZooming ? 1 : 0) - state.zoomLerp) * 0.12;

  drawRangeScene();
  drawTarget(state.target);
  drawBenchWeapon();
  updateCasings();
  drawHandsAndWeapon();
  drawReticle();

  state.recoilOffset *= 0.82;
  requestAnimationFrame(render);
}

function init() {
  bindEvents();
  spawnTarget();
  renderWeaponRack();
  renderStores();
  refreshUI();
  log('Ses efektleri: atış, doldurma, güçlü/zayıf isabet ve ıskalama aktif.', 'warn');
  render();
}

init();
