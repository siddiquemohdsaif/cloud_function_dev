const LockManager = require("./LockManager");
//const RedisLockManager = require("./RedisLockManager");


class UserLock {
    static getInstance() {
        if (!UserLock.instance) {
            UserLock.instance = new UserLock();
        }
        return UserLock.instance;
    }

    constructor() {
        this.lockManager = new LockManager();
        //this.lockManager = new RedisLockManager();
    }

    async run(uid, task) {
        const lock = this.lockManager.getLock(uid);
        return lock.exec(task);
    }

    // Add the runMultiple method
    async runMultiple(uids, task) {
        const sortedUids = [...new Set(uids)].sort((a, b) => a - b);

        // Function to recursively acquire locks and execute the task
        const execWithLock = async (index) => {
            if (index >= sortedUids.length) {
                // All locks acquired, execute the task
                return task();
            } else {
                // Get lock for the current uid
                const lock = this.lockManager.getLock(sortedUids[index]);
                // Execute the next lock acquisition and task within the current lock
                return lock.exec(() => execWithLock(index + 1));
            }
        };

        // Start the recursive lock acquisition and task execution
        return execWithLock(0);
    }
}


module.exports = UserLock;






// now the user is less so use simple lock because we run only one node instance.
// in future if use multi node i.e cluster use RedisLockManager to make it work properly
