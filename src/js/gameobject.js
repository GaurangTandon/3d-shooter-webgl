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
}

export { GameObject };
