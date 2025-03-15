const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const XpHandler = require("./XpHandler");
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("./StaticDocument/GameInfo/PuckInfo");
const TrailInfoCache = require("./StaticDocument/GameInfo/TrailInfo");

const upgradeStriker = async (uid, strikerId) => {
    try {
        // Retrieve data from Firestore
        const [StrikerInfo, UnlockedDataDoc, profileAndGamedata] = await Promise.all([
            StrikerInfoCache.get(),
            firestoreManager.readDocument("UnlockData", uid, "/Data/UserData"),
            firestoreManager.readDocument("Users", uid, "/")
        ]);

        const strikerIdInfo = getStrikerInfoById(strikerId, StrikerInfo);
        const unlockedStrikerIdData = getStrikerDataById(strikerId, UnlockedDataDoc.strikerUnlocked);

        
        const currentLevel = unlockedStrikerIdData.level;
        const upgradeLevel = unlockedStrikerIdData.level + 1;
        

        // Determine max level dynamically
        const maxLevel = Object.keys(strikerIdInfo).filter(key => key.startsWith('level')).length;
        if(currentLevel >= maxLevel){
            // already max
            throw new Error("Striker level is already MAX : " + currentLevel);
        }

        const upgradeInfo = strikerIdInfo[`level${upgradeLevel}`];
        const cardRequired = upgradeInfo.cardRequired;
        const coinRequired = upgradeInfo.coinRequired;

        if(unlockedStrikerIdData.collected < cardRequired){
            // not have required card to upgrade
            throw new Error("Not have required card to upgrade Striker : " + unlockedStrikerIdData.collected);
        }

        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade Striker");
        }
        
        unlockedStrikerIdData.collected -= cardRequired; // decrease cards for upgrade
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin
        unlockedStrikerIdData.level ++;                  // upgrade level


        // Call IncreasedXpByCardUpgrade
        await XpHandler.IncreasedXpByCardUpgrade(profileAndGamedata, unlockedStrikerIdData.level);


        // update userStrikerUnlockedDoc to firebaseDatabase
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", {strikerUnlocked : UnlockedDataDoc.strikerUnlocked});


        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins, "gameData.xp": profileAndGamedata.gameData.xp });


        return { strikerUnlocked : UnlockedDataDoc.strikerUnlocked, profileAndGamedata};

    } catch (error) {
        console.error(error);
        throw new Error("Error in upgradeStriker inner : " + error.message);
    }
};


const upgradePower = async (uid, powerId) => {
    try {
        // Retrieve data from Firestore
        const [PowerInfo, UnlockedDataDoc, profileAndGamedata] = await Promise.all([
            PowerInfoCache.get(),
            firestoreManager.readDocument("UnlockData", uid, "/Data/UserData"),
            firestoreManager.readDocument("Users", uid, "/")
        ]);

        const powerInfoById = getPowerInfoById(powerId, PowerInfo);
        const unlockedPowerData = getPowerDataById(powerId, UnlockedDataDoc.powerUnlocked);

        // Check current level and determine upgrade feasibility
        const currentLevel = unlockedPowerData.level;
        const upgradeLevel = unlockedPowerData.level + 1;

        // Dynamically determine max level
        const maxLevel = Object.keys(powerInfoById).filter(key => key.startsWith('level')).length;
        if (currentLevel >= maxLevel) {
            throw new Error("Power level is already MAX : " + currentLevel);
        }

        // Check if user has required cards for upgrade
        const upgradeInfo = powerInfoById[`level${upgradeLevel}`];
        const cardRequired = upgradeInfo.cardRequired;
        const coinRequired = upgradeInfo.coinRequired;
        if (unlockedPowerData.collected < cardRequired) {
            throw new Error("Not enough cards to upgrade Power : " + unlockedPowerData.collected);
        }

        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade Striker");
        }

        // Perform upgrade
        unlockedPowerData.collected -= cardRequired; // decrease cards for upgrade
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin
        unlockedPowerData.level++;                   // upgrade level


        // Call IncreasedXpByCardUpgrade
        await XpHandler.IncreasedXpByCardUpgrade(profileAndGamedata, unlockedPowerData.level);


        // Update user's power data in Firestore
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", { powerUnlocked: UnlockedDataDoc.powerUnlocked });


        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins, "gameData.xp": profileAndGamedata.gameData.xp });


        return { powerUnlocked : UnlockedDataDoc.powerUnlocked, profileAndGamedata };

    } catch (error) {
        console.error(error);
        throw new Error("Error in upgradePower inner : " + error.message);
    }
};



