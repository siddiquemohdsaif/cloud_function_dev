const RedisLock = require('./RedisLock');
const Redis = require('ioredis');

class RedisLockManager {
    constructor(redisOptions) {
        this.locks = {};
        if (redisOptions) {
            this.redisClient = new Redis(redisOptions);
        } else {
            // Handle the case when redisOptions is undefined or not provided
            this.redisClient = new Redis({
                host: "127.0.0.1",
                port: 6379,
            }); // Use default options
        }
    }

    getLock(uid, ttl) {
        const resource = `locks:${uid}`;
        if (!this.locks[resource]) {
            this.locks[resource] = new RedisLock(this.redisClient, resource, ttl);
        }
        return this.locks[resource];
    }
}

module.exports = RedisLockManager;
