

class Lock {
    constructor() {
        this._locked = false;
        this._waiting = [];
        this._timeout = 5000; // 5 seconds timeout for lock acquisition
        this._ttl = 10000; // 10 seconds Time-to-Live for the lock
    }

    acquire() {
        const unlock = () => {
            clearTimeout(this._ttlId); // Clear the TTL timeout when the lock is manually unlocked
            let nextResolve;
            if (this._waiting.length > 0) {
                nextResolve = this._waiting.shift();
                nextResolve({ success: true, unlock });
            } else {
                this._locked = false;
            }
        };

        if (this._locked) {
            return new Promise((resolve, reject) => {
                const resolveWrapper = (result) => {
                    clearTimeout(timeoutId); // Clear the acquisition timeout
                    resolve(result);
                };
                this._waiting.push(resolveWrapper);

                // Set a timeout for lock acquisition
                const timeoutId = setTimeout(() => {
                    const index = this._waiting.indexOf(resolveWrapper);
                    if (index !== -1) {
                        this._waiting.splice(index, 1);
                    }
                    reject(new Error("Lock acquisition timeout"));
                }, this._timeout);
            });
        } else {
            this._locked = true;
            // Set a TTL timeout to automatically release the lock
            this._ttlId = setTimeout(() => {
                if (this._locked) {
                    this._locked = false;
                    // Resolve any waiting promises if lock times out
                    while (this._waiting.length > 0) {
                        let resolve = this._waiting.shift();
                        resolve({ success: true, unlock });
                    }
                }
            }, this._ttl);

            return Promise.resolve({ success: true, unlock });
        }
    }

    async exec(task) {
        const result = await this.acquire();
        if (!result.success) {
            throw new Error("Failed to acquire lock");
        }
        try {
            return await task();
        } finally {
            result.unlock();
        }
    }
}

module.exports = Lock;
