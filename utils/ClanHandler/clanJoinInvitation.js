const FirestoreManager = require("../../Firestore/FirestoreManager");
const UserDataModifier = require("../UserDataModifier");
const WebSocketHttpClient = require('.././WebSocketHttpClient');
const ClanUtilities = require('./clanUtilities');
const NotificationsHandler = require('../notificationsHandler');
const BackboneServerUrl = require('../BackboneServerUrl');
const ClanLock = require("../Lock/ClanLock");
const TrophyLeagueConverter = require("../TrophyLeagueConverter");
const backboneServerUrl = new BackboneServerUrl();

const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();

const {sendMsgToAll,sendMsgToClan,sendMsgToPlayer} = require('../FCM/PushNotificationHandler');



///////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// sendClanJoinInviteNotification /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function sendClanJoinInviteNotification(senderUID, receiverUID, clanId) {
    try {
        // Validate input
        if (!senderUID || !receiverUID || !clanId) {
            throw new Error("All parameters are required." + senderUID + receiverUID + clanId);
        }


        // Read both kicker and kicking member's profileData
        const users = await firestoreManager.bulkReadDocuments("Users", "/", [senderUID, receiverUID], { "profileData.userName": 1, "gameData.trophy": 1});
        const senderName = users[0].profileData.userName;
        const senderTrophy = users[0].gameData.trophy;
        const receiverTrophy = users[1].gameData.trophy;


        // Fetch the clan by clanId
        const clan = await firestoreManager.readDocument("Clans", clanId, "/");

        // Verify sender is eligible to send clan join invitation
        if (!validateSendClanJoinRequest(clan, senderUID, receiverTrophy)) {
            throw new Error("clan join invitation request is invalid");
        }

        // Send notification to receiver
        const clanJoinNotification = {
            type: "clanJoin",
            senderId: senderUID,
            senderName: senderName,
            senderLeague: TrophyLeagueConverter.trophyToLeague(senderTrophy),
            clanLogo: clan.clanLogo,
            clanName: clan.clanName,
            clanId: clan.clanId,
            clanTrophy: clan.clanTrophy,
            timeStamp: Date.now()
        };

        // Construct the notificationId using a type and the senderUID
        const notificationId = `${clanJoinNotification.type}_${senderUID}`;


        let notifications = await firestoreManager.readDocumentWithProjection("Notifications", receiverUID, "/", {[notificationId]: 1})

        if(notifications[notificationId]){
            // already have invite request
            throw new Error("already send clan join invitation request");
        }

        // Send the notification to receiver
        await NotificationsHandler.sendNotification(receiverUID, JSON.stringify(clanJoinNotification), notificationId);

        // Send Notification on Phone
        const body = {
            type: 12 ,
            text: `${users[0].profileData.userName} invited you to join his ${clan.clanName}'s clan.`,
            icon : clan.clanLogo,
            app_open:false,
        }
        const title = "New Clan Request";
        sendMsgToPlayer(JSON.stringify(body),title,receiverUID);
        
        return { status: "success", message: "Invitation sent successfully!" };

    } catch (error) {
        throw new Error("Failed to send clan join invitation: " + error.message);
    }
}


function validateSendClanJoinRequest(clan, uid, receiverTrophy) {

    const userRole = clan.members.find(member => member.UID === uid)?.TYPE;

    if (userRole === "Leader" || userRole === "Co-Leader") {
        return true;

    } else if ((clan.clanType === "Open" || clan.clanType === "Invite Only") && receiverTrophy >= clan.requiredTrophy) {
        return true;
    }

    return false;
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// acceptClanJoinInviteNotification ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function acceptRejectClanJoinInviteNotification(uid, notificationId, isAccepted) {
    try {
        // 2) Validate input
        if (!uid || !notificationId) {
            throw new Error("Both UID and notificationId are required.");
        }

        // 3) Get ClanJoinInviteNotification card from db
        const collName = "Notifications";
        const parentPath = "/";
        const notificationDocument = await firestoreManager.readDocumentWithProjection(collName, uid, parentPath, { [notificationId]: 1 });


        const notificationString = notificationDocument[notificationId];
        const notification = JSON.parse(notificationString);
        if (!notification || notification.type !== "clanJoin") {
            throw new Error("Invalid or missing ClanJoinInviteNotification.");
        }

        if (!isAccepted) {
            //rejected invite join
            // Delete ClanJoinInviteNotification from notifications
            await firestoreManager.deleteField(collName, parentPath, uid, notificationId);
            return {sucess : true};
        }

        return await ClanLock.getInstance().run(notification.clanId, async () => {
            // 5) Get clan from db by clanId
            const clanCollName = "Clans";
            const clan = await firestoreManager.readDocument(clanCollName, notification.clanId, parentPath);
    
            // 6) Check if clan has less than 40 members
            if (clan.members.length >= ClanUtilities.MAX_CLAN_MEMBERS) {
                throw new Error("The clan is already full.");
            }
    
            // 7) Update the user's profile
            const updatedProfileAfterJoinClan = await userDataModifier.updateNewClanJoin(uid, notification.clanId);
    
            // 8) Join the player to the clan
            clan.members.push({
                UID: uid,
                TYPE: clan.members.length === 0 ? "Leader" : "Member",
                LT: 0,
                JT: Date.now()
            });
            await firestoreManager.updateDocument(clanCollName, notification.clanId, parentPath, { members: clan.members });
        
            
            // Delete ClanJoinInviteNotification from notifications
            await firestoreManager.deleteField(collName, parentPath, uid, notificationId);


            // 9) AddJoinedCardToBackboneServer
            addInviteJoinedCardToBackboneServer(uid, notification.senderName, updatedProfileAfterJoinClan.profileData.userName, notification.clanId);

            // 10) Return updated profile
            return updatedProfileAfterJoinClan;
        });

    } catch (error) {
        throw new Error(error.message);
    }
}


async function addInviteJoinedCardToBackboneServer(joinedUID, invitedPlayerName, joinedPlayerName, cid) {

    // Introduce a delay of 4 seconds
    await new Promise(resolve => setTimeout(resolve, 4000));

    //tell backbone server to send JoinMessage to clan for new join player
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'joinedClanByInvite',
        joinedUID: joinedUID,
        invitedPlayerName: invitedPlayerName,
        joinedPlayerName: joinedPlayerName,
        cid: cid,
    };
    const response = await client.request(queryParams);
    return response;
}


module.exports = {
    sendClanJoinInviteNotification,
    acceptRejectClanJoinInviteNotification
}

