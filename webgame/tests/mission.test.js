const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../app.js");

function withFixedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test("realtime ETA completes outbound and return legs without advancing turns", () => {
  withFixedRandom(0.9, () => {
    game.initGame(2);
    const source = game.state.planets.find(p => p.ownerId === 0);
    const target = game.state.planets.find(p => p.ownerId === 1);
    source.ships.probe = 1;
    const initialFleet = { ...source.ships };

    assert.match(game.launchMission("espionage", source.id, target.id, 0, 1_000), /Görev çıktı/);
    const mission = game.state.missions[0];

    game.processMissions(mission.etaMs);
    assert.equal(mission.phase, "returning");
    assert.equal(game.state.turn, 1);

    game.processMissions(mission.returnEtaMs);
    assert.equal(game.state.missions.length, 0);
    assert.deepEqual(source.ships, initialFleet);
  });
});

test("attack loot returns to the selected source colony", () => {
  withFixedRandom(0.9, () => {
    game.initGame(2);
    const home = game.state.planets.find(p => p.ownerId === 0);
    const source = game.state.planets.find(p => p.ownerId === -1);
    const target = game.state.planets.find(p => p.ownerId === 1);
    source.ownerId = 0;
    Object.keys(source.ships).forEach(k => { source.ships[k] = 0; });
    source.ships.lightFighter = 1_000;
    Object.keys(target.ships).forEach(k => { target.ships[k] = 0; });
    Object.keys(target.def).forEach(k => { target.def[k] = 0; });
    target.resources = { metal: 10_000, crystal: 8_000, deuterium: 6_000 };
    const homeBefore = { ...home.resources };
    const sourceBefore = { ...source.resources };

    game.launchMission("attack", source.id, target.id, 0, 5_000);
    const mission = game.state.missions[0];
    game.processMissions(mission.etaMs);
    const loot = { ...mission.cargo };

    assert.ok(loot.metal + loot.crystal + loot.deuterium > 0);
    assert.deepEqual(home.resources, homeBefore);
    assert.deepEqual(source.resources, sourceBefore);

    game.processMissions(mission.returnEtaMs);
    assert.deepEqual(home.resources, homeBefore);
    assert.equal(source.resources.metal, sourceBefore.metal + loot.metal);
    assert.equal(source.resources.crystal, sourceBefore.crystal + loot.crystal);
    assert.equal(source.resources.deuterium, sourceBefore.deuterium + loot.deuterium);
  });
});

test("mission processing does not crash after the owner loses every planet", () => {
  game.initGame(2);
  const source = game.state.planets.find(p => p.ownerId === 0);
  const target = game.state.planets.find(p => p.ownerId === -1);
  source.ships.recycler = 2;

  game.launchMission("recycle", source.id, target.id, 0, 10_000);
  const mission = game.state.missions[0];
  game.state.planets.filter(p => p.ownerId === 0).forEach(p => { p.ownerId = 1; });

  assert.doesNotThrow(() => game.processMissions(mission.etaMs));
  assert.equal(mission.phase, "returning");
  assert.doesNotThrow(() => game.processMissions(mission.returnEtaMs));
  assert.equal(game.state.missions.length, 0);
  assert.match(game.state.missionReports[0].title, /Filo Kaybı/);
});

test("legacy returning missions honor returnEtaMs", () => {
  withFixedRandom(0.9, () => {
    game.initGame(2);
    const source = game.state.planets.find(p => p.ownerId === 0);
    const target = game.state.planets.find(p => p.ownerId === 1);
    source.ships.probe = 1;
    game.launchMission("espionage", source.id, target.id, 0, 1_000);
    const mission = game.state.missions[0];
    game.processMissions(mission.etaMs);
    const returnAt = mission.returnEtaMs;
    delete mission.phase;
    delete mission.cargo;
    mission.returnEta = 999;

    game.processMissions(returnAt);
    assert.equal(game.state.missions.length, 0);
  });
});
