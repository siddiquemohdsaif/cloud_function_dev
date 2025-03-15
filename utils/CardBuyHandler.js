const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");

const buyStrikerCards = async (uid, strikerId, noOfCards) => {
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
        const collectedCards = unlockedStrikerIdData.collected;
        const newCollectedCards = collectedCards + noOfCards;
        

        // Determine max level dynamically
        const maxLevel = Object.keys(strikerIdInfo).filter(key => key.startsWith('level')).length;
        if(currentLevel >= maxLevel){
            // already max
            throw new Error("Striker level is already MAX : " + currentLevel);
        }

        const singleCardValue = StrikerInfo.SingleCardValue[getStrikerCategoryById(strikerId, StrikerInfo)];

        if(singleCardValue == null || singleCardValue == 0){
            throw new Error("Single Card Value null or 0 ");
        }

        const coinRequired = singleCardValue * noOfCards;

        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade Striker");
        }
        
        unlockedStrikerIdData.collected = newCollectedCards;
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin
 
        // update userStrikerUnlockedDoc to firebaseDatabase
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", {strikerUnlocked : UnlockedDataDoc.strikerUnlocked});


        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins});


        return { strikerUnlocked : UnlockedDataDoc.strikerUnlocked, profileAndGamedata};

    } catch (error) {
        console.error(error);
        throw new Error("Error in upgradeStriker inner : " + error.message);
    }
};


const buyPowerCards = async (uid, powerId, noOfCards) => {
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
        const collectedCards = unlockedPowerData.collected;
        const newCollectedCards = collectedCards + noOfCards;

        // Dynamically determine max level
        const maxLevel = Object.keys(powerInfoById).filter(key => key.startsWith('level')).length;
        if (currentLevel >= maxLevel) {
            throw new Error("Power level is already MAX : " + currentLevel);
        }

        // Check if user has required cards for upgrade
        const singleCardValue = PowerInfo.SingleCardValue[getPowerCategoryById(powerId, PowerInfo)];

        if(singleCardValue == null || singleCardValue == 0){
            throw new Error("Single Card Value null or 0 ");
        }
        const coinRequired = singleCardValue * noOfCards;
        
        if(profileAndGamedata.gameData.coins < coinRequired){
            throw new Error("Not enough coins to upgrade Striker");
        }

        unlockedPowerData.collected = newCollectedCards; 
        profileAndGamedata.gameData.coins -= coinRequired; // deduct coin


        // Update user's power data in Firestore
        await firestoreManager.updateDocument("UnlockData", uid, "/Data/UserData", { powerUnlocked: UnlockedDataDoc.powerUnlocked });


        // update profileAndGamedata
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.coins": profileAndGamedata.gameData.coins});


        return { powerUnlocked : UnlockedDataDoc.powerUnlocked, profileAndGamedata };

    } catch (error) {
        console.error(error);
        throw new Error("Error in upgradePower inner : " + error.message);
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

const getPowerCategoryById = (id, PowerInfo) => {
    // Combine all powers into one array
    const allPowers = [
        ...PowerInfo.Normal || [],
        ...PowerInfo.Rare || [],
        ...PowerInfo.Epic || [],
        ...PowerInfo.Legendary || []
    ];

    // Find the power with the given id
    const power = allPowers.find(power => power.id === id);

    // If the power is found, return its category
    if (power) {
        // Determine which category the power belongs to
        if (PowerInfo.Normal && PowerInfo.Normal.includes(power)) return "normal";
        if (PowerInfo.Rare && PowerInfo.Rare.includes(power)) return "rare";
        if (PowerInfo.Epic && PowerInfo.Epic.includes(power)) return "epic";
        if (PowerInfo.Legendary && PowerInfo.Legendary.includes(power)) return "legendary";
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

const getStrikerCategoryById = (id, StrikerInfo) => {
    // Combine all strikers into one array
    const allStrikers = [
        ...StrikerInfo.Normal || [],
        ...StrikerInfo.Rare || [],
        ...StrikerInfo.Epic || [],
        ...StrikerInfo.Legendary || []
    ];

    // Find the striker with the given id
    const striker = allStrikers.find(striker => striker.id === id);

    // If the striker is found, return its category
    if (striker) {
        // Determine which category the striker belongs to
        if (StrikerInfo.Normal && StrikerInfo.Normal.includes(striker)) return "normal";
        if (StrikerInfo.Rare && StrikerInfo.Rare.includes(striker)) return "rare";
        if (StrikerInfo.Epic && StrikerInfo.Epic.includes(striker)) return "epic";
        if (StrikerInfo.Legendary && StrikerInfo.Legendary.includes(striker)) return "legendary";
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



module.exports = {
    buyStrikerCards,
    buyPowerCards
};
