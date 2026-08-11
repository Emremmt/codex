const test = require("node:test");
const assert = require("node:assert/strict");

const game = require("../app.js");

function emptyFleet() {
  const ships = game.state.planets[0].ships;
  return Object.fromEntries(Object.keys(ships).map(k => [k, 0]));
}

test("combat applies real defender casualties and bounded attacker survival", () => {
  game.initGame(6);
  const target = game.state.planets.find(p => p.ownerId === 1);
  Object.keys(target.ships).forEach(k => { target.ships[k] = 0; });
  Object.keys(target.def).forEach(k => { target.def[k] = 0; });
  target.ships.lightFighter = 100;
  target.def.rocket = 100;
  target.resources = { metal: 100_000, crystal: 80_000, deuterium: 50_000 };
  const fleet = emptyFleet();
  fleet.lightFighter = 1_000;
  game.state.empires[0].research.weapons = 5;
  game.state.empires[0].officers.admiral = true;

  const result = game.resolveCombat(0, target, fleet, () => 0.5);

  assert.equal(result.win, true);
  assert.ok(result.survivor > 0 && result.survivor <= 0.92);
  assert.ok(target.ships.lightFighter < 100);
  assert.ok(target.def.rocket < 100);
  assert.ok(result.destroyedPower > 0);
  assert.ok(Object.values(result.loot).every(value => value >= 0));
});

test("Autonomous Drone and officers increase calculated fleet power", () => {
  game.initGame(6);
  const planet = game.state.planets.find(p => p.ownerId === 0);
  const baseline = game.power(planet, 0);
  game.state.empires[0].research.autonomousDrone = 4;
  game.state.empires[0].officers.admiral = true;
  assert.ok(game.power(planet, 0) > baseline);
});

test("generated bot alliances provide real war targets and battle scoring", () => {
  game.initGame(20);
  assert.ok(game.state.alliances.length >= 2);
  const playerAlliance = { id: "player-alliance", name: "NovaGuard", members: [0] };
  game.state.alliances.push(playerAlliance);
  game.state.empires[0].allianceId = playerAlliance.id;
  const rival = game.state.alliances.find(a => a.id !== playerAlliance.id);

  assert.equal(game.declareAllianceWar(rival.id), true);
  const war = game.activeWarBetween(playerAlliance.id, rival.id);
  assert.ok(war);

  game.recordAllianceBattle(0, rival.members[0], { win: true, destroyedPower: 7_500 }, "Vega-1");
  assert.equal(war.score1, 12);
  assert.equal(war.score2, 0);
  assert.equal(war.battles.length, 1);
});

test("trade contracts debit both parties and block duplicate active deals", () => {
  game.initGame(10);
  const bot = game.state.empires.find(e => e.isBot && game.state.planets.some(p => p.ownerId === e.id));
  const playerPlanet = game.activePlanet();
  const partnerPlanet = game.state.planets.find(p => p.ownerId === bot.id);
  playerPlanet.resources = { metal: 100_000, crystal: 100_000, deuterium: 100_000 };
  partnerPlanet.resources = { metal: 100_000, crystal: 100_000, deuterium: 100_000 };
  const playerBefore = { ...playerPlanet.resources };
  const partnerBefore = { ...partnerPlanet.resources };

  const contract = game.createTradeContract(bot.id);
  assert.ok(contract);
  assert.equal(game.createTradeContract(bot.id), undefined);
  assert.equal(game.state.tradeContracts.length, 1);
  game.state.turn = contract.nextTurn;
  game.processTradeContracts();

  assert.equal(playerPlanet.resources.metal, playerBefore.metal - contract.give.metal);
  assert.equal(playerPlanet.resources.crystal, playerBefore.crystal + contract.take.crystal);
  assert.equal(playerPlanet.resources.deuterium, playerBefore.deuterium + contract.take.deuterium);
  assert.equal(partnerPlanet.resources.metal, partnerBefore.metal + contract.give.metal);
  assert.equal(partnerPlanet.resources.crystal, partnerBefore.crystal - contract.take.crystal);
  assert.equal(partnerPlanet.resources.deuterium, partnerBefore.deuterium - contract.take.deuterium);
  assert.equal(game.cancelTradeContract(contract.id), true);
  assert.equal(contract.active, false);
});

test("advanced ships enforce building and research requirements", () => {
  game.initGame(6);
  const planet = game.activePlanet();
  const empire = game.state.empires[0];
  assert.match(game.shipRequirementFailure("battleship", planet, empire), /Tersane/);
  planet.b.shipyard = 4;
  empire.research.weapons = 2;
  assert.equal(game.shipRequirementFailure("battleship", planet, empire), null);
});

test("attack targeting excludes members of the same alliance", () => {
  game.initGame(10);
  const source = game.activePlanet();
  const rival = game.state.alliances[0];
  rival.members.push(0);
  game.state.empires[0].allianceId = rival.id;
  const memberPlanets = new Set(rival.members.flatMap(id => game.state.planets.filter(p => p.ownerId === id).map(p => p.id)));
  assert.ok(game.missionTargets("attack", source.id).every(p => !memberPlanets.has(p.id)));
});

test("bot messaging produces a bounded diplomatic response", () => {
  game.initGame(10);
  const bot = game.state.empires.find(e => e.isBot);
  assert.equal(game.sendMessage(bot.id, "Durum raporu ver."), true);
  assert.equal(game.state.messages.length, 2);
  assert.equal(game.state.messages[0].from, bot.id);
  assert.equal(game.state.messages[0].to, 0);
});

test("large browser galaxies do not generate duplicate coordinates", () => {
  game.initGame(120);
  const coordinates = game.state.planets.map(planet => planet.coords.join(":"));
  assert.equal(coordinates.length, new Set(coordinates).size);
});
