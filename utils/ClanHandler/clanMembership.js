const FirestoreManager = require("../../Firestore/FirestoreManager");
const UserDataModifier = require(".././UserDataModifier");
const WebSocketHttpClient = require('.././WebSocketHttpClient');
const ClanSearch = require('./clanSearch');
const ClanUtilities = require('./clanUtilities');
const BackboneServerUrl = require('../BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();
const UserLock = require('../Lock/UserLock');
const ClanLock = require('../Lock/ClanLock');
const UserAndClanLock = require('../Lock/UserAndClanLock');
const TrophyLeagueConverter = require("../TrophyLeagueConverter");
const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();


///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Leave Clan ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function leaveClan(uid) {
    try {
        // Validate UID
        if (!uid) {
            throw new Error("UID is required.");
        }
        const collName = "Clans";
        const parentPath = "/";
        // Leave clan in user's profile and get the clan ID that user left
        const { profileAndGamedata, leavedClan } = await userDataModifier.leaveClan(uid);


        await ClanLock.getInstance().run(leavedClan , async () => {
            // Fetch the clan's current data
            const clan = await firestoreManager.readDocument(collName, leavedClan, parentPath);
    
            // Remove the user from the clan's member list
            // Identify if the leaving member is the leader
            const leavingMember = clan.members.find(member => member.UID === uid);
            if (leavingMember.TYPE === "Leader" && clan.members.length !== 1) {
                clan.members = ClanUtilities.handleLeaderDeparture(clan.members);
            } else {
                clan.members = clan.members.filter(member => member.UID !== uid);
            }
    
            if (clan.members.length === 0) {
                ClanSearch.deleteClanToClanSearch(clan.clanId);
            }
    
            // Update the clan's document with the updated member list
            await firestoreManager.updateDocument(collName, leavedClan, parentPath, { members: clan.members });
    
            addLeaveCardToBackboneServer(uid, profileAndGamedata.profileData.userName, clan.clanId);
        });
       
        return profileAndGamedata;

    } catch (error) {
        throw new Error("Failed to leave clan: " + error.message);
    }
}

async function addLeaveCardToBackboneServer(leftUID, playerName, cid) {

    // Introduce a delay of 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    //tell backbone server to send JoinMessage to clan for new join player
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'LeftClan',
        leftUID: leftUID,
        playerName: playerName,
        cid: cid,
    };
    const response = await client.request(queryParams);
    return response;
}




///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Join Clan ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function HandleClanJoin(uid, clan, userGameData, userProfileData) {


    if (clan.clanType === "Closed") {

        throw new Error("The clan is Closed");


    } else if (clan.clanType === "Open") {

        // Check if the user meets the requiredTrophy value to join this clan
        if (userGameData.trophy < clan.requiredTrophy) {
            throw new Error("You do not meet the required trophy value to join this clan");
        }
        let existingMember = clan.members.find(member => member.UID === uid);

        if (!existingMember) {
            // Add new member to the clan's members list
            clan.members.push({
                UID: uid,
                TYPE: clan.members.length === 0 ? "Leader" : "Member",
                LT: 0,
                JT: Date.now()
            });
        }
        // Update the clan's document with the updated member list
        const collName = "Clans";
        const parentPath = "/";
        await firestoreManager.updateDocument(collName, clan.clanId, parentPath, { members: clan.members });


        // Update the user's profile to reflect the new clan membership
        const updatedProfileAfterJoinClan = await userDataModifier.updateNewClanJoin(uid, clan.clanId);

        addJoinedCardToBackboneServer(uid, userProfileData.userName, clan.clanId);

        return updatedProfileAfterJoinClan;



    } else if (clan.clanType === "Invite Only") {


        // Check if the user meets the requiredTrophy value to join this clan
        if (userGameData.trophy < clan.requiredTrophy) {
            throw new Error("You do not meet the required trophy value to join this clan");
        }

        // check is is already send a joined request to that clan or not if yes the send error : you already send request to that clan.
        const messagesHistory = await ClanUtilities.getClanChatHistory(clan.clanId);
        delete messagesHistory._id; delete messagesHistory.info;
        if (ClanUtilities.isAlreadySendJoinRequest(uid, messagesHistory)) {
            throw new Error("You already sent a joint request");
        }


        //tell backbone server to send message to clan for accept/reject join
        const url = await backboneServerUrl.getUrl();
        const client = new WebSocketHttpClient(url);
        const queryParams = {
            uid: 'InternalServerServicesCall',
            callType: 'sendClanJoinedRequest',
            senderId: uid,
            senderName: userProfileData.userName,
            senderLeagueLogo: TrophyLeagueConverter.trophyToLeague(userGameData.trophy),
            senderAvatar: userProfileData.userPicture.avatar,
            senderFrame: userProfileData.userPicture.frame,
            senderTrophy: userGameData.trophy,
            isSenderPremium: userGameData.carromPass.isPremiumMember,
            cid: clan.clanId
        };
        const response = await client.request(queryParams);
        return response;

    }

    throw new Error("error : x0345");
}


