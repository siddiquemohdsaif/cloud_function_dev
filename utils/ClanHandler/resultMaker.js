const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const UserLock = require('../Lock/UserLock');
const ResourceLock = require('../Lock/ResourceLock');
const ChestCache = require('../StaticDocument/Data/Chest');
const WebSocketHttpClient = require('../WebSocketHttpClient.js');
const BackboneServerUrl = require('../BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();
const ChestHandler = require("../ChestHandler");

const parallelProcess = 10;

async function processWarDoc(warDoc) {
    try {
        // 1. Retrieve warData and clan information concurrently from Firestore.
        const [warData, clans] = await Promise.all([
            firestoreManager.readDocument('OnGoingWar', warDoc.warId, '/ClanWar/War'),
            firestoreManager.bulkReadDocuments('Clans', '/', [warDoc.clanId1, warDoc.clanId2], { clanId : 1, clanWarId : 1, clanLevel : 1, clanTrophy : 1, clanXp : 1, warHistory: 1})
        ]);

        // Remove unnecessary fields from warData
        delete warData._id;

        // 2. Calculate total scores and coins for both clans.
        const [clan1Score, clan1Coins] = [
            warData.membersList1.reduce((acc, member) => acc + member.score, 0),
            warData.membersList1.reduce((acc, member) => acc + member.coinCollected, 0)
        ];
        const [clan2Score, clan2Coins] = [
            warData.membersList2.reduce((acc, member) => acc + member.score, 0),
            warData.membersList2.reduce((acc, member) => acc + member.coinCollected, 0)
        ];

        // 3. Determine the winning and losing clans based on scores and coins.
        let win, lose, winMembers, loseMembers, winClanLevel;
        if (clan1Score > clan2Score || (clan1Score === clan2Score && clan1Coins > clan2Coins)) {
            win = { clanId: warData.clanId1, score: clan1Score, coinCollected: clan1Coins };
            lose = { clanId: warData.clanId2, score: clan2Score, coinCollected: clan2Coins };
            winMembers = warData.membersList1.map(member => member.UID);
            loseMembers = warData.membersList2.map(member => member.UID);
            winClanLevel = clans[0].clanLevel;
        } else {
            win = { clanId: warData.clanId2, score: clan2Score, coinCollected: clan2Coins };
            lose = { clanId: warData.clanId1, score: clan1Score, coinCollected: clan1Coins };
            winMembers = warData.membersList2.map(member => member.UID);
            loseMembers = warData.membersList1.map(member => member.UID);
            winClanLevel = clans[1].clanLevel;
        }

        const isDraw = clan1Score === clan2Score && clan1Coins === clan2Coins;

        // 4. Construct the war result object.
        const result = { finishWarTime: Date.now(), isDraw, win: win, lose: lose };
        const clanTrophyAndXP = await increaseXPAndTrophy(result, clans[0], clans[1], winMembers.length);
        warData.warResult = result;

        // 5. Update war histories for both clans and ensure they don't exceed the maximum length.
        let clan1WarHistory = clans[0].warHistory || [];
        let clan2WarHistory = clans[1].warHistory || [];
        clan1WarHistory.unshift(warDoc.warId);
        clan2WarHistory.unshift(warDoc.warId);
        if (clan1WarHistory.length > 20) clan1WarHistory.pop();
        if (clan2WarHistory.length > 20) clan2WarHistory.pop();

        
        //give chest to all player in war and win based on clan Level
        await giveRewardForPlayers(winMembers, loseMembers, winClanLevel, result.isDraw);
        


        await ResourceLock.getInstance().run(warDoc.warId, async () => {  // lock require to prevent other user to create OnGoingWar after delete , by played and finish exact time . hence doc created if not found.
            // 6. Perform Firestore database operations concurrently to update war results and clan histories.
            await Promise.all([
                firestoreManager.createDocument('FinishWar', warDoc.warId, '/ClanWar/War', warData),
                firestoreManager.deleteDocument('OnGoingWar', warDoc.warId, '/ClanWar/War'),
                firestoreManager.updateDocument('Clans', warData.clanId1, '/', { warHistory: clan1WarHistory, clanWarId: "null", clanLevel : clanTrophyAndXP.clan1.clanLevel, clanXp : clanTrophyAndXP.clan1.clanXp,  clanTrophy : clanTrophyAndXP.clan1.clanTrophy }),
                firestoreManager.updateDocument('Clans', warData.clanId2, '/', { warHistory: clan2WarHistory, clanWarId: "null", clanLevel : clanTrophyAndXP.clan2.clanLevel, clanXp : clanTrophyAndXP.clan2.clanXp, clanTrophy : clanTrophyAndXP.clan2.clanTrophy }),
            ]);
        });

        // 7. Notify the backbone server about the war's conclusion.
        await sendClanWarOverToBBS(warDoc.warId, warData.clanId1, warData.clanId2);

        //console.log(`Processed warDoc with ID: ${warDoc.warId}`);
    } catch (error) {
        console.error(`Error processing warDoc with ID: ${warDoc.warId}. Error: ${error.message}`);
    }
}


async function giveRewardForPlayers(winMembers, loseMembers, winClanLevel, isDraw) {
    try {
        // Determine the type of chest to award based on the winning clan's level
        const chest = await ChestCache.get();
        const warChest = chest.warChest;

        const chestType = warChest.perks[`lvl${winClanLevel}`].chest;
        const coins = warChest.perks[`lvl${winClanLevel}`].coin;
        const gems = warChest.perks[`lvl${winClanLevel}`].gems;

        // Lock the user profiles to avoid concurrent modifications
        await UserLock.getInstance().runMultiple(winMembers, async () => {
            
            const users = await firestoreManager.bulkReadDocuments('Users', '/', winMembers, { uid: 1, gameData: 1 });

            // Prepare promises for parallel updates
            const updatePromises = users.map(async user => {
                // Generate and assign the chest to each player
                if(!isDraw){
                    const chestDetail = chest.ChestInfo[chestType];
                    const generatedChest = await ChestHandler.generateChest(user.uid, chestType, chestDetail, chest.CardConstraint, chest.SplitInfo, chest.cardExchangeCoin);
                    generatedChest.coins = coins;
                    generatedChest.gems = gems;
                    user.gameData.chestData.clanWarChest = generatedChest;
                }

                //make in war disable
                user.gameData.isInWar = false;

                // Update the player's profile with the new chest, preparing for parallel execution
                return firestoreManager.updateDocument("Users", user.uid, "/", { "gameData.chestData": user.gameData.chestData, 
                                                                                 "gameData.isInWar": user.gameData.isInWar });
            });

            // Execute all update operations in parallel
            await Promise.all(updatePromises);
        });


        // Handle losing members
        await UserLock.getInstance().runMultiple(loseMembers, async () => {
            const users = await firestoreManager.bulkReadDocuments('Users', '/', loseMembers, { uid: 1, gameData: 1 });

            // Prepare promises for parallel updates for losers
            const updatePromises = users.map(user => {
                user.gameData.isInWar = false; // Only update in-war status for losing members

                return firestoreManager.updateDocument("Users", user.uid, "/", { "gameData.isInWar": user.gameData.isInWar });
            });

            // Execute all update operations for losers in parallel
            await Promise.all(updatePromises);
        });


    } catch (e) {
        console.error(e);
    }
}


async function sendClanWarOverToBBS(warId, cid1, cid2) {
    // Logic to call the backbone server to send a feedback to all clan member to update ui
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'clanWarOver',
        warId,
        cid1,
        cid2
    };
    const response = await client.request(queryParams);
    return response;
}


