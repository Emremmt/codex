package com.rts;

import java.util.ArrayList;
import java.util.List;

public class Faction {
    private final RaceType race;
    private final List<Unit> units = new ArrayList<>();
    private final ResourceInventory inventory = new ResourceInventory();
    private int wallStrength;

    public Faction(RaceType race) {
        this.race = race;
        this.wallStrength = 100;
    }

    public RaceType race() {
        return race;
    }

    public List<Unit> units() {
        return units;
    }

    public ResourceInventory inventory() {
        return inventory;
    }

    public int wallStrength() {
        return wallStrength;
    }

    public void addUnit(Unit unit) {
        units.add(unit);
    }

    public void reinforceWalls(int amount) {
        wallStrength += amount;
    }

    public void damageWalls(int amount) {
        wallStrength = Math.max(0, wallStrength - amount);
    }

    public void gather(ResourceType type, int baseAmount) {
        double multiplier = race.profile().gatherMultiplier();
        int gained = (int) Math.max(1, Math.round(baseAmount * multiplier));
        inventory.add(type, gained);
    }

    public boolean unlockDivinePower() {
        int cost = 400;
        if (inventory.consume(ResourceType.GOLD, cost)) {
            return true;
        }
        return false;
    }
}
