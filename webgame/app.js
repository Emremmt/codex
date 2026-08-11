const RES = ["metal", "crystal", "deuterium"];

const BUILDINGS = {
  metalMine: { n: "Metal Madeni", b: { metal: 60, crystal: 15, deuterium: 0 }, f: 1.5 },
  crystalMine: { n: "Kristal Madeni", b: { metal: 48, crystal: 24, deuterium: 0 }, f: 1.6 },
  deuteriumSynth: { n: "Deuterium Sentez", b: { metal: 225, crystal: 75, deuterium: 0 }, f: 1.5 },
  solarPlant: { n: "Güneş Santrali", b: { metal: 75, crystal: 30, deuterium: 0 }, f: 1.5 },
  shipyard: { n: "Tersane", b: { metal: 400, crystal: 200, deuterium: 100 }, f: 1.9 },
  lab: { n: "Araştırma Lab", b: { metal: 200, crystal: 400, deuterium: 200 }, f: 1.8 },
};

const RESEARCH = {
  weapons: { n: "Silah", b: { metal: 800, crystal: 200, deuterium: 0 }, f: 1.7 },
  shielding: { n: "Kalkan", b: { metal: 200, crystal: 600, deuterium: 0 }, f: 1.7 },
  armor: { n: "Zırh", b: { metal: 1000, crystal: 0, deuterium: 0 }, f: 1.7 },
  impulse: { n: "İtki", b: { metal: 1200, crystal: 400, deuterium: 1000 }, f: 1.8 },
  espionage: { n: "Casusluk", b: { metal: 200, crystal: 1000, deuterium: 200 }, f: 1.8 },
  astrophysics: { n: "Astrofizik", b: { metal: 6000, crystal: 10000, deuterium: 4000 }, f: 2.0 },
  quantumAI: { n: "Quantum AI", b: { metal: 18000, crystal: 12000, deuterium: 9000 }, f: 2.1 },
  autonomousDrone: { n: "Otonom Drone Ağ", b: { metal: 24000, crystal: 21000, deuterium: 12000 }, f: 2.15 },
  orbitalFabrication: { n: "Yörüngesel Fabrikasyon", b: { metal: 30000, crystal: 26000, deuterium: 20000 }, f: 2.25 },
};

const SHIPS = {
  lightFighter: { n: "Hafif Avcı", c: { metal: 3000, crystal: 1000, deuterium: 0 }, atk: 55, hp: 380, cargo: 50 },
  cruiser: { n: "Kruvazör", c: { metal: 20000, crystal: 7000, deuterium: 2000 }, atk: 420, hp: 2900, cargo: 800 },
  battleship: { n: "Savaş Gemisi", c: { metal: 45000, crystal: 15000, deuterium: 0 }, atk: 1100, hp: 6200, cargo: 1500 },
  colonyShip: { n: "Koloni Gemisi", c: { metal: 10000, crystal: 20000, deuterium: 10000 }, atk: 70, hp: 3000, cargo: 7500 },
  recycler: { n: "Recycler", c: { metal: 10000, crystal: 6000, deuterium: 2000 }, atk: 1, hp: 1600, cargo: 20000 },
  probe: { n: "Casus Sondası", c: { metal: 0, crystal: 1000, deuterium: 0 }, atk: 1, hp: 100, cargo: 0 },
  titanDreadnought: { n: "UNIQUE Titan Dreadnought", c: { metal: 30_000_000, crystal: 18_000_000, deuterium: 9_000_000 }, atk: 120_000, hp: 600_000, cargo: 200_000, unique: true },
  quantumArk: { n: "UNIQUE Quantum Ark", c: { metal: 24_000_000, crystal: 26_000_000, deuterium: 12_000_000 }, atk: 90_000, hp: 800_000, cargo: 400_000, unique: true },
};

const SHIP_REQUIREMENTS = {
  cruiser: { building: ["shipyard", 2] },
  battleship: { building: ["shipyard", 4], research: ["weapons", 2] },
  colonyShip: { building: ["shipyard", 3], research: ["astrophysics", 1] },
  recycler: { building: ["shipyard", 2] },
  probe: { building: ["lab", 2], research: ["espionage", 1] },
  titanDreadnought: { building: ["shipyard", 8], research: ["quantumAI", 5] },
  quantumArk: { building: ["shipyard", 8], research: ["astrophysics", 5] },
};

const DEF = {
  rocket: { n: "Roketatar", c: { metal: 2000, crystal: 0, deuterium: 0 }, atk: 80, hp: 200 },
  lightLaser: { n: "Hafif Lazer", c: { metal: 1500, crystal: 500, deuterium: 0 }, atk: 100, hp: 200 },
  gauss: { n: "Gauss", c: { metal: 20000, crystal: 15000, deuterium: 2000 }, atk: 1100, hp: 3500 },
  plasma: { n: "Plazma", c: { metal: 50000, crystal: 50000, deuterium: 30000 }, atk: 3100, hp: 10000 },
};

const OFFICERS = {
  commander: { n: "Commander", c: { metal: 120000, crystal: 60000, deuterium: 40000 }, bonus: "+%10 üretim" },
  engineer: { n: "Engineer", c: { metal: 100000, crystal: 90000, deuterium: 50000 }, bonus: "+%12 savunma HP" },
  admiral: { n: "Admiral", c: { metal: 140000, crystal: 120000, deuterium: 110000 }, bonus: "+%8 filo saldırı" },
};

const UNIT_ART = {
  lightFighter: "./assets/fighter.svg",
  cruiser: "./assets/cruiser.svg",
  titanDreadnought: "./assets/titan.svg",
};

const state = {
  turn: 1,
  activePlanetId: null,
  lastExpeditionTurn: -1,
  empires: [],
  planets: [],
  missions: [],
  missionReports: [],
  market: { metalToCrystal: 1.4, metalToDeut: 2.2 },
  alliances: [],
  allianceWars: [],
  tradeContracts: [],
  messages: [],
  log: [],
  realtime: { startedAt: Date.now() },
};

const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const resCost = (base, f, lv) => Object.fromEntries(RES.map(x => [x, Math.floor(base[x] * Math.pow(f, lv))]));
const can = (pool, c) => RES.every(k => (pool[k] || 0) >= (c[k] || 0));
function pay(pool, c) { if (!can(pool, c)) return false; RES.forEach(k => pool[k] -= c[k] || 0); return true; }

function mkEmpire(id, bot = false) {
  return {
    id,
    name: bot ? `Bot-${id}` : "Sen",
    isBot: bot,
    research: Object.fromEntries(Object.keys(RESEARCH).map(k => [k, 0])),
    uniqueBuilt: { titanDreadnought: false, quantumArk: false },
    officers: Object.fromEntries(Object.keys(OFFICERS).map(k => [k, false])),
    allianceId: null,
  };
}

function mkPlanet(name, ownerId, neutral = false) {
  return {
    id: crypto.randomUUID(),
    name,
    ownerId,
    coords: [r(1, 9), r(1, 499), r(1, 15)],
    moon: false,
    resources: {
      metal: neutral ? r(20000, 140000) : 40000,
      crystal: neutral ? r(10000, 90000) : 25000,
      deuterium: neutral ? r(8000, 70000) : 16000,
    },
    b: Object.fromEntries(Object.keys(BUILDINGS).map(k => [k, 1])),
    ships: Object.fromEntries(Object.keys(SHIPS).map(k => [k, 0])),
    def: Object.fromEntries(Object.keys(DEF).map(k => [k, 0])),
  };
}

