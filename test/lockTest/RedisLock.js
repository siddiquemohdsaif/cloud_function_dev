const Redlock = require('redlock');
const Redis = require('ioredis');

class RedisLock {
    constructor(redisClient, resource, ttl = 10000) { // default TTL 10 seconds
        this.redlock = new Redlock([redisClient], {
            driftFactor: 0.01,
            retryCount: 50,
            retryDelay: 200,
            retryJitter: 200
        });
        this.resource = resource;
        this.ttl = ttl;
    }

    async acquire() {
        try {
            const lock = await this.redlock.lock(this.resource, this.ttl);
            return {
                success: true,
                unlock: () => lock.unlock().catch((err) => console.error(err))
            };
        } catch (err) {
            return { success: false };
        }
    }

    async exec(task) {
        const lock = await this.acquire();
        if (!lock.success) {
            throw new Error("Failed to acquire lock");
        }

        try {
            return await task();
        } finally {
            lock.unlock();
        }
    }
}

module.exports = RedisLock;
