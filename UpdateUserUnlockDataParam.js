const FirestoreManager = require("./Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


// Function to update user by adding or modifying parameters
const updateUserUnlockDataByAddParam = (userUnlockData) => {
    return {
        _id: userUnlockData._id,
        strikerUnlocked : userUnlockData.strikerUnlocked,
        powerUnlocked: userUnlockData.powerUnlocked,
        puckUnlocked: userUnlockData.puckUnlocked,
        trailUnlocked: [{ id: 0, level: 1, collected: 0 }],
        avatarUnlocked: userUnlockData.avatarUnlocked,
        frameUnlocked: userUnlockData.frameUnlocked,
        emojiUnlocked: userUnlockData.emojiUnlocked
    };
};

// Function to update all users in Firestore
const updateALLUsersUnlockData = async () => {
    const docIds = await firestoreManager.readCollectionDocumentIds("UnlockData", "/Data/UserData");
    const usersChunks = chunkArray(docIds, 100);

    let i=0;
    for (let usersChunk of usersChunks) {
        const userUnlockData = await firestoreManager.bulkReadDocuments("UnlockData", "/Data/UserData", usersChunk, {});
        i +=100;
        console.log("done : "+i);

        //Create a list of update promises
        const updatePromises = userUnlockData.map(userUnlockData => {
            const updatedUserUnlockData = updateUserUnlockDataByAddParam(userUnlockData);
            // Return the promise of the update operation
            const id = updatedUserUnlockData._id;
            delete updatedUserUnlockData._id;
            return firestoreManager.updateDocument("UnlockData", id, "/Data/UserData", updatedUserUnlockData);
        });

        // Execute all update operations in parallel
        await Promise.all(updatePromises);
    }
};



function chunkArray(array, size) {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunked_arr.push(chunk);
    }
    return chunked_arr;
}



const test = async () => {
    const userUnlockData =  await firestoreManager.readDocument("UnlockData", "JstJo1Rg9TqVKRfr" ,"/Data/UserData");
    const updatedUser = updateUserUnlockDataByAddParam(userUnlockData);
    console.log(updatedUser);
    const id = updatedUser._id;
    delete updatedUser._id;
    await firestoreManager.updateDocument('UnlockData', id, '/Data/UserData', updatedUser);
}

// test();
// updateALLUsersUnlockData();