function initGame(botCount = 80) {
  state.turn = 1;
  state.activePlanetId = null;
  state.lastExpeditionTurn = -1;
  state.empires = [mkEmpire(0, false)];
  for (let i = 1; i <= botCount; i++) state.empires.push(mkEmpire(i, true));
  state.planets = [];
  state.missions = [];
  state.missionReports = [];
  state.alliances = [];
  state.allianceWars = [];
  state.tradeContracts = [];
  state.messages = [];
  state.log = ["2K komuta ağı aktive edildi."];
  state.realtime.startedAt = Date.now();
  const occupiedCoordinates = new Set();
  const addPlanet = planet => {
    let key = planet.coords.join(":");
    let attempts = 0;
    while (occupiedCoordinates.has(key) && attempts < 20) {
      planet.coords = [r(1, 9), r(1, 499), r(1, 15)];
      key = planet.coords.join(":");
      attempts++;
    }
    if (occupiedCoordinates.has(key)) {
      let index = occupiedCoordinates.size;
      do {
        planet.coords = [1 + Math.floor(index / (499 * 15)) % 9, 1 + Math.floor(index / 15) % 499, 1 + index % 15];
        key = planet.coords.join(":");
        index++;
      } while (occupiedCoordinates.has(key));
    }
    occupiedCoordinates.add(key);
    state.planets.push(planet);
  };

  const names = ["Astra", "Vega", "Orion", "Draco", "Nyx", "Aquila", "Helix", "Sirius"];
  state.empires.forEach(e => {
    const p = mkPlanet(`${names[r(0, names.length - 1)]}-${e.id}`, e.id, false);
    p.ships.lightFighter = 18;
    p.ships.colonyShip = 1;
    p.ships.recycler = 1;
    p.def.rocket = 16;
    addPlanet(p);
    if (e.id === 0) state.activePlanetId = p.id;
  });
  for (let i = 0; i < botCount * 2; i++) {
    const p = mkPlanet(`${names[r(0, names.length - 1)]}-N${i}`, -1, true);
    p.ships.lightFighter = r(0, 20);
    p.def.rocket = r(0, 20);
    addPlanet(p);
  }
  createBotAlliances(botCount);
}

function createBotAlliances(botCount) {
  const names = ["Orion Paktı", "Vega Birliği", "Draco Lejyonu", "Nyx Konsorsiyumu", "Aquila Muhafızları", "Helix İttifakı"];
  const alignedBots = Math.floor(botCount * 0.75);
  const groupSize = clamp(Math.round(botCount / 6), 4, 12);
  let group = 0;
  for (let first = 1; first <= alignedBots; first += groupSize) {
    const members = state.empires
      .filter(e => e.isBot && e.id >= first && e.id < first + groupSize)
      .map(e => e.id);
    if (members.length < 2) continue;
    const alliance = { id: crypto.randomUUID(), name: names[group % names.length], members };
    state.alliances.push(alliance);
    members.forEach(id => { emp(id).allianceId = alliance.id; });
    group++;
  }
}

const emp = id => state.empires.find(x => x.id === id);
const planetsOf = id => state.planets.filter(p => p.ownerId === id);

function activePlanet(ownerId = 0) {
  const selected = state.planets.find(p => p.id === state.activePlanetId && p.ownerId === ownerId);
  const fallback = selected || planetsOf(ownerId)[0] || null;
  if (ownerId === 0 && fallback) state.activePlanetId = fallback.id;
  return fallback;
}

function selectActivePlanet(planetId) {
  const planet = state.planets.find(p => p.id === planetId && p.ownerId === 0);
  if (!planet) return false;
  state.activePlanetId = planet.id;
  render();
  return true;
}

function playerEliminated() {
  return planetsOf(0).length === 0;
}

function allianceOfEmpire(empireId) {
  const id = emp(empireId)?.allianceId;
  return id ? state.alliances.find(a => a.id === id) || null : null;
}

function sameAlliance(firstId, secondId) {
  const first = emp(firstId)?.allianceId;
  return Boolean(first && first === emp(secondId)?.allianceId);
}

function activeWarBetween(firstAllianceId, secondAllianceId) {
  if (!firstAllianceId || !secondAllianceId) return null;
  return state.allianceWars.find(w => w.status !== "ended" && (
    (w.a1 === firstAllianceId && w.a2 === secondAllianceId) ||
    (w.a1 === secondAllianceId && w.a2 === firstAllianceId)
  )) || null;
}

function tech(id) {
  const t = emp(id)?.research || {};
  return {
    atk: 1 + 0.1 * (t.weapons || 0) + 0.03 * (t.quantumAI || 0),
    hp: 1 + 0.1 * (t.armor || 0) + 0.02 * (t.orbitalFabrication || 0),
    def: 1 + 0.1 * (t.shielding || 0),
    speed: 1 + 0.08 * (t.impulse || 0),
    drone: 1 + 0.04 * (t.autonomousDrone || 0),
  };
}

function officerMul(id) {
  const o = emp(id)?.officers || {};
  return {
    eco: o.commander ? 1.1 : 1,
    shipAtk: o.admiral ? 1.08 : 1,
    defHp: o.engineer ? 1.12 : 1,
  };
}

function ecoTick(p) {
  const mm = p.b.metalMine, cm = p.b.crystalMine, ds = p.b.deuteriumSynth, sp = p.b.solarPlant;
  const mul = p.ownerId >= 0 ? officerMul(p.ownerId).eco : 1;
  const energy = 25 * Math.pow(sp, 1.2);
  const used = 10 * mm + 10 * cm + 20 * ds;
  const ratio = clamp(energy / Math.max(1, used), 0.3, 1);
  p.resources.metal += Math.floor(45 * Math.pow(mm, 1.17) * ratio * mul);
  p.resources.crystal += Math.floor(30 * Math.pow(cm, 1.17) * ratio * mul);
  p.resources.deuterium += Math.floor(18 * Math.pow(ds, 1.15) * ratio * mul);
}

function power(p, owner = p.ownerId) {
  const t = owner >= 0 ? tech(owner) : { atk: 1, hp: 1, def: 1, drone: 1 };
  const of = owner >= 0 ? officerMul(owner) : { shipAtk: 1, defHp: 1 };
  let shipAtk = 0, defAtk = 0, hp = 0;
  Object.entries(p.ships).forEach(([k, v]) => { shipAtk += v * SHIPS[k].atk * of.shipAtk * t.drone; hp += v * SHIPS[k].hp; });
  Object.entries(p.def).forEach(([k, v]) => { defAtk += v * DEF[k].atk; hp += v * DEF[k].hp * of.defHp; });
  return (shipAtk + defAtk) * t.atk + hp * t.hp * (0.7 + 0.3 * t.def) * 0.2;
}

function distance(a, b) {
  const [g1, s1, sl1] = a.coords;
  const [g2, s2, sl2] = b.coords;
  return Math.abs(g1 - g2) * 220 + Math.abs(s1 - s2) * 1.8 + Math.abs(sl1 - sl2) * 8 + 1;
}

function travelTurns(from, to, ownerId) {
  const speed = tech(ownerId).speed;
  const d = distance(from, to);
  return Math.max(1, Math.ceil((d / (110 * speed))));
}

const MISSION_FLEET_RULES = {
  attack: k => !["colonyShip", "recycler", "probe"].includes(k),
  transport: k => !["colonyShip", "recycler", "probe"].includes(k) && SHIPS[k].cargo > 0,
  espionage: k => k === "probe",
  recycle: k => k === "recycler",
};

function validMissionTarget(type, from, to, ownerId) {
  if (!from || !to || from.id === to.id) return false;
  if (type === "transport") return to.ownerId === ownerId;
  if (to.ownerId >= 0 && sameAlliance(ownerId, to.ownerId)) return false;
  return to.ownerId !== ownerId;
}

function missionTargets(type, fromId, ownerId = 0) {
  const from = state.planets.find(p => p.id === fromId);
  return state.planets.filter(to => validMissionTarget(type, from, to, ownerId));
}

