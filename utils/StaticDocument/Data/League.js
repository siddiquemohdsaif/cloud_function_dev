const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for League
let leagueCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if League is in cache and not older than 10 seconds
    if (leagueCache.data && (now - leagueCache.timestamp) < 10000) {
        return leagueCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const league = await firestoreManager.readDocument("Data", "League", "/");
        leagueCache = {
            data: league,
            timestamp: now
        };
        return league;
    }
};

module.exports = {
    get
};
