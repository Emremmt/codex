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

  const names = ["Astra", "Vega", "Orion", "Draco", "Nyx", "Aquila", "Helix", "Sirius"];
  state.empires.forEach(e => {
    const p = mkPlanet(`${names[r(0, names.length - 1)]}-${e.id}`, e.id, false);
    p.ships.lightFighter = 18;
    p.ships.colonyShip = 1;
    p.ships.recycler = 1;
    p.def.rocket = 16;
    state.planets.push(p);
  });
  for (let i = 0; i < botCount * 2; i++) {
    const p = mkPlanet(`${names[r(0, names.length - 1)]}-N${i}`, -1, true);
    p.ships.lightFighter = r(0, 20);
    p.def.rocket = r(0, 20);
    state.planets.push(p);
  }
}

const emp = id => state.empires.find(x => x.id === id);
const planetsOf = id => state.planets.filter(p => p.ownerId === id);

function tech(id) {
  const t = emp(id)?.research || {};
  return {
    atk: 1 + 0.1 * (t.weapons || 0) + 0.03 * (t.quantumAI || 0),
    hp: 1 + 0.1 * (t.armor || 0) + 0.02 * (t.orbitalFabrication || 0),
    def: 1 + 0.1 * (t.shielding || 0),
    speed: 1 + 0.08 * (t.impulse || 0),
  };
}

function officerMul(id) {
  const o = emp(id).officers;
  return {
    eco: o.commander ? 1.1 : 1,
    shipAtk: o.admiral ? 1.08 : 1,
    defHp: o.engineer ? 1.12 : 1,
  };
}

function ecoTick(p) {
  const mm = p.b.metalMine, cm = p.b.crystalMine, ds = p.b.deuteriumSynth, sp = p.b.solarPlant;
  const owner = p.ownerId >= 0 ? p.ownerId : 0;
  const mul = officerMul(owner).eco;
  const energy = 25 * Math.pow(sp, 1.2);
  const used = 10 * mm + 10 * cm + 20 * ds;
  const ratio = clamp(energy / Math.max(1, used), 0.3, 1);
  p.resources.metal += Math.floor(45 * Math.pow(mm, 1.17) * ratio * mul);
  p.resources.crystal += Math.floor(30 * Math.pow(cm, 1.17) * ratio * mul);
  p.resources.deuterium += Math.floor(18 * Math.pow(ds, 1.15) * ratio * mul);
}

