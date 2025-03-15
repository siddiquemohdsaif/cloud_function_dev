const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for Chest
let chestCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if Chest is in cache and not older than 10 seconds
    if (chestCache.data && (now - chestCache.timestamp) < 10000) {
        return chestCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const chest = await firestoreManager.readDocument("Data", "Chest", "/");
        chestCache = {
            data: chest,
            timestamp: now
        };
        return chest;
    }
};

module.exports = {
    get
};
