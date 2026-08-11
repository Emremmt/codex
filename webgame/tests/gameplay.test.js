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

function clearForColonization(planet) {
  Object.keys(planet.ships).forEach(k => { planet.ships[k] = 0; });
  Object.keys(planet.def).forEach(k => { planet.def[k] = 0; });
}

test("production actions use the selected colony", () => {
  game.initGame(2);
  const home = game.state.planets.find(p => p.ownerId === 0);
  const colony = game.state.planets.find(p => p.ownerId === -1);
  colony.ownerId = 0;
  colony.resources = { metal: 100_000, crystal: 100_000, deuterium: 100_000 };
  const homeLevel = home.b.metalMine;
  const colonyLevel = colony.b.metalMine;

  assert.equal(game.selectActivePlanet(colony.id), true);
  game.buyBuilding("metalMine");

  assert.equal(home.b.metalMine, homeLevel);
  assert.equal(colony.b.metalMine, colonyLevel + 1);
});

test("transport reserves cargo at launch and delivers it only to an owned colony", () => {
  game.initGame(2);
  const source = game.state.planets.find(p => p.ownerId === 0);
  const target = game.state.planets.find(p => p.ownerId === -1);
  target.ownerId = 0;
  source.ships.lightFighter = 200;
  const cargo = { metal: 2_000, crystal: 1_000, deuterium: 500 };
  const sourceBefore = { ...source.resources };
  const targetBefore = { ...target.resources };

  assert.match(game.launchMission("transport", source.id, target.id, 0, 2_000, { cargo }), /Görev çıktı/);
  const mission = game.state.missions[0];
  assert.equal(source.resources.metal, sourceBefore.metal - cargo.metal);
  assert.equal(source.resources.crystal, sourceBefore.crystal - cargo.crystal);
  assert.equal(source.resources.deuterium, sourceBefore.deuterium - cargo.deuterium);

  game.processMissions(mission.etaMs);
  assert.equal(target.resources.metal, targetBefore.metal + cargo.metal);
  assert.equal(target.resources.crystal, targetBefore.crystal + cargo.crystal);
  assert.equal(target.resources.deuterium, targetBefore.deuterium + cargo.deuterium);
  assert.deepEqual(mission.cargo, { metal: 0, crystal: 0, deuterium: 0 });

  game.processMissions(mission.returnEtaMs);
  assert.equal(game.state.missions.length, 0);
});

test("mission targets respect transport ownership rules", () => {
  game.initGame(2);
  const source = game.state.planets.find(p => p.ownerId === 0);
  const colony = game.state.planets.find(p => p.ownerId === -1);
  colony.ownerId = 0;

  assert.deepEqual(game.missionTargets("transport", source.id).map(p => p.id), [colony.id]);
  assert.ok(game.missionTargets("attack", source.id).every(p => p.ownerId !== 0));
});

test("colonization uses the selected empty target and enforces Astrophysics capacity", () => {
  game.initGame(2);
  const source = game.state.planets.find(p => p.ownerId === 0);
  const neutrals = game.state.planets.filter(p => p.ownerId === -1);
  const skipped = neutrals[0];
  const selected = neutrals[1];
  clearForColonization(selected);
  clearForColonization(skipped);
  game.state.empires[0].research.astrophysics = 1;

  assert.equal(game.maxPlayerPlanets(), 2);
  assert.equal(game.colonize(source.id, selected.id), true);
  assert.equal(selected.ownerId, 0);
  assert.equal(skipped.ownerId, -1);
  assert.equal(game.state.activePlanetId, selected.id);

  source.ships.colonyShip = 1;
  game.colonize(source.id, skipped.id);
  assert.equal(skipped.ownerId, -1);
});

test("expedition costs fuel and can run only once per turn", () => {
  withFixedRandom(0.99, () => {
    game.initGame(2);
    const source = game.activePlanet();
    const before = source.resources.deuterium;

    assert.equal(game.expedition(), true);
    assert.equal(source.resources.deuterium, before - 1_000);
    game.expedition();
    assert.equal(source.resources.deuterium, before - 1_000);

    game.state.turn += 1;
    assert.equal(game.expedition(), true);
    assert.equal(source.resources.deuterium, before - 2_000);
  });
});

test("player elimination is represented without dereferencing a missing homeworld", () => {
  game.initGame(2);
  game.state.planets.filter(p => p.ownerId === 0).forEach(p => { p.ownerId = 1; });
  assert.equal(game.playerEliminated(), true);
  assert.equal(game.activePlanet(), null);
});