const upgradePuck = async (uid, puckId) => {
    try {
        // Retrieve data from Firestore
        const [PuckInfo, UnlockedDataDoc, profileAndGamedata] = await Promise.all([
            PuckInfoCache.get(),
            firestoreManager.readDocument("UnlockData", uid, "/Data/UserData"),
            firestoreManager.readDocument("Users", uid, "/")
        ]);

        const puckInfoById = getPuckInfoById(puckId, PuckInfo);
        const unlockedPuckData = getPuckDataById(puckId, UnlockedDataDoc.puckUnlocked);

        // Check current level and determine upgrade feasibility
        const currentLevel = unlockedPuckData.level;
        const upgradeLevel = unlockedPuckData.level + 1;

        // Dynamically determine max level
        const maxLevel = Object.keys(puckInfoById).filter(key => key.startsWith('level')).length;
        if (currentLevel >= maxLevel) {
            throw new Error("Puck level is already MAX : " + currentLevel);
        }

        // Check if user has required cards for upgrade
        const upgradeInfo = puckInfoById[`level${upgradeLevel}`];
        const cardRequired = upgradeInfo.cardRequired;
        const coinRequired = upgradeInfo.coinRequired;
        if (unlockedPuckData.collected < cardRequired) {
            throw new Error("Not enough cards to upgrade Puck : " + unlockedPuckData.collected);
        }

        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade Puck");
        }

        // Perform upgrade
        unlockedPuckData.collected -= cardRequired; // decrease cards for upgrade
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin
        unlockedPuckData.level++;                    // upgrade level

        // Update user's puck data in Firestore
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", { puckUnlocked: UnlockedDataDoc.puckUnlocked });

        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins });

        return { puckUnlocked : UnlockedDataDoc.puckUnlocked, profileAndGamedata };

    } catch (error) {
        console.error(error);
        throw new Error("Error in updatePuck inner : " + error.message);
    }
};

const upgradeTrail = async (uid, trailId) => {
    try {
        // Retrieve data from Firestore
        const [TrailInfo, UnlockedDataDoc, profileAndGamedata] = await Promise.all([
            TrailInfoCache.get(),
            firestoreManager.readDocument("UnlockData", uid, "/Data/UserData"),
            firestoreManager.readDocument("Users", uid, "/")
        ]);

        const trailInfoById = getTrailInfoById(trailId, TrailInfo);
        const unlockedTrailData = getTrailDataById(trailId, UnlockedDataDoc.trailUnlocked);

        // Check current level and determine upgrade feasibility
        const currentLevel = unlockedTrailData.level;
        const upgradeLevel = unlockedTrailData.level + 1;

        // Dynamically determine max level
        const maxLevel = Object.keys(trailInfoById).filter(key => key.startsWith('level')).length;
        if (currentLevel >= maxLevel) {
            throw new Error("Trail level is already MAX : " + currentLevel);
        }

        // Check if user has required cards for upgrade
        const upgradeInfo = trailInfoById[`level${upgradeLevel}`];
        const cardRequired = upgradeInfo.cardRequired;
        const coinRequired = upgradeInfo.coinRequired;
        if (unlockedTrailData.collected < cardRequired) {
            throw new Error("Not enough cards to upgrade Trail : " + unlockedTrailData.collected);
        }

        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade trail");
        }

        // Perform upgrade
        unlockedTrailData.collected -= cardRequired; // decrease cards for upgrade
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin
        unlockedTrailData.level++;                    // upgrade level

        // Update user's trail data in Firestore
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", { trailUnlocked: UnlockedDataDoc.trailUnlocked });

        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins });

        return { trailUnlocked : UnlockedDataDoc.trailUnlocked, profileAndGamedata };

    } catch (error) {
        console.error(error);
        throw new Error("Error in updateTrail inner : " + error.message);
    }
};