function missionFleet(type, from, requestedFleet = null) {
  const allowed = MISSION_FLEET_RULES[type];
  const fleet = Object.fromEntries(Object.keys(from.ships).map(k => [k, 0]));
  if (!allowed) return fleet;

  if (requestedFleet) {
    Object.keys(fleet).forEach(k => {
      if (!allowed(k)) return;
      fleet[k] = clamp(Math.floor(Number(requestedFleet[k]) || 0), 0, from.ships[k]);
    });
    return fleet;
  }

  if (type === "espionage") fleet.probe = Math.min(1, from.ships.probe || 0);
  else if (type === "recycle") fleet.recycler = Math.min(1, from.ships.recycler || 0);
  else Object.keys(fleet).forEach(k => { if (allowed(k)) fleet[k] = Math.floor(from.ships[k] * 0.55); });
  return fleet;
}

function fleetCargoCapacity(fleet) {
  return Object.entries(fleet).reduce((sum, [k, amount]) => sum + amount * (SHIPS[k]?.cargo || 0), 0);
}

function transportCargo(from, fleet, requested = {}) {
  let remaining = fleetCargoCapacity(fleet);
  const cargo = { metal: 0, crystal: 0, deuterium: 0 };
  RES.forEach(k => {
    const wanted = Math.max(0, Math.floor(Number(requested[k]) || 0));
    cargo[k] = Math.min(wanted, from.resources[k], remaining);
    remaining -= cargo[k];
  });
  return cargo;
}

function launchMission(type, fromId, toId, ownerId, now = Date.now(), options = {}) {
  const from = state.planets.find(p => p.id === fromId);
  const to = state.planets.find(p => p.id === toId);
  if (!from || !to || from.ownerId !== ownerId) return "Görev başlatılamadı.";
  if (!["attack", "espionage", "transport", "recycle"].includes(type)) return "Geçersiz görev türü.";
  if (!validMissionTarget(type, from, to, ownerId)) return "Bu görev için hedef uygun değil.";

  const fleet = missionFleet(type, from, options.fleet);
  if (Object.values(fleet).reduce((a, b) => a + b, 0) <= 0) return "Gönderilecek filo yok.";

  const cargo = type === "transport"
    ? transportCargo(from, fleet, options.cargo || { metal: 2500, crystal: 1500, deuterium: 800 })
    : { metal: 0, crystal: 0, deuterium: 0 };
  if (type === "transport" && RES.every(k => cargo[k] === 0)) return "Taşınacak kaynak veya yeterli kargo kapasitesi yok.";

  Object.keys(fleet).forEach(k => { from.ships[k] -= fleet[k]; });
  if (type === "transport") RES.forEach(k => { from.resources[k] -= cargo[k]; });

  const eta = state.turn + travelTurns(from, to, ownerId);
  const durationSec = travelTurns(from, to, ownerId) * 25;
  state.missions.push({
    id: crypto.randomUUID(),
    type,
    ownerId,
    fromId,
    toId,
    fleet,
    cargo,
    phase: "outbound",
    eta,
    etaMs: now + durationSec * 1000,
    returnEta: null,
    returnEtaMs: null,
    done: false,
  });
  return `Görev çıktı: ${type}, varış turu ${eta}`;
}

function applySurvival(pool, definitions, factor) {
  const losses = {};
  let destroyedPower = 0;
  Object.keys(pool).forEach(k => {
    const before = pool[k] || 0;
    const after = Math.max(0, Math.floor(before * factor));
    losses[k] = before - after;
    pool[k] = after;
    destroyedPower += losses[k] * ((definitions[k]?.atk || 0) + (definitions[k]?.hp || 0) * 0.2);
  });
  return { losses, destroyedPower };
}

function maxEmpirePlanets(empireId) {
  return 1 + Math.ceil((emp(empireId)?.research.astrophysics || 0) / 2);
}

function resolveCombat(attackerId, target, fleet, random = Math.random) {
  const defenderOwnerId = target.ownerId;
  const attackerTech = tech(attackerId);
  const attackerOfficer = officerMul(attackerId);
  const defTech = defenderOwnerId >= 0 ? tech(defenderOwnerId) : { atk: 1, hp: 1, def: 1, drone: 1 };
  const defenderOfficer = defenderOwnerId >= 0 ? officerMul(defenderOwnerId) : { shipAtk: 1, defHp: 1 };
  let atk = 0, atkHp = 0;
  Object.entries(fleet).forEach(([k, v]) => { atk += v * SHIPS[k].atk; atkHp += v * SHIPS[k].hp; });

  let defShipAtk = 0, defStructureAtk = 0, defShipHp = 0, defStructureHp = 0;
  Object.entries(target.ships).forEach(([k, v]) => { defShipAtk += v * SHIPS[k].atk; defShipHp += v * SHIPS[k].hp; });
  Object.entries(target.def).forEach(([k, v]) => { defStructureAtk += v * DEF[k].atk; defStructureHp += v * DEF[k].hp; });

  const attackerMaxHp = atkHp * attackerTech.hp * (0.75 + 0.25 * attackerTech.def);
  const defenderMaxHp = (defShipHp + defStructureHp * defenderOfficer.defHp) * defTech.hp * (0.75 + 0.25 * defTech.def);
  const attackerDamage = atk * attackerTech.atk * attackerOfficer.shipAtk * attackerTech.drone;
  const defenderDamage = (defShipAtk * defenderOfficer.shipAtk * defTech.drone + defStructureAtk) * defTech.atk;
  let ap = attackerMaxHp;
  let dp = defenderMaxHp;
  for (let i = 0; i < 7; i++) {
    const nextDp = dp - attackerDamage * (0.82 + random() * 0.32);
    const nextAp = ap - defenderDamage * (0.82 + random() * 0.32);
    dp = nextDp;
    ap = nextAp;
    if (ap <= 0 || dp <= 0) break;
  }

  const attackerRatio = clamp(ap / Math.max(1, attackerMaxHp), 0, 1);
  const defenderRatio = clamp(dp / Math.max(1, defenderMaxHp), 0, 1);
  const win = attackerRatio > 0 && (dp <= 0 || attackerRatio > defenderRatio);
  const survivor = win ? clamp(attackerRatio, 0.08, 0.92) : clamp(attackerRatio, 0, 0.28);
  const defenderSurvivor = win ? clamp(defenderRatio, 0, 0.42) : clamp(defenderRatio, 0.42, 0.98);
  const shipDamage = applySurvival(target.ships, SHIPS, defenderSurvivor);
  const defenseDamage = applySurvival(target.def, DEF, defenderSurvivor);
  const destroyedPower = shipDamage.destroyedPower + defenseDamage.destroyedPower;
  const loot = { metal: 0, crystal: 0, deuterium: 0 };

  if (win) {
    const cargo = fleetCargoCapacity(fleet) * survivor;
    const totalLoot = Math.floor(Math.min(cargo, (target.resources.metal + target.resources.crystal + target.resources.deuterium) * 0.45));
    loot.metal = Math.min(target.resources.metal, Math.floor(totalLoot * 0.5));
    loot.crystal = Math.min(target.resources.crystal, Math.floor(totalLoot * 0.3));
    loot.deuterium = Math.min(target.resources.deuterium, Math.floor(totalLoot * 0.2));
    RES.forEach(k => target.resources[k] -= loot[k]);

    const canConquer = defenderOwnerId >= 0 && defenderOwnerId !== attackerId && planetsOf(attackerId).length < maxEmpirePlanets(attackerId);
    if (canConquer && random() < 0.18) {
      target.ownerId = attackerId;
      Object.keys(target.ships).forEach(k => { target.ships[k] = 0; });
      Object.keys(target.def).forEach(k => { target.def[k] = 0; });
    }
    if (!target.moon && destroyedPower >= 5_000 && random() < 0.12) target.moon = true;
  }

  return {
    win,
    loot,
    survivor,
    defenderSurvivor,
    defenderOwnerId,
    defenderLosses: { ships: shipDamage.losses, defenses: defenseDamage.losses },
    destroyedPower,
    conquered: target.ownerId === attackerId && defenderOwnerId !== attackerId,
  };
}

