import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";

class Airplane extends GameObject {
    lastBulletTime;

    bullets;

    static BULLET_INTERVAL = 1000;

    static BULLET_GLTF = "bullet.glb";

    constructor(model) {
        super(model);
        this.lastBulletTime = 0;
        this.bullets = [];
    }

    fire() {
        const currTime = Date.now();

        if (currTime - this.lastBulletTime < Airplane.BULLET_INTERVAL) {
            return false;
        }

        this.lastBulletTime = currTime;
        return true;
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
