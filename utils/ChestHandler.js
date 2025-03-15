const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("./StaticDocument/GameInfo/PuckInfo");
const TrailInfoCache = require("./StaticDocument/GameInfo/TrailInfo");

// Define the function
const generateChest = async (uid, chestType, chestDetail, cardConstrainOriginal, splitInfos, cardExchangeCoin) => {

    let cardConstrain = await filterCardInfoForMaxCard(uid, cardConstrainOriginal);

    let splitInfo = splitInfos[chestType];
    let chest = {
        type: chestType,
        cards: []
    };

    // Function to generate a random integer within a range
    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Function to generate a random floating-point number within a range
    function randomInRangeFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomRound(value) {
        if (value >= 0 && value <= 1) {
            // Treat the value as a probability for getting 1
            return Math.random() < value ? 1 : 0;
        }
        // If the value is outside 0 to 1 range, just round the number
        return Math.round(value);
    }

    // Function to handle splitting based on splitInfo
    function handleSplitting(detail, rarity) {
        const splitCount = Math.ceil(detail[rarity].min / splitInfo[rarity]);
        const newMin = detail[rarity].min / splitCount;
        const newMax = detail[rarity].max / splitCount;
        return { min: newMin, max: newMax, count: splitCount };
    }

    // Add coins and gems with the appropriate random function
    if (chestDetail.coins) {
        const coins = randomInRange(chestDetail.coins.min, chestDetail.coins.max);
        if (coins > 0) {
            chest.cards.push({
                type: "coin",
                id: null,
                unit: coins
            });
        }
    }

    if (chestDetail.gems) {
        const gems = randomInRange(chestDetail.gems.min, chestDetail.gems.max);
        if (gems > 0) {
            chest.cards.push({
                type: "gems",
                id: null,
                unit: gems
            });
        }
    }

    // Add cards based on rarity
    const rarities = ["Normal", "Rare", "Epic", "Legendary"];
    rarities.forEach(rarity => {
        let cardTypeKeys = Object.keys(cardConstrain).filter(type => cardConstrain[type][rarity] && cardConstrain[type][rarity].length > 0);
    
        if (chestDetail[rarity]) {
            let detail = chestDetail[rarity];
            detail.count = 1;
            if (detail.min > splitInfo[rarity]) {
                detail = handleSplitting(chestDetail, rarity);
            }
            for (let i = 0; i < detail.count; i++) {
                if (cardTypeKeys.length > 0) {
                    const randomCardTypeIndex = randomInRange(0, cardTypeKeys.length - 1);
                    const randomCardType = cardTypeKeys[randomCardTypeIndex];
    
                    const cardIds = cardConstrain[randomCardType][rarity];
                    if (cardIds && cardIds.length > 0) {
                        const randomCardId = cardIds[randomInRange(0, cardIds.length - 1)];
                        const unitRandomFunc = Number.isInteger(detail.min) ? randomInRange : randomInRangeFloat;
                        const unit = randomRound(unitRandomFunc(detail.min, detail.max));
    
                        if (unit > 0) {
                            chest.cards.push({
                                type: `${randomCardType}_${rarity}`,
                                id: randomCardId,
                                unit: unit
                            });
                        }
                    }
                } else {
                    const unitRandomFunc = Number.isInteger(detail.min) ? randomInRange : randomInRangeFloat;
                    const unit = randomRound(unitRandomFunc(detail.min, detail.max));
                    // Add coins as fallback
                    chest.cards.push({
                        type: 'coin',
                        id: null,
                        unit: cardExchangeCoin[rarity]*unit
                    });
                }
            }
        }
    });


    let totalCoins = 0;
    const nonCoinCards = chest.cards.filter(card => {
      if (card.type === 'coin') {
        totalCoins += card.unit;
        return false; // exclude this card from nonCoinCards
      }
      return true; // include this card in nonCoinCards
    });
  
    const mergedChest = {
      type: chest.type,
      cards: [
        { type: 'coin', id: null, unit: totalCoins },
        ...nonCoinCards,
      ]
    };

    return mergedChest;
}


