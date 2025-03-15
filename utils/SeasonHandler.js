const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const CarromPassCache = require('./StaticDocument/Data/CarromPass');
const UserLock = require('../utils/Lock/UserLock');


const applyRewardToPlayers = async (rewardPlayers) => {
    const uids = rewardPlayers.map(player => player.uid);

    if(uids.length == 0){
        return {error : "no element"};
    } 

    //use lock
    const result = await UserLock.getInstance().runMultiple(uids, async () => {
        const playersData = await firestoreManager.bulkReadDocuments("Users", "/", uids, { "uid": 1, "gameData.gems": 1 });

        playersData.forEach(playerData => {
            const player = rewardPlayers.find(p => p.uid === playerData.uid);
            if (player) {
                playerData.gameData.gems += player.reward;
            }
        });
    
        //console.log(playersData);
    
        // Function to handle chunked updates
        const chunkedUpdate = async (playersData, chunkSize) => {
            const updateResults = [];
            for (let i = 0; i < playersData.length; i += chunkSize) {
                const chunk = playersData.slice(i, i + chunkSize);
                const result = await Promise.all(
                    chunk.map(async playerData => {
                        try {
                            await firestoreManager.updateDocument("Users", playerData.uid, "/", { "gameData.gems": playerData.gameData.gems });
                            return { uid: playerData.uid, status: "success" };
                        } catch (error) {
                            return { uid: playerData.uid, status: "error", error: error.message };
                        }
                    })
                );
                updateResults.push(...result);
            }
            return updateResults;
        };
    
        // Update players in chunks of 40
        return await chunkedUpdate(playersData, 40);
    });

    return result;
};


const applyRewardToClans = async (rewardClans) => {
    const cids = rewardClans.map(clan => clan.cid);
    const clansData = await firestoreManager.bulkReadDocuments("Clans", "/", cids, { "clanId": 1, "members": 1 });

    const rewardPlayers = [];

    clansData.forEach(clanData => {
        const clanReward = rewardClans.find(c => c.cid === clanData.clanId);
        if (clanReward) {
            clanData.members.forEach(member => {
                rewardPlayers.push({ uid: member.UID, reward: clanReward.reward });
            });
        }
    });

    return await applyRewardToPlayers(rewardPlayers);
};




const giveRewardAndSetPastResult = async (topPlayersCompressString, topClansCompressString, rewardUids, rewardCids) => {


    const CarromPass = await CarromPassCache.get();
    const leaderBoard = CarromPass.leaderBoard;
    /**
     * leaderBoard :
     * {
        "player": {
          "1": [
            "1",
            "2000"
          ],
          "2": [
            "2",
            "1000"
          ],
          "3": [
            "3",
            "500"
          ],
          "4": [
            "4-100",
            "100"
          ]
        },
        "clan": {
          "1": [
            "1",
            "2000"
          ],
          "2": [
            "2",
            "1000"
          ],
          "3": [
            "3",
            "500"
          ]
        }
      }
     * 
  
      rewardUids : ["uid1", "uid2", ...]
      rewardCids : ["cid1", "cid2", ...]
     * 
     */




    // find rewardVectorObj => rewardPlayers[{uid : "uid1", reward : 2000}, {uid : "uid2", reward : 1000},...], rewardClans[{cid : "cid1", reward : 2000}, {cid : "cid2", reward : 1000},...]



    const rewardPlayers = [];
    const rewardClans = [];

    // Helper function to parse range (e.g., "4-100") and assign rewards
    const assignRewards = (id, rewards, isPlayer) => {
        let rewardIndex = 0;
        for (const [position, rewardInfo] of Object.entries(rewards)) {
            const [posRange, rewardValue] = rewardInfo;
            const [start, end] = posRange.includes('-') ? posRange.split('-').map(Number) : [Number(posRange), Number(posRange)];

            for (let i = start; i <= end && rewardIndex < id.length; i++) {
                if (id[rewardIndex]) {
                    if (isPlayer) {
                        rewardPlayers.push({ uid: id[rewardIndex], reward: parseInt(rewardValue) });
                    } else {
                        rewardClans.push({ cid: id[rewardIndex], reward: parseInt(rewardValue) });
                    }
                    rewardIndex++;
                }
            }
        }
    };

    // Assign rewards to players
    assignRewards(rewardUids, leaderBoard.player, true);

    // Assign rewards to clans
    assignRewards(rewardCids, leaderBoard.clan, false);

    //console.log({rewardUids,rewardCids})

    //console.log({rewardPlayers,rewardClans})

    // apply reward player
    const resultPlayer = await applyRewardToPlayers(rewardPlayers);

    // apply reward player
    const resultClans = await applyRewardToClans(rewardClans);


    //set pastResult
    const pastWarResult = {topPlayersCompressString, topClansCompressString, leaderBoard}
    await firestoreManager.createDocument("Data", "PastResult", "/", pastWarResult);


    //console.log({resultPlayer, resultClans});

};



module.exports = {
    giveRewardAndSetPastResult
}