function recordAllianceBattle(attackerId, defenderId, result, targetName) {
  if (defenderId < 0) return;
  const attackerAlliance = allianceOfEmpire(attackerId);
  const defenderAlliance = allianceOfEmpire(defenderId);
  const war = activeWarBetween(attackerAlliance?.id, defenderAlliance?.id);
  if (!war) return;

  const points = Math.max(1, Math.floor(result.destroyedPower / 1_000) + (result.win ? 5 : 1));
  if (war.a1 === attackerAlliance.id) war.score1 += points;
  else war.score2 += points;
  war.battles = war.battles || [];
  war.battles.unshift({ turn: state.turn, attackerId, defenderId, targetName, win: result.win, points });
  war.battles = war.battles.slice(0, 30);
  updateAllianceWarScores();
}

function missionReady(turnEta, timeEta, now) {
  const turnReady = Number.isFinite(turnEta) && turnEta <= state.turn;
  const timeReady = Number.isFinite(timeEta) && timeEta <= now;
  return turnReady || timeReady;
}

function reportMission(title, detail) {
  state.missionReports.unshift({ turn: state.turn, title, detail });
}

function returnDestination(m) {
  const origin = state.planets.find(p => p.id === m.fromId && p.ownerId === m.ownerId);
  return origin || planetsOf(m.ownerId)[0] || null;
}

function finishMissionReturn(m) {
  const home = returnDestination(m);
  if (!home) {
    m.done = true;
    state.log.unshift(`[T${state.turn}] ${emp(m.ownerId)?.name || "Bilinmeyen imparatorluk"} filosu dönecek üs bulamadı.`);
    reportMission(`Filo Kaybı (${m.type})`, "İmparatorluğun sahip olduğu gezegen kalmadığı için filo ve taşıdığı kaynaklar kaybedildi.");
    return;
  }

  Object.keys(m.fleet).forEach(k => { home.ships[k] = (home.ships[k] || 0) + (m.fleet[k] || 0); });
  RES.forEach(k => { home.resources[k] += m.cargo?.[k] || 0; });
  m.done = true;
  state.log.unshift(`[T${state.turn}] Filo ${home.name} gezegenine geri döndü.`);
  reportMission(
    `Dönüş Raporu (${m.type})`,
    `${emp(m.ownerId)?.name || "Filo"} ${home.name} gezegenine döndü. Yük M:${m.cargo?.metal || 0} C:${m.cargo?.crystal || 0} D:${m.cargo?.deuterium || 0}`,
  );
}

function processMissions(now = Date.now()) {
  const before = state.missions.map(m => `${m.id}:${m.phase || "legacy"}:${Boolean(m.done)}`).join("|");
  state.missions.forEach(m => {
    if (m.done) return;
    // Eski save dosyalarında phase/cargo alanı yoktur; yüklenirken güvenli şekilde tamamla.
    m.phase = m.phase || (m.returnEta ? "returning" : "outbound");
    m.cargo = m.cargo || { metal: 0, crystal: 0, deuterium: 0 };

    if (m.phase === "returning") {
      if (!missionReady(m.returnEta, m.returnEtaMs, now)) return;
      finishMissionReturn(m);
      return;
    }

    if (!missionReady(m.eta, m.etaMs, now)) return;
    const from = state.planets.find(p => p.id === m.fromId);
    const to = state.planets.find(p => p.id === m.toId);
    if (!from || !to) {
      m.done = true;
      reportMission(`Görev İptal (${m.type})`, "Kaynak veya hedef gezegen artık geçerli olmadığı için görev iptal edildi.");
      return;
    }

    if (m.phase === "outbound") {
      if (m.type === "attack") {
        const res = resolveCombat(m.ownerId, to, m.fleet);
        recordAllianceBattle(m.ownerId, res.defenderOwnerId, res, to.name);
        m.cargo = { ...res.loot };
        Object.keys(m.fleet).forEach(k => m.fleet[k] = Math.floor(m.fleet[k] * res.survivor));
        state.log.unshift(`[T${state.turn}] Savaş sonucu: ${res.win ? "Zafer" : "Yenilgi"}.`);
        state.missionReports.unshift({
          turn: state.turn,
          title: `Savaş Raporu: ${to.name}`,
          detail: `${res.win ? "Zafer" : "Yenilgi"}${res.conquered ? " · Gezegen fethedildi" : ""} | Yok edilen güç ${Math.floor(res.destroyedPower)} | Yağma M:${res.loot.metal} C:${res.loot.crystal} D:${res.loot.deuterium}`,
        });
      }
      if (m.type === "espionage") {
        const spyLvl = emp(m.ownerId).research.espionage;
        state.log.unshift(`[T${state.turn}] Casus raporu ${to.name}: Güç ${Math.floor(power(to))}, M:${to.resources.metal}.`);
        if (Math.random() < 0.2 - spyLvl * 0.01) Object.keys(m.fleet).forEach(k => m.fleet[k] = 0);
        state.missionReports.unshift({
          turn: state.turn,
          title: `Casusluk Raporu: ${to.name}`,
          detail: `Güç ${Math.floor(power(to))} | Kaynak M:${to.resources.metal} C:${to.resources.crystal} D:${to.resources.deuterium}`,
        });
      }
      if (m.type === "transport") {
        if (to.ownerId === m.ownerId) {
          const delivered = { ...m.cargo };
          RES.forEach(k => { to.resources[k] += delivered[k]; m.cargo[k] = 0; });
          state.missionReports.unshift({
            turn: state.turn,
            title: "Taşıma Raporu",
            detail: `${from.name} -> ${to.name} | M:${delivered.metal} C:${delivered.crystal} D:${delivered.deuterium}`,
          });
        } else {
          reportMission("Taşıma Başarısız", `${to.name} artık sana ait olmadığı için kaynaklar filoyla geri dönüyor.`);
        }
      }
      if (m.type === "recycle") {
        const bonus = r(3000, 12000);
        m.cargo.metal += bonus;
        state.log.unshift(`[T${state.turn}] Recycler enkaz topladı +${bonus} metal.`);
        state.missionReports.unshift({
          turn: state.turn,
          title: `Enkaz Toplama Raporu`,
          detail: `Recycler operasyonu +${bonus} metal getirdi.`,
        });
      }
      m.phase = "returning";
      m.returnEta = state.turn + travelTurns(to, from, m.ownerId);
      m.returnEtaMs = now + travelTurns(to, from, m.ownerId) * 25 * 1000;
    }
  });
  state.missions = state.missions.filter(m => !m.done);
  state.missionReports = state.missionReports.slice(0, 80);
  const after = state.missions.map(m => `${m.id}:${m.phase}:${Boolean(m.done)}`).join("|");
  return before !== after;
}

function shipRequirementFailure(key, planet, empire) {
  const requirement = SHIP_REQUIREMENTS[key];
  if (!requirement) return null;
  if (requirement.building) {
    const [building, level] = requirement.building;
    if ((planet.b[building] || 0) < level) return `${BUILDINGS[building].n} Sv. ${level} gerekli`;
  }
  if (requirement.research) {
    const [research, level] = requirement.research;
    if ((empire.research[research] || 0) < level) return `${RESEARCH[research].n} Sv. ${level} gerekli`;
  }
  return null;
}

function botTurn(e) {
  const ps = planetsOf(e.id);
  ps.forEach(p => {
    const bKeys = Object.keys(BUILDINGS).sort(() => Math.random() - 0.5);
    for (const k of bKeys) {
      const c = resCost(BUILDINGS[k].b, BUILDINGS[k].f, p.b[k]);
      if (can(p.resources, c) && Math.random() < 0.52) { pay(p.resources, c); p.b[k]++; break; }
    }

    if (p.b.lab >= 2 && Math.random() < 0.35) {
      const rk = Object.keys(RESEARCH)[r(0, Object.keys(RESEARCH).length - 1)];
      const c = resCost(RESEARCH[rk].b, RESEARCH[rk].f, e.research[rk]);
      if (pay(p.resources, c)) e.research[rk]++;
    }

    const buildable = Object.keys(SHIPS).filter(k => !shipRequirementFailure(k, p, e) && !(SHIPS[k].unique && e.uniqueBuilt[k]));
    const sk = buildable[r(0, Math.max(0, buildable.length - 1))];
    if (sk && pay(p.resources, SHIPS[sk].c)) {
      p.ships[sk] += 1;
      if (SHIPS[sk].unique) e.uniqueBuilt[sk] = true;
    }

    if (Math.random() < 0.2) {
      const t = state.planets.filter(x => validMissionTarget("attack", p, x, e.id)).sort((a, b) => power(a) - power(b))[0];
      if (t && power(p, e.id) > power(t) * 1.2) launchMission("attack", p.id, t.id, e.id);
    }
  });
}

