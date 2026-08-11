const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../app.js");

function snapshot() {
  return JSON.parse(JSON.stringify(game.state));
}

test("versioned saves round-trip without exposing unknown top-level data", () => {
  game.initGame(4);
  const source = game.state.planets.find(planet => planet.ownerId === 0);
  const target = game.state.planets.find(planet => planet.ownerId === 1);
  source.ships.probe = 2;
  game.state.turn = 9;
  assert.match(game.launchMission("espionage", source.id, target.id, 0, 5_000), /Görev çıktı/);
  const save = snapshot();
  save.injected = "ignored";

  game.initGame(2);
  game.restoreState(save);

  assert.equal(game.state.version, 2);
  assert.equal(game.state.turn, 9);
  assert.equal(game.state.activePlanetId, source.id);
  assert.equal(game.state.missions.length, 1);
  assert.equal(game.state.missions[0].returnEta, null);
  assert.equal(game.state.injected, undefined);
});

test("legacy saves migrate mission and newly introduced fields", () => {
  game.initGame(3);
  const source = game.state.planets.find(planet => planet.ownerId === 0);
  const target = game.state.planets.find(planet => planet.ownerId === 1);
  source.ships.probe = 1;
  game.launchMission("espionage", source.id, target.id, 0, 1_000);
  const legacy = snapshot();
  delete legacy.version;
  delete legacy.activePlanetId;
  delete legacy.lastExpeditionTurn;
  delete legacy.missions[0].phase;
  delete legacy.missions[0].cargo;
  legacy.missions[0].returnEta = 8;
  legacy.missions[0].returnEtaMs = 12_000;
  delete legacy.tradeContracts;
  delete legacy.messages;

  game.restoreState(legacy);

  assert.equal(game.state.version, 2);
  assert.equal(game.state.activePlanetId, source.id);
  assert.equal(game.state.lastExpeditionTurn, -1);
  assert.equal(game.state.missions[0].phase, "returning");
  assert.deepEqual(game.state.missions[0].cargo, { metal: 0, crystal: 0, deuterium: 0 });
  assert.deepEqual(game.state.tradeContracts, []);
  assert.deepEqual(game.state.messages, []);
});

test("save restoration clamps unsafe values and neutralizes unknown owners", () => {
  game.initGame(2);
  const save = snapshot();
  const neutral = save.planets.find(planet => planet.ownerId === -1);
  neutral.ownerId = 9_999;
  neutral.resources = { metal: -20, crystal: "12.9", deuterium: Infinity };
  neutral.coords = [0, 900, "invalid"];
  save.market = { metalToCrystal: Infinity, metalToDeut: -5 };

  game.restoreState(save);
  const restored = game.state.planets.find(planet => planet.id === neutral.id);

  assert.equal(restored.ownerId, -1);
  assert.deepEqual(restored.resources, { metal: 0, crystal: 12, deuterium: 0 });
  assert.deepEqual(restored.coords, [1, 499, 1]);
  assert.deepEqual(game.state.market, { metalToCrystal: 1.4, metalToDeut: 0.1 });
});

test("invalid save structures are rejected before replacing live state", () => {
  game.initGame(2);
  const originalTurn = game.state.turn;
  const duplicate = snapshot();
  duplicate.planets[1].id = duplicate.planets[0].id;

  assert.throws(() => game.restoreState(null), /Geçersiz kayıt şeması/);
  assert.throws(() => game.restoreState({ empires: [], planets: [] }), /Oyuncu imparatorluğu eksik/);
  assert.throws(() => game.restoreState(duplicate), /benzersiz değil/);
  assert.equal(game.state.turn, originalTurn);
});

test("imported save identifiers cannot inject markup into rendered attributes", () => {
  game.initGame(2);
  const save = snapshot();
  const unsafeId = `planet' autofocus onfocus='alert(1)`;
  save.planets[1].id = unsafeId;

  game.restoreState(save);
  const restored = game.state.planets[1];

  assert.notEqual(restored.id, unsafeId);
  assert.match(restored.id, /^[0-9a-f-]{36}$/i);
});
