const FirestoreManager = require("../Firestore/FirestoreManager");
const ChestHandler = require("./ChestHandler");
const GameEventHandler = require("./GameEventHandler");
const XpHandler = require("./XpHandler");
const CarromPassCache = require("./StaticDocument/Data/CarromPass");
const WarHandler = require("./WarHandler");
const MapSliderInfoCache = require("./StaticDocument/GameInfo/MapSliderInfo")
const firestoreManager = FirestoreManager.getInstance();
const ChestCache = require('./StaticDocument/Data/Chest');
const { getBotAccounts } = require("./StaticDocument/Data/BotAccounts");


class GameHandler {

    static async processGameStart(UID1, UID2, map) {
        try {

            const users = await firestoreManager.bulkReadDocuments("Users", "/", [UID1, UID2], { "gameData.coins": 1 });
            const userData1 = users[0];
            const userData2 = users[1];

            const MapSliderInfo = await MapSliderInfoCache.get();

            // Deduct the coins by coinToDeduct for each user
            userData1.gameData.coins -= MapSliderInfo.requiredCoins[map];
            userData2.gameData.coins -= MapSliderInfo.requiredCoins[map];

            // Parallel update the user data in Firestore
            await Promise.all([
                firestoreManager.updateDocument("Users", UID1, "/", { "gameData.coins": userData1.gameData.coins }),
                firestoreManager.updateDocument("Users", UID2, "/", { "gameData.coins": userData2.gameData.coins })
            ]);

            return { success: true, message: "Game start processed successfully" };
        } catch (error) {
            console.error("Error in processGameStart:", error);
            throw error;
        }
    }



    static async processGameOver(UID1, UID2, winner, map, p1TrophyWin, p1TrophyLose, p2TrophyWin, p2TrophyLose, isPlayer1InWar, isPlayer2InWar, gameType1, gameType2) {
        try {
            // Determine the winner and the loser
            const winnerUID = winner === 0 ? UID1 : UID2;
            const loserUID = winner === 0 ? UID2 : UID1;

            const matchInfo = {
                UID1,
                UID2,
                map,
                winnerUID,
                timestamp: Date.now(),
            };

              // Read both documents in parallel
        const [document1, document2] = await Promise.all([
            firestoreManager.readDocument("MatchInfo", UID1, "/Data/Surveillance"),
            firestoreManager.readDocument("MatchInfo", UID2, "/Data/Surveillance"),
        ]);

        delete document1._id;
        delete document2._id;
        // Update match lists
        document1.matchList = document1.matchList || [];
        document2.matchList = document2.matchList || [];

        document1.matchList.push(matchInfo);
        document2.matchList.push(matchInfo);

        // Update both documents in parallel
        await Promise.all([
            firestoreManager.updateDocument("MatchInfo", UID1, "/Data/Surveillance/", document1),
            firestoreManager.updateDocument("MatchInfo", UID2, "/Data/Surveillance/", document2),
        ]);
            await GameHandler.updateGameDataAndProfiles(UID1, UID2, winnerUID, map, p1TrophyWin, p1TrophyLose, p2TrophyWin, p2TrophyLose);
            await GameHandler.handleWar(UID1, UID2, winnerUID, map, isPlayer1InWar, isPlayer2InWar);
            await GameHandler.freeBot(UID1, UID2);

            GameEventHandler.processGameForEvents(UID1, UID2, winner, map, p1TrophyWin, p1TrophyLose, p2TrophyWin, p2TrophyLose, isPlayer1InWar, isPlayer2InWar, gameType1, gameType2);

            return { success: true, message: "Game over processed successfully" };
        } catch (error) {
            console.error("Error in processGameOver:", error);
            throw error;
        }
    }


    static async freeBot(UID1, UID2) {
        const bots = await getBotAccounts();
        const bot1 = bots[UID1];
        const bot2 = bots[UID2];

        if (bot1) {
            let freeField = `${bot1.key}.isFree`;
            await firestoreManager.updateDocument("Data", "BotAccountsLvl" + bot1.level, "/", { [freeField]: true });
        }

        if (bot2) {
            let freeField = `${bot2.key}.isFree`;
            await firestoreManager.updateDocument("Data", "BotAccountsLvl" + bot2.level, "/", { [freeField]: true });
        }
    }