function nextTurn() {
  if (playerEliminated()) { render(); return; }
  state.planets.forEach(ecoTick);
  state.empires.filter(x => x.isBot && planetsOf(x.id).length).forEach(botTurn);
  processMissions();
  processTradeContracts();
  updateAllianceWarScores();
  state.turn++;
  render();
}

function buyBuilding(key) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  const c = resCost(BUILDINGS[key].b, BUILDINGS[key].f, p.b[key]);
  if (pay(p.resources, c)) { p.b[key]++; log(`${BUILDINGS[key].n} ${p.b[key]} oldu.`); }
  else log("Kaynak yetmedi.");
  render();
}

function buyResearch(key) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  const e = emp(0);
  if (p.b.lab < 2) return log("Lab seviye 2 olmalı.");
  const c = resCost(RESEARCH[key].b, RESEARCH[key].f, e.research[key]);
  if (pay(p.resources, c)) { e.research[key]++; log(`${RESEARCH[key].n} araştırıldı.`); }
  else log("Kaynak yetmedi.");
  render();
}

function buyShip(key) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  const e = emp(0);
  const requirement = shipRequirementFailure(key, p, e);
  if (requirement) return log(requirement);
  if (SHIPS[key].unique && e.uniqueBuilt[key]) return log("Unique ünite bir kez üretilebilir.");
  if (pay(p.resources, SHIPS[key].c)) {
    p.ships[key] += 1;
    if (SHIPS[key].unique) e.uniqueBuilt[key] = true;
    log(`${SHIPS[key].n} üretildi.`);
  } else log("Kaynak yetmedi.");
  render();
}

function buyDefense(key) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  if (pay(p.resources, DEF[key].c)) { p.def[key] += 1; log(`${DEF[key].n} kuruldu.`); }
  else log("Kaynak yetmedi.");
  render();
}

function hireOfficer(k) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  const e = emp(0);
  if (e.officers[k]) return log("Officer zaten aktif.");
  if (pay(p.resources, OFFICERS[k].c)) { e.officers[k] = true; log(`${OFFICERS[k].n} aktif edildi.`); }
  else log("Kaynak yetmedi.");
  render();
}

function trade(mode) {
  const p = activePlanet();
  if (!p) return log("Yönetilecek gezegen kalmadı.");
  if (mode === "m2c") {
    const metal = 5000;
    const crystal = Math.floor(metal / state.market.metalToCrystal);
    if (p.resources.metal < metal) return log("Metal yetersiz.");
    p.resources.metal -= metal;
    p.resources.crystal += crystal;
    log(`Market: -${metal} metal +${crystal} crystal`);
  }
  if (mode === "m2d") {
    const metal = 6000;
    const d = Math.floor(metal / state.market.metalToDeut);
    if (p.resources.metal < metal) return log("Metal yetersiz.");
    p.resources.metal -= metal;
    p.resources.deuterium += d;
    log(`Market: -${metal} metal +${d} deuterium`);
  }
  render();
}

function createAlliance() {
  const e = emp(0);
  if (e.allianceId) return log("Zaten ittifaktasın.");
  const name = String(prompt("İttifak adı?", "NovaGuard") || "").trim().slice(0, 32);
  if (!name) return;
  const a = { id: crypto.randomUUID(), name, members: [0] };
  state.alliances.push(a);
  e.allianceId = a.id;
  log(`İttifak kuruldu: ${name}`);
  render();
}

function inviteBot() {
  const e = emp(0);
  if (!e.allianceId) return log("Önce ittifak kur.");
  const bot = state.empires.find(x => x.isBot && !x.allianceId);
  if (!bot) return log("Müsait bot yok.");
  bot.allianceId = e.allianceId;
  state.alliances.find(a => a.id === e.allianceId).members.push(bot.id);
  log(`${bot.name} ittifaka katıldı.`);
  render();
}

function sendMessage(toValue = null, contentValue = null) {
  const to = Number(toValue ?? (typeof document !== "undefined" ? document.getElementById("messageTo").value : 0));
  const content = String(contentValue ?? (typeof document !== "undefined" ? document.getElementById("messageInput").value : "")).trim().slice(0, 240);
  const recipient = emp(to);
  if (!content) return;
  if (!recipient?.isBot || !planetsOf(to).length) return log("Alıcı artık erişilebilir değil.");
  state.messages.unshift({ from: 0, to, content, turn: state.turn });
  const reply = sameAlliance(0, to)
    ? "Mesaj alındı komutan. İttifak kanalı açık."
    : (activeWarBetween(emp(0).allianceId, recipient.allianceId)
      ? "İletin kayda geçti. Savaş alanında cevap vereceğiz."
      : "Mesaj alındı. Diplomatik teklif değerlendiriliyor.");
  state.messages.unshift({ from: to, to: 0, content: reply, turn: state.turn });
  if (typeof document !== "undefined") document.getElementById("messageInput").value = "";
  log("Mesaj gönderildi.");
  render();
  return true;
}

function declareAllianceWar(targetAllianceId = null) {
  const me = emp(0);
  if (!me.allianceId) return log("Savaş ilanı için ittifak gerekli.");
  const targetId = typeof targetAllianceId === "string"
    ? targetAllianceId
    : (typeof document !== "undefined" ? document.getElementById("warTargetAlliance").value : "");
  if (!targetId) return log("Rakip ittifak seç.");
  if (!state.alliances.some(a => a.id === targetId) || targetId === me.allianceId) return log("Geçerli bir rakip ittifak seç.");
  const exists = activeWarBetween(me.allianceId, targetId);
  if (exists) return log("Bu ittifakla zaten savaş var.");
  state.allianceWars.push({
    id: crypto.randomUUID(),
    a1: me.allianceId,
    a2: targetId,
    startedTurn: state.turn,
    score1: 0,
    score2: 0,
    targetScore: 100,
    status: "active",
    winnerAllianceId: null,
    battles: [],
  });
  log("İttifak savaşı ilan edildi.");
  render();
  return true;
}

function createTradeContract(botIdValue = null) {
  const botId = Number(typeof botIdValue === "number" || typeof botIdValue === "string"
    ? botIdValue
    : (typeof document !== "undefined" ? document.getElementById("contractBot").value : 0));
  const bot = emp(botId);
  const playerPlanet = activePlanet();
  const partnerPlanet = planetsOf(botId)[0];
  if (!bot?.isBot || !playerPlanet || !partnerPlanet) return log("Ticaret ortağı erişilebilir değil.");
  if (activeWarBetween(emp(0).allianceId, bot.allianceId)) return log("Savaşta olduğun ittifakla ticaret yapamazsın.");
  if (state.tradeContracts.some(c => c.active && c.with === botId && c.playerPlanetId === playerPlanet.id)) return log("Bu gezegenin aynı botla aktif sözleşmesi zaten var.");
  const c = {
    id: crypto.randomUUID(),
    with: botId,
    playerPlanetId: playerPlanet.id,
    partnerPlanetId: partnerPlanet.id,
    give: { metal: 12000, crystal: 0, deuterium: 0 },
    take: { metal: 0, crystal: 6000, deuterium: 1800 },
    everyTurns: 3,
    nextTurn: state.turn + 1,
    active: true,
    missedPayments: 0,
  };
  state.tradeContracts.push(c);
  log(`${bot.name} ile ticaret sözleşmesi kuruldu.`);
  render();
  return c;
}

