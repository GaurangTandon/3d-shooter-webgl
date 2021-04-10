import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";
import { isPressed } from "./utils.js";

class Airplane extends GameObject {
    bullets;

    static BULLET_INTERVAL = 1000;

    static BULLET_GLTF = "bullet.glb";

    currentlyPressed;

    static delta = {
        S: [new Vector3(0, -1, 0), undefined],
        A: [new Vector3(-1, 0, 0), new Vector3(0, -0.5, 0)],
        W: [new Vector3(0, 1, 0), undefined],
        D: [new Vector3(1, 0, 0), new Vector3(0, 0.5, 0)],
    };

    constructor(model) {
        super(model);
        model.position.z = 1;
        this.lastBulletTime = 0;
        this.bullets = [];
        this.currentlyPressed = false;
    }

    processInput(deltaTime, keys) {
        const velocityScaling = deltaTime * 0.001;

        let pressedAny = false;

        for (const [key, [displacement, rot]] of Object.entries(Airplane.delta)) {
            if (isPressed(keys, key)) {
                this.currentlyPressed = true;
                pressedAny = true;

                // apply displacement to airplane
                this.displace(displacement.clone()
                    .multiplyScalar(velocityScaling));

                if (rot) {
                    this.rotate(rot);
                }
            }
        }

        if (!pressedAny) {
            // TODO: enable slow motion

            this.rotateNone();
            this.currentlyPressed = false;
        }
    }

    addBullet(bulletObj) {
        bulletObj.position.x = this.model.position.x;
        bulletObj.position.y = this.model.position.y;
        bulletObj.position.z = this.model.position.z;
        bulletObj.scale.divideScalar(2);
        this.bullets.push(new GameObject(bulletObj));
    }

    updateBullets(velocity) {
        // if any bullet is out of frame, delete it from list
        // otherwise add fixed displacement

        this.bullets.forEach((bullet) => {
            bullet.displace(new Vector3(0, velocity, 0));
        });

        let i = 0;
        while (i < this.bullets.len && this.bullets[i].outOfFrame()) {
            i++;
        }

        if (i > 0) {
            this.bullets = this.bullets.slice(i);
        }
    }
}

export { Airplane };
