const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const StrikerInfoCache = require("../utils/StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("../utils/StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("../utils/StaticDocument/GameInfo/PuckInfo");
const ChestCache = require('../utils/StaticDocument/Data/Chest');


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

        
    const CacheDocumentPromises = [
        StrikerInfoCache.get(),
        PowerInfoCache.get(),
        PuckInfoCache.get()
    ]

    // Use Promise.all to fetch all documents in parallel
    const [StrikerInfo, PowerInfo, PuckInfo] = await Promise.all(CacheDocumentPromises);



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

                console.log(maxLevelTemp);
            
                return !unlockData.some(card => card.id === id && card.level >= maxLevelTemp);
            });

        }
    }

    return cardConstrain;
}

// Data setup
const splitInfos = {
    "SILVER_CHEST": {
        "Normal": 10,
        "Rare": 5,
        "Epic": 3,
        "Legendary": 1
    },
    "GOLDEN_CHEST": {
        "Normal": 10,
        "Rare": 5,
        "Epic": 3,
        "Legendary": 1
    },
    "EPIC_CHEST": {
        "Normal": 15,
        "Rare": 10,
        "Epic": 6,
        "Legendary": 1
    },
    "LEGENDARY_CHEST": {
        "Normal": 20,
        "Rare": 15,
        "Epic": 9,
        "Legendary": 1
    }
};

const cardConstrain = {
    "striker": {
      "Normal": [
        0,
        1,
        2,
        3,
        51
      ],
      "Rare": [
        4,
        5,
        6,
        7
      ],
      "Epic": [
        8,
        9,
        10,
        11
      ],
      "Legendary": [
        12,
        13,
        14,
        15
      ]
    },
    "power": {
      "Normal": [
        0,
        1,
        2,
        3
      ],
      "Rare": [
        4,
        5,
        6,
        7
      ],
      "Epic": [
        8,
        9,
        10,
        11
      ],
      "Legendary": [
        12,
        13,
        14,
        15
      ]
    },
    "puck": {
      "Normal": [
        0,
        1,
        2,
        3
      ],
      "Rare": [
        4,
        5,
        6,
        7
      ],
      "Epic": [
        8,
        9,
        10,
        11
      ],
      "Legendary": [
        12,
        13,
        14,
        15
      ]
    }
  };

const chestDetail = {
    "coins": {
        "min": 1000,
        "max": 2500
    },
    "gems": {
        "min": 5,
        "max": 11
    },
    "Normal": {
        "min": 1100,
        "max": 1750
    },
    "Rare": {
        "min": 2,
        "max": 5
    },
    "Epic": {
        "min": 2,
        "max": 5
    },
    "Legendary": {
        "min": 0.5,
        "max": 0.6
    }
};

const chestType = "SILVER_CHEST";

// Test the function
const run = async() => {
    const chest = await ChestCache.get();
    const generatedChest = await generateChest("NDy0VPRc4bTTJqO6" , chestType, chestDetail, cardConstrain, splitInfos, chest.cardExchangeCoin);
    console.log(generatedChest);
}
run();


// const run = async() => {
//     const cardConstrainU = await filterCardInfoForMaxCard("NDy0VPRc4bTTJqO6", cardConstrain);
//     console.log(cardConstrainU);
// }
// run();
