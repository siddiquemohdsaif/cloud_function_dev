const UserLock = require("./UserLock");
const ClanLock = require("./ClanLock");

class UserAndClanLock {
    static getInstance() {
        if (!UserAndClanLock.instance) {
            UserAndClanLock.instance = new UserAndClanLock();
        }
        return UserAndClanLock.instance;
    }

    constructor() {
        this.userLock = UserLock.getInstance();
        this.clanLock = ClanLock.getInstance();
    }

    async run(uid, clanId, task) {
        // First, acquire the lock for the user
        return this.userLock.run(uid, async () => {
            // Once the user lock is acquired, then acquire the clan lock
            return this.clanLock.run(clanId, task);
        });
    }
}

module.exports = UserAndClanLock;
