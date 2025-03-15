const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// const DELETION_PERIOD_MS = 3600 * 1000 * 24 * 14; // 14 days 
const DELETION_PERIOD_MS = 600* 1000; // 14 days 

const deleteAccountProcessInitiate = async (uid) => {
    try {
        const profileData = await firestoreManager.readDocument("Users", uid, "/");
        profileData.deleteAt = Date.now() + DELETION_PERIOD_MS;

        await firestoreManager.updateDocument("Users", uid, "/", { "deleteAt": profileData.deleteAt });

        return profileData;
    } catch (error) {
        console.error('Error in deleteAccountProcessInitiate:', error.message);
        throw new Error('Failed to initiate account deletion process');
    }
}

const cancelAccountDeletionProcess = async (uid) => {
    try {
        const profileData = await firestoreManager.readDocument("Users", uid, "/");
        if (profileData.deleteAt) {
            if (profileData.deleteAt > Date.now()) {
                delete profileData.deleteAt;
                await firestoreManager.deleteField("Users", "/",uid, "deleteAt");
            } else {
                throw new Error("Account is already deleted!");
            }
        } else {
            throw new Error("Account deletion is not initiated yet!");
        }
        return profileData;
    } catch (error) {
        console.error('Error in cancelAccountDeletionProcess:', error.message);
        throw new Error('Failed to cancel account deletion process');
    }
}

const doAllDeleteProcess = async (profileData) => {
    // Clean profile
    profileData.gameData.chestData.freeChests = [null, null, null, null];
    profileData.gameData.chestData.clanWarChest = null;
    profileData.gameData.chestData.currentOpenChest = null;

    // Update encrypted credentials
    profileData.encryptedCredential = "__" + profileData.encryptedCredential; // "__" means deleted

    // Google logout
    if (profileData.loginAuth.startsWith("google_")) {
        // Delete Google login data
        let email = profileData.loginAuth.replace("google_", "");
        email = email.replace(/\./g, "<dot>")
        const collName = "GoogleAuth";
        const docName = email;
        const parentPath = "/";

        try {
            await firestoreManager.deleteDocument(collName, docName, parentPath);
        } catch (e) {
            // Ignore
        }
    }

    // Update profile
    await firestoreManager.updateDocument("Users", profileData.uid, "/", {
        "gameData.chestData": profileData.gameData.chestData,
        "deletedAt": profileData.deletedAt,
        "encryptedCredential": profileData.encryptedCredential
    });
}

const deleteAccount = async (uid) => {
    try {
        const profileData = await firestoreManager.readDocument("Users", uid, "/");

        if (profileData.deleteAt) {
            if (profileData.deleteAt < Date.now()) {
                // Delete account
                profileData.deletedAt = Date.now();
                delete profileData.deleteAt;
                await firestoreManager.deleteField("Users", "/", uid, "deleteAt");
                await doAllDeleteProcess(profileData);

                return profileData
            } else {
                throw new Error("Account deleted time is not come yet!");
            }
        } else {
            throw new Error("Account deletion is not initiated yet!");
        }
    } catch (error) {
        console.error('Error in deleteAccount:', error.message);
        throw new Error('Failed to delete account');
    }
}

module.exports = {
    deleteAccountProcessInitiate,
    cancelAccountDeletionProcess,
    deleteAccount
};
