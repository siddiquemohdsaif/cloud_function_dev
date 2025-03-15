const firestoreManager = require("../Firestore/FirestoreManager").getInstance();
const MapSliderInfoCache = require("./StaticDocument/GameInfo/MapSliderInfo")
const WebSocketHttpClient = require('./WebSocketHttpClient');
const BackboneServerUrl = require('./BackboneServerUrl');
const ResourceLock = require('./Lock/ResourceLock');
const backboneServerUrl = new BackboneServerUrl();


const handleWar = async (UID1, UID2, winnerUID, map, isPlayer1InWar, isPlayer2InWar) => {
    // Function to handle player war data update
    const handlePlayerWarData = async (uid, isPlayerInWar, winnerUID) => {
        if (isPlayerInWar) {
            const {warId , clanId} = await findPlayerWarId(uid);
            if (warId) {

                const result = await ResourceLock.getInstance().run(warId, async () => {

                    const playerWarDoc = await getPlayerWarDoc(uid, warId, clanId);

                    let win = winnerUID === uid;
                    const { score, coins } = await findGainCoinAndScore(map, win);
    
                    // Update playerWarDoc.member data with new score, coins, and increment used
                    playerWarDoc.member.score += score;
                    playerWarDoc.member.coinCollected += coins;
                    playerWarDoc.member.used += 1;
    
                    //console.log(playerWarDoc.member);
    
                    // Update Firestore document
                    const listName = playerWarDoc.membersList === playerWarDoc.war.membersList1 ? 'membersList1' : 'membersList2';
                    const fieldName = `${listName}.${playerWarDoc.position}`;
                    await firestoreManager.updateDocument("OnGoingWar", playerWarDoc.warId, "/ClanWar/War", { [fieldName]: playerWarDoc.member });
                    sendClanWarDoneToBBS(playerWarDoc.warId, playerWarDoc.war.clanId1, playerWarDoc.war.clanId2);
                    

                });
               
            }
        }
    };

    // Handle war data update for player 1 and player 2
    handlePlayerWarData(UID1, isPlayer1InWar, winnerUID);
    handlePlayerWarData(UID2, isPlayer2InWar, winnerUID);
}


async function sendClanWarDoneToBBS(warId, cid1, cid2) {
    // Logic to call the backbone server to send a feedback to all clan member to update ui
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'clanWarDone',
        warId,
        cid1,
        cid2
    };
    const response = await client.request(queryParams);
    return response;
}

const findPlayerWarId = async (uid) => {

    try {

        // Find clan Id by profile data
        const user = await firestoreManager.readDocumentWithProjection("Users", uid, "/", { "profileData.clanId": 1 });
        const clanId = user.profileData.clanId;

        if (clanId === "null") {
            return false; // Player has not joined any clan and is playing war
        }

        // Find clanWarId.warId by clan
        const clan = await firestoreManager.readDocumentWithProjection("Clans", clanId, "/", { "clanWarId": 1 });
        if (clan.clanWarId === '') {
            return false; // Clan is not in war
        }
        const clanWarId = JSON.parse(clan.clanWarId);
        if (!clanWarId.warId) {
            return false; // Clan is not in war
        }
        const warId = clanWarId.warId;

        return {warId , clanId};

    }catch (e) {
        return false
    }
}

const getPlayerWarDoc = async (uid, warId, clanId) => {

    try {

        // Get clanWar ongoing document and verify player can play war by attack used and given
        const war = await firestoreManager.readDocument("OnGoingWar", warId, "/ClanWar/War");

        let membersList;
        if (clanId === war.clanId1) {
            membersList = war.membersList1;
        } else if (clanId === war.clanId2) {
            membersList = war.membersList2;
        } else {
            return false; // Player's clan is not part of this war
        }

        let currentMember;
        let position = -1; // default value indicating not found

        for (let i = 0; i < membersList.length; i++) {
            if (membersList[i].UID === uid) {
                currentMember = membersList[i];
                position = i;
                break; // exit the loop once the member is found
            }
        }

        if (position === -1) {
            return false;   // player not found
        }

        return { member: currentMember, position, membersList, warId, war };


    }catch (e) {
        return false
    }
}



const findGainCoinAndScore = async (map, win) => {

    const MapSliderInfo = await MapSliderInfoCache.get();

    let score = 0;
    let coins = 0;

    const coinWin = MapSliderInfo.prize[map];
    const scoreWin = MapSliderInfo.warScore[map];

    if (!win) {
        return { score, coins };
    }

    coins = coinWin;
    score = scoreWin;

    return { score, coins };

}


module.exports = {
    handleWar
}




























