package com.rts;

public record RaceProfile(
        String name,
        String advantage,
        String disadvantage,
        double combatMultiplier,
        double gatherMultiplier,
        double fireConsumptionMultiplier,
        String fantasyPower
) {
}
