const axios = require('axios');

const FirestoreManager = require("../Firestore/FirestoreManager");
const UserDataModifier = require("./UserDataModifier");

const firestoreManager = FirestoreManager.getInstance();


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GET ProfileAndGameData  /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function getOthersProfileAndGameData(uid, profileUid) {
    try {
        // Validate UID
        if (!uid) {
            throw new Error("UID is required.");
        }
        const collName = "Users";
        const parentPath = "/";

        const profileAndGamedata = await firestoreManager.readDocumentWithProjection(collName, profileUid, parentPath, { profileData: 1, gameData: 1 });

        return profileAndGamedata;

    } catch (error) {
        throw new Error("Failed to OthersProfileAndGameData : " + error.message);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GET ProfileAndGameDataWithClan  /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function getOthersProfileAndGameDataWithClan(uid, profileUid) {
    try {
        // Validate UID
        if (!uid) {
            throw new Error("UID is required.");
        }
        const collName = "Users";
        const parentPath = "/";

        const profileAndGamedata = await firestoreManager.readDocumentWithProjection(collName, profileUid, parentPath, { profileData: 1, gameData: 1 });

        if(profileAndGamedata.profileData.clanId !== "null" ){
            const clan = await firestoreManager.readDocument('Clans', profileAndGamedata.profileData.clanId , parentPath);
            profileAndGamedata.clan = clan;
        }

        return profileAndGamedata;

    } catch (error) {
        throw new Error("Failed to OthersProfileAndGameData : " + error.message);
    }
}





///////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GET ProfileAndGameDataBulk  ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function getOthersProfileAndGameDataBulk(uids, projection) {
    try {

        // Validate uids
        if (!Array.isArray(uids) || uids.length === 0) {
            throw new Error("uids should be an array of strings and not be empty.");
        }

        // Validate projection
        if (typeof projection !== 'object' || Array.isArray(projection)) {
            throw new Error("projection should be an object.");
        }

        const collName = "Users";
        const parentPath = "/";

        // Use the bulkReadDocuments method to fetch multiple user profiles and game data
        const docs = await firestoreManager.bulkReadDocuments(collName, parentPath, uids, projection);

        // Remove "loginAuth" and "encryptedCredential" fields from each document if they exist
        docs.forEach(doc => {
            if (doc.loginAuth) delete doc.loginAuth;
            if (doc.encryptedCredential) delete doc.encryptedCredential;
        });

        return docs;

    } catch (error) {
        throw new Error("Failed to getOthersProfileAndGameDataBulk: " + error.message);
    }
}





///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GET MemberDetailsList  /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function getMemberDetailsList(uid, memberIds) {
    try {
        // Validate UID
        if (!uid) {
            throw new Error("UID is required.");
        }

        // Validate memberIds
        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            throw new Error("memberIds should be an array of strings and not be empty.");
        }

        const collName = "Users";
        const parentPath = "/";

        // Use the bulkReadDocuments method to fetch member details
        const docs = await firestoreManager.bulkReadDocuments(collName, parentPath, memberIds, {
            "uid": 1,
            "profileData.userName": 1,
            "gameData.trophy": 1
        });

        // Create a list of member details based on the fetched documents
        const memberDetails = docs.map(doc => ({
            uid: doc.uid,
            userName: doc.profileData.userName,
            trophy: doc.gameData.trophy
        }));

        return memberDetails;

    } catch (error) {
        throw new Error("Failed to MemberDetailsList : " + error.message);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GET FriendDetailsList  /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function getFriendDetailsList(friendIds) {
    try {
        // Validate memberIds
        if (!Array.isArray(friendIds) || friendIds.length === 0) {
            throw new Error("memberIds should be an array of strings and not be empty.");
        }

        const collName = "Users";
        const parentPath = "/";

        // Use the bulkReadDocuments method to fetch member details
        let friendProfiles = await firestoreManager.bulkReadDocuments(collName, parentPath, friendIds, { 
            "lastSeen": 1,
            "gameData": {"xp" : 1, "trophy" : 1, "collection" : 1, "carromPass" : { "isPremiumMember" : 1 }}, 
            "profileData": 1,
            "uid": 1 
        });

        // Extract clanIds and fetch clan details
        const clanIds = friendProfiles.map(profile => profile.profileData.clanId).filter(clanId => clanId !== "null" && clanId !== undefined);
        let clanDetails = {};
        if (clanIds.length > 0) {
            clanDetails = await fetchClanDetails(clanIds);
        }
    
        // Embed clan details into player profiles
        friendProfiles = friendProfiles.map(profile => {
            const clanId = profile.profileData.clanId;
            if (clanId && clanDetails[clanId]) {
                profile.clanName = clanDetails[clanId].clanName;
                profile.clanLogo = clanDetails[clanId].clanLogo;
            } else {
                profile.clanName = "No clan";
                profile.clanLogo = 0;
            }
            return profile;
        });
    
        return friendProfiles;

    } catch (error) {
        throw new Error("Failed to MemberDetailsList : " + error.message);
    }
}
const fetchClanDetails = async (clanIds) => {
    const collName = 'Clans';
    const parentPath = '/';
    const projection = { "clanName": 1, "clanLogo": 1 };
    const clansData = await firestoreManager.bulkReadDocumentsInMap(collName, parentPath, clanIds, projection);
    return clansData;
}





module.exports = {
    getOthersProfileAndGameData,
    getOthersProfileAndGameDataBulk,
    getMemberDetailsList,
    getOthersProfileAndGameDataWithClan,
    getFriendDetailsList
}
