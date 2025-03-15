const FirestoreManager = require("../Firestore/FirestoreManager");
    
//const BACKBONE_SERVER_URL = 'ws://167.172.85.50:15999';

class BackboneServerUrl {
    constructor() {
        this.BACKBONE_SERVER_URL = null; // To store the message received from the server
    }

    
    _isBackboneServerUrlValid = () => {
        if (this.BACKBONE_SERVER_URL === null || this.BACKBONE_SERVER_URL.expireTime < Date.now()) {
            return false;
        } else {
            return true;
        }
    }
    
    _loadBackboneServerUrl = async () => {
        const result = await FirestoreManager.getInstance().readDocumentWithProjection("Data", "ServerConfig", "/", { BackboneServerUrl: 1 });
        this.BACKBONE_SERVER_URL = { url: result.BackboneServerUrl , expireTime: Date.now() + 10000 }
    }

    getUrl = async () => {
        if(!this._isBackboneServerUrlValid()){
            await this._loadBackboneServerUrl();
        }

        return this.BACKBONE_SERVER_URL.url

    }

}

module.exports = BackboneServerUrl;
