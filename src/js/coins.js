import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";
import { PLAYER_Z } from "./utils.js";
import { ResourceTracker } from "./resource.js";

class Coins {
    coins;

    tracker;

    static INTERVAL = 1000;

    static GLTF = "star.glb";

    constructor() {
        this.coins = [];
        this.tracker = new ResourceTracker();
    }

    reset() {
        this.tracker.dispose();
        this.coins = [];
    }

    addCoin(model) {
        model.position.z = PLAYER_Z;
        model.position.y = 1;
        model.position.x = -1 + Math.random() * 2;
        model.scale.setScalar(model.scale.x);
        model.rotation.x = Math.PI / 2;

        this.tracker.track(model);
        this.coins.push(new GameObject(model));
    }

    update(velocity, time) {
        for (const coin of this.coins) {
            if (coin.over) {
                continue;
            }

            coin.displace(new Vector3(0, -velocity, 0));

            coin.model.rotation.y = time;

            if (coin.model.position.y < -2) {
                coin.kick();
                this.tracker.dispose(coin.getUuid());
            }
        }
    }

    checkCollision(position, threshold) {
        for (const coin of this.coins) {
            if (!coin.over && coin.colliding(position, threshold)) {
                coin.kick();
                this.tracker.dispose(coin.getUuid());
                return true;
            }
        }
        return false;
    }
}

export { Coins };
