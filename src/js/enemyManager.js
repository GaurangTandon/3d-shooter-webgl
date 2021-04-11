import {
    EllipseCurve, BufferGeometry, Line, LineBasicMaterial, Vector3, LineCurve,
} from "../build/three.module.js";
import { GameObject } from "./gameobject.js";
import { PLAYER_Z, randomChoose } from "./utils.js";
import { ResourceTracker } from "./resource.js";

class CurveObject extends GameObject {
    lengthTraversed;

    constructor(model) {
        super(model);

        this.lengthTraversed = 0;
        this.over = false;
    }

    /**
     *
     * @param curve {Curve}
     * @param curveObject {BufferGeometr}
     * @param lengthAdd {Float}
     */
    update(curve, curveObject, lengthAdd) {
        if (this.over) {
            return false;
        }

        if (this.lengthTraversed >= 1) {
            this.kick();
            return false;
        }

        const carPosition = new Vector3(),
            carTarget = new Vector3();

        curve.getPointAt(this.lengthTraversed % 1, carPosition);
        carPosition.applyMatrix4(curveObject.matrixWorld);

        // get a second point slightly further down the curve
        curve.getPointAt((this.lengthTraversed + lengthAdd) % 1, carTarget);
        carTarget.applyMatrix4(curveObject.matrixWorld);

        // put the car at the first point (temporarily)
        this.model.position.copy(carPosition);

        // put the car between the 2 points
        this.model.position.lerpVectors(carPosition, carTarget, 0.5);

        for (let i = 0; i < 2; i++) {
            const wing = this.model.children[i];
            wing.rotation.y += lengthAdd * 5;
        }

        this.lengthTraversed += lengthAdd;

        return true;
    }
}

class EnemyWave {
    curve;

    enemies;

    curveObject;

    cycleComplete;

    resources;

    static circleCenters = [
        [0.8, 1],
        [-0.8, 1],
    ];

    static lineCenters = [
        [0.5, 0.6],
        [-0.5, -0.6],
    ];

    constructor(curveType, enemyObjects) {
        this.resources = new ResourceTracker();

        // docs: https://threejs.org/docs/#api/en/extras/curves/EllipseCurve
        if (curveType === "circle") {
            const [x, y] = randomChoose(EnemyWave.circleCenters);

            this.curve = new EllipseCurve(x, y, 1, 1, 0, 2 * Math.PI, false, 0);
        } else if (curveType === "ellipse") {
            this.curve = new EllipseCurve(0, 0.8, 0.7, 1.2, 0, 2 * Math.PI, false, 0);
        } else if (curveType === "vline") {
            const [x1, x2] = randomChoose(EnemyWave.lineCenters);

            // goes straight down from up
            this.curve = new LineCurve(new Vector3(x1, 2), new Vector3(x2, -1.1));
        } else {
            console.error("Unknown enemy movement");
            return;
        }

        const points = this.curve.getPoints(50),
            geometry = new BufferGeometry().setFromPoints(points),
            material = new LineBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0,
            }),
            curveObject = new Line(geometry, material);

        curveObject.position.z = PLAYER_Z;

        this.enemies = [];
        for (let i = 0; i < EnemyManager.ENEMY_PER_WAVE; i++) {
            const gltf = enemyObjects[i];
            this.resources.track(gltf);

            const enemy = new CurveObject(gltf);
            enemy.lengthTraversed = i * 0.08;
            this.enemies.push(enemy);
        }

        this.curveObject = curveObject;
        this.resources.track(this.curveObject);

        this.cycleComplete = false;
    }

    update(velocity) {
        if (!this.cycleComplete) {
            let allOver = true;
            for (const enemy of this.enemies) {
                allOver = !enemy.update(this.curve, this.curveObject, velocity) && allOver;
            }

            if (allOver) {
                this.cycleComplete = true;
                this.resources.dispose();
            }
        }
    }

    checkPlaneCollision(position, threshold) {
        for (const enemy of this.enemies) {
            if (enemy.colliding(position, threshold)) {
                // TODO: game over
                console.log("HIT");
            }
        }
    }

    checkBulletCollision(position, threshold) {
        for (const enemy of this.enemies) {
            if (enemy.colliding(position, threshold)) {
                enemy.kick();
                this.resources.dispose(enemy.getUuid());
                return true;
            }
        }

        return false;
    }
}

class EnemyManager {
    enemyGroups;

    static ENEMY_PER_WAVE = 5;

    static SPAWN_INTERVAL = 10000;

    constructor() {
        this.enemyGroups = [];
    }

    addEnemyChain(enemyObjects) {
        const type = Math.random() < 0.35 ? "circle" : Math.random() < 0.7 ? "ellipse" : "vline",
            cycle = new EnemyWave(type, enemyObjects),
            objs = [cycle.curveObject]; // cycle.curveObject

        for (const enemy of cycle.enemies) {
            objs.push(enemy.model);
        }

        this.enemyGroups.push(cycle);

        return objs;
    }

    update(velocity) {
        for (const cycle of this.enemyGroups) {
            cycle.update(velocity);
        }
    }

    checkPlaneCollision(position, threshold) {
        return this.enemyGroups.some((cycle) => cycle.checkPlaneCollision(position, threshold));
    }

    checkBulletCollision(position, threshold) {
        return this.enemyGroups.some((cycle) => cycle.checkBulletCollision(position, threshold));
    }
}

export { EnemyManager };
