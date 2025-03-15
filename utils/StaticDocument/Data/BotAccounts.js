const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestore = FirestoreManager.getInstance();

// Global cache for bot accounts data
let botAccountsCache = {
    data: null,
    timestamp: null
};

const getBotAccounts = async () => {
    const now = new Date().getTime();

    // Check if data is in cache and not older than 10 seconds
    if (botAccountsCache.data && (now - botAccountsCache.timestamp) < 10000) {
        return botAccountsCache.data;  // Return cached data
    } else {
        // Fetch new data from Firestore and combine data for all levels
        const combinedData = {};
        await Promise.all([1, 3, 7, 10].map(async (level) => {
            const botAccountsData = await firestore.readDocument("Data", `BotAccountsLvl${level}`, "/");
            Object.entries(botAccountsData).forEach(([key, bot])  => {
                combinedData[bot.uid] = { uid: bot.uid, key: key, level: level };
            });
        }));

        botAccountsCache = {
            data: combinedData,
            timestamp: now
        };
        return combinedData;
    }
};


module.exports = {
    getBotAccounts,
};
