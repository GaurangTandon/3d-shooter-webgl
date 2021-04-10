import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";

class Background {
    static INTERVAL = 1000;

    backgrounds;

    constructor() {
        this.backgrounds = [];
    }

    update(deltaTime) {
        const velocity = deltaTime * 0.0001;
        for (const bg of this.backgrounds) {
            bg.displace(new Vector3(0, -velocity, 0));
        }
    }

    static randomGLTF() {
        return Math.random() < 0.5 ? Lighthouse.GLTF : Mountain.GLTF;
    }

    addBg(model) {
        model.position.z = -1;
        model.position.y = 1;
        model.position.x = -1 + Math.random() * 2;

        this.backgrounds.push(new GameObject(model));
    }
}

class Lighthouse extends Background {
    static GLTF = "lighthouse.glb";
}

class Mountain extends Background {
    static GLTF = "mountain.glb";
}

export { Background, Mountain, Lighthouse };
