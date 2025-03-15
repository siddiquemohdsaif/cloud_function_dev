const FirestoreManager = require("../../Firestore/FirestoreManager");
const UserDataModifier = require(".././UserDataModifier");
const WebSocketHttpClient = require('.././WebSocketHttpClient');
const ClanSearch = require('./clanSearch');
const ClanUtilities = require('./clanUtilities');
const BackboneServerUrl = require('../BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();

const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();



///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Update Clan //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function updateClanDetails(uid, clanId, clanName, clanLogo, clanDescription, clanType, requiredTrophy) {
    try {


        // Fetch clan details first
        const clan = await firestoreManager.readDocument("Clans", clanId, "/");
        const profileData = await userDataModifier.getUserProfileData(uid);

        // If no clan details found, throw an error
        if (!clan) {
            throw new Error("No clan found with the given ID.");
        }

        // Check if the user is a Leader or Co-Leader
        const userRole = clan.members.find(member => member.UID === uid)?.TYPE;
        if (userRole !== "Leader" && userRole !== "Co-Leader") {
            throw new Error("Only a Leader or Co-Leader can update clan details.");
        }



        // Validate inputs first
        if (clanName !== null) {
            ClanUtilities.validateClanName(clanName);
        }

        if (clanDescription !== null) {
            ClanUtilities.validateClanDescription(clanDescription);
        }

        if (clanLogo !== null) {
            ClanUtilities.validateClanLogo(clanLogo);
        }

        if (clanType !== null) {
            ClanUtilities.validateClanType(clanType);
        }

        if (requiredTrophy !== null) {
            ClanUtilities.validateRequiredTrophy(requiredTrophy);
        }

        const updateData = {};
        if (clanName !== null) updateData.clanName = clanName;
        if (clanLogo !== null) updateData.clanLogo = clanLogo;
        if (clanDescription !== null) updateData.clanDescription = clanDescription;
        if (clanType !== null) updateData.clanType = clanType;
        if (requiredTrophy !== null) updateData.requiredTrophy = requiredTrophy;

        const collName = "Clans";
        const docName = clanId;
        const parentPath = "/";

        const updateResult = await firestoreManager.updateDocument(collName, docName, parentPath, updateData);

        if (updateResult) {
            updateClanToClanSearch(clanId);
            sendClanUpdateToAllMemberByBackboneServer(uid, profileData.userName, clanId);
            return { success: true, message: "Clan details updated successfully." };
        } else {
            throw new Error("Unable to update clan details.");
        }
    } catch (error) {
        throw new Error("Update failed: " + error.message);
    }
}


async function sendClanUpdateToAllMemberByBackboneServer(invalidatorUid, invalidatorName, cid) {
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'sendClanDetailsUpdate',
        invalidatorUid: invalidatorUid,
        invalidatorName: invalidatorName,
        cid: cid
    };
    const response = await client.request(queryParams);
    return response;
}

async function updateClanToClanSearch(clanId) {
    try {
        // Fetch clan details first
        const clan = await firestoreManager.readDocument("Clans", clanId, "/");
        await ClanSearch.deleteClanToClanSearch(clanId);
        await ClanSearch.addNewClanToClanSearch(clan);
    } catch (e) {
        //ignore
        console.error(e);
        return e;
    }
}





module.exports = {
    updateClanDetails,
    sendClanUpdateToAllMemberByBackboneServer,
    updateClanToClanSearch
};
