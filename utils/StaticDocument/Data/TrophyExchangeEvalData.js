const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for TrophyExchangeEvalData
let trophyExchangeEvalDataCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if TrophyExchangeEvalData is in cache and not older than 10 seconds
    if (trophyExchangeEvalDataCache.data && (now - trophyExchangeEvalDataCache.timestamp) < 10000) {
        return trophyExchangeEvalDataCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const trophyExchangeEvalData = await firestoreManager.readDocument("Data", "TrophyExchangeEvalData", "/");
        trophyExchangeEvalDataCache = {
            data: trophyExchangeEvalData,
            timestamp: now
        };
        return trophyExchangeEvalData;
    }
};

module.exports = {
    get
};
