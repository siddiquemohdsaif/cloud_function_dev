const { MongoClient } = require('mongodb');

class MongoConnection {
    static client;
    static async getDb(purpose) {
        const uri = 'mongodb://128.199.227.113:23115/';
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }

        let dbName;
        if (purpose === "userNameSearch") {
            dbName = 'carrom-clash-9t32';
        }else if (purpose === "eventTopPlayers" || purpose === "createEvent") {
            dbName = 'carrom-clash-9t32`Data`Event';
        }
         else {
            throw new Error("unknown purpose!");
        }

        return this.client.db(dbName);
    }
}


const getDb = async(purpose) => {
    return await MongoConnection.getDb(purpose);
}


/////////////////////////////// friend search //////////////////////////////////////////////// 
/**
 * 
 * @param {Db} db 
 * @param {String} userName 
 * @param {Number} limit 
 * @returns {Object}
 */
const getUsersByName = async (db, userName, limit) => {
    const collection = db.collection('Users');
    const query = { $text: { $search: `^${userName}`, $caseSensitive :false }};
    const projection = { projection: { "gameData": {"xp" : 1, "trophy" : 1, "collection" : 1, "carromPass" : { "isPremiumMember" : 1 }}, "profileData": 1, "uid": 1 }};
    const result = await collection.find(query, projection)
        .limit(limit)
        .toArray();

    // const explainPlan = await collection.find(query)
    // .limit(limit)
    // .explain("executionStats");
    // console.log('Explain Plan:', JSON.stringify(explainPlan));

    return result;
}


/**
 * 
 * @param {Db} db 
 * @param {String} userName 
 * @param {Number} limit 
 * @returns {Object}
 */
const getUserByCCID = async (db, CCID, limit) => {
    const collection = db.collection('Users');
    const query = { "profileData.cc_id":  new RegExp(`^${CCID}`) };
    const projection = { projection: { "gameData": {"xp" : 1, "trophy" : 1, "collection" : 1, "carromPass" : { "isPremiumMember" : 1 }}, "profileData": 1, "uid": 1 }};
    const result = await collection.find(query, projection)
    .limit(limit)
    .toArray();
    
    // const explainPlan = await collection.find(query)
    // .limit(limit)
    // .explain("executionStats");
    // console.log('Explain Plan:', JSON.stringify(explainPlan));

    return result;
}
/////////////////////////////// friend search //////////////////////////////////////////////// 


/////////////////////////////// event  //////////////////////////////////////////////// 
/**
 * 
 * @param {Db} db 
 * @param {String} eventId 
 * @param {Number} limit 
 * @returns {Object}
 */
const getTopPlayerofCoinBasedEevent = async (db, eventId, limit) => {
    const collection = db.collection(eventId);
    const result = await collection.find()
        .sort({"coins": -1}) // Sorting by coins in descending order
        .limit(limit)
        .toArray();

    // const explainPlan = await collection.find()
    // .sort({"coins": -1}) // Sorting by coins in descending order
    // .limit(limit)
    // .explain("executionStats");
    // console.log('Explain Plan:', JSON.stringify(explainPlan));

    return result;
}


/**
 * Fetches a single player's data from the specified event collection.
 * 
 * @param {Db} db - The database connection object.
 * @param {String} eventId - The unique identifier for the event.
 * @param {String} uid - The unique identifier for the user.
 * @returns {Object} The player's data object or null if not found.
 */
const getSinglePlayerofCoinBasedEevent = async (db, eventId, uid) => {
    const collection = db.collection(eventId);
    const playerData = await collection.findOne({"uid": uid});

    if (!playerData) {
        console.log(`No data found for UID: ${uid}`);
        return null;
    }

    return playerData;
}



/**
 * Creates a database collection for a coin-based event with a specific ID and sets up an index on the 'coins' field.
 * 
 * @param {Db} db - The database connection.
 * @param {String} eventId - The ID for the new event collection.
 * @returns {Promise<boolean>} A promise that resolves to true if the collection and index were successfully created.
 */
const createCoinBaseEvent = async (db, eventId) => {
    try {
        const collection = await db.createCollection(eventId);
        await collection.createIndex({ "coins": -1 }); // Creating an index on the 'coins' field for efficient sorting
        return true;
    } catch (error) {
        console.error('Error creating collection:', error);
        return false;
    }
};


/**
 * Deletes a database collection associated with a specific event ID.
 * 
 * @param {Db} db - The database connection.
 * @param {String} eventId - The ID of the event collection to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the collection was successfully deleted.
 */
const deleteEvent = async (db, eventId) => {
    try {
        await db.collection(eventId).drop();
        return true;
    } catch (error) {
        console.error('Error deleting collection:', error);
        return false;
    }
};

/////////////////////////////// event  //////////////////////////////////////////////// 



module.exports = {
    getDb,
    getUsersByName,
    getUserByCCID,
    getTopPlayerofCoinBasedEevent,
    getSinglePlayerofCoinBasedEevent,
    createCoinBaseEvent,
    deleteEvent
}


// const test = async () => {
//     let db = await getDb("createEvent");

//     const r = await getTopPlayerofCoinBasedEevent(db, "GamePlayUploaded",10);
//     console.log(r);
// }

// test();