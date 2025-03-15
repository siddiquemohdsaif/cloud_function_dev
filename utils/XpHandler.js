const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for XpInfo
let xpInfoCache = {
    data: null,
    timestamp: null
};

const getXpInfo = async () => {
    const now = new Date().getTime();
    // Check if xpInfo is in cache and not older than 10 seconds
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

const IncreaseXp = async (profileAndGamedata, xpIncreased) => {
    // Retrieve XP Information from cache or Firestore
    const XpInfo = await getXpInfo();

    // Extract current XP and Level
    let currentXp = profileAndGamedata.gameData.xp.y;
    let currentLevel = profileAndGamedata.gameData.xp.x;
    let requiredXp = XpInfo.requiredXpPerlevel[currentLevel];

    // Calculate new XP
    let newXp = currentXp + xpIncreased;

    // Determine if level-up occurs
    while (newXp >= requiredXp && requiredXp !== -1) {
        newXp -= requiredXp; // Subtract the XP required for the current level
        currentLevel++; // Increment the level
        requiredXp = XpInfo.requiredXpPerlevel[currentLevel];
    }

    // Update the gameData with new XP, Level, and required XP for the next level
    profileAndGamedata.gameData.xp.x = currentLevel;
    profileAndGamedata.gameData.xp.y = newXp;
    profileAndGamedata.gameData.xp.z = requiredXp;
};


const IncreasedXpByWin = async (profileAndGamedata) => {
    // Retrieve XP Information from cache or Firestore
    const XpInfo = await getXpInfo();

    // get game-win xp count from XpInfo
    const xpIncreased = XpInfo.gamePlayXp + XpInfo.gameWonXp;

    // increase Xp
    await IncreaseXp(profileAndGamedata, xpIncreased);
}


const IncreasedXpByLose = async (profileAndGamedata) => {
    // Retrieve XP Information from cache or Firestore
    const XpInfo = await getXpInfo();

    // get game-win xp count from XpInfo
    const xpIncreased = XpInfo.gamePlayXp;
    
    // increase Xp
    await IncreaseXp(profileAndGamedata, xpIncreased);
}

const IncreasedXpByCardUpgrade = async (profileAndGamedata, level) => {
    // Retrieve XP Information from cache or Firestore
    const XpInfo = await getXpInfo();

    // get game-win xp count from XpInfo
    const xpIncreased = XpInfo.cardUpgadeXp[level];

    // increase Xp
    await IncreaseXp(profileAndGamedata, xpIncreased);
}


module.exports = {
    IncreaseXp,
    IncreasedXpByWin,
    IncreasedXpByLose,
    IncreasedXpByCardUpgrade
};
