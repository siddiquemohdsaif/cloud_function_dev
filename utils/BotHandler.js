const FirestoreManager = require("../Firestore/FirestoreManager");

const firestoreManager = FirestoreManager.getInstance();





const refillAllBot = async() => {

    //refill bot level : 1
    // await refillBot(1, 10000);
    //await refillBot(3, 20000);
    //await refillBot(7, 50000);
    //await refillBot(10, 100000);

}


const refillBot = async(level, minCoin) => {
    //load all bot info
    let botInfo = await firestoreManager.readDocument("Data", `BotAccountsLvl${level}`, "/");

    //update all bot profile one by one
    // console.log(botInfo)
    delete botInfo._id;

    if (botInfo) {
        // Iterate through each bot in the collection
        Object.entries(botInfo).forEach(async ([botId, botData]) => {
            let uid = botData.uid;
            let profile = await firestoreManager.readDocument("Users", uid, "/");
            // console.log(`Bot ${botData.uid} : coins:${profile.gameData.coins}`);
            if(profile.gameData.coins < minCoin){
                await firestoreManager.updateDocument("Users", uid, "/", {"gameData.coins":   minCoin});
            }
        });
    } 

}








module.exports = {
    refillAllBot
}



refillAllBot();
























