const FirestoreManager = require("../Firestore/FirestoreManager");
const MapSliderInfoCache = require("./../utils/StaticDocument/GameInfo/MapSliderInfo.js");
const firestoreManager = FirestoreManager.getInstance();
const EventCache = require('./../utils/StaticDocument/Data/Event');
const DBdirectConnect = require('./../utils/DBdirectConnect');
const LZ4_util = require('./../utils/LZ4_util.js');
const NodeCache = require( "node-cache" );
const UserLock = require('./../utils/Lock/UserLock');


const myCache = new NodeCache({ stdTTL: 10, checkperiod: 120 }); // TTL in seconds

const getTopPlayerForCoinCollect= async (eventId, latest,uid)=>{
    let cachedData = myCache.get(eventId);
    if (cachedData && !latest) {
        return cachedData;
    }

    let db = await DBdirectConnect.getDb("eventTopPlayers");

    let playersEventData_1000 = await DBdirectConnect.getTopPlayerofCoinBasedEevent(db, eventId, 1000);
    const playersEventData = playersEventData_1000.slice(0, 100);

    const isEventJoined = await checkAlreadyJoinedEvent(uid,eventId);
    let uidFound = playersEventData.some(player => player.uid === uid);

    if (isEventJoined && !uidFound){
        let userData = await DBdirectConnect.getSinglePlayerofCoinBasedEevent(db,eventId, uid);
        if (userData) {
            console.log(userData)
            playersEventData.push(userData);
        }
    }

    const topPlayerUidList = playersEventData.map((playerData)=> { return playerData.uid });
    const projection = { "gameData": {"xp" : 1, "trophy" : 1, "collection" : 1, "carromPass" : { "isPremiumMember" : 1 }}, "profileData": 1, "uid": 1 };
    let eventTopPlayersData = await firestoreManager.bulkReadDocuments('Users', '/', topPlayerUidList, projection);
    
    eventTopPlayersData =  eventTopPlayersData.map( (player, index) => {
        player.coins = playersEventData[index].coins;
        return player;
    })


    const clanIds = eventTopPlayersData.map(player => player.profileData.clanId).filter(clanId => clanId !== "null");

    if(clanIds.length == 0){

        // Map clan details back to players
        eventTopPlayersData = eventTopPlayersData.map(player => {
            player.clanName = "No clan";
            player.clanLogo = 0;
            return player;
        });

    }else{

        // Fetch clan details in bulk
        const projection = { "clanName": 1, "clanLogo": 1 };
        const clans = await firestoreManager.bulkReadDocumentsInMap('Clans', "/", clanIds, projection);
        
        // Map clan details back to players
        eventTopPlayersData = eventTopPlayersData.map(player => {
            const clanId = player.profileData.clanId;
            if (clanId !== "null" && clans[clanId]) {
                player.clanName = clans[clanId].clanName;
                player.clanLogo = clans[clanId].clanLogo;
            } else {
                player.clanName = "No clan";
                player.clanLogo = 0;
            }
            return player;
        });

    }

    const topPlayersRankIndex = playersEventData_1000.reduce((acc, obj, index) => {
        delete obj._id;
        obj.rank = index + 1;
        acc[obj.uid] = obj;
        return acc;
    }, {});
    console.log(JSON.stringify(eventTopPlayersData));
    const topPlayersDataStr = await LZ4_util.compressString(JSON.stringify(eventTopPlayersData));

    // Set the cache before returning
    const cacheData = {topPlayersRankIndex, topPlayersDataStr};
    myCache.set(eventId, cacheData);

    console.log(cacheData);
    return cacheData
}

const checkAlreadyJoinedEvent= async (uid, eventId) => {
    try{
        const tournamentData = await firestoreManager.readDocument(eventId, uid,"/Data/Event/",);
        if(tournamentData){
            return true;
        } else{
            return false;
        }
    }catch(error){
        return false;
    }
}





getTopPlayerForCoinCollect("DAILY_PRIZE_TOURNAMENT",true,"iAcAopfjRvfYxJ2O");