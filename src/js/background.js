import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";
import { ResourceTracker } from "./resource.js";

class Background {
    static INTERVAL = 2000;

    backgrounds;

    tracker;

    constructor() {
        this.backgrounds = [];
        this.tracker = new ResourceTracker();
    }

    update(velocity) {
        for (const bg of this.backgrounds) {
            if (bg.over) {
                continue;
            }

            bg.displace(new Vector3(0, -velocity, 0));

            if (bg.model.position.y < -2) {
                bg.kick();
                this.tracker.dispose(bg.getUuid());
            }
        }
    }

    static randomGLTF() {
        return "lighthouse.glb";
    }

    addBg(model) {
        model.position.z = -0.555;
        model.position.y = 2;
        model.position.x = -1 + Math.random() * 2;
        model.scale.setScalar(model.scale.x * 3);

        this.tracker.track(model);
        this.backgrounds.push(new GameObject(model));
    }

    reset() {
        this.tracker.dispose();
        this.backgrounds = [];
    }
}

export { Background };
