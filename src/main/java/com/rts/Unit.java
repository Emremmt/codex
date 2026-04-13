package com.rts;

public class Unit {
    private final String name;
    private final UnitRole role;
    private final RaceType race;
    private int health;
    private int attack;
    private int armor;

    public Unit(String name, UnitRole role, RaceType race, int health, int attack, int armor) {
        this.name = name;
        this.role = role;
        this.race = race;
        this.health = health;
        this.attack = attack;
        this.armor = armor;
    }

    public String name() {
        return name;
    }

    public UnitRole role() {
        return role;
    }

    public RaceType race() {
        return race;
    }

    public int health() {
        return health;
    }

    public int attack() {
        return attack;
    }

    public int armor() {
        return armor;
    }

    public void upgradeWeapon(int bonus) {
        attack += bonus;
    }

    public void upgradeArmor(int bonus) {
        armor += bonus;
    }

    public void receiveDamage(int damage) {
        int applied = Math.max(1, damage - armor);
        health = Math.max(0, health - applied);
    }

    public boolean alive() {
        return health > 0;
    }
}
