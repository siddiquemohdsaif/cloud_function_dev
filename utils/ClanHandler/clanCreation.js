const FirestoreManager = require("../../Firestore/FirestoreManager");
const UserDataModifier = require(".././UserDataModifier");
const { generateClanId, validateInputs } = require("./clanUtilities");
const ClanSearch = require('./clanSearch');


const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Create New Clan /////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function createNewClan(uid, clanName, clanLogo, clanDescription, clanType, requiredTrophy) {
    try {
        // Validate inputs first
        validateInputs(clanName, clanDescription, clanLogo, clanType, requiredTrophy);

        const collName = "Clans";
        const docName = generateClanId(9);
        const parentPath = "/";

        const clan = {
            clanId: docName,
            clanName: clanName,
            clanLevel: 1,
            clanTrophy: 0,
            clanXp: 0,
            clanLogo: clanLogo,
            clanDescription: clanDescription,
            clanType: clanType,
            requiredTrophy: requiredTrophy,
            cct: Date.now(), // Clan create time in milliseconds since the Unix epoch
            members: [
                {
                    UID: uid,
                    TYPE: "Leader", // You can set an initial type for the Leader i.e who create clan
                    LT: 0,
                    JT: Date.now() // Joining time
                }
            ],
            warHistory: [], // You can set an initial war history, or adapt as needed
            clanWarId : "null"
        };

        // deduct coins
        const user = await firestoreManager.readDocumentWithProjection("Users", uid, "/", { "gameData": 1 });
        if(user.gameData.coins >= 10000){
            user.gameData.coins -= 10000;
            await firestoreManager.updateDocument("Users", uid, "/",{"gameData.coins" : user.gameData.coins});
        }else{
            throw new Error("Not have enough coin to create clan!");
        }

        const updatedProfileAfterJoinClan = await userDataModifier.updateNewClanJoin(uid, clan.clanId);

        let createResult = false;
        try {
            let [clanCreateResult, clanMessageHistoryCreateResult] = await Promise.all([
                firestoreManager.createDocument(collName, docName, parentPath, clan),
                firestoreManager.createDocument("ClanMsg", docName, parentPath, { info: "clan message history save here" })
            ]);
            if (clanCreateResult && clanMessageHistoryCreateResult) {
                createResult = true;
            }
        } catch (error) {
            await userDataModifier.updateLogoutClan(uid);
            throw new Error("failed to create clan x002 : " + error.message);
        }

        if (!createResult) {
            await userDataModifier.updateLogoutClan(uid);
            throw new Error("failed to create clan x002");
        }

        if (createResult && updatedProfileAfterJoinClan) {
            ClanSearch.addNewClanToClanSearch(clan);
            return updatedProfileAfterJoinClan;
        } else {
            throw new Error("unexpected error x003");
        }
    } catch (error) {
        throw new Error("failed to create clan x001 : " + error.message);
    }
}

module.exports = {
    createNewClan
}
