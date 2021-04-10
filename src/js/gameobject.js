class GameObject {
    model;

    constructor(model) {
        this.model = model;
    }

    displace(displacement) {
        this.model.position.add(displacement);
    }

    outOfFrame() {
        return false;
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
            return x < -0.9 || x > 0.98;
        }

        const pos = this.model.position;
        return !(outside(pos.x, displacement.x) || outside(pos.y, displacement.y));
    }
}

export { GameObject };