    static async handleWar(UID1, UID2, winnerUID, map, isPlayer1InWar, isPlayer2InWar) {
        await WarHandler.handleWar(UID1, UID2, winnerUID, map, isPlayer1InWar, isPlayer2InWar);
    }

    static async updateGameDataAndProfiles(UID1, UID2, winnerUID, map, p1TrophyWin, p1TrophyLose, p2TrophyWin, p2TrophyLose) {
        if (UID1 && UID2) {
            try {

                const users = await firestoreManager.bulkReadDocuments("Users", "/", [UID1, UID2], {});
                const userData1 = users[0];
                const userData2 = users[1];

                //check is seasonEnd hence no trophy update
                const CarromPass = await CarromPassCache.get();
                let isSeasonEnd = false;
                if (CarromPass.seasonEndTime < Date.now()) {
                    isSeasonEnd = true;
                }


                const MapSliderInfo = await MapSliderInfoCache.get();

                if (userData1 && userData2) {

                    // Handle coin addition for the winner
                    const winnerData = winnerUID === UID1 ? userData1 : userData2;
                    const coinWin = MapSliderInfo.prize[map];
                    winnerData.gameData.coins += coinWin;

                    // Update trophies
                    if (!isSeasonEnd) {
                        if (winnerUID === UID1) {
                            userData1.gameData.trophy += p1TrophyWin;
                            userData2.gameData.trophy -= p2TrophyLose;
                        } else {
                            userData1.gameData.trophy -= p1TrophyLose;
                            userData2.gameData.trophy += p2TrophyWin;
                        }
                    }


                    // Update profiles for gamePlay, currentWinStrike, totalWinning, gameWon, currentWinStrike, bestWinStrike, highestTrophy
                    this.updateProfileData(userData1.profileData, userData1.gameData, winnerUID === UID1, coinWin);
                    this.updateProfileData(userData2.profileData, userData2.gameData, winnerUID === UID2, coinWin);


                    //add free chest
                    // Check for an available slot in freeChests
                    const freeChestSlotIndex = winnerData.gameData.chestData.freeChests.findIndex(chest => chest === null);
                    if (freeChestSlotIndex !== -1) {

                        // Get Chest document from db
                        const chestData = await ChestCache.get();

                        // Determine the chest type based on probabilities
                        const chestType = this.determineChestType(chestData.FreeChestInfo, winnerData.gameData.chestData.freeChestLastOpen);

                        // Generate the chest
                        const chestDetail = chestData.ChestInfo[chestType];
                        const chest = await ChestHandler.generateChest(winnerUID, chestType, chestDetail, chestData.CardConstraint, chestData.SplitInfo, chestData.cardExchangeCoin);

                        // Assign the chest to the free slot and set the unlock start time
                        chest.unlockedStartTime = 0;
                        if (winnerData.gameData.chestData.isFirstTimeChest){
                            winnerData.gameData.chestData.isFirstTimeChest = false;
                            chest.totalUnlockTime = 10 * 1000;
                            chest.OpenNowGems = 1;
                        }else{
                            chest.totalUnlockTime = chestData.FreeChestInfo[chestType].duration * 1000;
                            chest.OpenNowGems = (chest.totalUnlockTime / 3600000) * chestData.FreeChestInfo.instantUnlockRate;
                        }
                        chest.createdAt = Date.now();
                        winnerData.gameData.chestData.freeChests[freeChestSlotIndex] = chest;
                    }


                    //give xp of gamePlay and gameWin , carromPoint increase and league update
                    if (winnerUID === UID1) {

                        // xp update
                        await XpHandler.IncreasedXpByWin(userData1);
                        await XpHandler.IncreasedXpByLose(userData2);

                        // carromPoint update
                        userData1.gameData.carromPass.carromPoints += MapSliderInfo.carromPoints[map];
                        userData2.gameData.carromPass.carromPoints += Math.round((MapSliderInfo.carromPoints[map] * 0.4)); // 40% at lose


                    } else {

                        // xp update
                        await XpHandler.IncreasedXpByLose(userData1);
                        await XpHandler.IncreasedXpByWin(userData2);

                        // carromPoint update
                        userData1.gameData.carromPass.carromPoints += Math.round((MapSliderInfo.carromPoints[map] * 0.4)); // 40% at lose
                        userData2.gameData.carromPass.carromPoints += MapSliderInfo.carromPoints[map];

                    }


                    if (isSeasonEnd) {
                        await Promise.all([
                            firestoreManager.updateDocument("Users", UID1, "/", {
                                profileData: userData1.profileData,
                                "gameData.coins": userData1.gameData.coins,
                                "gameData.carromPass.carromPoints": userData1.gameData.carromPass.carromPoints,
                                "gameData.xp": userData1.gameData.xp,
                                "gameData.chestData.freeChests": userData1.gameData.chestData.freeChests,
                                "gameData.chestData.isFirstTimeChest": userData1.gameData.chestData.isFirstTimeChest,
                            }),
                            firestoreManager.updateDocument("Users", UID2, "/", {
                                profileData: userData2.profileData,
                                "gameData.coins": userData2.gameData.coins,
                                "gameData.carromPass.carromPoints": userData2.gameData.carromPass.carromPoints,
                                "gameData.xp": userData2.gameData.xp,
                                "gameData.chestData.freeChests": userData2.gameData.chestData.freeChests,
                                "gameData.chestData.isFirstTimeChest": userData2.gameData.chestData.isFirstTimeChest,
                            }),
                        ]);
                    } else {
                        await Promise.all([
                            firestoreManager.updateDocument("Users", UID1, "/", {
                                profileData: userData1.profileData,
                                "gameData.trophy": userData1.gameData.trophy,
                                "gameData.coins": userData1.gameData.coins,
                                "gameData.carromPass.carromPoints": userData1.gameData.carromPass.carromPoints,
                                "gameData.xp": userData1.gameData.xp,
                                "gameData.chestData.freeChests": userData1.gameData.chestData.freeChests,
                                "gameData.chestData.isFirstTimeChest": userData1.gameData.chestData.isFirstTimeChest,
                            }),
                            firestoreManager.updateDocument("Users", UID2, "/", {
                                profileData: userData2.profileData,
                                "gameData.trophy": userData2.gameData.trophy,
                                "gameData.coins": userData2.gameData.coins,
                                "gameData.carromPass.carromPoints": userData2.gameData.carromPass.carromPoints,
                                "gameData.xp": userData2.gameData.xp,
                                "gameData.chestData.freeChests": userData2.gameData.chestData.freeChests,
                                "gameData.chestData.isFirstTimeChest": userData2.gameData.chestData.isFirstTimeChest,
                            }),
                        ]);
                    }


                }
            } catch (error) {
                console.error("Error in updateGameDataAndProfiles:", error);
                throw error;
            }
        }
    }