async function makeResult(warDocs) {
    const totalDocs = warDocs.length;

    for (let i = 0; i < totalDocs; i += parallelProcess) {
        const chunk = warDocs.slice(i, i + parallelProcess);
        const processingPromises = chunk.map(doc => processWarDoc(doc));
        await Promise.all(processingPromises);
    }
}


async function increaseXPAndTrophy(result, clan1, clan2, noOfPlayers) {
    const chest = await ChestCache.get();


    let clanTrophyAndXP = {
        clan1: { clanLevel: clan1.clanLevel, clanXp: clan1.clanXp, clanTrophy: clan1.clanTrophy, clanId: clan1.clanId },
        clan2: { clanLevel: clan2.clanLevel, clanXp: clan2.clanXp, clanTrophy: clan2.clanTrophy, clanId: clan2.clanId }
    };

    //console.log(clanTrophyAndXP);


    if(result.isDraw){

        // clan1 wins and clan2 loses
        const evalData = evaluateTrophyGain(result.win.score, result.lose.score, clanTrophyAndXP.clan1.clanTrophy, clanTrophyAndXP.clan2.clanTrophy, noOfPlayers, true);
        let trophyGain1 = evalData.winTrophyIncrease;
        let trophyGain2 = evalData.loseTrophyIncrease;
        let xpGain1 = Math.round((trophyGain1/40)*(450));
        let xpGain2 = Math.round((trophyGain2/40)*(450));
 
        // Increase trophy
        clanTrophyAndXP.clan1.clanTrophy += trophyGain1;
        clanTrophyAndXP.clan2.clanTrophy += trophyGain2;
 
        // Increase x p only if it's <= 100000
        if (clanTrophyAndXP.clan1.clanXp < 100000) {
            clanTrophyAndXP.clan1.clanXp += xpGain1;
        }
 
        if (clanTrophyAndXP.clan2.clanXp < 100000) {
            clanTrophyAndXP.clan2.clanXp += xpGain2;
        }
 
        result.win.trophyGain = trophyGain1;
        result.lose.trophyGain = trophyGain2;
        result.win.xpGain = xpGain1;
        result.lose.xpGain = xpGain2;
 



    } else if (result.win.clanId === clanTrophyAndXP.clan1.clanId) {

        // clan1 wins and clan2 loses
        const evalData = evaluateTrophyGain(result.win.score, result.lose.score, clanTrophyAndXP.clan1.clanTrophy, clanTrophyAndXP.clan2.clanTrophy, noOfPlayers,  false);
        let trophyGain1 = evalData.winTrophyIncrease;
        let trophyGain2 = evalData.loseTrophyIncrease;
        let xpGain1 = Math.round((trophyGain1/40)*(450));
        let xpGain2 = Math.round((trophyGain2/40)*(450));

        // Increase trophy
        clanTrophyAndXP.clan1.clanTrophy += trophyGain1;
        clanTrophyAndXP.clan2.clanTrophy += trophyGain2;

        // Increase x p only if it's <= 100000
        if (clanTrophyAndXP.clan1.clanXp < 100000) {
            clanTrophyAndXP.clan1.clanXp += xpGain1;
        }

        if (clanTrophyAndXP.clan2.clanXp < 100000) {
            clanTrophyAndXP.clan2.clanXp += xpGain2;
        }

        result.win.trophyGain = trophyGain1;
        result.lose.trophyGain = trophyGain2;
        result.win.xpGain = xpGain1;
        result.lose.xpGain = xpGain2;


    } else {

        // clan2 wins and clan1 loses
        const evalData = evaluateTrophyGain(result.win.score, result.lose.score, clanTrophyAndXP.clan2.clanTrophy, clanTrophyAndXP.clan1.clanTrophy, noOfPlayers, false);
        let trophyGain1 = evalData.loseTrophyIncrease;
        let trophyGain2 = evalData.winTrophyIncrease;
        let xpGain1 = Math.round((trophyGain1/40)*(450));
        let xpGain2 = Math.round((trophyGain2/40)*(450));

        // Increase trophy
        clanTrophyAndXP.clan1.clanTrophy += trophyGain1;
        clanTrophyAndXP.clan2.clanTrophy += trophyGain2;

        // Increase x p only if it's <= 100000
        if (clanTrophyAndXP.clan1.clanXp < 100000) {
            clanTrophyAndXP.clan1.clanXp += xpGain1;
        }

        if (clanTrophyAndXP.clan2.clanXp < 100000) {
            clanTrophyAndXP.clan2.clanXp += xpGain2;
        }

        result.win.trophyGain = trophyGain2;
        result.lose.trophyGain = trophyGain1;
        result.win.xpGain = xpGain2;
        result.lose.xpGain = xpGain1;

    }


    // Update clanLevel based on clanXp and levelsXpRequired
    clanTrophyAndXP.clan1.clanLevel = getClanLevel(clanTrophyAndXP.clan1.clanXp, chest.warChest.levelsXpRequired);
    clanTrophyAndXP.clan2.clanLevel = getClanLevel(clanTrophyAndXP.clan2.clanXp, chest.warChest.levelsXpRequired);

    //console.log(result);
    //console.log(clanTrophyAndXP);


    return clanTrophyAndXP;
}

