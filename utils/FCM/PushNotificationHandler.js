const FCMPushNotification = require('./FCMPushNotification');
const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

require('dotenv').config();

const Options = {
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};
const fcmPushNotification = new FCMPushNotification(Options);






const sendMsgToAll = async (notificationBody, title) => {

    try{
        const result = await fcmPushNotification.sendNotificationToAll(notificationBody, title);
        return result;

    }catch (e){

        console.error(e);
    }

}




const sendMsgToClan = async (notificationBody, title, clanId) => {

    try{
        const result = await fcmPushNotification.sendNotificationToTopic(notificationBody, title, clanId);
        return result;

    }catch (e){

        console.error(e);
    }

}


const sendMsgToPlayer = async (notificationBody, title, uid) => {

    try{
        const result = await fcmPushNotification.sendNotificationToTopic(notificationBody, title, uid);
        return result;

    }catch (e){

        console.error(e);
    }

}



module.exports = {
    sendMsgToAll,
    sendMsgToClan,
    sendMsgToPlayer
}















// const test = async () => {

//     //const result = await fcmPushNotification.sendNotification("cTAxzrcVRLSvfVW48l5T1a:APA91bEWpUF00k8SKueK8HXZxYi-AjjlqGiTAR9cN3xmB3VHHKxdPFHX9ukGysIQDgdSbioFqKKIeV60CnL_-BUIB_zMKuLl2udTjEWQ85voC7c4k-8HH2HVFoPGSgITixn6inOfQKot", "this is body", "this is tittle6");
    
    
//     const notificationBody = JSON.stringify({
//         type: 2,  // Specifies that this is a notification with an extra icon
//         text: "This is the notification body text",
//         icon: "https://t4.ftcdn.net/jpg/05/70/25/53/240_F_570255323_QM1BvMuSwOWGnQj2UacVtcRbsSllgDtu.jpg"  // URL of the icon to display on the right
//     });
    
//     const result = await fcmPushNotification.sendNotificationToAll(notificationBody, "This is the title for all");
//     console.log(result)
// }

// test();