    static determineChestType(FreeChestInfo, freeChestLastOpen) {
        // Getting the current time in milliseconds
        const currentTime = new Date().getTime();

        // Filter the chests that have passed their minimum day requirement
        const eligibleChests = [];
        for (const chestType in FreeChestInfo) {
            if (chestType !== 'instantUnlockRate') {
                const chestInfo = FreeChestInfo[chestType];
                const lastOpenTime = freeChestLastOpen[chestType];
                const minDayInMs = chestInfo.minDay * 24 * 60 * 60 * 1000;
                if (currentTime - lastOpenTime >= minDayInMs) {
                    eligibleChests.push(chestType);
                }
            }
        }

        // Randomly select one of the eligible chests
        if (eligibleChests.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleChests.length);
            const selectedChest = eligibleChests[randomIndex];
            freeChestLastOpen[selectedChest] = currentTime; // Update the last open time
            return selectedChest;
        } else {
            // If no chests are eligible, return 'SILVER_CHEST'
            return 'SILVER_CHEST';
        }
    }


    static updateProfileData(profileData, gameData, isWinner, coinWinOrLose) {
        profileData.gamePlay += 1; // Increment games played

        if (isWinner) {
            profileData.totalWinning += coinWinOrLose; // Add the coins won
            profileData.gameWon += 1; // Increment games won
            profileData.currentWinStrike += 1; // Increment current win streak
            profileData.bestWinStrike = Math.max(profileData.bestWinStrike, profileData.currentWinStrike); // Update best win streak if current streak is higher

            // Update highest trophy if this win is higher
            profileData.highestTrophy = Math.max(profileData.highestTrophy, gameData.trophy);
        } else {
            profileData.currentWinStrike = 0; // Reset loser's win streak
        }
    }
}

module.exports = GameHandler;