const filterCardInfoForMaxCard = async (uid, cardConstrainOriginal) => {

    // Using Deep Clone for edit and don't want to modify original
    let cardConstrain = JSON.parse(JSON.stringify(cardConstrainOriginal));

    // fetching documents UnlockedDataDoc
    const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");

    const strikerUnlockData = UnlockedDataDoc.strikerUnlocked;
    const powerUnlockData = UnlockedDataDoc.powerUnlocked;
    const puckUnlockData = UnlockedDataDoc.puckUnlocked;
    const trailUnlockData = UnlockedDataDoc.trailUnlocked;

    const CacheDocumentPromises = [
        StrikerInfoCache.get(),
        PowerInfoCache.get(),
        PuckInfoCache.get(),
        TrailInfoCache.get()
    ]

    // Use Promise.all to fetch all documents in parallel
    const [StrikerInfo, PowerInfo, PuckInfo, TrailInfo] = await Promise.all(CacheDocumentPromises);



    // Process each card category to filter out max level cards
    for (const category in cardConstrain) {
        let unlockData;
        let levelInfo;
        if (category === 'striker') {
            unlockData = strikerUnlockData;
            levelInfo = StrikerInfo;
        } else if (category === 'power') {
            unlockData = powerUnlockData;
            levelInfo = PowerInfo;
        } else if (category === 'puck') {
            unlockData = puckUnlockData;
            levelInfo = PuckInfo;
        } else if ( category === "trail"){
            unlockData = trailUnlockData;
            levelInfo = TrailInfo;
        }

        // Filter out cards that have reached the max level
        for (const rarity in cardConstrain[category]) {
            cardConstrain[category][rarity] = cardConstrain[category][rarity].filter(id => {
                const cardDetails = levelInfo[rarity].find(card => card.id === id);
                const maxLevelTemp = Object.keys(cardDetails)
                    .filter(key => key.startsWith('level'))
                    .length; // Determine the maximum level for the card

                if (id > 50) {
                    // If the card ID is greater than 50 (considered as a league card)
                    // Check if the card is unlocked. If not, return false to filter it out
                    //return unlockData.some(card => card.id === id); // not give until upgraded to level 1 and less than max level
                    return unlockData.some(card => card.id === id && card.level >= 1 && card.level < maxLevelTemp);
                } 

                //console.log(maxLevelTemp);
            
                return !unlockData.some(card => card.id === id && card.level >= maxLevelTemp);
            });

        }
    }

    return cardConstrain;
}


const applyRewards = async (uid, profileAndGamedata, chest) => {

    const chestCards = chest.cards;


    // fetching documents UnlockedDataDoc
    const UnlockedDataDoc = await firestoreManager.readDocument("UnlockData", uid, "Data/UserData");

    const strikerUnlocked = UnlockedDataDoc.strikerUnlocked;
    const powerUnlocked = UnlockedDataDoc.powerUnlocked;
    const puckUnlocked = UnlockedDataDoc.puckUnlocked;
    const trailUnlocked = UnlockedDataDoc.trailUnlocked;

    // Loop through chest cards and give rewards
    for (const card of chestCards) {
        const cardType = card.type.split('_')[0]; // Consider only the part before the underscore
        switch (cardType) {
            case 'coin':
                addCoins(profileAndGamedata, card.unit);
                break;
            case 'gems':
                addGems(profileAndGamedata, card.unit);
                break;
            case 'striker':
                await addStriker(strikerUnlocked, card.id, card.unit);
                break;
            case 'power':
                await addPower(powerUnlocked, card.id, card.unit);
                break;
            case 'puck':
                addPuck(puckUnlocked, card.id, card.unit);
                break;
            case'trail':
                addTrail(trailUnlocked,card.id,card.unit);
                break;
        }
    }

    await firestoreManager.updateDocument("UnlockData", uid, "Data/UserData", { strikerUnlocked : strikerUnlocked,  powerUnlocked : powerUnlocked, puckUnlocked : puckUnlocked, trailUnlocked: trailUnlocked});

    // Update the profile and game data
    return profileAndGamedata.gameData;
}

const addCoins = (profileAndGamedata, coins) => {
    profileAndGamedata.gameData.coins += coins;
}

const addGems = (profileAndGamedata, gems) => {
    profileAndGamedata.gameData.gems += gems;
}

