const { OAuth2Client } = require("google-auth-library");
const axios = require('axios');
const FirestoreManager = require("../Firestore/FirestoreManager");
const UserDataModifier = require("./UserDataModifier");

const CLIENT_ID = "997243586766-i2q38h6ke3vd6ccc1ma3v83k3rrccrjg.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();

async function verifyFacebookToken(accessToken, userId,email) {
    const appId = '451633481200901';
    const appSecret = '1e1991e0c742376c6950fbebead7ccce';
    try {
        const response = await axios.get(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`);
        if (response.data.data.is_valid && response.data.data.user_id === userId) {
            console.log('Token is valid');
            const userInfo = await fetchFacebookUserData(accessToken,email); // Correctly wait for the userInfo
            return userInfo; // Return the user info from this function
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Error verifying Facebook token:', error);
        throw error; // Rethrow the error to be handled outside this function
    }
}


async function fetchFacebookUserData(accessToken,email) {
    try {
        const response = await axios.get(`https://graph.facebook.com/v15.0/me`, {
            params: {
                fields: 'name,email', // Specify the fields you need
                access_token: accessToken
            }
        });
        if (!response.data.email && email !== null){
            response.data.email = email;
        }
        const loginPhotoUrl = `https://graph.facebook.com/${response.data.id}/picture?type=large&access_token=$`;
        response.data.loginPhotoUrl = loginPhotoUrl;
        return response.data; // Return the modified data with photo URL
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}

async function getFacebookAccount(idToken, UID, userId,emailId) {
    try {
        const payload = await verifyFacebookToken(idToken,userId,emailId);
        console.log(payload);

        const collName = "FacebookAuth";
        const docName = userId;
        const parentPath = "/";

        const document = await firestoreManager.readDocument(collName, docName, parentPath);
        if (document) {
            return document;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error getting Facebook account:", error.message);
        return false;
    }
}

async function createNewFacebookAuthAccount(idToken, UID, ENC, userId,emailId) {
    try {
        const payload = await verifyFacebookToken(idToken,userId,emailId);
        console.log(payload);
        const email = payload["email"].replace(/\./g, "<dot>");

        const facebookAuthDocument = {
            UID: UID,
            ENC: ENC,
            email: email,
            payload: payload
        };

        const collName = "FacebookAuth";
        const docName = userId;
        const parentPath = "/";

        await firestoreManager.createDocument(collName, docName, parentPath, facebookAuthDocument);

        // Change authType in userdata to loginAuth google
        const loginAuth = "facebook_"+payload["id"];
        const name = payload["name"];
        const photo_url = payload["loginPhotoUrl"];
        await userDataModifier.updateProfileOnLogin(UID, loginAuth, name, photo_url);

        return facebookAuthDocument;
    } catch (error) {
        console.error("Error creating new Facebook Auth account:", error.message);
        return false;
    }
}

module.exports = {
    verifyFacebookToken,
    getFacebookAccount,
    createNewFacebookAuthAccount
}
