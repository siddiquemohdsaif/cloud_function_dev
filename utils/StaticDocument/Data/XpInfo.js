const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for XpInfo
let xpInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if XpInfo is in cache and not older than 10 seconds
    if (xpInfoCache.data && (now - xpInfoCache.timestamp) < 10000) {
        return xpInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const xpInfo = await firestoreManager.readDocument("Data", "XpInfo", "/");
        xpInfoCache = {
            data: xpInfo,
            timestamp: now
        };
        return xpInfo;
    }
};

module.exports = {
    get
};
