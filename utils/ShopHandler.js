const FirestoreManager = require("../Firestore/FirestoreManager");
const ChestHandler = require("./ChestHandler");
const firestoreManager = FirestoreManager.getInstance();
const ChestCache = require('./StaticDocument/Data/Chest');
const ShopCache = require('./StaticDocument/Data/Shop');


const getCoinsBuyOperator = async (type) => {
    const Shop = await ShopCache.get();
    const goldBuyInfo = Shop.gold;

    // Find the matching type in the goldBuyInfo array
    const buyInfo = goldBuyInfo.find(item => item.type === type);

    // If no matching type is found, return error
    if (!buyInfo) {
        throw new Error("Invalid coinsId: " + type);
    }

    // Return the coins to add and gems to deduct based on the found type
    return {
        coinsToAdd: buyInfo.givenCoins,
        gemsToDeduct: buyInfo.gemsRequired
    };
};


const getCoinsBuyOperatorFlexible = async (coins) => {
    const Shop = await ShopCache.get();
    const goldBuyInfo = Shop.gold;

    // Determine the rate based on coins and goldBuyInfo
    let Rate = 0;
    for (const info of goldBuyInfo) {
        if (coins <= info.givenCoins) {
            Rate = info.givenCoins / info.gemsRequired;
            break; // Found the correct rate, no need to continue looping
        }
    }

    // Handle case where coins amount is larger than any givenCoins option
    if (Rate === 0 && goldBuyInfo.length > 0) {
        const lastInfo = goldBuyInfo[goldBuyInfo.length - 1];
        Rate = lastInfo.givenCoins / lastInfo.gemsRequired;
    }

    // Calculate gemsToDeduct as an integer
    let gemsToDeduct = Math.round(coins / Rate);
    if (gemsToDeduct === 0) {
        gemsToDeduct = 1;
    }

    return {
        coinsToAdd: coins,
        gemsToDeduct: gemsToDeduct
    };
};


const coinsBuy = async (uid, coinsId) => {
    try {

        const coinsbuyOperator = await getCoinsBuyOperator(coinsId);

        // Fetch the user's data.
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        if (profileAndGamedata.gameData.gems < coinsbuyOperator.gemsToDeduct) {
            throw new Error("not enough gems");
        }

        profileAndGamedata.gameData.gems -= coinsbuyOperator.gemsToDeduct;
        profileAndGamedata.gameData.coins += coinsbuyOperator.coinsToAdd;

        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.coins": profileAndGamedata.gameData.coins,
            "gameData.gems": profileAndGamedata.gameData.gems,
        });

        return profileAndGamedata;

    } catch (error) {
        console.error(error);
        throw new Error("Error in coins buy: " + error.message);
    }
};

const coinsBuyFlexible = async (uid, coins) => {
    try {

        const coinsbuyOperator = await getCoinsBuyOperatorFlexible(coins);

        // Fetch the user's data.
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        if (profileAndGamedata.gameData.gems < coinsbuyOperator.gemsToDeduct) {
            throw new Error("not enough gems");
        }

        profileAndGamedata.gameData.gems -= coinsbuyOperator.gemsToDeduct;
        profileAndGamedata.gameData.coins += coinsbuyOperator.coinsToAdd;

        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.coins": profileAndGamedata.gameData.coins,
            "gameData.gems": profileAndGamedata.gameData.gems,
        });

        return profileAndGamedata;

    } catch (error) {
        console.error(error);
        throw new Error("Error in coins buy: " + error.message);
    }
};


const premiumchestBuy = async (uid, premiumChestId) => {
    try {
        // Get Chest document from db
        const chest = await ChestCache.get();

        // Get User profile and game data from db
        const profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Check if user has enough gems
        const premiumChest = chest.PremiumChest[premiumChestId];
        if (profileAndGamedata.gameData.gems < premiumChest.gemsRequired) {
            throw new Error("Not enough gems");
        }

        // check is alread have currentOpenChest chest in profile
        if (profileAndGamedata.gameData.chestData.currentOpenChest != null) {
            throw new Error("you already have a currentOpenChest chest, free it first!");
        }

        // Deduct gems and generate premium chest
        const chestDetail = chest.ChestInfo[premiumChest.type];

        profileAndGamedata.gameData.gems -= premiumChest.gemsRequired;
        const generatedChest = await ChestHandler.generateChest(uid, premiumChest.type, chestDetail, chest.CardConstraint, chest.SplitInfo, chest.cardExchangeCoin);

        // Add premium chest to user's game data
        profileAndGamedata.gameData.chestData.currentOpenChest = generatedChest;

        // Update profile and game data in db
        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.gems": profileAndGamedata.gameData.gems,
            "gameData.chestData.currentOpenChest": profileAndGamedata.gameData.chestData.currentOpenChest
        });


        // Return updated profile and game data
        return profileAndGamedata;

    } catch (error) {
        console.error(error);
        throw new Error("Error in premium chest buy: " + error.message);
    }
};




