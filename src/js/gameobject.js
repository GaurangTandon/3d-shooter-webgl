class GameObject {
    model;

    over;

    constructor(model) {
        this.model = model;
        this.over = false;
    }

    displace(displacement) {
        this.model.position.add(displacement);
    }

    outOfFrame() {
        return Math.abs(this.model.position.x) > 1.2 || Math.abs(this.model.position.y) > 1.2;
    }

    rotateNone() {
        this.model.rotation.x = this.model.rotation.y = this.model.rotation.z = 0;
    }

    rotate(rot) {
        // this.model.rotation.copy(rot); // THIS DOES NOT WORK
        this.model.rotation.x = rot.x;
        this.model.rotation.y = rot.y;
        this.model.rotation.z = rot.z;
    }

    checkDisplacementValid(displacement) {
        function outside(x, dx) {
            x += dx;
            return x < -0.9 || x > 0.9;
        }

        const pos = this.model.position;
        return !(outside(pos.x, displacement.x) || outside(pos.y, displacement.y));
    }

    colliding(other, threshold) {
        return this.model.position.distanceTo(other) <= threshold;
    }

    getPosition() {
        return this.model.position.clone();
    }

    kick() {
        this.model.position.x = 3;
        this.model.position.y = 3;
        this.model.position.z = 2;
        this.over = true;
    }

    getUuid() {
        return this.model.uuid;
    }
}

export { GameObject };