function processTradeContracts() {
  state.tradeContracts.forEach(c => {
    if (!c.active || state.turn < c.nextTurn) return;
    const home = state.planets.find(p => p.id === c.playerPlanetId && p.ownerId === 0);
    const partner = state.planets.find(p => p.id === c.partnerPlanetId && p.ownerId === c.with);
    if (!home || !partner) {
      c.active = false;
      reportMission("Ticaret Sözleşmesi Bitti", "Taraflardan biri sözleşmedeki gezegenini kaybetti.");
      return;
    }

    if (can(home.resources, c.give) && can(partner.resources, c.take)) {
      RES.forEach(k => {
        home.resources[k] -= c.give[k];
        home.resources[k] += c.take[k];
        partner.resources[k] -= c.take[k];
        partner.resources[k] += c.give[k];
      });
      c.missedPayments = 0;
      state.missionReports.unshift({
        turn: state.turn,
        title: "Ticaret Sözleşmesi",
        detail: `${emp(c.with)?.name} ile otomatik takas tamamlandı.`,
      });
      c.nextTurn += c.everyTurns;
    } else {
      c.missedPayments = (c.missedPayments || 0) + 1;
      c.nextTurn += c.everyTurns;
      if (c.missedPayments >= 3) c.active = false;
      state.missionReports.unshift({
        turn: state.turn,
        title: c.active ? "Ticaret Ödemesi Ertelendi" : "Ticaret Sözleşmesi Durdu",
        detail: c.active ? "Taraflardan birinin kaynağı yetersiz; sonraki dönem yeniden denenecek." : "Üç başarısız dönemden sonra sözleşme pasif oldu.",
      });
    }
  });
}

function cancelTradeContract(contractId) {
  const contract = state.tradeContracts.find(c => c.id === contractId);
  if (!contract || !contract.active) return false;
  contract.active = false;
  log(`${emp(contract.with)?.name || "Ticaret"} sözleşmesi iptal edildi.`);
  render();
  return true;
}

function updateAllianceWarScores() {
  state.allianceWars.forEach(w => {
    if (w.status === "ended") return;
    const a1 = state.alliances.find(a => a.id === w.a1);
    const a2 = state.alliances.find(a => a.id === w.a2);
    const a1Alive = a1?.members.some(id => planetsOf(id).length > 0);
    const a2Alive = a2?.members.some(id => planetsOf(id).length > 0);
    const target = w.targetScore || 100;
    if (!a1 || !a2 || !a1Alive || !a2Alive || w.score1 >= target || w.score2 >= target) {
      w.status = "ended";
      w.endedTurn = state.turn;
      w.winnerAllianceId = !a2Alive || w.score1 >= target ? w.a1 : (!a1Alive || w.score2 >= target ? w.a2 : null);
      const winner = state.alliances.find(a => a.id === w.winnerAllianceId)?.name || "Berabere";
      reportMission("İttifak Savaşı Bitti", `Kazanan: ${winner} · Skor ${w.score1}-${w.score2}`);
    }
  });
}

function saveGame() {
  localStorage.setItem("nova_dominion_save", JSON.stringify(state));
  log("Oyun local storage'a kaydedildi.");
  render();
}

function normalizeLoadedState() {
  state.activePlanetId = state.planets.some(p => p.id === state.activePlanetId && p.ownerId === 0)
    ? state.activePlanetId
    : (planetsOf(0)[0]?.id || null);
  if (!Number.isFinite(state.lastExpeditionTurn)) state.lastExpeditionTurn = -1;
}

function loadGame() {
  const raw = localStorage.getItem("nova_dominion_save");
  if (!raw) return log("Kayıt bulunamadı.");
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    normalizeLoadedState();
    log("Kayıt yüklendi.");
    render();
  } catch {
    log("Kayıt yüklenemedi (bozuk veri).");
  }
}

function exportSave() {
  document.getElementById("saveData").value = JSON.stringify(state);
  log("Save verisi metin alanına aktarıldı.");
}

function importSave() {
  const raw = document.getElementById("saveData").value.trim();
  if (!raw) return log("İçe aktarılacak veri yok.");
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    normalizeLoadedState();
    log("Save verisi içe aktarıldı.");
    render();
  } catch {
    log("JSON hatalı.");
  }
}

function launchFromUI() {
  const fromId = document.getElementById("sourcePlanet").value;
  const toId = document.getElementById("targetPlanet").value;
  const type = document.getElementById("missionType").value;
  const cargo = type === "transport" ? {
    metal: document.getElementById("cargoMetal").value,
    crystal: document.getElementById("cargoCrystal").value,
    deuterium: document.getElementById("cargoDeuterium").value,
  } : undefined;
  log(launchMission(type, fromId, toId, 0, Date.now(), { cargo }));
  render();
}

function maxPlayerPlanets() {
  return maxEmpirePlanets(0);
}

function isColonizable(target) {
  if (!target || target.ownerId !== -1) return false;
  const stationed = Object.values(target.ships).reduce((a, b) => a + b, 0);
  const defenses = Object.values(target.def).reduce((a, b) => a + b, 0);
  return stationed + defenses === 0;
}

function colonize(sourceId, targetId) {
  const srcId = sourceId || (typeof document !== "undefined" ? document.getElementById("sourcePlanet").value : null);
  const dstId = targetId || (typeof document !== "undefined" ? document.getElementById("targetPlanet").value : null);
  const src = state.planets.find(p => p.id === srcId && p.ownerId === 0);
  const target = state.planets.find(p => p.id === dstId);
  if (!src || src.ships.colonyShip <= 0) return log("Koloni gemisi yok.");
  if (planetsOf(0).length >= maxPlayerPlanets()) return log("Koloni sınırı dolu; Astrofizik yükselt.");
  if (!isColonizable(target)) return log("Seçilen hedef boş ve savunmasız bir nötr gezegen olmalı.");
  src.ships.colonyShip -= 1;
  target.ownerId = 0;
  state.activePlanetId = target.id;
  log(`${target.name} kolonize edildi.`);
  render();
  return true;
}

function expedition() {
  const p = activePlanet();
  if (!p) return log("Sefer gönderecek gezegen kalmadı.");
  if (state.lastExpeditionTurn === state.turn) return log("Bu tur sefer hakkını kullandın.");
  if ((p.ships.lightFighter || 0) + (p.ships.cruiser || 0) + (p.ships.battleship || 0) <= 0) return log("Sefer için en az bir savaş gemisi gerekli.");
  const fuel = 1000;
  if (p.resources.deuterium < fuel) return log(`Sefer için ${fuel} deuterium gerekli.`);
  p.resources.deuterium -= fuel;
  state.lastExpeditionTurn = state.turn;
  const x = Math.random();
  if (x < 0.3) {
    const g = { metal: r(2000, 15000), crystal: r(1000, 9000), deuterium: r(800, 6000) };
    RES.forEach(k => p.resources[k] += g[k]);
    log(`Sefer ganimet: M${g.metal} C${g.crystal} D${g.deuterium}`);
  } else if (x < 0.5) {
    p.ships.lightFighter += r(1, 4);
    log("Terk edilmiş filo bulundu.");
  } else if (x < 0.64) {
    p.ships.lightFighter = Math.max(0, p.ships.lightFighter - r(1, 3));
    log("Sefer çatışmaya girdi, kayıp var.");
  } else {
    log("Sefer sakin geçti.");
  }
  render();
  return true;
}

function log(s) {
  state.log.unshift(`[T${state.turn}] ${s}`);
  state.log = state.log.slice(0, 60);
  if (typeof document !== "undefined") {
    const battleLog = document.getElementById("battleLog");
    if (battleLog) battleLog.textContent = state.log.join("\n");
  }
}