const freeChestUnlock = async (uid, chestId) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Check if the user has a free chest available to unlock
        let freeChests = profileAndGamedata.gameData.chestData.freeChests;
        let chestToUnlock = freeChests[chestId];

        if (!chestToUnlock || chestToUnlock.unlockedStartTime !== 0) {
            throw new Error("No free chest available for unlocking or chest is already unlocked");
        }

        // Get the current time
        let currentTime = Date.now();

        // Check if any other chest is already in the unlocking process or fully unlocked
        // for (let chest of freeChests) {
        //     if (chest && chest.unlockedStartTime !== 0) {
        //         let timeElapsed = currentTime - chest.unlockedStartTime;
        //         if (timeElapsed < chest.totalUnlockTime) {
        //             throw new Error("Another chest is already in the unlocking process");
        //         }
        //     }
        // }

        // Update the unlockedStartTime to the current time
        chestToUnlock.unlockedStartTime = Date.now();

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.chestData.freeChests": profileAndGamedata.gameData.chestData.freeChests });


        // Return updated profile and game data
        return profileAndGamedata;
    } catch (error) {
        console.error(error);
        throw new Error("Error in free chest unlocking: " + error.message);
    }
};


const reduceChestOpeningTime = async (uid, chestId) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Check if the user has a free chest available to unlock
        let freeChests = profileAndGamedata.gameData.chestData.freeChests;
        let chestToUnlock = freeChests[chestId];

        if (!chestToUnlock) {
            throw new Error("No free chest available for unlocking");
        }

        // Get the current time
        let currentTime = Date.now();
        let chestUnlockTime = chestToUnlock.unlockedStartTime + chestToUnlock.totalUnlockTime;
        let remainingUnlockTime = chestUnlockTime - currentTime;

        // Reduce the unlockedStartTime based on the condition
        if (remainingUnlockTime < (3 * 60 * 60 * 1000)) {
            // If remaining unlock time is less than 3 hours, reduce by the remaining time
            chestToUnlock.unlockedStartTime -= remainingUnlockTime;
        } else {
            // Otherwise, reduce by 3 hours
            chestToUnlock.unlockedStartTime -= (3 * 60 * 60 * 1000);
        }

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.chestData.freeChests": profileAndGamedata.gameData.chestData.freeChests });

        // Return updated profile and game data
        return profileAndGamedata;
    } catch (error) {
        console.error(error);
        throw new Error("Error in free chest unlocking: " + error.message);
    }
};


const freeChestCompleteRemainingTimeByGems = async (uid, chestId) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Retrieve the specific chest
        let chest = profileAndGamedata.gameData.chestData.freeChests[chestId];

        // Check if the chest is locked and calculate remaining unlock time
        if (!chest || chest.unlockedStartTime === 0) {
            throw new Error("Chest is not locked or does not exist");
        }

        let timeElapsed = Date.now() - chest.unlockedStartTime;
        if (timeElapsed > chest.totalUnlockTime) {
            throw new Error("Chest is already in the unlocked");
        }


        const currentTime = Date.now();
        const remainingTime = chest.unlockedStartTime + chest.totalUnlockTime - currentTime;

        // Calculate gems per millisecond
        const gemsPerMillisecond = chest.OpenNowGems / chest.totalUnlockTime;

        // Calculate the required number of gems
        const gemsRequired = Math.ceil(gemsPerMillisecond * remainingTime);

        // Check if the user has enough gems
        if (profileAndGamedata.gameData.gems < gemsRequired) {
            throw new Error("Not enough gems to unlock the chest");
        }

        // Deduct gems and unlock the chest
        profileAndGamedata.gameData.gems -= gemsRequired;
        chest.unlockedStartTime = currentTime - chest.totalUnlockTime; // Setting the start time to a value that makes the chest unlocked

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.gems": profileAndGamedata.gameData.gems,
            "gameData.chestData.freeChests": profileAndGamedata.gameData.chestData.freeChests
        });


        // Return updated profile and game data
        return profileAndGamedata;
    } catch (error) {
        console.error(error);
        throw new Error("Error in completing chest unlock time with gems: " + error.message);
    }
};