function power(p, owner = p.ownerId) {
  const t = owner >= 0 ? tech(owner) : { atk: 1, hp: 1, def: 1 };
  const of = owner >= 0 ? officerMul(owner) : { shipAtk: 1, defHp: 1 };
  let atk = 0, hp = 0;
  Object.entries(p.ships).forEach(([k, v]) => { atk += v * SHIPS[k].atk * of.shipAtk; hp += v * SHIPS[k].hp; });
  Object.entries(p.def).forEach(([k, v]) => { atk += v * DEF[k].atk; hp += v * DEF[k].hp * of.defHp; });
  return atk * t.atk + hp * t.hp * (0.7 + 0.3 * t.def) * 0.2;
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

function launchMission(type, fromId, toId, ownerId, now = Date.now()) {
  const from = state.planets.find(p => p.id === fromId);
  const to = state.planets.find(p => p.id === toId);
  if (!from || !to || from.ownerId !== ownerId) return "Görev başlatılamadı.";
  if (!["attack", "espionage", "transport", "recycle"].includes(type)) return "Geçersiz görev türü.";

  const fleet = {};
  Object.keys(from.ships).forEach(k => {
    fleet[k] = Math.floor(from.ships[k] * 0.55);
    from.ships[k] -= fleet[k];
  });
  if (Object.values(fleet).reduce((a, b) => a + b, 0) <= 0) return "Gönderilecek filo yok.";

  const eta = state.turn + travelTurns(from, to, ownerId);
  const durationSec = travelTurns(from, to, ownerId) * 25;
  state.missions.push({
    id: crypto.randomUUID(),
    type,
    ownerId,
    fromId,
    toId,
    fleet,
    cargo: { metal: 0, crystal: 0, deuterium: 0 },
    phase: "outbound",
    eta,
    etaMs: now + durationSec * 1000,
    returnEta: null,
    returnEtaMs: null,
    done: false,
  });
  return `Görev çıktı: ${type}, varış turu ${eta}`;
}

function resolveCombat(attackerId, target, fleet) {
  const attackerTech = tech(attackerId);
  const defTech = target.ownerId >= 0 ? tech(target.ownerId) : { atk: 1, hp: 1, def: 1 };
  let atk = 0, atkHp = 0;
  Object.entries(fleet).forEach(([k, v]) => { atk += v * SHIPS[k].atk; atkHp += v * SHIPS[k].hp; });

  let defAtk = 0, defHp = 0;
  Object.entries(target.ships).forEach(([k, v]) => { defAtk += v * SHIPS[k].atk; defHp += v * SHIPS[k].hp; });
  Object.entries(target.def).forEach(([k, v]) => { defAtk += v * DEF[k].atk; defHp += v * DEF[k].hp; });

  let ap = atkHp * attackerTech.hp;
  let dp = defHp * defTech.hp;
  for (let i = 0; i < 7; i++) {
    dp -= (atk * attackerTech.atk) * (0.82 + Math.random() * 0.32);
    ap -= (defAtk * defTech.atk) * (0.82 + Math.random() * 0.32);
    if (ap <= 0 || dp <= 0) break;
  }

  const win = ap > dp;
  if (win) {
    const surv = clamp(ap / Math.max(1, atkHp), 0.1, 0.86);
    const cargo = Object.entries(fleet).reduce((a, [k, v]) => a + v * SHIPS[k].cargo, 0) * surv;
    const totalLoot = Math.floor(Math.min(cargo, (target.resources.metal + target.resources.crystal + target.resources.deuterium) * 0.45));
    const loot = {
      metal: Math.min(target.resources.metal, Math.floor(totalLoot * 0.5)),
      crystal: Math.min(target.resources.crystal, Math.floor(totalLoot * 0.3)),
      deuterium: Math.min(target.resources.deuterium, Math.floor(totalLoot * 0.2)),
    };
    RES.forEach(k => target.resources[k] -= loot[k]);
    if (Math.random() < 0.3) {
      target.ownerId = attackerId;
      Object.keys(target.ships).forEach(k => target.ships[k] = Math.floor(target.ships[k] * 0.25));
      Object.keys(target.def).forEach(k => target.def[k] = Math.floor(target.def[k] * 0.5));
    }
    if (!target.moon && Math.random() < 0.18) target.moon = true;
    return { win: true, loot, survivor: surv };
  }

  Object.keys(target.ships).forEach(k => target.ships[k] = Math.floor(target.ships[k] * 0.94));
  Object.keys(target.def).forEach(k => target.def[k] = Math.floor(target.def[k] * 0.97));
  return { win: false, loot: { metal: 0, crystal: 0, deuterium: 0 }, survivor: 0.15 };
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
    if (!from || !to || from.ownerId !== m.ownerId) {
      m.done = true;
      reportMission(`Görev İptal (${m.type})`, "Kaynak veya hedef gezegen artık geçerli olmadığı için görev iptal edildi.");
      return;
    }

    if (m.phase === "outbound") {
      if (m.type === "attack") {
        const res = resolveCombat(m.ownerId, to, m.fleet);
        m.cargo = { ...res.loot };
        Object.keys(m.fleet).forEach(k => m.fleet[k] = Math.floor(m.fleet[k] * res.survivor));
        state.log.unshift(`[T${state.turn}] Savaş sonucu: ${res.win ? "Zafer" : "Yenilgi"}.`);
        state.missionReports.unshift({
          turn: state.turn,
          title: `Savaş Raporu: ${to.name}`,
          detail: `${res.win ? "Zafer" : "Yenilgi"} | Yağma M:${res.loot.metal} C:${res.loot.crystal} D:${res.loot.deuterium}`,
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
        const take = { metal: 2500, crystal: 1500, deuterium: 800 };
        const src = from.resources;
        const real = { metal: Math.min(src.metal, take.metal), crystal: Math.min(src.crystal, take.crystal), deuterium: Math.min(src.deuterium, take.deuterium) };
        RES.forEach(k => { src[k] -= real[k]; to.resources[k] += real[k]; });
        state.missionReports.unshift({
          turn: state.turn,
          title: `Taşıma Raporu`,
          detail: `${from.name} -> ${to.name} | M:${real.metal} C:${real.crystal} D:${real.deuterium}`,
        });
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

    const sk = Object.keys(SHIPS)[r(0, 4)];
    if (pay(p.resources, SHIPS[sk].c)) p.ships[sk] += 1;

    if (Math.random() < 0.2) {
      const t = state.planets.filter(x => x.ownerId !== e.id).sort((a, b) => power(a) - power(b))[0];
      if (t && power(p, e.id) > power(t) * 1.2) launchMission("attack", p.id, t.id, e.id);
    }
  });
}

function nextTurn() {
  state.planets.forEach(ecoTick);
  state.empires.filter(x => x.isBot && planetsOf(x.id).length).forEach(botTurn);
  processMissions();
  processTradeContracts();
  updateAllianceWarScores();
  state.turn++;
  render();
}

function buyBuilding(key) {
  const p = planetsOf(0)[0];
  const c = resCost(BUILDINGS[key].b, BUILDINGS[key].f, p.b[key]);
  if (pay(p.resources, c)) { p.b[key]++; log(`${BUILDINGS[key].n} ${p.b[key]} oldu.`); }
  else log("Kaynak yetmedi.");
  render();
}

function buyResearch(key) {
  const p = planetsOf(0)[0];
  const e = emp(0);
  if (p.b.lab < 2) return log("Lab seviye 2 olmalı.");
  const c = resCost(RESEARCH[key].b, RESEARCH[key].f, e.research[key]);
  if (pay(p.resources, c)) { e.research[key]++; log(`${RESEARCH[key].n} araştırıldı.`); }
  else log("Kaynak yetmedi.");
  render();
}

function buyShip(key) {
  const p = planetsOf(0)[0];
  const e = emp(0);
  if (SHIPS[key].unique && e.uniqueBuilt[key]) return log("Unique ünite bir kez üretilebilir.");
  if (pay(p.resources, SHIPS[key].c)) {
    p.ships[key] += 1;
    if (SHIPS[key].unique) e.uniqueBuilt[key] = true;
    log(`${SHIPS[key].n} üretildi.`);
  } else log("Kaynak yetmedi.");
  render();
}

function buyDefense(key) {
  const p = planetsOf(0)[0];
  if (pay(p.resources, DEF[key].c)) { p.def[key] += 1; log(`${DEF[key].n} kuruldu.`); }
  else log("Kaynak yetmedi.");
  render();
}

function hireOfficer(k) {
  const p = planetsOf(0)[0];
  const e = emp(0);
  if (e.officers[k]) return log("Officer zaten aktif.");
  if (pay(p.resources, OFFICERS[k].c)) { e.officers[k] = true; log(`${OFFICERS[k].n} aktif edildi.`); }
  else log("Kaynak yetmedi.");
  render();
}

function trade(mode) {
  const p = planetsOf(0)[0];
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
  const name = prompt("İttifak adı?", "NovaGuard");
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

function sendMessage() {
  const to = Number(document.getElementById("messageTo").value);
  const content = document.getElementById("messageInput").value.trim();
  if (!content) return;
  state.messages.unshift({ from: 0, to, content, turn: state.turn });
  document.getElementById("messageInput").value = "";
  log("Mesaj gönderildi.");
  render();
}

function declareAllianceWar() {
  const me = emp(0);
  if (!me.allianceId) return log("Savaş ilanı için ittifak gerekli.");
  const targetId = document.getElementById("warTargetAlliance").value;
  if (!targetId) return log("Rakip ittifak seç.");
  const exists = state.allianceWars.find(w =>
    (w.a1 === me.allianceId && w.a2 === targetId) || (w.a1 === targetId && w.a2 === me.allianceId)
  );
  if (exists) return log("Bu ittifakla zaten savaş var.");
  state.allianceWars.push({ id: crypto.randomUUID(), a1: me.allianceId, a2: targetId, startedTurn: state.turn, score1: 0, score2: 0 });
  log("İttifak savaşı ilan edildi.");
  render();
}

function createTradeContract() {
  const botId = Number(document.getElementById("contractBot").value);
  if (!botId) return;
  const c = {
    id: crypto.randomUUID(),
    with: botId,
    give: { metal: 12000, crystal: 0, deuterium: 0 },
    take: { metal: 0, crystal: 6000, deuterium: 1800 },
    everyTurns: 3,
    nextTurn: state.turn + 1,
    active: true,
  };
  state.tradeContracts.push(c);
  log(`${emp(botId).name} ile ticaret sözleşmesi kuruldu.`);
  render();
}

function processTradeContracts() {
  const home = planetsOf(0)[0];
  state.tradeContracts.forEach(c => {
    if (!c.active || state.turn < c.nextTurn) return;
    if (can(home.resources, c.give)) {
      RES.forEach(k => {
        home.resources[k] -= c.give[k];
        home.resources[k] += c.take[k];
      });
      state.missionReports.unshift({
        turn: state.turn,
        title: "Ticaret Sözleşmesi",
        detail: `${emp(c.with)?.name} ile otomatik takas tamamlandı.`,
      });
      c.nextTurn += c.everyTurns;
    } else {
      c.active = false;
      state.missionReports.unshift({
        turn: state.turn,
        title: "Ticaret Sözleşmesi Durdu",
        detail: "Yetersiz kaynak nedeniyle sözleşme pasif oldu.",
      });
    }
  });
}

function updateAllianceWarScores() {
  state.allianceWars.forEach(w => {
    const a1 = state.alliances.find(a => a.id === w.a1);
    const a2 = state.alliances.find(a => a.id === w.a2);
    if (!a1 || !a2) return;
    const p1 = a1.members.flatMap(id => planetsOf(id));
    const p2 = a2.members.flatMap(id => planetsOf(id));
    w.score1 = Math.floor(p1.reduce((s, p) => s + power(p, p.ownerId), 0) / 1000);
    w.score2 = Math.floor(p2.reduce((s, p) => s + power(p, p.ownerId), 0) / 1000);
  });
}

function saveGame() {
  localStorage.setItem("nova_dominion_save", JSON.stringify(state));
  log("Oyun local storage'a kaydedildi.");
  render();
}

function loadGame() {
  const raw = localStorage.getItem("nova_dominion_save");
  if (!raw) return log("Kayıt bulunamadı.");
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
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
  log(launchMission(type, fromId, toId, 0));
  render();
}

function colonize() {
  const src = state.planets.find(p => p.id === document.getElementById("sourcePlanet").value);
  if (!src || src.ships.colonyShip <= 0) return log("Koloni gemisi yok.");
  const limit = 1 + Math.floor(emp(0).research.astrophysics / 2);
  if (planetsOf(0).length > limit) return log("Astrofizik yükselt.");
  const target = state.planets.find(p => p.ownerId === -1);
  if (!target) return log("Boş gezegen yok.");
  src.ships.colonyShip -= 1;
  target.ownerId = 0;
  log(`${target.name} kolonize edildi.`);
  render();
}

function expedition() {
  const p = planetsOf(0)[0];
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
}

function log(s) {
  state.log.unshift(`[T${state.turn}] ${s}`);
  state.log = state.log.slice(0, 60);
}

function bindList(elId, map, onClick, formatter) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  Object.keys(map).forEach(k => {
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `<span>${map[k].n}<br><small>${formatter(k)}</small></span><button>İşlem</button>`;
    d.querySelector("button").onclick = () => onClick(k);
    el.appendChild(d);
  });
}

function renderGallery() {
  const g = document.getElementById("unitGallery");
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
}

function render() {
  const p = planetsOf(0)[0];
  const me = emp(0);
  document.getElementById("meta").textContent = `Tur ${state.turn} | Bot ${state.empires.length - 1} | Mission ${state.missions.length}`;

  document.getElementById("resources").innerHTML = RES.map(k => `<div class='item'><span>${k}</span><strong>${p.resources[k].toLocaleString("tr-TR")}</strong></div>`).join("");
  document.getElementById("planets").innerHTML = planetsOf(0).map(x => `<div class='item'><span>${x.name} [${x.coords.join(":")}] ${x.moon ? "🌙" : ""}</span><small>Güç ${Math.floor(power(x, 0))}</small></div>`).join("");

  bindList("buildings", BUILDINGS, buyBuilding, k => `Lv ${p.b[k]} | ${JSON.stringify(resCost(BUILDINGS[k].b, BUILDINGS[k].f, p.b[k]))}`);
  bindList("research", RESEARCH, buyResearch, k => `Lv ${me.research[k]} | ${JSON.stringify(resCost(RESEARCH[k].b, RESEARCH[k].f, me.research[k]))}`);
  bindList("units", SHIPS, buyShip, k => `${p.ships[k]} | M${SHIPS[k].c.metal} C${SHIPS[k].c.crystal} D${SHIPS[k].c.deuterium}`);
  bindList("defenses", DEF, buyDefense, k => `${p.def[k]} | M${DEF[k].c.metal} C${DEF[k].c.crystal} D${DEF[k].c.deuterium}`);
  bindList("officers", OFFICERS, hireOfficer, k => `${me.officers[k] ? "AKTİF" : "Pasif"} | ${OFFICERS[k].bonus}`);

  document.getElementById("market").innerHTML = `
    <div class='item'><span>5000 Metal -> Crystal</span><button id='tradeMC'>Çevir</button></div>
    <div class='item'><span>6000 Metal -> Deuterium</span><button id='tradeMD'>Çevir</button></div>
  `;
  document.getElementById("tradeMC").onclick = () => trade("m2c");
  document.getElementById("tradeMD").onclick = () => trade("m2d");

  const msgBox = document.getElementById("messages");
  msgBox.innerHTML = state.messages.filter(m => m.to === 0 || m.from === 0).slice(0, 20)
    .map(m => `<div class='item'><span>T${m.turn} ${emp(m.from)?.name} ➜ ${emp(m.to)?.name}</span><small>${m.content}</small></div>`).join("");

  document.getElementById("missions").innerHTML = state.missions.slice(0, 20)
    .map(m => `<div class='item'><span>${m.type} ETA:${m.eta}${m.returnEta ? " / dönüş:" + m.returnEta : ""}</span><small>${emp(m.ownerId)?.name}</small></div>`).join("") || "Görev yok";

  const ally = me.allianceId ? state.alliances.find(a => a.id === me.allianceId) : null;
  document.getElementById("alliance").innerHTML = ally ? `${ally.name}<br>Üyeler: ${ally.members.map(id => emp(id).name).join(", ")}` : "İttifak yok";

  const src = document.getElementById("sourcePlanet");
  const tgt = document.getElementById("targetPlanet");
  src.innerHTML = planetsOf(0).map(x => `<option value='${x.id}'>${x.name} [${x.coords.join(":")}]</option>`).join("");
  tgt.innerHTML = state.planets.filter(x => x.ownerId !== 0).slice(0, 100)
    .map(x => `<option value='${x.id}'>${x.name} - ${x.ownerId === -1 ? "Nötr" : emp(x.ownerId).name}</option>`).join("");

  document.getElementById("messageTo").innerHTML = state.empires.filter(x => x.id !== 0).slice(0, 80)
    .map(x => `<option value='${x.id}'>${x.name}</option>`).join("");

  const myAllianceId = me.allianceId;
  document.getElementById("warTargetAlliance").innerHTML = state.alliances
    .filter(a => a.id !== myAllianceId)
    .map(a => `<option value='${a.id}'>${a.name}</option>`).join("") || "<option value=''>Rakip ittifak yok</option>";

  document.getElementById("contractBot").innerHTML = state.empires.filter(x => x.isBot).slice(0, 80)
    .map(x => `<option value='${x.id}'>${x.name}</option>`).join("");

  document.getElementById("wars").innerHTML = state.allianceWars.map(w => {
    const a1 = state.alliances.find(a => a.id === w.a1)?.name || "A1";
    const a2 = state.alliances.find(a => a.id === w.a2)?.name || "A2";
    return `<div class='item'><span>${a1} vs ${a2}</span><small>${w.score1} - ${w.score2}</small></div>`;
  }).join("") || "Aktif savaş yok";

  document.getElementById("contracts").innerHTML = state.tradeContracts.map(c =>
    `<div class='item'><span>${emp(c.with)?.name} | her ${c.everyTurns} tur</span><small>${c.active ? "aktif" : "pasif"} / sonraki:${c.nextTurn}</small></div>`
  ).join("") || "Sözleşme yok";

  document.getElementById("reports").innerHTML = state.missionReports.slice(0, 30).map(rp =>
    `<div class='item'><span>T${rp.turn} ${rp.title}</span><small>${rp.detail}</small></div>`
  ).join("") || "Rapor yok";

  document.getElementById("battleLog").textContent = state.log.join("\n");

  renderGallery();
}

function initStarfield2K() {
  const c = document.getElementById("starfield");
  const ctx = c.getContext("2d");
  const stars = [];

  function resize() {
    c.width = Math.max(2048, window.innerWidth);
    c.height = Math.max(1152, window.innerHeight);
    stars.length = 0;
    const density = Math.floor((c.width * c.height) / 7000);
    for (let i = 0; i < density; i++) stars.push({ x: Math.random() * c.width, y: Math.random() * c.height, z: Math.random() * 2 + 0.2 });
  }
  window.addEventListener("resize", resize);
  resize();

  function tick() {
    ctx.fillStyle = "#030715";
    ctx.fillRect(0, 0, c.width, c.height);
    stars.forEach(s => {
      s.y += s.z * 0.5;
      if (s.y > c.height) s.y = 0;
      ctx.fillStyle = `rgba(160,220,255,${0.4 + s.z / 2.5})`;
      ctx.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6);
    });
    requestAnimationFrame(tick);
  }
  tick();
}

function formatCountdown(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function realtimeTicker(now = Date.now()) {
  processMissions(now);
  const missionClock = document.getElementById("missionClock");
  const next = state.missions
    .map(m => (m.returnEtaMs || m.etaMs || 0) - now)
    .filter(v => v > 0)
    .sort((a, b) => a - b)[0];
  missionClock.textContent = next ? `En yakın görev tamamlanma: ${formatCountdown(next)}` : "Aktif geri sayım yok";
  render();
}

function boot() {
  initStarfield2K();
  const bots = Number(prompt("Bot sayısı (20-250)", "100") || 100);
  initGame(clamp(bots, 20, 250));

  document.getElementById("nextTurn").onclick = nextTurn;
  document.getElementById("launchMissionBtn").onclick = launchFromUI;
  document.getElementById("colonizeBtn").onclick = colonize;
  document.getElementById("expeditionBtn").onclick = expedition;
  document.getElementById("createAllianceBtn").onclick = createAlliance;
  document.getElementById("inviteBotBtn").onclick = inviteBot;
  document.getElementById("sendMessageBtn").onclick = sendMessage;
  document.getElementById("declareWarBtn").onclick = declareAllianceWar;
  document.getElementById("createContractBtn").onclick = createTradeContract;
  document.getElementById("saveBtn").onclick = saveGame;
  document.getElementById("loadBtn").onclick = loadGame;
  document.getElementById("exportBtn").onclick = exportSave;
  document.getElementById("importBtn").onclick = importSave;

  render();
  setInterval(realtimeTicker, 1000);
}

const NOVA_TEST_API = {
  state,
  initGame,
  launchMission,
  processMissions,
  missionReady,
  returnDestination,
  travelTurns,
  resolveCombat,
};

if (typeof module !== "undefined" && module.exports) module.exports = NOVA_TEST_API;
if (typeof document !== "undefined") boot();
