class BackgroundFiring {
    lastFiring = 0;

    threshold;

    random;

    constructor(threshold, random = 0) {
        this.threshold = threshold;
        this.random = random;
    }

    fire(curr) {
        const diff = curr - this.lastFiring,
            gap = this.threshold - diff;

        if (gap >= Math.random() * this.random) {
            return false;
        }

        this.lastFiring = curr;
        return true;
    }

    reset() {
        this.lastFiring = 0;
    }
}

export { BackgroundFiring };
