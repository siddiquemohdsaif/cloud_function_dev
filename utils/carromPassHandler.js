const FirestoreManager = require("../Firestore/FirestoreManager");
const ChestHandler = require("./ChestHandler");
const firestoreManager = FirestoreManager.getInstance();
const ChestCache = require('./StaticDocument/Data/Chest');
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("./StaticDocument/GameInfo/PuckInfo");
const CarromPassCache = require("./StaticDocument/Data/CarromPass");

const secondSeasonEndTime = async () => {
    // Season end at 1/x_month/x_year at 5:00:00 AM


    const carromPass = await CarromPassCache.get();
    if(carromPass.secondSeasonEndTime){
        return carromPass.secondSeasonEndTime;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();
    
    // Calculate the month of the second season end
    let secondSeasonMonth = currentMonth + 2;
    let secondSeasonYear = currentYear;
    
    // If the month goes beyond December, adjust the year and month
    if (secondSeasonMonth > 11) {
        secondSeasonMonth -= 12;
        secondSeasonYear += 1;
    }
    
    // Create the date for the second season end in UTC
    const secondSeasonEndDate = new Date(Date.UTC(secondSeasonYear, secondSeasonMonth, 1, 5, 0, 0));

    // India Standard Time (IST) is UTC+5:30
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // Offset in milliseconds
    const IndiaTime = secondSeasonEndDate.getTime() - IST_OFFSET;

    return IndiaTime;
};



const isUnlocked = (items, itemIndex, carromPoint, carromPointRequiredPerLevel) => {

    // check item index exist
    if(itemIndex >= items.length){
        throw new Error("Error in isUnlocked, no item availabe at: " + itemIndex);
    }

    // check is item unlocked
    if(itemIndex <= carromPoint/carromPointRequiredPerLevel){
        return true;
    }else{
        return false;
    }
}

const isUnlockedPointer = (items, itemIndex, carromPoint, carromPointRequiredPerLevel) => {

    // check item index exist
    if(itemIndex > items.length){
        throw new Error("Error in isUnlocked, no item availabe at: " + itemIndex);
    }

    // check is item unlocked
    if(itemIndex <= carromPoint/carromPointRequiredPerLevel){
        return true;
    }else{
        return false;
    }
}


const unlockAvatarTemp = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the avatarDoc and the avatar array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.avatarUnlocked) {
            // Check if the avatar id is not already in the user's avatar array
            if (!UnlockedDataDoc.avatarUnlocked.some(avatar => avatar.id === id)) {
                // If not present, add the id to the avatar array
                UnlockedDataDoc.avatarUnlocked.push({id :id, valid : await secondSeasonEndTime() });
                
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

const unlockFrameTemp = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the frameDoc and the frame array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.frameUnlocked) {
            // Check if the frame id is not already in the user's frame array
            if (!UnlockedDataDoc.frameUnlocked.some(frame => frame.id === id)) {
                // If not present, add the id to the frame array
                UnlockedDataDoc.frameUnlocked.push({id :id, valid : await secondSeasonEndTime() });
                
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


const unlockEmojiTemp = async (id, uid) => {
    try {
        const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
        
        // Check if the emojiDoc and the emoji array within it exist
        if (UnlockedDataDoc && UnlockedDataDoc.emojiUnlocked) {
            // Check if the emoji id is not already in the user's emoji array
            if (!UnlockedDataDoc.emojiUnlocked.some(emoji => emoji.id === id)) {
                // If not present, add the id to the emoji array
                UnlockedDataDoc.emojiUnlocked.push({id :id, valid : await secondSeasonEndTime() });
                
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

const unlockTempMaxCard = async (uid, type, id) => {
    const CacheDocumentPromises = [
        StrikerInfoCache.get(),
        PowerInfoCache.get(),
        PuckInfoCache.get()
    ];

    // Use Promise.all to fetch all documents in parallel
    const [StrikerInfo, PowerInfo, PuckInfo] = await Promise.all(CacheDocumentPromises);

    // Determine the max level and Firestore path based on type
    let MaxLevel, unlockType, unlockData;
    if (type === "striker") {
        MaxLevel = findMaxLevel(id, StrikerInfo);
        unlockType = "strikerUnlocked";
    } else if (type === "power") {
        MaxLevel = findMaxLevel(id, PowerInfo);
        unlockType = "powerUnlocked";
    } else if (type === "puck") {
        MaxLevel = findMaxLevel(id, PuckInfo);
        unlockType = "puckUnlocked";
    } else {
        throw new Error("Invalid type.");
    }

    if (MaxLevel == null) {
        throw new Error("Card not found.");
    }

    // Read existing unlock data from Firestore
    const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");
    unlockData = UnlockedDataDoc[unlockType];

    // Check if the unlockData and the unlocked array within it exist
    if (unlockData) {
        // Check if the item id is not already in the user's unlocked array
        if (!unlockData.some(item => item.id === id)) {
            // If not present, add the item to the unlocked array
            unlockData.push({ id: id, level: MaxLevel, collected: 0, valid : await secondSeasonEndTime() });
            
            // Update the document in Firestore with the new unlocked array
            await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { [unlockType]: unlockData });
        }
    } else {
        // Handle case where unlockData or unLocked array doesn't exist
        throw new Error(`${unlockType} UnlockData document or unLocked array not found.`);
    }
}


const findMaxLevel = (id, CardInfo) => {
    // Iterate over each rarity type to find the card with the given id
    for (const rarityType in CardInfo) {
      if(rarityType == "_id"){
        continue;
      }
      const cards = CardInfo[rarityType];
      //console.log(rarityType);
      const card = cards.find(card => card.id === id);
      if (card) {
        const maxLevelTemp = Object.keys(card)
            .filter(key => key.startsWith('level'))
            .length; // Determine the maximum level for the card
        return maxLevelTemp;
      }
    }
    return null; // Return null if the card with the given id is not found
};
  

const consumeCarromPassReward = async (items, itemIndex, gameData, uid) => {

    const item = items[itemIndex];

    if(item.type == "coins"){

        gameData.coins += item.unit;

    }else if(item.type == "gems"){

        gameData.gems += item.unit;

    }else if(item.type == "lucky_shot"){

        gameData.luckyShot.extra += item.unit;

    }else if(item.type == "avatar"){

        await unlockAvatarTemp(item.id, uid);

    }else if(item.type == "frame"){

        await unlockFrameTemp(item.id, uid);
        
    }else if(item.type == "emoji"){

        await unlockEmojiTemp(item.id, uid);
        
    }else if(item.type == "silver_chest" || item.type == "golden_chest" || item.type == "epic_chest" || item.type == "legendary_chest"){
        
        await giveChest(uid, gameData, item.type.toUpperCase());

    }else if(item.type == "striker" || item.type == "power" || item.type == "puck"){
        
        await unlockTempMaxCard(uid, item.type, item.id);

    }else{

        throw new Error("Error in giveReward, item type not matched type: " + item.type);

    }
    

    return item;

}



const collectItemAtIndex = async (uid, itemIndex, isPremiumMemberIndex) => {
    try {
        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");
        let isPremiumMember = profileAndGamedata.gameData.carromPass.isPremiumMember;

        if(isPremiumMemberIndex && !isPremiumMember){
            throw new Error("Item is only available for PremiumMember at: " + itemIndex);
        }

        // get items
        let items;
        let carromPointRequiredPerLevel;
        const carromPoint = profileAndGamedata.gameData.carromPass.carromPoints;
        if(isPremiumMemberIndex){

            const carromPassDoc = await firestoreManager.readDocumentWithProjection("Data", "CarromPass", "/", {premium : 1, carromPointsRequired : 1});
            items = carromPassDoc.premium;
            carromPointRequiredPerLevel = carromPassDoc.carromPointsRequired;
        }else{
            const carromPassDoc = await firestoreManager.readDocumentWithProjection("Data", "CarromPass", "/", {free : 1,  carromPointsRequired : 1});
            items = carromPassDoc.free;
            carromPointRequiredPerLevel = carromPassDoc.carromPointsRequired;
        }


        // Check is item unlocked or not
        if(!isUnlocked(items, itemIndex, carromPoint, carromPointRequiredPerLevel)){
            throw new Error("Item is not unlocked yet at : " + itemIndex);
        }

        // Check if the item is already collected
        if (isPremiumMemberIndex) {
            if (profileAndGamedata.gameData.carromPass.collectedPremium.includes(itemIndex)) {
                throw new Error("Item has already been collected at: " + itemIndex);
            }
        } else {
            if (profileAndGamedata.gameData.carromPass.collectedFree.includes(itemIndex)) {
                throw new Error("Item has already been collected at: " + itemIndex);
            }
        }
        


        // consumeItem
        await consumeCarromPassReward(items, itemIndex, profileAndGamedata.gameData, uid);
        
        
        // update collect
        if(isPremiumMemberIndex){
            profileAndGamedata.gameData.carromPass.collectedPremium.push(itemIndex);
        }else{
            profileAndGamedata.gameData.carromPass.collectedFree.push(itemIndex);
        }


        // Update the user's profile and game data in the database
        const gameData = profileAndGamedata.gameData;
        const updatedData = {"gameData.carromPass.collectedPremium": gameData.carromPass.collectedPremium,
                             "gameData.carromPass.collectedFree": gameData.carromPass.collectedFree,
                             "gameData.coins": gameData.coins,
                             "gameData.gems": gameData.gems,
                             "gameData.luckyShot.extra": gameData.luckyShot.extra,
                             "gameData.chestData.currentOpenChest": gameData.chestData.currentOpenChest,
                            }
        await firestoreManager.updateDocument("Users", uid, "/", updatedData);

        // Return updated profile and game data
        return {profileAndGamedata, rewardItem : items[itemIndex]};

    } catch (error) {
        console.error(error);
        throw new Error("Error in premium chest fulfillment: " + error.message);
    }
};

const updateLastAnimationPointer = async (uid, newAnimationPointer) => {

    try{

        // Fetch the user's profile and game data from the database
        let profileAndGamedata = await firestoreManager.readDocument("Users", uid, "/");


        // get items
        const carromPoint = profileAndGamedata.gameData.carromPass.carromPoints;
        const carromPassDoc = await firestoreManager.readDocumentWithProjection("Data", "CarromPass", "/", {free : 1, carromPointsRequired : 1});
        const items = carromPassDoc.free;
        const carromPointRequiredPerLevel = carromPassDoc.carromPointsRequired;



        // Check is item unlocked or not
        if(!isUnlockedPointer(items, newAnimationPointer, carromPoint, carromPointRequiredPerLevel)){
            throw new Error("Item is not unlocked yet at : " + newAnimationPointer);
        }

        
        // Update the lastAnimationPointer in the user's game data
        profileAndGamedata.gameData.carromPass.lastAnimationPointer = newAnimationPointer;
    
        // Update the user's profile and game data in the database
        await firestoreManager.updateDocument("Users", uid, "/", { "gameData.carromPass.lastAnimationPointer": profileAndGamedata.gameData.carromPass.lastAnimationPointer });
        
        // Return updated profile and game data
        return profileAndGamedata;

    }catch(error) {
        throw new Error("Error updating last animation pointer: " + error.message);
    }
   
}


module.exports = {
    collectItemAtIndex,
    updateLastAnimationPointer
}