import unittest

from ogame_offline import GalaxyGame, Planet


class EconomyTests(unittest.TestCase):
    def test_robot_factory_increases_production(self) -> None:
        basic = Planet("Basic", (1, 1, 1), 0)
        automated = Planet("Automated", (1, 1, 2), 0)
        automated.buildings["robot_factory"] = 6
        basic_before = dict(basic.resources)
        automated_before = dict(automated.resources)

        basic.economy_tick()
        automated.economy_tick()

        basic_gain = basic.resources["metal"] - basic_before["metal"]
        automated_gain = automated.resources["metal"] - automated_before["metal"]
        self.assertGreater(automated_gain, basic_gain)

    def test_engine_research_has_a_mobility_effect(self) -> None:
        game = GalaxyGame(seed=5, bot_count=10)
        baseline = game.mobility_multiplier(0)
        game.empires[0].research["combustion"] = 2
        game.empires[0].research["impulse"] = 2
        game.empires[0].research["hyperspace"] = 1
        self.assertGreater(game.mobility_multiplier(0), baseline)


class WorldAndCombatTests(unittest.TestCase):
    def test_generated_coordinates_are_unique(self) -> None:
        game = GalaxyGame(seed=11, bot_count=80)
        coordinates = [planet.coords for planet in game.planets]
        self.assertEqual(len(coordinates), len(set(coordinates)))

    def test_victory_damages_defending_fleet_and_defenses(self) -> None:
        game = GalaxyGame(seed=7, bot_count=10)
        source = game.empire_planets(0)[0]
        target = game.empire_planets(1)[0]
        source.ships = {key: 0 for key in source.ships}
        source.ships["destroyer"] = 2_000
        target.ships = {key: 0 for key in target.ships}
        target.defenses = {key: 0 for key in target.defenses}
        target.ships["light_fighter"] = 100
        target.defenses["rocket_launcher"] = 100
        fleet_before = target.ships["light_fighter"]
        defense_before = target.defenses["rocket_launcher"]

        won = game.resolve_battle(source, target, 0)

        self.assertTrue(won)
        self.assertLess(target.ships["light_fighter"], fleet_before)
        self.assertLess(target.defenses["rocket_launcher"], defense_before)
        self.assertTrue(all(value >= 0 for value in target.resources.values()))


if __name__ == "__main__":
    unittest.main()
