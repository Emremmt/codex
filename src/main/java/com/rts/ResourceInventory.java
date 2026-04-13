package com.rts;

import java.util.EnumMap;
import java.util.Map;

public class ResourceInventory {
    private final Map<ResourceType, Integer> resources = new EnumMap<>(ResourceType.class);

    public ResourceInventory() {
        for (ResourceType type : ResourceType.values()) {
            resources.put(type, 0);
        }
    }

    public void add(ResourceType type, int amount) {
        resources.merge(type, amount, Integer::sum);
    }

    public boolean consume(ResourceType type, int amount) {
        int current = resources.get(type);
        if (current < amount) {
            return false;
        }
        resources.put(type, current - amount);
        return true;
    }

    public int get(ResourceType type) {
        return resources.get(type);
    }

    public Map<ResourceType, Integer> snapshot() {
        return Map.copyOf(resources);
    }
}