const addStriker = async (unlockedStrikers, strikerId, unit) => {
    // Add or update the striker data in the unlockedStrikers array
    let strikerIndex = unlockedStrikers.findIndex(s => s.id === strikerId);
    if (strikerIndex !== -1) {
        unlockedStrikers[strikerIndex].collected += unit;
    } else {
        unlockedStrikers.push({ id: strikerId, level : 0, collected: unit });
        //strikerIndex = unlockedStrikers.length - 1;  // Update strikerIndex to the new striker's index
    }
    

    // //upgrade striker level if level is zero and have required cards
    // const strikerIdIfo = getStrikerInfoById(strikerId, StrikerInfo);
    // if(unlockedStrikers[strikerIndex].level == 0 && unlockedStrikers[strikerIndex].collected >= strikerIdIfo.level1.cardRequired){
    //     unlockedStrikers[strikerIndex].level++;
    //     unlockedStrikers[strikerIndex].collected -= strikerIdIfo.level1.cardRequired;
    //     await XpHandler.IncreasedXpByCardUpgrade(profileAndGamedata, unlockedStrikers[strikerIndex].level);
    // }

}

const addPower = async (unlockedPowers, powerId, unit) => {
    // Add or update the power data in the unlockedPowers array
    let powerIndex = unlockedPowers.findIndex(p => p.id === powerId);
    if (powerIndex !== -1) {
        unlockedPowers[powerIndex].collected += unit;
    } else {
        unlockedPowers.push({ id: powerId, level: 0, collected: unit});
        //powerIndex = unlockedPowers.length - 1;
    }

    // // Upgrade power level if level is zero and have required units
    // const powerInfoById = getPowerInfoById(powerId, PowerInfo);
    // if(unlockedPowers[powerIndex].level == 0 && unlockedPowers[powerIndex].collected >= powerInfoById.level1.cardRequired){
    //     unlockedPowers[powerIndex].level++;
    //     unlockedPowers[powerIndex].collected -= powerInfoById.level1.cardRequired;

    //     // Call IncreasedXpByCardUpgrade when a power is upgraded
    //     await XpHandler.IncreasedXpByCardUpgrade(profileAndGamedata, unlockedPowers[powerIndex].level);
    // }
}


const addPuck = (unlockedPucks, puckId, unit) => {
    // Add or update the puck data in the unlockedPucks array
    const puckIndex = unlockedPucks.findIndex(p => p.id === puckId);
    if (puckIndex !== -1) {
        unlockedPucks[puckIndex].collected += unit;
    } else {
        unlockedPucks.push({ id: puckId, level: 0, collected: unit });
    }
}

const addTrail = (unlockedTrails, trailId, unit) => {
    // Add or update the puck data in the unlockedPucks array
    const trailIndex = unlockedTrails.findIndex(p => p.id === trailId);
    if (trailIndex !== -1) {
        unlockedTrails[trailIndex].collected += unit;
    } else {
        unlockedTrails.push({ id: trailId, level: 0, collected: unit });
    }
}




const getStrikerInfoById = (id, StrikerInfo) => {
    //StrikerInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allStrikers = [...StrikerInfo.Normal, ...StrikerInfo.Rare, ...StrikerInfo.Epic, ...StrikerInfo.Legendary];

    // Find the striker with the given id
    const striker = allStrikers.find(striker => striker.id === id);

    // If the striker is found, return its info; otherwise, throw an error
    if (striker) {
        return striker;
    } else {
        console.error("Striker not found with id:", id);
        throw new Error("Striker not found");
    }
};


const getPowerInfoById = (id, PowerInfo) => {
    //PowerInfo is structured with categories like Normal, Rare, Epic, Legendary
    const allPowers = [...PowerInfo.Normal, ...PowerInfo.Rare, ...PowerInfo.Epic, ...PowerInfo.Legendary];

    // Find the power with the given id
    const power = allPowers.find(power => power.id === id);

    // If the power is found, return its info; otherwise, throw an error
    if (power) {
        return power;
    } else {
        console.error("Power not found with id:", id);
        throw new Error("Power not found");
    }
};


module.exports = {
    generateChest,
    applyRewards
}