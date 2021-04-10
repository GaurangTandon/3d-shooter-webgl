class BackgroundFiring {
    lastFiring = 0;

    threshold;

    constructor(threshold) {
        this.threshold = threshold;
    }

    fire(curr) {
        if (curr - this.lastFiring < this.threshold) {
            return false;
        }

        this.lastFiring = curr;
        return true;
    }
}

export { BackgroundFiring };
