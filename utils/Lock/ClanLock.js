const LockManager = require("./LockManager");
//const RedisLockManager = require("./RedisLockManager");

class ClanLock {
    static getInstance() {
        if (!ClanLock.instance) {
            ClanLock.instance = new ClanLock();
        }
        return ClanLock.instance;
    }

    constructor() {
        this.lockManager = new LockManager();
    }

    async run(clanId, task) {
        const lock = this.lockManager.getLock(clanId);
        return lock.exec(task);
    }

    // run a task with locks on multiple clanIds
    async runMultiple(clanIds, task) {
    
        const sortedClanIds = [...new Set(clanIds)].sort((a, b) => a - b);

        // Function to recursively acquire locks and execute the task
        const execWithLock = async (index) => {
            if (index >= sortedClanIds.length) {
                // All locks acquired, execute the task
                return task();
            } else {
                // Get lock for the current clanId
                const lock = this.lockManager.getLock(sortedClanIds[index]);
                // Execute the next lock acquisition and task within the current lock
                return lock.exec(() => execWithLock(index + 1));
            }
        };

        // Start the recursive lock acquisition and task execution
        return execWithLock(0);
    }
}

module.exports = ClanLock;
