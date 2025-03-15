const FirestoreManager = require("../Firestore/FirestoreManager");

const firestoreManager = FirestoreManager.getInstance();

function generateRandomString_Aa0(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomString_A(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomString_a(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function generateCC_ID() {
    for (let i = 0; i < 20; i++) {
        const cc_id = generateRandomString_A(9);
        const cc_id_doc = await getCC_ID_Doc(cc_id);
        if (!cc_id_doc) {
            return cc_id;
        }
    }
    throw new Error("failed to create account x001");
}

async function getCC_ID_Doc(CC_ID) {
    try {
        const collName = "CC-ID-MAP";
        const docName = CC_ID;
        const parentPath = "/";
        const document = await firestoreManager.readDocument(collName, docName, parentPath);
        if (document) {
            return document;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

async function createCC_ID_DOC(cc_id, uid) {
    try {
        const collName = "CC-ID-MAP";
        const docName = cc_id;
        const parentPath = "/";
        const createResult = await firestoreManager.createDocument(collName, docName, parentPath, { uid });
        if (createResult) {
            return createResult;
        } else {
            throw new Error("failed to create account x002");
        }
    } catch (error) {
        throw new Error("failed to create account x003");
    }
}

async function createUserInitialData( notification , uid , UnlockData, analytics,surveillance ) {
    try {
        await Promise.all([
            firestoreManager.createDocument("Notifications", uid , '/' , notification ),
            firestoreManager.createDocument("UnlockData", uid , '/Data/UserData' , UnlockData ),
            firestoreManager.createDocument("Analytics", uid , '/' , analytics ),
            firestoreManager.createDocument('MatchInfo', uid, '/Data/Surveillance/', surveillance)
        ]);
    } catch (error) {
        throw new Error("failed to create account x003");
    }
}

module.exports = {
    generateRandomString_Aa0,
    generateRandomString_A,
    generateRandomString_a,
    generateCC_ID,
    getCC_ID_Doc,
    createCC_ID_DOC,
    createUserInitialData
}
