package com.rts;

import java.util.ArrayDeque;
import java.util.Queue;

public class InputManager {
    private final Queue<InputCommand> queue = new ArrayDeque<>();

    public void push(InputCommand command) {
        queue.offer(command);
    }

    public InputCommand poll() {
        return queue.poll();
    }

    public boolean hasPending() {
        return !queue.isEmpty();
    }
}
