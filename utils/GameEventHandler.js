const FirestoreManager = require("../Firestore/FirestoreManager");
const MapSliderInfoCache = require("./StaticDocument/GameInfo/MapSliderInfo")
const firestoreManager = FirestoreManager.getInstance();
const EventCache = require('./StaticDocument/Data/Event');
const DBdirectConnect = require('./DBdirectConnect');
const LZ4_util = require('./LZ4_util.js');
const NodeCache = require( "node-cache" );
const UserLock = require('./Lock/UserLock');


const myCache = new NodeCache({ stdTTL: 10, checkperiod: 120 }); // TTL in seconds


class GameEventHandler {

    static async joinEvent(uid,trophy,eventId){
        try{
            const Event = await EventCache.getEvent();
            const Events = Event.EventInfo;

        
            for (const event of Events) {
                if (event.id === eventId){

                    let eventData = {
                        uid : uid,
                        coins :0
                    }
                    if(event.type === "COIN_COLLECT" ){
                        eventData = {
                            uid : uid,
                            coins :0
                        }
                    }

                    if (trophy >= event.trophyRequired){
                        const isEventJoined = await this.checkAlreadyJoinedEvent(uid,eventId);
                        if (!isEventJoined) {
                            await firestoreManager.createDocument(eventId, uid, '/Data/Event/', eventData);
                            return await this.getTopPlayerofEvent(uid, eventId, true);
                        } else{
                            return { success: false, message: "You have already joined the event." };
                        }
                    } else{
                        return { success: false, message: "More Trophy is required!" };
                    }
                }
            }
            return { success: false, message: "No Event Found!" };

        } catch(error){
            console.error("Error in joinEvent:", error);
            throw error;
        }
    }

    static async processGameForEvents(UID1, UID2, winner, map, p1TrophyWin, p1TrophyLose, p2TrophyWin, p2TrophyLose, isPlayer1InWar, isPlayer2InWar, gameType1, gameType2){
        
        try {
            // Determine the winner and the loser
    
            const MapSliderInfo = await MapSliderInfoCache.get();
            const coinWin = MapSliderInfo.prize[map];

           if(winner === 0){
                await this.processGamePlayerForEvents(UID1,true,coinWin,p1TrophyWin, gameType1);
                await this.processGamePlayerForEvents(UID2,false,0,p2TrophyLose, gameType2);
           }else{
                await this.processGamePlayerForEvents(UID2,true,coinWin,p2TrophyWin, gameType2);
                await this.processGamePlayerForEvents(UID1,false,0,p1TrophyLose, gameType1);
           }


         } catch (error) {
            console.error("Error in processGameForEvents:", error);
            throw error;
        }

    }

