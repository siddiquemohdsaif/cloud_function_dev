const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for LuckyShot
let luckyShotCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if LuckyShot is in cache and not older than 10 seconds
    if (luckyShotCache.data && (now - luckyShotCache.timestamp) < 10000) {
        return luckyShotCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const luckyShot = await firestoreManager.readDocument("Data", "LuckyShot", "/");
        luckyShotCache = {
            data: luckyShot,
            timestamp: now
        };
        return luckyShot;
    }
};

module.exports = {
    get
};
