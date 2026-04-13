package com.rts;

public class Renderer3D {
    public void render(GameWorld world) {
        // Gerçek projede jMonkeyEngine/LWJGL bağlanır.
        // Bu prototipte sadece oyun durumunu yazdırıyoruz.
        System.out.printf("[3D] Tick=%d Camera=%s Fire=%s%n", world.tick(), world.cameraMode(), world.fireActive());
    }
}
