const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

 const processGameOver = async (UID1, UID2, map)=> {
    try {

        const surveillanceDocument = await firestoreManager.readDocument("Data", "Surveillance", "/");
        const surveillanceID = surveillanceDocument.uidList;
        console.log(`Surveillance IDs: ${surveillanceID}`);

        for (const uid of surveillanceID) {
            if (uid === UID1 || uid === UID2) {
                console.log(`Processing for UID: ${uid}`);
                const document = await firestoreManager.readDocument("MatchInfo", uid, "/Data/Surveillance");
                const matchInfo = {
                    UID1: UID1,
                    UID2: UID2,
                    map: map,
                    winnerUID: UID1,
                    timestamp: Date.now()  // Capture the time of the match
                };

                if (document) {
                    console.log(`Updating existing document for UID: ${uid}`);
                    delete document._id;  // Ensure _id is not duplicated in Firestore updates
                    document.matchList = document.matchList || [];
                    document.matchList.push(matchInfo);
                    await firestoreManager.updateDocument("MatchInfo", uid, "/Data/Surveillance/", document);
                } else {
                    console.log(`Creating new document for UID: ${uid}`);
                    const newDocument = {
                        matchList: [matchInfo] // Initialize matchList with matchInfo as the first item
                    };
                    await firestoreManager.createDocument("MatchInfo", uid, "/Data/Surveillance/", newDocument);
                }
            }
        }


        console.log("Game over process completed successfully");
        return { success: true, message: "Game over processed successfully" };
    } catch (error) {
        console.error("Error in processGameOver:", error);
        throw error;
    }
}

// processGameOver("9h5pjGon2eLh1hlu","POu7aEDcwYCunEgr",2);