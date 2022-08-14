class Semaphore {
    /** @type {{ promise: Promise<void>, resolve: () => void } | undefined} */
    #waiter;

    get empty() { return !this.#waiter; }

    async wait() {
        while (this.#waiter) await this.#waiter.promise;

        let resolve;
        const promise = new Promise(_resolve => resolve = _resolve);
        this.#waiter = { promise, resolve };
    }

    release() {
        if (this.#waiter) {
            const waiter = this.#waiter;
            this.#waiter = undefined;
            waiter.resolve();
        }
    }
}
exports.Semaphore = Semaphore;