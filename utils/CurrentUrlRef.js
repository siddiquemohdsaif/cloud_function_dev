const FirestoreManager = require("../Firestore/FirestoreManager");
    
//const _SERVER_URL = 'any from db';

class CurrentUrlRef {
    constructor(ServerUrlName) {
        this.ServerUrlName = ServerUrlName;
        this._SERVER_URL = null; // To store the message received from the server
    }

    
    _isServerUrlValid = () => {
        if (this._SERVER_URL === null || this._SERVER_URL.expireTime < Date.now()) {
            return false;
        } else {
            return true;
        }
    }
    
    _loadServerUrl = async () => {
        const result = await FirestoreManager.getInstance().readDocumentWithProjection("Data", "ServerConfig", "/", { [this.ServerUrlName] : 1 });
        this._SERVER_URL = { url: result[this.ServerUrlName] , expireTime: Date.now() + 10000 }
    }

    getUrl = async () => {
        if(!this._isServerUrlValid()){
            await this._loadServerUrl();
        }

        return this._SERVER_URL.url

    }

}

module.exports = CurrentUrlRef;
