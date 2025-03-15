const FirestoreManager = require("./Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


// Function to update user by adding or modifying parameters
const updateUserByAddParam = (user) => {
    return {
        uid: user.uid,
        loginAuth: user.loginAuth,
        profileData: {
            userPicture: user.profileData.userPicture,
            userName: user.profileData.userName,
            nameChangeCount: user.profileData.nameChangeCount,
            clanId: user.profileData.clanId,
            cc_id: user.profileData.cc_id,
            totalWinning: user.profileData.totalWinning,
            highestTrophy: user.profileData.highestTrophy,
            gameWon: user.profileData.gameWon,
            gamePlay: user.profileData.gamePlay,
            bestWinStrike: user.profileData.bestWinStrike,
            currentWinStrike: user.profileData.currentWinStrike
        },
        gameData: {
            xp: user.gameData.xp,
            trophy: user.gameData.trophy,
            gems: user.gameData.gems,
            coins: user.gameData.coins,
            isInWar: user.gameData.isInWar,
            collection: user.gameData.collection,
            freeCoin: user.gameData.freeCoin,
            luckyShot: user.gameData.luckyShot,
            chestData: {
                ...user.gameData.chestData,
                isFirstTimeChest: false
            },
            carromPass: user.gameData.carromPass,
            leagueData: user.gameData.leagueData
        },
        encryptedCredential: user.encryptedCredential,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        creatorCode: user.creatorCode
    };
};

// Function to update all users in Firestore
const updateALLUsers = async () => {
    const docIds = await firestoreManager.readCollectionDocumentIds('Users', '/');
    const usersChunks = chunkArray(docIds, 100);

    let i=0;
    for (let usersChunk of usersChunks) {
        const users = await firestoreManager.bulkReadDocuments('Users', '/', usersChunk, {});
        i +=100;
        console.log("done : "+i);

        // Create a list of update promises
        const updatePromises = users.map(user => {
            const updatedUser = updateUserByAddParam(user);
            // Return the promise of the update operation
            return firestoreManager.updateDocument('Users', updatedUser.uid, '/', updatedUser);
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
    const user =  await firestoreManager.readDocument('Users', 'POu7aEDcwYCunEgr' ,'/');
    const updatedUser = updateUserByAddParam(user);
    await firestoreManager.updateDocument('Users', updatedUser.uid, '/', updatedUser);
}

// test();
// updateALLUsers();












