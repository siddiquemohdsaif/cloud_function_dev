const FirestoreManager = require("../Firestore/FirestoreManager");
const ChestHandler = require("./ChestHandler");
const firestoreManager = FirestoreManager.getInstance();
const ChestCache = require('./StaticDocument/Data/Chest');

const collectPointerToTrophy = (collectPointer) => {
    const league = collectPointer.league;
    const tier = collectPointer.tier;
    let item = collectPointer.item;

    if(item== 0){
        item = 1;
    }

    const trophy = (league -1) * 1200 + (tier -1) * 400 + (item -1) * 100;

    return trophy;
}


const advanceCollectPointer = (collectPointer) => {

    if(collectPointer.item < 4){
        collectPointer.item ++;

    }else{

        collectPointer.item = 0;
        if(collectPointer.tier < 3){

            collectPointer.tier ++;

        }else{

            collectPointer.tier = 1;
            collectPointer.league ++;
        }
    }
}


const unlockAvatar = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the avatarDoc and the avatar array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.avatarUnlocked) {
            if (!UnlockedDataDoc.avatarUnlocked.some(avatar => avatar.id === id)) {
                // If not present, add the id to the avatar array
                UnlockedDataDoc.avatarUnlocked.push({id :id});
                
                // Update the document in Firestore with the new avatar array
                await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { avatarUnlocked: UnlockedDataDoc.avatarUnlocked });
            }
        } else {
            // Handle case where avatarDoc or avatar array doesn't exist
            throw new Error("Avatar document or avatar array not found.");
        }
    } catch (error) {
        throw new Error("Error unlocking avatar:", error.message);
    }
}

const unlockFrame = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the frameDoc and the frame array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.frameUnlocked) {
            // Check if the frame id is not already in the user's frame array
            if (!UnlockedDataDoc.frameUnlocked.some(frame => frame.id === id)) {
                // If not present, add the id to the frame array
                UnlockedDataDoc.frameUnlocked.push({id :id});
                
                // Update the document in Firestore with the new frame array
                await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { frameUnlocked: UnlockedDataDoc.frameUnlocked });
            }
        } else {
            // Handle case where frameDoc or frame array doesn't exist
            throw new Error("Frame document or frame array not found.");
        }
    } catch (error) {
        throw new Error("Error unlocking frame: " + error.message);
    }
}


const unlockEmoji = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the emojiDoc and the emoji array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.emojiUnlocked) {
            // Check if the emoji id is not already in the user's emoji array
            if (!UnlockedDataDoc.emojiUnlocked.some(emoji => emoji.id === id)) {
                // If not present, add the id to the emoji array
                UnlockedDataDoc.emojiUnlocked.push({id :id});
                
                // Update the document in Firestore with the new emoji array
                await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { emojiUnlocked: UnlockedDataDoc.emojiUnlocked });
            }
        } else {
            // Handle case where emojiDoc or emoji array doesn't exist
            throw new Error("Emoji document or emoji array not found.");
        }
    } catch (error) {
        throw new Error("Error unlocking emoji: " + error.message);
    }
}

const giveChest = async (uid, gameData, chestType) => {
    try {
        // Get Chest document from db
        const chest = await ChestCache.get();

        // check is alread have currentOpenChest chest in profile
        if(gameData.chestData.currentOpenChest != null){
            throw new Error("you already have a currentOpenChest chest, free it first!");
        }

        // generate premium chest
        const chestDetail = chest.ChestInfo[chestType];
        const generatedChest = await ChestHandler.generateChest(uid, chestType, chestDetail, chest.CardConstraint , chest.SplitInfo, chest.cardExchangeCoin);

        // Add premium chest to user's game data
        gameData.chestData.currentOpenChest = generatedChest;

    } catch (error) {
        console.error(error);
        throw new Error("Error in give chest: " + error.message);
    }
}


