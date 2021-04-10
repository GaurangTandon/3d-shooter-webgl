import {
    EllipseCurve, BufferGeometry, Line, LineBasicMaterial,
} from "../build/three.module.js";

class EnemyCycler {
    curve;

    enemies;

    ENEMY_PER_WAVE = 5;

    curveObject;

    constructor(curveType) {
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
        for (let i = 0; i < this.ENEMY_PER_WAVE; i++) {
            // TODO: add fighter jets equally spaced
        }

        this.curveObject = curveObject;
    }

    update() {
        // TODO: move them!
    }
}

class EnemyManager {
    enemyGroups;

    constructor() {
        this.enemyGroups = [];
    }

    addEnemyChain() {
        const cycle = new EnemyCycler("circle"),
            objs = [cycle.curveObject];

        for (const enemy of cycle.enemies) {
            objs.push(enemy);
        }

        this.enemyGroups.push(cycle);

        return objs;
    }

    update() {
        for (const cycle of this.enemyGroups) {
            cycle.update();
        }
    }
}

export { EnemyManager };
