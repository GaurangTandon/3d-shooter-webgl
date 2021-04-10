import {
    EllipseCurve, BufferGeometry, Line, LineBasicMaterial, Vector3,
} from "../build/three.module.js";
import { GameObject } from "./gameobject.js";
import { PLAYER_Z } from "./utils.js";

class CurveObject extends GameObject {
    lengthTraversed;

    over;

    constructor(model) {
        super(model);

        this.lengthTraversed = 0;
        this.over = false;
    }

    /**
     *
     * @param curve {Curve}
     * @param lengthAdd {Float}
     */
    update(curve, curveObject, lengthAdd) {
        if (this.over) {
            return false;
        }

        if (this.lengthTraversed >= 1) {
            this.model.position.x = 2;
            this.model.position.y = 2;
            this.model.position.z = 0;
            this.over = true;
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

        // const dirn = carTarget.clone()
        //         .sub(carPosition)
        //         .normalize(),
        //     dirnVec = carPosition.clone()
        //         .add(dirn.multiplyScalar(20));

        // point the car the second point
        // TODO: fix models in blender so that they look the correct way
        this.model.lookAt(carTarget);

        // put the car between the 2 points
        this.model.position.lerpVectors(carPosition, carTarget, 0.5);

        this.lengthTraversed += lengthAdd;

        return true;
    }
}

class EnemyWave {
    curve;

    enemies;

    curveObject;

    cycleComplete;

    constructor(curveType, enemyObjects) {
        if (curveType === "circle") {
            // docs: https://threejs.org/docs/#api/en/extras/curves/EllipseCurve
            this.curve = new EllipseCurve(0.8, 0.8, 1, 1, 0, 2 * Math.PI, false, 0);
        } else if (curveType === "ellipse") {
            this.curve = new EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0);
        } else if (curveType === "vline") {
            // goes straight down from up
            this.curve = new EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0);
        } else {
            console.error("Unknown enemy movement");
            return;
        }

        const points = this.curve.getPoints(50),
            geometry = new BufferGeometry().setFromPoints(points),
            material = new LineBasicMaterial({ color: 0xff0000 }),
            curveObject = new Line(geometry, material);

        curveObject.position.z = PLAYER_Z;

        this.enemies = [];
        for (let i = 0; i < EnemyManager.ENEMY_PER_WAVE; i++) {
            const enemy = new CurveObject(enemyObjects[i]);
            enemy.lengthTraversed = i * 0.08;
            this.enemies.push(enemy);
        }

        // TODO: set start position of each fighter jet to outside the view

        this.curveObject = curveObject;
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
            }
        }

        return !this.cycleComplete;
    }
}

class EnemyManager {
    enemyGroups;

    static ENEMY_PER_WAVE = 5;

    constructor() {
        this.enemyGroups = [];
    }

    addEnemyChain(enemyObjects) {
        const cycle = new EnemyWave("circle", enemyObjects),
            objs = [cycle.curveObject];

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
}

export { EnemyManager };