const giveCardsToUnlockCard = async (uid, type, id, unit) => {

    // Determine the max level and Firestore path based on type
    let unlockType, unlockData;
    if (type === "striker") {
        unlockType = "strikerUnlocked";
    } else if (type === "power") {
        unlockType = "powerUnlocked";
    } else if (type === "puck") {
        unlockType = "puckUnlocked";
    } else {
        throw new Error("Invalid type.");
    }

    // Read existing unlock data from Firestore
    const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
    // console.log(UnlockedDataDoc);
    unlockData = UnlockedDataDoc[unlockType];


    if (unlockData) {
        // console.log(unlockData);
    
        // Find the item with the matching id in the unlockData array
        const existingItem = unlockData.find(item => item.id === id);
    
        if (existingItem) {
            // If the item exists, update the collected value
            existingItem.collected += unit;
            // console.log(`Updated item:`, existingItem);
    
            // Update the document in Firestore with the updated unlockData array
            await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { [unlockType]: unlockData });
        } else {
            // If not present, add the item to the unlocked array
            unlockData.push({ id: id, level: 0, collected: unit });
            // console.log(`Added new item:`, { id: id, level: 0, collected: unit });
    
            // Update the document in Firestore with the new unlockData array
            await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { [unlockType]: unlockData });
        }
    } else {
        // Handle case where unlockData or unlocked array doesn't exist
        throw new Error(`${unlockType} UnlockData document or unlocked array not found.`);
    }
}


const consumeLeagueReward = async (item, gameData, uid) => {

    if(item.type == "coins"){

        gameData.coins += item.unit;

    }else if(item.type == "gems"){

        gameData.gems += item.unit;

    }else if(item.type == "lucky_shot"){

        gameData.luckyShot.extra += item.unit;

    }else if(item.type == "avatar"){

        await unlockAvatar(item.id, uid);

    }else if(item.type == "frame"){

        await unlockFrame(item.id, uid);
        
    }else if(item.type == "emoji"){

        await unlockEmoji(item.id, uid);
        
    }else if(item.type == "silver_chest" || item.type == "golden_chest" || item.type == "epic_chest" || item.type == "legendary_chest"){
        
        await giveChest(uid, gameData, item.type.toUpperCase());

    }else if(item.type == "striker" || item.type == "power" || item.type == "puck"){
        
        await giveCardsToUnlockCard(uid, item.type, item.id, item.unit);

    }else{

        throw new Error("Error in giveReward, item type not matched type: " + item.type);

    }
    
}



const collectPointerItem = async (uid) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");
        const leagueDoc = await firestoreManager.readDocument("Data", "League", "/");


        // check is have a enough trophy
        let collectPointer = profileAndGamedata.gameData.leagueData.collectPointer;
        const trophyRequired = collectPointerToTrophy(collectPointer);
        if(trophyRequired > profileAndGamedata.gameData.trophy){
            throw new Error("Error current trophy is less then the trophy required: " + trophyRequired);
        }



        // collect
        const rewardLeagueItems = leagueDoc[`league_${collectPointer.league}_${collectPointer.tier}`];
        const rewardItem = rewardLeagueItems.reward[collectPointer.item];
        await consumeLeagueReward(rewardItem, profileAndGamedata.gameData, uid);



        // update collectPointer
        advanceCollectPointer(collectPointer);


        // Update the user's profile and game data in the database
        const gameData = profileAndGamedata.gameData;
        const updatedData = {"gameData.leagueData.collectPointer": gameData.leagueData.collectPointer,
                             "gameData.coins": gameData.coins,
                             "gameData.gems": gameData.gems,
                             "gameData.luckyShot.extra": gameData.luckyShot.extra,
                             "gameData.chestData.currentOpenChest": gameData.chestData.currentOpenChest,
                            }
        await firestoreManager.updateDocument("Users", uid, "/", updatedData);

        // Return updated profile and game data
        return {profileAndGamedata, rewardItem};

    } catch (error) {
        console.error(error);
        throw new Error("Error in premium chest fulfillment: " + error.message);
    }
};



module.exports = {
    collectPointerItem
}