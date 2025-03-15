const FirestoreManager = require("../../Firestore/FirestoreManager.js");
const firestoreManager = FirestoreManager.getInstance();
const WebSocketHttpClient = require('../WebSocketHttpClient.js');
const BackboneServerUrl = require('../BackboneServerUrl.js');
const backboneServerUrl = new BackboneServerUrl();
//const BACKBONE_SERVER_URL = 'ws://167.172.85.50:15999';




const makeMatch = async (clansWarList, warStartTime) => {

    // # CALCULATE SCORE
    // 1) find clan trophy and warHistory 
    const clanIds = clansWarList.map(clan => clan.clanId);
    const projection = {
        clanTrophy: 1,
        warHistory: 1,
        clanId: 1
    };
    const clansDetails = await firestoreManager.bulkReadDocuments('Clans', '/', clanIds, projection);
    clansWarList.forEach(clan => {
        const details = clansDetails.find(details => details.clanId === clan.clanId);
        if (details) {
            clan.clanTrophy = details.clanTrophy;
            clan.warHistory = details.warHistory;
        }
    });

    // //print
    // for (const clan of clansWarList) {
    //     console.log(clan);
    // }

    // 2) find war win streak of all clan and store in object as key (winStreak) by using warHistory i.e array of string key of past war ["pastWarId1", "pastWarId2", "pastWarId2" ... ] its also be a empty [] , using "pastWarId" key you can use bulkRead of projection {win : "winClanId"} if win is equal to clanId means it win that match and hence find winStreak.
    for (const clan of clansWarList) {
        clan.winStreak = await calculateWinStreak(clan);
    }

    //3) find average xp of clan war-members
    console.time("calculateAverageXP");
    for (const clan of clansWarList) {
        clan.XP = await calculateAverageXP(clan.members);
    }
    console.timeEnd("calculateAverageXP");

    //find score of each clan to make match
    for (const clan of clansWarList) {
        clan.score = (clan.clanTrophy * 100) / 3000 + 2 * (clan.winStreak * 100) / 10 + (clan.XP * 100) / 99
    }


    //print
    for (const clan of clansWarList) {
        //console.log(clan);
    }

    const warMatchPair = makeMatchInList(clansWarList);

    //create ongoing war doc for each warMatchPair
    console.time("create ongoing war");
    for (const pairClans of warMatchPair) {

        // create the membersList for each clan
        const membersList1 = pairClans[0].members.map(UID => ({
            UID,
            coinCollected: 0,
            score: 0,
            used: 0,
            given: 3
        }));

        const membersList2 = pairClans[1].members.map(UID => ({
            UID,
            coinCollected: 0,
            score: 0,  
            used: 0,
            given: 3
        }));


        const warDoc = {
            warId: Date.now() + "_" + pairClans[0].clanId + pairClans[1].clanId,
            clanId1: pairClans[0].clanId,
            clanId2: pairClans[1].clanId,
            membersList1,
            membersList2,
            warStartTime,
            warEndTime: warStartTime + (24 * 60 * 60 * 1000) // 24 hr
            // warEndTime: warStartTime + (30 * 60 * 1000)  // for test 30 min
        }

        await Promise.all([
            //create ongoing war doc
            firestoreManager.createDocument('OnGoingWar', warDoc.warId, '/ClanWar/War', warDoc),

            //change clanWarId in both clan
            firestoreManager.updateDocument('Clans', warDoc.clanId1, '/', { clanWarId: JSON.stringify({ warId: warDoc.warId, state: "WAR" }) }),
            firestoreManager.updateDocument('Clans', warDoc.clanId2, '/', { clanWarId: JSON.stringify({ warId: warDoc.warId, state: "WAR" }) })

        ]);


        await sendClanWarMatchSuccessfulToBBS(warDoc.warId, warDoc.clanId1, warDoc.clanId2);
            
    }
    console.timeEnd("create ongoing war");


    //print
    for (const pair of warMatchPair) {
        //console.log("pair :", pair);
    }

}



async function sendClanWarMatchSuccessfulToBBS(warId, cid1, cid2) {
    // Logic to call the backbone server to send a feedback to all clan member to update ui
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'clanWarMatchSuccessful',
        warId,
        cid1,
        cid2
    };
    const response = await client.request(queryParams);
    return response;
}



const calculateWinStreak = async (clan) => {

    if (clan.warHistory.length === 0) {
        return 0;
    }

    const projection = { win: 1 };
    const warResults = await firestoreManager.bulkReadDocuments('FinishWar', '/ClanWar/War', clan.warHistory, projection);

    let winStreak = 0;
    for (const warResult of warResults) {
        if (warResult.win === clan.clanId) {
            winStreak++;
        } else {
            // If the clan didn't win the most recent war, break the loop
            break;
        }
    }
    return winStreak;
};

const calculateAverageXP = async (members) => {
    // Fetch XP for each member using bulkReadDocuments
    const projection = { "gameData.xp": 1 };
    const memberDetails = await firestoreManager.bulkReadDocuments('Users', '/', members, projection);

    let totalXP = 0;
    memberDetails.forEach(member => {
        totalXP += member.gameData.xp.x;
    });

    return totalXP / members.length; // Calculate average XP
};








const makeMatchInList = (clanWarList) => {
    // Sort the clans based on score in descending order
    const sortedClans = [...clanWarList].sort((a, b) => b.score - a.score);

    const warMatchPair = [];
    // Pair clans for war
    for (let i = 0; i < sortedClans.length; i += 2) {
        if (i + 1 < sortedClans.length) {
            warMatchPair.push([sortedClans[i], sortedClans[i + 1]]);
        } else {
            // If there's an odd number of clans, the last one will not have a match
            warMatchPair.push([sortedClans[i]]);
        }
    }
    return warMatchPair;
}






module.exports = {
    makeMatch
}

