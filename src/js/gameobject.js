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
}

export { GameObject };
