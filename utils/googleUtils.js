const { OAuth2Client } = require("google-auth-library");
const FirestoreManager = require("../Firestore/FirestoreManager");
const UserDataModifier = require("./UserDataModifier");

const CLIENT_ID = "979104882574-uaotulkaq86io7jjt5s7lv5qb7ak9tto.apps.googleusercontent.com"; // Service Client Id..
const client = new OAuth2Client(CLIENT_ID);

const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    return ticket.getPayload();
}

async function getGoogleAccount(idToken, UID) {
    try {
        const payload = await verify(idToken);
        const email = payload["email"].replace(/\./g, "<dot>");

        const collName = "GoogleAuth";
        const docName = email;
        const parentPath = "/";

        const document = await firestoreManager.readDocument(collName, docName, parentPath);
        if (document) {
            return document;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error getting Google account:", error.message);
        return false;
    }
}

async function createNewGoogleAuthAccount(idToken, UID, ENC) {
    try {
        const payload = await verify(idToken);
        const email = payload["email"].replace(/\./g, "<dot>");

        const googleAuthDocument = {
            UID: UID,
            ENC: ENC,
            email: email,
            payload: payload
        };

        const collName = "GoogleAuth";
        const docName = email;
        const parentPath = "/";

        await firestoreManager.createDocument(collName, docName, parentPath, googleAuthDocument);

        // Change authType in userdata to loginAuth google
        const loginAuth = "google_"+payload["email"];
        const name = payload["given_name"];
        const photo_url = payload["picture"];
        await userDataModifier.updateProfileOnLogin(UID, loginAuth, name, photo_url);

        return googleAuthDocument;
    } catch (error) {
        console.error("Error creating new Google Auth account:", error.message);
        return false;
    }
}

module.exports = {
    verify,
    getGoogleAccount,
    createNewGoogleAuthAccount
}
