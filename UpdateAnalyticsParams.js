const { UUID } = require("mongodb");
const FirestoreManager = require("./Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Function to update user by adding or modifying parameters
const updateUserByAddParam = () => {
    return {
        deviceId: "null",
        appOpenTime: Date.now(),
        appCloseTime: 0,
        duration_min:0,
        adsShown: {},
        purchaseMade: {}
    };
};

// Function to update all users in Firestore
const updateALLUsers = async () => {
    const docIds = await firestoreManager.readCollectionDocumentIds('Notifications', '/');
    const document = updateUserByAddParam();
    for (const uid of docIds) {
        console.log(uid)
        delete document._id;
        await firestoreManager.createDocument('Analytics', uid, '/', document);
    }    
};


const test = async () => {
    const updatedUser = updateUserByAddParam();
    await firestoreManager.updateDocument('Analytics', "POu7aEDcwYCunEgr", '/', updatedUser);
}


// test();
// updateALLUsers();

