const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for Event
let eventCache = {
    data: null,
    timestamp: null
};

const getEvent = async () => {
    const now = new Date().getTime();
    // Check if Event is in cache and not older than 10 seconds
    if (eventCache.data && (now - eventCache.timestamp) < 10000) {
        return eventCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const event = await firestoreManager.readDocument("Data", "Event", "/");
        eventCache = {
            data: event,
            timestamp: now
        };
        return event;
    }
};

module.exports = {
    getEvent
};
