const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const ChestCache = require('../utils/StaticDocument/Data/Chest');
const ChestHandler = require("../utils/ChestHandler");

const createChest = async (uid)=>{
 // Get Chest document from db
 const chestData = await ChestCache.get();

 // Determine the chest type based on probabilities
 const chestType = "LEGENDARY_CHEST";

 // Generate the chest
 const chestDetail = chestData.ChestInfo[chestType];
 const chest = await ChestHandler.generateChest(uid, chestType, chestDetail, chestData.CardConstraint , chestData.SplitInfo, chestData.cardExchangeCoin);

 console.log(chest);
}

createChest("w7KHmL5lKUNQ0SWb");