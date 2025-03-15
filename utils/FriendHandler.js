const firestoreManager = require("../Firestore/FirestoreManager").getInstance();
const DBdirectConnect = require("./DBdirectConnect")
const WebSocketHttpClient = require('./WebSocketHttpClient');
const BackboneServerUrl = require('./BackboneServerUrl');
const TrophyLeagueConverter = require("./TrophyLeagueConverter");
const backboneServerUrl = new BackboneServerUrl();
const NotificationsHandler = require('./notificationsHandler');
const {sendMsgToAll,sendMsgToClan,sendMsgToPlayer} = require('./FCM/PushNotificationHandler');
const AppConfiguration_v_3_2_1 = require('./StaticDocument/GameInfo/AppConfiguration_v_3_2_1');

const fetchClanDetails = async (clanIds) => {
    const collName = 'Clans';
    const parentPath = '/';
    const projection = { "clanName": 1, "clanLogo": 1 };
    const clansData = await firestoreManager.bulkReadDocumentsInMap(collName, parentPath, clanIds, projection);
    return clansData;
}

const searchForFriend = async (searchKey) => {
    let db = await DBdirectConnect.getDb("userNameSearch");
    let profilesByUserName = await DBdirectConnect.getUsersByName(db, searchKey, 10);
    let profilesByCCID = await DBdirectConnect.getUserByCCID(db, searchKey, 10);
    let combinedProfiles = profilesByUserName.concat(profilesByCCID);

    // Extract clanIds and fetch clan details
    const clanIds = combinedProfiles.map(profile => profile.profileData.clanId).filter(clanId => clanId !== "null" && clanId !== undefined);
    let clanDetails = {};
    if (clanIds.length > 0) {
        clanDetails = await fetchClanDetails(clanIds);
    }

    // Embed clan details into player profiles
    combinedProfiles = combinedProfiles.map(profile => {
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

    return combinedProfiles;
}


const sendFriendRequest = async (uid, playerUID) => {

    if(uid === playerUID){
        throw Error("Frient request can't send to us!");
    }

    const userNotifications = await firestoreManager.readDocumentWithProjection("Notifications", uid, "/", {friendList:1});
    const friendList = userNotifications.friendList;

    // Check if the playerUID is already in the friend list
    const isAlreadyFriend = friendList.some(friend => friend.uid === playerUID);
    if (isAlreadyFriend) {
        throw new Error("This player is already in your friend list.");
    }


    
    // Read sender player profile
    const user = await firestoreManager.readDocument("Users", uid, "/");

    let clan = {clanLogo : 0, clanName: "No Clan", clanId: user.profileData.clanId}

    if(clan.clanId !== "null"){
        // Fetch the clan by clanId
        clan = await firestoreManager.readDocument("Clans", clan.clanId, "/");
    }


    // Send notification to receiver
    const friendRequestNotification = {
        type: "friendRequest",
        senderId: user.uid,
        senderName: user.profileData.userName,
        senderLeague: TrophyLeagueConverter.trophyToLeague(user.gameData.trophy),
        userPicture: user.profileData.userPicture,
        isPremiumMember: user.gameData.carromPass.isPremiumMember,
        clanLogo: clan.clanLogo,
        clanName: clan.clanName,
        clanId: clan.clanId,
        playerTrophy: user.gameData.trophy,
        timeStamp: Date.now()
    };

    let senderUID = friendRequestNotification.senderId;
    let receiverUID = playerUID;

    // Construct the notificationId using a type and the senderUID
    const notificationId = `${friendRequestNotification.type}_${senderUID}`;
    let notifications = await firestoreManager.readDocumentWithProjection("Notifications", receiverUID, "/", {[notificationId]: 1});
    if(notifications[notificationId]){
        // already have invite request
        throw new Error("Already friend request sent.");
    }

    /*
    {
  "type": "friendRequest",
  "senderId": "7MzFu8wVTP6H8M1r",
  "senderName": "guest_mfax",
  "senderLeague": "1_1",
  "clanLogo": 5,
  "clanName": "Knight Kings",
  "clanId": "VBQYWFOKQ",
  "playerTrophy": 0,
  "timeStamp": 1720233459347
    }
  */

    // Send the notification to receiver
    await NotificationsHandler.sendNotification(receiverUID, JSON.stringify(friendRequestNotification), notificationId);
    
    // Send Notification on Phone
    let icon = user.profileData.userPicture.avatar;
    const appConfig = await AppConfiguration_v_3_2_1.get();
    if (icon.startsWith("https://graph.facebook.com")) {
        icon = icon.replace("$", appConfig.accessToken);
    }
    const body = {
        type: 11 ,
        text: `${user.profileData.userName} wants to be your friend.`,
        icon : icon,
        frame: user.profileData.userPicture.frame,
        app_open:false,
    }
    const title = "New Friend Request";
    sendMsgToPlayer(JSON.stringify(body),title,receiverUID);
    
    return true;
    
}


const acceptRejectFriendRequest = async (uid, notificationId, isAccepted) => {
    // 1) Retrieve the friend request notification from the Notifications collection
    const collName = "Notifications";
    const parentPath = "/";
    const notificationDocument = await firestoreManager.readDocumentWithProjection(collName, uid, parentPath, { [notificationId]: 1 });
    const notificationString = notificationDocument[notificationId];
    const notification = JSON.parse(notificationString);
    if (!notification || notification.type !== "friendRequest") {
        throw new Error("Invalid or missing friend request notification.");
    }

    // 2) Action rejected: Remove the notification and return success
    if (!isAccepted) {
        // Delete friend request notification from notifications
        await firestoreManager.deleteField(collName, "/", uid, notificationId);
        return { success: true };
    }

    // 3) Action accepted: Add each user to the other's friend list
    const senderId = notification.senderId;
    const receiverId = uid;

    // Read current friend lists
    const senderFriends = await firestoreManager.readDocumentWithProjection("Notifications", senderId, "/", { friendList: 1 });
    const receiverFriends = await firestoreManager.readDocumentWithProjection("Notifications", receiverId, "/", { friendList: 1 });

    // Prepare friend list updates
    const senderFriendList = senderFriends.friendList || [];
    const receiverFriendList = receiverFriends.friendList || [];
    
    // Add receiver to sender's friend list if not already added
    if (!senderFriendList.some(friend => friend.uid === receiverId)) {
        senderFriendList.push({ uid: receiverId, ts: Date.now() });
    }
    // Add sender to receiver's friend list if not already added
    if (!receiverFriendList.some(friend => friend.uid === senderId)) {
        receiverFriendList.push({ uid: senderId, ts: Date.now() });
    }

    // Update both friend lists in the database
    await firestoreManager.updateDocument("Notifications", senderId, "/", { friendList: senderFriendList });
    await firestoreManager.updateDocument("Notifications", receiverId, "/", { friendList: receiverFriendList });

    // Delete the friend request notification after acceptance
    await firestoreManager.deleteField(collName, "/", uid, notificationId);

    sendNotificationInvalidateToBackboneServer(senderId, "friendList");

    return { success: true };
}

const removeFriend = async(uid1, uid2) => {
    // Read current friend lists
    const uid1FriendsDocument = await firestoreManager.readDocumentWithProjection("Notifications", uid1, "/", { friendList: 1 });
    const uid2FriendsDocument = await firestoreManager.readDocumentWithProjection("Notifications", uid2, "/", { friendList: 1 });
    
    // Extract the friend lists, if they exist
    const uid1Friends = uid1FriendsDocument.friendList || [];
    const uid2Friends = uid2FriendsDocument.friendList || [];

    // Filter out the friend from each user's friend list
    const updatedUid1Friends = uid1Friends.filter(friend => friend.uid !== uid2);
    const updatedUid2Friends = uid2Friends.filter(friend => friend.uid !== uid1);

    // Update both friend lists in the database
    await firestoreManager.updateDocument("Notifications", uid1, "/", { friendList: updatedUid1Friends });
    await firestoreManager.updateDocument("Notifications", uid2, "/", { friendList: updatedUid2Friends });

    sendNotificationInvalidateToBackboneServer(uid2, "friendList");

    return { success: true };
}


async function sendNotificationInvalidateToBackboneServer(receiverUID, type) {

    //tell backbone server to send Notification to user for new notificationCard
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'invalidateNotification',
        receiverUID: receiverUID,
        type: type
    };
    const response = await client.request(queryParams);
    return response;
}


module.exports = {
    searchForFriend,
    sendFriendRequest,
    acceptRejectFriendRequest,
    removeFriend
}