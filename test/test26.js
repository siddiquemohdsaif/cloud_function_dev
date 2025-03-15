const { giveRewardAndSetPastResult } = require('../utils/SeasonHandler'); // Replace with actual path to your module

// Mock CarromPassCache
const CarromPassCache = {
    get: async () => ({
        leaderBoard: {
            player: {
                "1": ["1", "2000"],
                "2": ["2", "1000"],
                "3": ["3", "500"],
                "4": ["4-6", "100"]
            },
            clan: {
                "1": ["1", "2000"],
                "2": ["2", "1000"],
                "3": ["3", "500"]
            }
        }
    })
};

// Mock FirestoreManager
// const firestoreManager = {
//     updateLeaderboardRewards: async (rewardPlayers, rewardClans) => {
//         console.log("Rewards Updated in Firestore");
//         console.log("Reward Players:", rewardPlayers);
//         console.log("Reward Clans:", rewardClans);
//     }
// };

// Mock data for testing
const topPlayersCompressString = "mockedTopPlayersCompressString"; // This can be an actual compressed string
const topClansCompressString = "mockedTopClansCompressString"; // This can be an actual compressed string
const rewardUids = ["omIFqE5DnTpaDYsl", "gBuKGXKWcDMpEFg5", "3JiCFMmUl1doIDOs"];
const rewardCids = ["SVHQGQXHI", "BLHOXKFNW"];

// Test the function
giveRewardAndSetPastResult(topPlayersCompressString, topClansCompressString, rewardUids, rewardCids)
    .then(result => {
        console.log("Test Result:", result);
    })
    .catch(error => {
        console.error("Error:", error);
    });
