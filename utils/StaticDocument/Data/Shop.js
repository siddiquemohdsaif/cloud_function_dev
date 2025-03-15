const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for Shop
let shopCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if Shop is in cache and not older than 10 seconds
    if (shopCache.data && (now - shopCache.timestamp) < 10000) {
        return shopCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const shop = await firestoreManager.readDocument("Data", "Shop", "/");
        shopCache = {
            data: shop,
            timestamp: now
        };
        return shop;
    }
};

module.exports = {
    get
};