// without Lock
// const firestoreManager = require("../Firestore/FirestoreManager").getInstance();
// const MapSliderInfoCache = require("./StaticDocument/GameInfo/MapSliderInfo")
// const WebSocketHttpClient = require('./WebSocketHttpClient');
// const BackboneServerUrl = require('./BackboneServerUrl');
// const backboneServerUrl = new BackboneServerUrl();


// const handleWar = async (UID1, UID2, winnerUID, map, isPlayer1InWar, isPlayer2InWar) => {
//     // Function to handle player war data update
//     const handlePlayerWarData = async (uid, isPlayerInWar, winnerUID) => {
//         if (isPlayerInWar) {
//             const playerWarDoc = await findPlayerWithWarData(uid);
//             if (playerWarDoc) {
//                 let win = winnerUID === uid;
//                 const { score, coins } = await findGainCoinAndScore(map, win);

//                 // Update playerWarDoc.member data with new score, coins, and increment used
//                 playerWarDoc.member.score += score;
//                 playerWarDoc.member.coinCollected += coins;
//                 playerWarDoc.member.used += 1;

//                 console.log(playerWarDoc.member);

//                 // Update Firestore document
//                 const listName = playerWarDoc.membersList === playerWarDoc.war.membersList1 ? 'membersList1' : 'membersList2';
//                 const fieldName = `${listName}.${playerWarDoc.position}`;
//                 await firestoreManager.updateDocument("OnGoingWar", playerWarDoc.warId, "/ClanWar/War", { [fieldName]: playerWarDoc.member });
//                 sendClanWarDoneToBBS(playerWarDoc.warId, playerWarDoc.war.clanId1, playerWarDoc.war.clanId2);
//             }
//         }
//     };

//     // Handle war data update for player 1 and player 2
//     handlePlayerWarData(UID1, isPlayer1InWar, winnerUID);
//     handlePlayerWarData(UID2, isPlayer2InWar, winnerUID);
// }


// async function sendClanWarDoneToBBS(warId, cid1, cid2) {
//     // Logic to call the backbone server to send a feedback to all clan member to update ui
//     const url = await backboneServerUrl.getUrl();
//     const client = new WebSocketHttpClient(url);
//     const queryParams = {
//         uid: 'InternalServerServicesCall',
//         callType: 'clanWarDone',
//         warId,
//         cid1,
//         cid2
//     };
//     const response = await client.request(queryParams);
//     return response;
// }


// const findPlayerWithWarData = async (uid) => {

//     try {

//         // Find clan Id by profile data
//         const user = await firestoreManager.readDocumentWithProjection("Users", uid, "/", { "profileData.clanId": 1 });
//         const clanId = user.profileData.clanId;

//         if (clanId === "null") {
//             return false; // Player has not joined any clan and is playing war
//         }

//         // Find clanWarId.warId by clan
//         const clan = await firestoreManager.readDocumentWithProjection("Clans", clanId, "/", { "clanWarId": 1 });
//         if (clan.clanWarId === '') {
//             return false; // Clan is not in war
//         }
//         const clanWarId = JSON.parse(clan.clanWarId);
//         if (!clanWarId.warId) {
//             return false; // Clan is not in war
//         }
//         const warId = clanWarId.warId;

//         // Get clanWar ongoing document and verify player can play war by attack used and given
//         const war = await firestoreManager.readDocument("OnGoingWar", warId, "/ClanWar/War");

//         let membersList;
//         if (clanId === war.clanId1) {
//             membersList = war.membersList1;
//         } else if (clanId === war.clanId2) {
//             membersList = war.membersList2;
//         } else {
//             return false; // Player's clan is not part of this war
//         }

//         let currentMember;
//         let position = -1; // default value indicating not found

//         for (let i = 0; i < membersList.length; i++) {
//             if (membersList[i].UID === uid) {
//                 currentMember = membersList[i];
//                 position = i;
//                 break; // exit the loop once the member is found
//             }
//         }

//         if (position === -1) {
//             return false;   // player not found
//         }

//         return { member: currentMember, position, membersList, warId, war };


//     } catch (e) {
//         return false
//     }
// };

// const findGainCoinAndScore = async (map, win) => {

//     const MapSliderInfo = await MapSliderInfoCache.get();

//     let score = 0;
//     let coins = 0;

//     const coinWin = MapSliderInfo.prize[map];
//     const scoreWin = MapSliderInfo.warScore[map];

//     if (!win) {
//         return { score, coins };
//     }

//     coins = coinWin;
//     score = scoreWin;

//     return { score, coins };

// }


// module.exports = {
//     handleWar
// }