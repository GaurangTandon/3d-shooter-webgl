class BackgroundFiring {
    lastFiring = 0;

    threshold;

    constructor(threshold) {
        this.threshold = threshold;
    }

    fire() {
        const curr = Date.now();

        if (curr - this.lastFiring < this.threshold) {
            return false;
        }

        this.lastFiring = curr;
        return true;
    }
}

export { BackgroundFiring };
