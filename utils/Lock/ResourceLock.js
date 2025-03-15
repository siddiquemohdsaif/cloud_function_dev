const LockManager = require("./LockManager");
//const RedisLockManager = require("./RedisLockManager");

class ResourceLock {
    static getInstance() {
        if (!ResourceLock.instance) {
            ResourceLock.instance = new ResourceLock();
        }
        return ResourceLock.instance;
    }

    constructor() {
        this.lockManager = new LockManager();
    }

    async run(resourceId, task) {
        const lock = this.lockManager.getLock(resourceId);
        return lock.exec(task);
    }

    async runMultiple(resourceIds, task) {
        const sortedResourceIds = [...resourceIds].sort((a, b) => a - b);

        const execWithLock = async (index) => {
            if (index >= sortedResourceIds.length) {
                return task();
            } else {
                const lock = this.lockManager.getLock(sortedResourceIds[index]);
                return lock.exec(() => execWithLock(index + 1));
            }
        };

        return execWithLock(0);
    }
    
}

module.exports = ResourceLock;