    static async processGamePlayerForEvents(uid, isWin, coinGain, trophyGain, gameType) {
        // Retrieve and process all events
        const Event = await EventCache.getEvent();
        const Events = Event.EventInfo;
    
        for (const element of Events) {
            if (element.type == "COIN_COLLECT") {
                if(isWin && coinGain > 0 && gameType !== "CHALLENGE" && gameType !== "FRIENDLY" && gameType !== "REMATCH"){
                    await this.coinProcessorEvent(uid, coinGain, element);
                }
            }
        }
    }

    
    static async checkAlreadyJoinedEvent(uid, eventId) {
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
    
    static async coinProcessorEvent(uid, coinGain, element) {
        try{
            const tournamentData = await firestoreManager.readDocument(element.id, uid,"/Data/Event/",);
            tournamentData.coins = tournamentData.coins + coinGain;
            await firestoreManager.updateDocument(element.id, uid, "/Data/Event/", {coins : tournamentData.coins});
        }catch(error){
            //not register, ignore
        }
    }
    

    static async getTopPlayerofEvent(uid, eventId, latest){

        try{



            const Event = await EventCache.getEvent();
            const Events = Event.EventInfo;

        
            for (const event of Events) {
                if (event.id === eventId){

                    if(event.type === "COIN_COLLECT" ){

                        const data = await this.getTopPlayerForCoinCollect(eventId, latest,uid);
                        let myPos = 0;
                        if(data.topPlayersRankIndex[uid] != null){
                            myPos = data.topPlayersRankIndex[uid].rank;
                        }
                        let myEventData;
                        try{
                            myEventData = await firestoreManager.readDocument(eventId, uid, "Data/Event");
                        }catch{
                            myEventData = "null"
                        }
                        const result = { success: true, players : myPos + "," + data.topPlayersDataStr, myEventData};

                        return result;

                    }else{

                        return { success: false, message: "Not Implemented Yet!" };

                    }
                }else{
                    // console.log(eventId + "  : " + event.id);
                }
            }
            return { success: false, message: "No Event Found!" };

        } catch(error){
            console.error("Error in getTopPlayerofEvent:", error);
            throw error;
        }
    }

    static async getTopPlayerForCoinCollect(eventId, latest,uid){
        let cachedData = myCache.get(eventId);
        if (cachedData && !latest) {
            return cachedData;
        }

        let db = await DBdirectConnect.getDb("eventTopPlayers");

        let playersEventData_1000 = await DBdirectConnect.getTopPlayerofCoinBasedEevent(db, eventId, 1000);
        const playersEventData = playersEventData_1000.slice(0, 100);

        const isEventJoined = await this.checkAlreadyJoinedEvent(uid,eventId);
        let uidFound = playersEventData.some(player => player.uid === uid);

        if (isEventJoined && !uidFound){
            let userData = await DBdirectConnect.getSinglePlayerofCoinBasedEevent(db,eventId, uid);
            if (userData) {
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
        const topPlayersDataStr = await LZ4_util.compressString(JSON.stringify(eventTopPlayersData));

        // Set the cache before returning
        const cacheData = {topPlayersRankIndex, topPlayersDataStr};
        myCache.set(eventId, cacheData);

        return cacheData
    }

    static async claimReward(uid, resultKey, details) {
        const resultAndReward = await firestoreManager.readDocument("ResultAndReward", resultKey, "Data/Event");
        const rewards = resultAndReward.rewards;
        if(rewards[uid]){
            const reward = rewards[uid];

            if(reward.collected){
                return { success: false, message: "Already reward collected!" };
            }

            if(reward.rewardType === "MONEY"){
                //validate details
                if(!details.payLink || !details.email || !details.country){
                    return { success: false, message: "Details not filled correctly!" };
                }

                const info = {
                    reward : reward.reward,
                    resultKey : resultKey,
                    country : details.country,
                    email : details.email,
                    payLink : details.payLink
                }

                //save to WinPrizeList
                await firestoreManager.createDocument("WinPrizeList", Date.now()+"_"+uid, "Data/Event", info);
                
                reward.collected = true;
                await firestoreManager.updateDocument("ResultAndReward", resultKey, "Data/Event", {rewards : rewards})
                return { success: true, resultAndReward};

            }else if(reward.rewardType === "CARROM_PASS") {
                // make player premium
                await UserLock.getInstance().run(uid, async () => {
                    await firestoreManager.updateDocument("Users", uid, "/", {"gameData.carromPass.isPremiumMember" :   true});
                });
        
                reward.collected = true;
                await firestoreManager.updateDocument("ResultAndReward", resultKey, "Data/Event", {rewards : rewards})
                return { success: true, resultAndReward};

            }else if(reward.rewardType === "GEMS"){
                let gems = parseInt(reward.reward);
                // make player premium
                await UserLock.getInstance().run(uid, async () => {
                    const user = await firestoreManager.readDocumentWithProjection("Users", uid, "/", {"gameData.gems" : 1});
                    user.gameData.gems += gems;
                    await firestoreManager.updateDocument("Users", uid, "/" , {"gameData.gems":   user.gameData.gems });
                });


                reward.collected = true;
                await firestoreManager.updateDocument("ResultAndReward", resultKey, "Data/Event", {rewards : rewards})
                return { success: true, resultAndReward};
            }else {
                return { success: false, message: "No Event Found!" };
            }

        }else{
            return { success: false, message: "rewardType unknown!" };
        }

    }




    //////////////////////////// SYSTEM ////////////////////////////////

    static async createEvent(eventId, type) {
        try{
            const db = await DBdirectConnect.getDb("createEvent");
            if(type === "COIN_COLLECT"){
                return await DBdirectConnect.createCoinBaseEvent(db, eventId);
            }
            return false;
        }catch(error){
            return false;
        }
    }

    static async deleteEvent(eventId) {
        try{
            return await firestoreManager.deleteCollection(eventId,"/Data/Event/");
        }catch(error){
            return false;
        }
    }

    //////////////////////////// SYSTEM ////////////////////////////////

}

module.exports = GameEventHandler;
