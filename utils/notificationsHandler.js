const FirestoreManager = require("../Firestore/FirestoreManager");
const WebSocketHttpClient = require('./WebSocketHttpClient');
const ClanUtilities = require('./ClanHandler/clanUtilities');
const BackboneServerUrl = require('./BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();

const firestoreManager = FirestoreManager.getInstance();


async function sendNotification(receiverUID, notificationCard, notificationId) {
    try {
        // Push the new notification
        await firestoreManager.updateDocument("Notifications", receiverUID, "/", { [notificationId]: notificationCard });

        // 20% chance to proceed with the delete/filter operation
        if (Math.random() <= 0.2) {
            // Fetch the entire notificationDocument for the user
            const userNotifications = await firestoreManager.readDocument("Notifications", receiverUID, "/");
            delete userNotifications._id;

            // Excluding the "info" field and get notification keys
            const notificationKeys = Object.keys(userNotifications).filter(key => key !== "info" && key !== "friendList" && key !== "FCMtoken" );

            // Sort the keys based on the timestamp
            notificationKeys.sort((a, b) => {
                const timestampA = userNotifications[a].timeStamp;
                const timestampB = userNotifications[b].timeStamp;
                return timestampA - timestampB; // Ascending order
            });

            // Check if total notifications exceed 50
            while (notificationKeys.length > 50) {
                // Remove the oldest notification (the first key in the sorted array)
                delete userNotifications[notificationKeys.shift()];
            }

            // Save the updated notificationDocument back to the database
            await firestoreManager.createDocument("Notifications", receiverUID, "/", userNotifications);
        }

        sendNotificationCardToBackboneServer(receiverUID, notificationCard, notificationId);

        return { status: "success", message: "Notification sent successfully!" };

    } catch (error) {
        throw new Error("Failed to send notification: " + error.message);
    }
}

async function clearAllNotification(uid) {
    try {
        // Fetch the user's notifications document
        const userNotifications = await firestoreManager.readDocument("Notifications", uid, "/");

        // Excluding the "info" field
        const notificationKeys = Object.keys(userNotifications).filter(key => key !== "info" && key !== "friendList" && key !== "FCMtoken" );

        // Clear all notifications
        for (const key of notificationKeys) {
            delete userNotifications[key];
        }

        // Save the updated document back to the database
        await firestoreManager.createDocument("Notifications", uid, "/", userNotifications);

        return { status: "success", message: "Notifications cleared successfully!" };

    } catch (error) {
        throw new Error("Failed to clear notifications: " + error.message);
    }
}


async function sendNotificationCardToBackboneServer(receiverUID, notificationCard, notificationId) {

    //tell backbone server to send Notification to user for new notificationCard
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'sendNotification',
        receiverUID: receiverUID,
        notificationCard: notificationCard,
        notificationId: notificationId
    };
    const response = await client.request(queryParams);
    return response;
}


async function updateFCMToken(uid, token){
    await firestoreManager.updateDocument("Notifications", uid, "/", { FCMtoken: token });
}


module.exports = {
    sendNotification,
    clearAllNotification,
    updateFCMToken
}