async function joinClan(uid, clanId) {
    try {

        const collName = "Clans";
        const parentPath = "/";

        // Fetch the desired clan's current data
        const clan = await firestoreManager.readDocument(collName, clanId, parentPath);

        // Check if the clan is already full or if the request no longer exists
        if (clan.members.length >= ClanUtilities.MAX_CLAN_MEMBERS) {
            throw new Error("The clan is already full");
        }

        // get user profile
        const userProfileAndGameData = await userDataModifier.getUserProfileAndGameData(uid);
        if (userProfileAndGameData.gameData.trophy < clan.requiredTrophy) {
            throw new Error("You do not meet the required trophy value to join this clan");
        }


        const response = await HandleClanJoin(uid, clan, userProfileAndGameData.gameData, userProfileAndGameData.profileData);

        return response;

    } catch (error) {
        throw new Error("Failed to join clan: " + error.message);
    }
}


async function addJoinedCardToBackboneServer(joinedUID, playerName, cid) {

    // Introduce a delay of 4 seconds
    await new Promise(resolve => setTimeout(resolve, 4000));

    //tell backbone server to send JoinMessage to clan for new join player
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'joinedClan',
        joinedUID: joinedUID,
        playerName: playerName,
        cid: cid,
    };
    const response = await client.request(queryParams);
    return response;
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// handle RequestJoinClan ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function handleRequestJoin(uid, clanId, requestMessageId, isAccepted) {

    try {


        //getClan and evaluate is eligible to accecpt/reject request clanJoin message
        const clan = await firestoreManager.readDocument("Clans", clanId, "/");
        // Check if the clan is already full or if the request no longer exists
        if (clan.members.length >= ClanUtilities.MAX_CLAN_MEMBERS) {
            throw new Error("The clan is already full.");
        }
        const actionMember = clan.members.find(member => member.UID === uid);
        if (!actionMember) {
            throw new Error("The Player is not in clan hence, can't accept/reject joinRequest.");
        }
        if (actionMember.TYPE === "Member") {
            throw new Error("The Memeber can't handle joinRequest.");
        }


        //getClanMessage Invite Card
        const clanMsg = await firestoreManager.readDocumentWithProjection("ClanMsg", clanId, "/", { [requestMessageId]: 1 });
        if(!clanMsg[requestMessageId]){
            throw new Error("The Clan Msg not found or already deleted");
        }
        
        const REQUEST_MessageCard = JSON.parse(clanMsg[requestMessageId]);

        //handle 
        const { actionCode, profileData } = await UserLock.getInstance().run(REQUEST_MessageCard.senderId, async() => {
            return await handleJoinAction(uid, REQUEST_MessageCard.senderId, clan, isAccepted);
        });

        //update clanMessage by backBoneServer
        const response = await updateClanMessageByBackboneServer(uid, REQUEST_MessageCard.senderId, profileData.userName, REQUEST_MessageCard.senderName, actionCode, clanId, requestMessageId);

        return response;

    } catch (error) {
        throw new Error("Failed to handleRequestJoin clan: " + error.message);
    }
}

async function handleJoinAction(actionId, senderId, clan, isAccepted) {

    const userProfileAndGameDataAction = await userDataModifier.getUserProfileAndGameData(actionId);

    if (isAccepted) {
        const userProfileAndGameData = await userDataModifier.getUserProfileAndGameData(senderId);

        if (userProfileAndGameData.profileData.clanId === "null") {

            // Add the user to the clan's members list
            clan.members.push({
                UID: senderId,
                TYPE: clan.members.length === 0 ? "Leader" : "Member",
                LT: 0,
                JT: Date.now()
            });

            // Update the clan's document with the updated member list
            await firestoreManager.updateDocument("Clans", clan.clanId, "/", { members: clan.members });

            // Update the user's profile to reflect the new clan membership
            userProfileAndGameData.profileData.clanId = clan.clanId;
            await firestoreManager.updateDocument("Users", senderId, "/", { profileData: userProfileAndGameData.profileData });

            return { actionCode: 1, profileData: userProfileAndGameDataAction.profileData }; // player join accepted

        } else {
            return { actionCode: -1, profileData: userProfileAndGameDataAction.profileData }; // already join clan
        }

    } else {

        return { actionCode: 0, profileData: userProfileAndGameDataAction.profileData }; // request rejected
    }

}

async function updateClanMessageByBackboneServer(uid, senderUID, actionMemberName, playerName, actionCode, clanId, requestMessageId) {

    //tell backbone server to action JoinMessage to clan for accept/reject/already join
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'actionJoinedRequest',
        actionMemberUid: uid,
        onActionDoneUid: senderUID,
        actionMemberName: actionMemberName,
        playerName: playerName,
        actionCode: actionCode,
        requestMessageId: requestMessageId,
        cid: clanId
    };
    const response = await client.request(queryParams);
    return response;
}



module.exports = {
    leaveClan,
    joinClan,
    handleRequestJoin
};