function formatCost(cost) {
  return `M ${Math.floor(cost.metal || 0).toLocaleString("tr-TR")} · K ${Math.floor(cost.crystal || 0).toLocaleString("tr-TR")} · D ${Math.floor(cost.deuterium || 0).toLocaleString("tr-TR")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindList(elId, map, onClick, formatter, actionLabel = "İşlem", disabledReason = null) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  Object.keys(map).forEach(k => {
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `<span>${map[k].n}<br><small>${formatter(k)}</small></span><button type="button">${actionLabel}</button>`;
    const button = d.querySelector("button");
    const reason = disabledReason?.(k) || "";
    button.disabled = Boolean(reason);
    if (reason) button.title = reason;
    button.onclick = () => onClick(k);
    el.appendChild(d);
  });
}

function renderGallery() {
  const g = document.getElementById("unitGallery");
  if (g.dataset.rendered === "true") return;
  const cards = [
    { k: "lightFighter", label: "Hafif Avcı" },
    { k: "cruiser", label: "Kruvazör" },
    { k: "titanDreadnought", label: "Titan Dreadnought" },
  ];
  g.innerHTML = cards.map(c => `
    <div class="unit-card">
      <img src="${UNIT_ART[c.k]}" alt="${c.label}" />
      <strong>${c.label}</strong>
      <small>ATK ${SHIPS[c.k].atk} | HP ${SHIPS[c.k].hp}</small>
    </div>
  `).join("");
  g.dataset.rendered = "true";
}

function refreshMissionTargets() {
  if (typeof document === "undefined") return;
  const src = document.getElementById("sourcePlanet");
  const tgt = document.getElementById("targetPlanet");
  const type = document.getElementById("missionType").value;
  const previous = tgt.value;
  const source = state.planets.find(p => p.id === src.value) || activePlanet();
  const query = document.getElementById("targetSearch").value.trim().toLocaleLowerCase("tr-TR");
  const allTargets = missionTargets(type, source?.id, 0);
  const matched = allTargets
    .filter(x => {
      if (!query) return true;
      const owner = x.ownerId === -1 ? "nötr" : (emp(x.ownerId)?.name || "");
      return `${x.name} ${x.coords.join(":")} ${owner}`.toLocaleLowerCase("tr-TR").includes(query);
    })
    .sort((a, b) => (source ? distance(source, a) - distance(source, b) : 0));
  const targets = matched.slice(0, 80);

  tgt.innerHTML = targets.map(x => {
    const owner = x.ownerId === -1 ? "Nötr" : (emp(x.ownerId)?.name || "Bilinmiyor");
    const eta = source ? travelTurns(source, x, 0) : 0;
    return `<option value='${x.id}'>${x.name} [${x.coords.join(":")}] · ${owner} · Güç ${Math.floor(power(x))} · ${eta} tur</option>`;
  }).join("") || "<option value=''>Uygun hedef yok</option>";
  if (targets.some(x => x.id === previous)) tgt.value = previous;
  document.getElementById("targetSummary").textContent = `${targets.length}/${matched.length} hedef gösteriliyor${matched.length > 80 ? " · aramayla daralt" : ""}`;

  const cargoFields = document.getElementById("transportCargoFields");
  cargoFields.hidden = type !== "transport";
  renderTargetPreview();
}

function renderTargetPreview() {
  if (typeof document === "undefined") return;
  const source = state.planets.find(p => p.id === document.getElementById("sourcePlanet").value);
  const target = state.planets.find(p => p.id === document.getElementById("targetPlanet").value);
  const box = document.getElementById("targetPreview");
  if (!source || !target) { box.textContent = "Hedef seçilmedi."; return; }
  const owner = target.ownerId === -1 ? "Nötr" : (emp(target.ownerId)?.name || "Bilinmiyor");
  box.textContent = `${owner} · Güç ${Math.floor(power(target)).toLocaleString("tr-TR")} · Mesafe ${Math.floor(distance(source, target))} · ETA ${travelTurns(source, target, 0)} tur`;
}

function renderMissionPanel(now = Date.now()) {
  if (typeof document === "undefined") return;
  const missions = document.getElementById("missions");
  missions.innerHTML = state.missions.slice(0, 20).map(m => {
    const deadline = m.phase === "returning" ? m.returnEtaMs : m.etaMs;
    const remaining = Number.isFinite(deadline) ? formatCountdown(deadline - now) : "tur bekleniyor";
    const phase = m.phase === "returning" ? "Dönüş" : "Gidiş";
    return `<div class='item'><span>${m.type} · ${phase}</span><small>${remaining} · ${emp(m.ownerId)?.name || "Filo"}</small></div>`;
  }).join("") || "Görev yok";

  const next = state.missions
    .map(m => (m.phase === "returning" ? m.returnEtaMs : m.etaMs) - now)
    .filter(v => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b)[0];
  document.getElementById("missionClock").textContent = next
    ? `En yakın görev: ${formatCountdown(next)}`
    : "Aktif geri sayım yok";
}

function render() {
  if (typeof document === "undefined") return;
  const p = activePlanet();
  const me = emp(0);
  document.getElementById("meta").textContent = `Tur ${state.turn} | Bot ${state.empires.length - 1} | Mission ${state.missions.length}`;
  const gameOver = document.getElementById("gameOver");
  const grid = document.querySelector(".grid");
  if (!p) {
    gameOver.hidden = false;
    grid.inert = true;
    document.getElementById("gameOverText").textContent = `İmparatorluğun ${state.turn}. turda yıkıldı. Kayıttan devam edebilir veya sayfayı yenileyerek yeni oyun başlatabilirsin.`;
    return;
  }
  gameOver.hidden = true;
  grid.inert = false;

  document.getElementById("resources").innerHTML = `<div class='active-world'>Aktif: <strong>${p.name}</strong></div>` + RES.map(k => `<div class='item'><span>${k}</span><strong>${p.resources[k].toLocaleString("tr-TR")}</strong></div>`).join("");
  const planetList = document.getElementById("planets");
  planetList.innerHTML = "";
  planetsOf(0).forEach(x => {
    const row = document.createElement("div");
    row.className = `item planet-row${x.id === p.id ? " selected" : ""}`;
    row.innerHTML = `<span>${x.name} [${x.coords.join(":")}] ${x.moon ? "🌙" : ""}<br><small>Güç ${Math.floor(power(x, 0))}</small></span><button type='button'>${x.id === p.id ? "Aktif" : "Yönet"}</button>`;
    row.querySelector("button").onclick = () => selectActivePlanet(x.id);
    planetList.appendChild(row);
  });

  bindList("buildings", BUILDINGS, buyBuilding, k => `Sv. ${p.b[k]} · ${formatCost(resCost(BUILDINGS[k].b, BUILDINGS[k].f, p.b[k]))}`, "Yükselt");
  bindList("research", RESEARCH, buyResearch, k => `Sv. ${me.research[k]} · ${formatCost(resCost(RESEARCH[k].b, RESEARCH[k].f, me.research[k]))}`, "Araştır");
  bindList(
    "units",
    SHIPS,
    buyShip,
    k => `${p.ships[k]} adet · ${shipRequirementFailure(k, p, me) || formatCost(SHIPS[k].c)}`,
    "Üret",
    k => shipRequirementFailure(k, p, me),
  );
  bindList("defenses", DEF, buyDefense, k => `${p.def[k]} adet · ${formatCost(DEF[k].c)}`, "Kur");
  bindList("officers", OFFICERS, hireOfficer, k => `${me.officers[k] ? "AKTİF" : "Pasif"} · ${OFFICERS[k].bonus}`, "Aktifleştir");

  document.getElementById("market").innerHTML = `
    <div class='item'><span>5000 Metal -> Crystal</span><button id='tradeMC'>Çevir</button></div>
    <div class='item'><span>6000 Metal -> Deuterium</span><button id='tradeMD'>Çevir</button></div>
  `;
  document.getElementById("tradeMC").onclick = () => trade("m2c");
  document.getElementById("tradeMD").onclick = () => trade("m2d");

  const msgBox = document.getElementById("messages");
  msgBox.innerHTML = state.messages.filter(m => m.to === 0 || m.from === 0).slice(0, 20)
    .map(m => `<div class='item'><span>T${m.turn} ${escapeHtml(emp(m.from)?.name || "?")} ➜ ${escapeHtml(emp(m.to)?.name || "?")}</span><small>${escapeHtml(m.content)}</small></div>`).join("");

  renderMissionPanel();

  const ally = me.allianceId ? state.alliances.find(a => a.id === me.allianceId) : null;
  document.getElementById("alliance").innerHTML = ally ? `${escapeHtml(ally.name)}<br>Üyeler: ${ally.members.map(id => escapeHtml(emp(id)?.name || "?")).join(", ")}` : "İttifak yok";

  const src = document.getElementById("sourcePlanet");
  const previousSource = src.value;
  src.innerHTML = planetsOf(0).map(x => `<option value='${x.id}'>${x.name} [${x.coords.join(":")}]</option>`).join("");
  src.value = planetsOf(0).some(x => x.id === previousSource) ? previousSource : p.id;
  refreshMissionTargets();

  document.getElementById("messageTo").innerHTML = state.empires.filter(x => x.id !== 0 && planetsOf(x.id).length).slice(0, 80)
    .map(x => `<option value='${x.id}'>${x.name}</option>`).join("");

  const myAllianceId = me.allianceId;
  document.getElementById("warTargetAlliance").innerHTML = state.alliances
    .filter(a => a.id !== myAllianceId)
    .map(a => `<option value='${a.id}'>${a.name}</option>`).join("") || "<option value=''>Rakip ittifak yok</option>";

  document.getElementById("contractBot").innerHTML = state.empires.filter(x => x.isBot && planetsOf(x.id).length).slice(0, 80)
    .map(x => `<option value='${x.id}'>${x.name}</option>`).join("");

  document.getElementById("wars").innerHTML = state.allianceWars.map(w => {
    const a1 = state.alliances.find(a => a.id === w.a1)?.name || "A1";
    const a2 = state.alliances.find(a => a.id === w.a2)?.name || "A2";
    const status = w.status === "ended" ? "Bitti" : `Hedef ${w.targetScore || 100}`;
    return `<div class='item'><span>${a1} vs ${a2}<br><small>${status} · ${w.battles?.length || 0} çatışma</small></span><strong>${w.score1} - ${w.score2}</strong></div>`;
  }).join("") || "Savaş kaydı yok";

  document.getElementById("contracts").innerHTML = state.tradeContracts.map(c =>
    `<div class='item'><span>${emp(c.with)?.name || "Eski ortak"} · her ${c.everyTurns} tur<br><small>${c.active ? `Aktif · sonraki ${c.nextTurn}. tur · gecikme ${c.missedPayments || 0}/3` : "Pasif"}</small></span>${c.active ? `<button type='button' data-cancel-contract='${c.id}'>İptal</button>` : ""}</div>`
  ).join("") || "Sözleşme yok";
  document.querySelectorAll("[data-cancel-contract]").forEach(button => {
    button.onclick = () => cancelTradeContract(button.dataset.cancelContract);
  });

  document.getElementById("reports").innerHTML = state.missionReports.slice(0, 30).map(rp =>
    `<div class='item'><span>T${rp.turn} ${rp.title}</span><small>${rp.detail}</small></div>`
  ).join("") || "Rapor yok";

  document.getElementById("battleLog").textContent = state.log.join("\n");

  renderGallery();
}

function initStarfield2K() {
  const c = document.getElementById("starfield");
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const stars = [];
  const compact = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frameInterval = 1000 / (compact ? 30 : 45);
  let lastFrame = 0;
  let resizeTimer;

  function resize() {
    const width = window.visualViewport?.width || window.innerWidth;
    const height = window.visualViewport?.height || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.75);
    c.width = Math.max(1, Math.floor(width * dpr));
    c.height = Math.max(1, Math.floor(height * dpr));
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;
    stars.length = 0;
    const density = clamp(Math.floor((width * height) / (compact ? 9000 : 7000)), 36, compact ? 110 : 280);
    for (let i = 0; i < density; i++) stars.push({ x: Math.random() * c.width, y: Math.random() * c.height, z: Math.random() * 2 + 0.2 });
    draw();
  }

  function draw() {
    ctx.fillStyle = "#030715";
    ctx.fillRect(0, 0, c.width, c.height);
    stars.forEach(s => {
      if (!reducedMotion) s.y += s.z * (compact ? 0.32 : 0.5);
      if (s.y > c.height) s.y = 0;
      ctx.fillStyle = `rgba(160,220,255,${0.4 + s.z / 2.5})`;
      ctx.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6);
    });
  }

  function tick(timestamp) {
    if (!document.hidden && timestamp - lastFrame >= frameInterval) {
      draw();
      lastFrame = timestamp;
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });
  window.visualViewport?.addEventListener("resize", resize, { passive: true });
  resize();
  if (!reducedMotion) requestAnimationFrame(tick);
}

function formatCountdown(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function realtimeTicker(now = Date.now()) {
  const changed = processMissions(now);
  if (changed) render();
  else renderMissionPanel(now);
}

function boot() {
  initStarfield2K();
  const compact = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const maxBots = compact ? 120 : 250;
  const fallbackBots = compact ? 50 : 100;
  const requested = Number(prompt(`Bot sayısı (20-${maxBots})`, String(fallbackBots)) || fallbackBots);
  const bots = Number.isFinite(requested) ? clamp(Math.floor(requested), 20, maxBots) : fallbackBots;
  initGame(bots);

  document.getElementById("nextTurn").onclick = nextTurn;
  document.getElementById("launchMissionBtn").onclick = launchFromUI;
  document.getElementById("colonizeBtn").onclick = () => colonize();
  document.getElementById("expeditionBtn").onclick = expedition;
  document.getElementById("sourcePlanet").onchange = refreshMissionTargets;
  document.getElementById("missionType").onchange = refreshMissionTargets;
  document.getElementById("targetSearch").oninput = refreshMissionTargets;
  document.getElementById("targetPlanet").onchange = renderTargetPreview;
  document.getElementById("newGameBtn").onclick = () => location.reload();
  document.getElementById("gameOverLoadBtn").onclick = loadGame;
  document.getElementById("createAllianceBtn").onclick = createAlliance;
  document.getElementById("inviteBotBtn").onclick = inviteBot;
  document.getElementById("sendMessageBtn").onclick = () => sendMessage();
  document.getElementById("declareWarBtn").onclick = declareAllianceWar;
  document.getElementById("createContractBtn").onclick = createTradeContract;
  document.getElementById("saveBtn").onclick = saveGame;
  document.getElementById("loadBtn").onclick = loadGame;
  document.getElementById("exportBtn").onclick = exportSave;
  document.getElementById("importBtn").onclick = importSave;
  document.querySelectorAll("[data-scroll-target]").forEach(button => {
    button.onclick = () => document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
  setInterval(realtimeTicker, 1000);
}

const NOVA_TEST_API = {
  state,
  initGame,
  activePlanet,
  selectActivePlanet,
  playerEliminated,
  allianceOfEmpire,
  sameAlliance,
  activeWarBetween,
  launchMission,
  processMissions,
  missionTargets,
  missionFleet,
  fleetCargoCapacity,
  transportCargo,
  missionReady,
  returnDestination,
  travelTurns,
  resolveCombat,
  recordAllianceBattle,
  maxEmpirePlanets,
  shipRequirementFailure,
  buyBuilding,
  colonize,
  maxPlayerPlanets,
  isColonizable,
  expedition,
  declareAllianceWar,
  sendMessage,
  createTradeContract,
  processTradeContracts,
  cancelTradeContract,
  updateAllianceWarScores,
  power,
};

if (typeof module !== "undefined" && module.exports) module.exports = NOVA_TEST_API;
if (typeof document !== "undefined") boot();