function getClanLevel(xp, levelsXpRequired) {
    let level = 1; // Default level
    for (let i = 0; i < levelsXpRequired.length; i++) {
        if (xp >= levelsXpRequired[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    return level;
}


function evaluateTrophyGain(winScore, loseScore, winTrophy, loseTrophy, noOfPlayers, isDraw) {

    if(winTrophy < 100){
        winTrophy = 100;
    }

    if(loseTrophy < 100){
        loseTrophy = 100;
    }

    //console.log({winScore, loseScore, winTrophy, loseTrophy, noOfPlayers});

    let trophyPool = 40;

    let winTrophyIncrease;
    let loseTrophyIncrease;
    if(isDraw){
        winTrophyIncrease = trophyPool * 0.2;
        loseTrophyIncrease = trophyPool * 0.2;
    }else{
        winTrophyIncrease = trophyPool * 0.4;
        loseTrophyIncrease = 0;
    }

    trophyPool = trophyPool * 0.6; //40% already given to winner


    const idealWinScore = (Math.min(winTrophy, 3000)/3000 * 8 * 3) * noOfPlayers * 0.6;
    const idealLoseScore = (Math.min(loseTrophy, 3000)/3000 * 8 * 3) * noOfPlayers * 0.6;


    // give remaining trophy from trophyPool to both user based on performance
    winTrophyIncrease += Math.min(winScore, idealWinScore) / idealWinScore * trophyPool;
    loseTrophyIncrease += Math.min(loseScore, idealLoseScore)  / idealLoseScore * trophyPool;

    // Round off the trophy increase values to integers
    winTrophyIncrease = Math.round(winTrophyIncrease);
    loseTrophyIncrease = Math.round(loseTrophyIncrease);

    return {winTrophyIncrease, loseTrophyIncrease};
}




module.exports = {
    makeResult,
    giveRewardForPlayers,
    increaseXPAndTrophy,
    evaluateTrophyGain
};

