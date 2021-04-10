import {
    EllipseCurve, BufferGeometry, Line, LineBasicMaterial, Vector3,
} from "../build/three.module.js";
import { GameObject } from "./gameobject.js";

class CurveObject extends GameObject {
    lengthTraversed;

    constructor(model) {
        super(model);
        // model.rotation.y = Math.PI;
        // model.rotation.x = Math.PI / 2;

        this.lengthTraversed = 0;
    }

    /**
     *
     * @param curve {Curve}
     * @param lengthAdd {Float}
     */
    update(curve, curveObject, lengthAdd) {
        const carPosition = new Vector3(),
            carTarget = new Vector3();

        curve.getPointAt(this.lengthTraversed % 1, carPosition);
        carPosition.applyMatrix4(curveObject.matrixWorld);

        // get a second point slightly further down the curve
        curve.getPointAt((this.lengthTraversed + lengthAdd) % 1, carTarget);
        carTarget.applyMatrix4(curveObject.matrixWorld);

        // put the car at the first point (temporarily)
        this.model.position.copy(carPosition);

        const dirn = carTarget.clone()
                .sub(carPosition)
                .normalize(),
            dirnVec = carPosition.clone()
                .add(dirn.multiplyScalar(20));
        // point the car the second point
        this.model.lookAt(dirnVec);

        console.log(carTarget, carPosition, dirnVec);

        // put the car between the 2 points
        this.model.position.lerpVectors(carPosition, carTarget, 0.5);

        this.lengthTraversed += lengthAdd;
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
            this.curve = new EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI, false, 0);
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

        this.enemies = [];
        for (let i = 0; i < EnemyManager.ENEMY_PER_WAVE; i++) {
            const enemy = new CurveObject(enemyObjects[i]);
            enemy.lengthTraversed = i * 0.01;
            this.enemies.push(enemy);
        }

        // TODO: set start position of each fighter jet to outside the view

        this.curveObject = curveObject;
        this.cycleComplete = false;
    }

    update(velocity) {
        for (const enemy of this.enemies) {
            enemy.update(this.curve, this.curveObject, velocity);
        }
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
