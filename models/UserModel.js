class UserModel {
    constructor(uid, loginAuth, profileData, gameData, encryptedCredential) {
        this.uid = uid;
        this.loginAuth = loginAuth;
        this.profileData = profileData;
        this.gameData = gameData;
        this.encryptedCredential = encryptedCredential;
        this.createdAt = Date.now();
        this.lastSeen = Date.now();
        this.creatorCode = "null"
    }
}

module.exports = UserModel;
