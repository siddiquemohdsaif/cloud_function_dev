const FirestoreManager = require("./Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const updateNotification = async (notificationId, updatedParams) => {
    try {
        await firestoreManager.updateDocument('Notifications', notificationId, '/', updatedParams);
        console.log(`Notification ${notificationId} updated successfully.`);
    } catch (error) {
        console.error('Error updating notification:', error);
    }
}

const updateAllNotifications = async () => {
    const docIds = await firestoreManager.readCollectionDocumentIds('Notifications', '/');
    const notificationChunks = chunkArray(docIds, 100);


    for (let notificationChunk of notificationChunks) {
        const notifications = await firestoreManager.bulkReadDocuments('Notifications', '/', notificationChunk, {});

        const updatePromises = notifications.map(notification => {
            const { _id, friendList,  info,  ...restOfNotification } = notification;  // Destructure to separate _id and the rest of the properties
            
            let updatedFriendList = friendList || [];
            if (updatedFriendList.length > 0) {
                updatedFriendList = updatedFriendList.map(friend => ({
                    ...friend,
                    ls: Date.now() // Add 'ls' property to each friend object
                }));
            }

            const updatedParams = {
                friendList : updatedFriendList,
                info : "notification message history save below",
                ...restOfNotification,  // Use the spread operator to include all other properties
                // You can modify or add new properties here as needed
            };
            return updateNotification(notification._id, updatedParams);
        });

        await Promise.all(updatePromises);
    }
};

function chunkArray(array, size) {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunkedArr.push(chunk);
    }
    return chunkedArr;
}

const testUpdateNotification = async () => {
    const notification =  await firestoreManager.readDocument('Notifications', 'f6VhoQDwo4fItxrv' ,'/');
    
    console.log(notification);

    const { _id, friendList,  info,  ...restOfNotification } = notification;  // Destructure to separate _id and the rest of the properties
    let updatedFriendList = friendList || [];
            if (updatedFriendList.length > 0) {
                updatedFriendList = updatedFriendList.map(friend => ({
                    ...friend,
                    ls: Date.now() // Add 'ls' property to each friend object
                }));
            }
    const updatedParams = {
        friendList : updatedFriendList,
        info : "notification message history save below",
        ...restOfNotification,  // Use the spread operator to include all other properties
    };
    return updateNotification(notification._id, updatedParams);

}


// Uncomment to run the function for all notifications
// first comment del doc._id in firestore 
// updateAllNotifications();
// testUpdateNotification();


