package com.rts;

import java.util.ArrayList;
import java.util.List;

public class GameWorld {
    private final List<Faction> factions = new ArrayList<>();
    private final InputManager inputManager;
    private CameraMode cameraMode = CameraMode.FIXED;
    private boolean fireActive = true;
    private int tick;

    public GameWorld(InputManager inputManager) {
        this.inputManager = inputManager;
    }

    public void addFaction(Faction faction) {
        factions.add(faction);
    }

    public List<Faction> factions() {
        return factions;
    }

    public CameraMode cameraMode() {
        return cameraMode;
    }

    public boolean fireActive() {
        return fireActive;
    }

    public int tick() {
        return tick;
    }

    public void update() {
        tick++;
        processInput();

        for (Faction faction : factions) {
            consumeFire(faction);
            passiveGather(faction);
        }
    }

    private void processInput() {
        while (inputManager.hasPending()) {
            InputCommand command = inputManager.poll();
            if (command instanceof InputCommand.SwitchCamera switchCamera) {
                cameraMode = switchCamera.mode();
            } else if (command instanceof InputCommand.GatherCommand gatherCommand) {
                factions.forEach(f -> f.gather(gatherCommand.type(), gatherCommand.amount()));
            } else if (command instanceof InputCommand.ToggleFire toggleFire) {
                fireActive = toggleFire.active();
            }
        }
    }

    private void consumeFire(Faction faction) {
        if (!fireActive) {
            faction.units().forEach(unit -> unit.receiveDamage(9999));
            return;
        }

        int consumption = (int) Math.max(1, Math.round(3 * faction.race().profile().fireConsumptionMultiplier()));
        boolean hasFire = faction.inventory().consume(ResourceType.FIRE, consumption);
        if (!hasFire) {
            faction.units().forEach(unit -> unit.receiveDamage(25));
        }
    }

    private void passiveGather(Faction faction) {
        long gatherers = faction.units().stream().filter(u -> u.role() == UnitRole.GATHERER && u.alive()).count();
        if (gatherers == 0) {
            return;
        }
        faction.gather(ResourceType.WOOD, (int) gatherers * 2);
        faction.gather(ResourceType.WATER, (int) gatherers * 2);
        faction.gather(ResourceType.STONE, (int) gatherers * 2);
        faction.gather(ResourceType.GOLD, (int) gatherers);
        faction.gather(ResourceType.FIRE, (int) gatherers * 2);
    }
}
