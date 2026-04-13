package com.rts;

public sealed interface InputCommand permits InputCommand.SwitchCamera, InputCommand.GatherCommand, InputCommand.ToggleFire {
    record SwitchCamera(CameraMode mode) implements InputCommand {}

    record GatherCommand(ResourceType type, int amount) implements InputCommand {}

    record ToggleFire(boolean active) implements InputCommand {}
}
