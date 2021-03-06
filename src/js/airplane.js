import { GameObject } from "./gameobject.js";
import { Vector3 } from "../build/three.module.js";
import { isPressed, PLAYER_Z } from "./utils.js";

class Airplane extends GameObject {
    bullets;

    static BULLET_INTERVAL = 500;

    static BULLET_GLTF = "bullet.gltf";

    currentlyPressed;

    score;

    health;

    static delta = {
        S: [new Vector3(0, -1, 0), undefined],
        A: [new Vector3(-1, 0, 0), new Vector3(0, -0.5, 0)],
        W: [new Vector3(0, 1, 0), undefined],
        D: [new Vector3(1, 0, 0), new Vector3(0, 0.5, 0)],
        Q: [new Vector3(0, 0, 0), undefined],
    };

    reset() {
        this.model.position.z = PLAYER_Z;
        this.model.position.y = -0.8;
        this.currentlyPressed = false;
        this.score = 0;
        this.health = 100;

        for (const bullet of this.bullets) {
            bullet.kick();
        }
        this.bullets = [];
    }

    constructor(model) {
        super(model);
        this.bullets = [];
        this.reset();
    }

    static anyMotionKeyPressed(keys) {
        for (const key of Object.keys(Airplane.delta)) {
            if (isPressed(keys, key)) {
                return true;
            }
        }

        return false;
    }

    processInput(deltaTime, keys) {
        const velocityScaling = deltaTime * 0.001;

        let pressedAny = false;

        for (const [key, [displacement, rot]] of Object.entries(Airplane.delta)) {
            if (isPressed(keys, key)) {
                this.currentlyPressed = true;
                pressedAny = true;

                // apply displacement to airplane
                const dispy = displacement.clone()
                    .multiplyScalar(velocityScaling);

                if (this.checkDisplacementValid(dispy)) {
                    this.displace(dispy);
                }

                if (rot) {
                    this.rotate(rot);
                }
            }
        }

        if (!pressedAny) {
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

        velocity *= 1.5;
        this.bullets = this.bullets.filter((bullet) => !bullet.over && !bullet.outOfFrame());
        this.bullets.forEach((bullet) => {
            bullet.displace(new Vector3(0, velocity, 0));
        });
    }

    hitCoin() {
        this.score += 10;
    }

    hitEnemy() {
        this.score += 20;
    }

    hitBullet() {
        this.health -= 10;
    }
}

export { Airplane };
