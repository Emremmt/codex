package com.rts;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        InputManager inputManager = new InputManager();
        GameWorld world = new GameWorld(inputManager);
        Renderer3D renderer3D = new Renderer3D();

        for (RaceType race : RaceType.values()) {
            Faction faction = new Faction(race);
            faction.inventory().add(ResourceType.FIRE, 150);
            faction.inventory().add(ResourceType.GOLD, 500);
            faction.addUnit(new Unit(race.profile().name() + " Savaşçı", UnitRole.COMBAT, race, 120, 24, 8));
            faction.addUnit(new Unit(race.profile().name() + " Toplayıcı", UnitRole.GATHERER, race, 80, 8, 3));
            world.addFaction(faction);
        }

        printRaceLore();

        inputManager.push(new InputCommand.SwitchCamera(CameraMode.FREE));
        inputManager.push(new InputCommand.GatherCommand(ResourceType.GOLD, 5));

        for (int i = 0; i < 10; i++) {
            if (i == 7) {
                inputManager.push(new InputCommand.ToggleFire(false));
            }
            world.update();
            renderer3D.render(world);
            printSnapshot(world);
            Thread.sleep(150);
        }
    }

    private static void printRaceLore() {
        System.out.println("=== Irk Özellikleri ===");
        for (RaceType race : RaceType.values()) {
            RaceProfile p = race.profile();
            System.out.printf("%s | +%s | -%s | İlahi Güç: %s%n", p.name(), p.advantage(), p.disadvantage(), p.fantasyPower());
        }
    }

    private static void printSnapshot(GameWorld world) {
        for (Faction faction : world.factions()) {
            long alive = faction.units().stream().filter(Unit::alive).count();
            System.out.printf("- %s Alive=%d Fire=%d Gold=%d Wall=%d%n",
                    faction.race().profile().name(),
                    alive,
                    faction.inventory().get(ResourceType.FIRE),
                    faction.inventory().get(ResourceType.GOLD),
                    faction.wallStrength());
        }
    }
}