const freeChestOpenNowByGems = async (uid, chestId) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Retrieve the specific chest
        let chest = profileAndGamedata.gameData.chestData.freeChests[chestId];

        // Check if the chest is locked and calculate remaining unlock time
        if (!chest || chest.unlockedStartTime !== 0) {
            throw new Error("Chest is not locked or does not exist");
        }

        const currentTime = Date.now();

        // Calculate the required number of gems
        const gemsRequired = chest.OpenNowGems;

        // Check if the user has enough gems
        if (profileAndGamedata.gameData.gems < gemsRequired) {
            throw new Error("Not enough gems to unlock the chest");
        }

        // Deduct gems and unlock the chest
        profileAndGamedata.gameData.gems -= gemsRequired;
        chest.unlockedStartTime = currentTime - chest.totalUnlockTime; // Setting the start time to a value that makes the chest unlocked

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.gems": profileAndGamedata.gameData.gems,
            "gameData.chestData.freeChests": profileAndGamedata.gameData.chestData.freeChests
        });

        // Return updated profile and game data
        return profileAndGamedata;
    } catch (error) {
        console.error(error);
        throw new Error("Error in completing chest unlock time with gems: " + error.message);
    }
};

const tapOpenFreeChest = async (uid, chestId) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Get the specific free chest
        let freeChest = profileAndGamedata.gameData.chestData.freeChests[chestId];

        // Check if the chest is available and the unlock time has elapsed
        const currentTime = Date.now();
        if (!freeChest || freeChest.unlockedStartTime === 0 || currentTime < freeChest.unlockedStartTime + freeChest.totalUnlockTime) {
            throw new Error("Chest is not available or unlock time has not elapsed");
        }

        // transfer this free chest to currentOpenChet to open it and show animation later do fullfillment
        profileAndGamedata.gameData.chestData.currentOpenChest = { type: freeChest.type, cards: freeChest.cards };

        // Remove the chest from the user's data after opening
        profileAndGamedata.gameData.chestData.freeChests[chestId] = null;

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.chestData": profileAndGamedata.gameData.chestData });

        // Return updated profile and game data
        return profileAndGamedata;
    } catch (error) {
        console.error(error);
        throw new Error("Error in free chest fulfillment: " + error.message);
    }
};


const claimClanWarReward = async (uid) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGameData = await firestoreManager.readDocument("Users", uid, "/");

        // Get the clan war chest
        let clanWarChest = profileAndGameData.gameData.chestData.clanWarChest;

        // Check if the clan war chest is available
        if (!clanWarChest) {
            throw new Error("Clan war chest is not available");
        }

        // Transfer the clan war chest to currentOpenChest to open it and show animation later do fulfillment
        profileAndGameData.gameData.chestData.currentOpenChest = {
            type: clanWarChest.type,
            cards: clanWarChest.cards
        };

        // Remove the clan war chest from the user's data after opening
        profileAndGameData.gameData.chestData.clanWarChest = null;

        //give coins and gems of clan war reward
        profileAndGameData.gameData.coins += Number(clanWarChest.coins);
        profileAndGameData.gameData.gems += Number(clanWarChest.gems);

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.chestData": profileAndGameData.gameData.chestData,
            "gameData.coins": profileAndGameData.gameData.coins,
            "gameData.gems": profileAndGameData.gameData.gems,
        });

        // Return updated profile and game data
        return profileAndGameData;
    } catch (error) {
        console.error(error);
        throw new Error("Error in clan war chest fulfillment: " + error.message);
    }
};




const currentOpenChestFulfillment = async (uid) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");

        // Check if the user has a current open chest
        if (!profileAndGamedata.gameData.chestData.currentOpenChest) {
            throw new Error("No current open chest available");
        }

        // Process the chest get
        const chest = profileAndGamedata.gameData.chestData.currentOpenChest;

        // Apply chest rewards to the user's profile and user data
        profileAndGamedata.gameData = await ChestHandler.applyRewards(uid, profileAndGamedata, chest);

        // Remove the current open chest from the user's data after opening
        profileAndGamedata.gameData.chestData.currentOpenChest = null;

        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", {
            "gameData.coins": profileAndGamedata.gameData.coins,
            "gameData.gems": profileAndGamedata.gameData.gems,
            "gameData.chestData": profileAndGamedata.gameData.chestData
        });

        // Return updated profile and game data
        return profileAndGamedata;

    } catch (error) {
        console.error(error);
        throw new Error("Error in premium chest fulfillment: " + error.message);
    }
};





module.exports = {
    coinsBuy,
    coinsBuyFlexible,
    premiumchestBuy,
    freeChestUnlock,
    freeChestCompleteRemainingTimeByGems,
    freeChestOpenNowByGems,
    tapOpenFreeChest,
    claimClanWarReward,
    currentOpenChestFulfillment,
    reduceChestOpeningTime
};

