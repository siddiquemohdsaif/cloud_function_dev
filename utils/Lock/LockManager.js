const Lock = require("./Lock");


class LockManager {
    constructor() {
        this.locks = {};
    }

    getLock(uid) {
        if (!this.locks[uid]) {
            this.locks[uid] = new Lock();
        }
        return this.locks[uid];
    }
}


module.exports = LockManager;