const getPowerInfoById = (id, PowerInfo) => {
    // PowerInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allPowers = [...PowerInfo.Normal, ...PowerInfo.Rare, ...PowerInfo.Epic, ...PowerInfo.Legendary];

    // Find the power with the given id
    const power = allPowers.find(power => power.id === id);

    // If the power is found, return its info; otherwise, throw an error
    if (power) {
        return power;
    } else {
        console.error("Power not found with id:", id);
        throw new Error("Power not found");
    }
};

const getPowerDataById = (powerId, userPowerUnlockedDoc) => {
    // Check if userPowerUnlockedDoc and its unLocked array are valid
    if (!userPowerUnlockedDoc) {
        console.error("Invalid user power unlocked document");
        return null;
    }

    // Find the power data with the given id in the unLocked array
    const powerData = userPowerUnlockedDoc.find(power => power.id === powerId);

    // If the power data is found, return it; otherwise, throw an error
    if (powerData) {
        return powerData;
    } else {
        console.error("Power data not found for id:", powerId);
        throw new Error("Power is not unlocked");
    }
};



const getStrikerInfoById = (id, StrikerInfo) => {
    // StrikerInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allStrikers = [...StrikerInfo.Normal, ...StrikerInfo.Rare, ...StrikerInfo.Epic, ...StrikerInfo.Legendary];

    // Find the striker with the given id
    const striker = allStrikers.find(striker => striker.id === id);

    // If the striker is found, return its info; otherwise, throw an error
    if (striker) {
        return striker;
    } else {
        console.error("Striker not found with id:", id);
        throw new Error("Striker not found");
    }
};


const getStrikerDataById = (strikerId, userStrikerUnlockedDoc) => {
    // Check if userStrikerUnlockedDoc and its unLocked array are valid
    if (!userStrikerUnlockedDoc) {
        console.error("Invalid user striker unlocked document");
        return null;
    }

    // Find the striker data with the given id in the unLocked array
    const strikerData = userStrikerUnlockedDoc.find(striker => striker.id === strikerId);

    // If the striker data is found, return it; otherwise, throw an error
    if (strikerData) {
        return strikerData;
    } else {
        console.error("Striker data not found for id:", strikerId);
        throw new Error("Striker is not unlocked");
    }
};


const getPuckInfoById = (id, PuckInfo) => {
    // PuckInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allPucks = [...PuckInfo.Normal, ...PuckInfo.Rare, ...PuckInfo.Epic, ...PuckInfo.Legendary];

    // Find the puck with the given id
    const puck = allPucks.find(puck => puck.id === id);

    // If the puck is found, return its info; otherwise, throw an error
    if (puck) {
        return puck;
    } else {
        console.error("Puck not found with id:", id);
        throw new Error("Puck not found");
    }
};

const getPuckDataById = (puckId, userPuckUnlockedDoc) => {
    if (!userPuckUnlockedDoc) {
        console.error("Invalid user puck unlocked document");
        return null;
    }

    const puckData = userPuckUnlockedDoc.find(puck => puck.id === puckId);

    if (puckData) {
        return puckData;
    } else {
        console.error("Puck data not found for id:", puckId);
        throw new Error("Puck is not unlocked");
    }
};


const getTrailInfoById = (id, TrailInfo) => {
    // TrailInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allTrails = [...TrailInfo.Normal, ...TrailInfo.Rare, ...TrailInfo.Epic, ...TrailInfo.Legendary];

    // Find the trail with the given id
    const trail = allTrails.find(trail => trail.id === id);

    // If the trail is found, return its info; otherwise, throw an error
    if (trail) {
        return trail;
    } else {
        console.error("Trail not found with id:", id);
        throw new Error("Trail not found");
    }
};

const getTrailDataById = (trailId, userTrailUnlockedDoc) => {
    if (!userTrailUnlockedDoc) {
        console.error("Invalid user trail unlocked document");
        return null;
    }

    const trailData = userTrailUnlockedDoc.find(trail => trail.id === trailId);

    if (trailData) {
        return trailData;
    } else {
        console.error("Trail data not found for id:", trailId);
        throw new Error("Trail is not unlocked");
    }
};


module.exports = {
    upgradeStriker,
    upgradePower,
    upgradePuck,
    upgradeTrail
};
