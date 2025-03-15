const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


function generatePremiumChest(chestType, chestDetail, cardConstrain, splitInfo) {
    let chest = {
        type: chestType,
        cards: []
    };

    // Function to generate a random number within a range
    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Function to handle splitting based on splitInfo
    function handleSplitting(detail, rarity) {
        const splitCount = Math.ceil(detail[rarity].min / splitInfo[rarity]);
        const newMin = Math.floor(detail[rarity].min / splitCount);
        const newMax = Math.floor(detail[rarity].max / splitCount);
        return { min: newMin, max: newMax, count: splitCount };
    }

    // Add coins
    if (chestDetail.coins) {
        chest.cards.push({
            type: "coin",
            id: null,
            unit: randomInRange(chestDetail.coins.min, chestDetail.coins.max)
        });
    }

    // Add gems
    if (chestDetail.gems) {
        chest.cards.push({
            type: "gems",
            id: null,
            unit: randomInRange(chestDetail.gems.min, chestDetail.gems.max)
        });
    }

    // Add cards based on rarity
    const rarities = ["Normal", "Rare", "Epic", "Legendary"];
    rarities.forEach(rarity => {
        if (chestDetail[rarity]) {
            let detail = chestDetail[rarity];
            // Check if splitting is needed
            detail.count = 1;
            if (detail.min > splitInfo[rarity]) {
                detail = handleSplitting(chestDetail, rarity);
            }
            for (let i = 0; i < detail.count; i++) {
                // Randomly select a card type for this rarity
                const cardTypeKeys = Object.keys(cardConstrain);
                const randomCardTypeIndex = randomInRange(0, cardTypeKeys.length - 1);
                const randomCardType = cardTypeKeys[randomCardTypeIndex];

                const cardIds = cardConstrain[randomCardType][rarity];
                if (cardIds) {
                    const randomCardId = cardIds[randomInRange(0, cardIds.length - 1)];
                    chest.cards.push({
                        type: `${randomCardType}_${rarity}`, // Concatenating card type and rarity
                        id: randomCardId,
                        unit: randomInRange(detail.min, detail.max)
                    });
                }
            }
        }
    });

    return chest;
}



// // Define sample chest details and card constraints
// const chestDetail = {
//     "coins": {
//         "min": 1000,
//         "max": 2500
//     },
//     "gems": {
//         "min": 5,
//         "max": 10
//     },
//     "Normal": {
//         "min": 20,
//         "max": 30
//     },
//     "Rare": {
//         "min": 2,
//         "max": 5
//     },
//     "Epic": null,
//     "Legendary": {
//         "min": 2,
//         "max": 5
//     }
// };

// const cardConstrain = {
//     "striker": {
//         "Normal": [0, 2, 3],
//         "Rare": [1, 7, 9],
//         "Epic": [4, 5, 6],
//         "Legendary": [8, 10, 11]
//     },
//     "power": {
//         "Normal": [0, 2, 3],
//         "Rare": [1, 7, 9],
//         "Epic": [4, 5, 6],
//         "Legendary": [8, 10, 11]
//     },
//     "puck": {
//         "Normal": [0, 1, 2, 3, 5, 6, 8, 10],
//         "Rare": [4, 9, 11, 12, 15],
//         "Epic": [7, 13, 14, 16],
//         "Legendary": [17, 18, 19]
//     }
// };

// const splitInfo = {
//     "Normal": 10,
//     "Rare": 5,
//     "Epic": 3,
//     "Legendary": 1
// }




async function testGeneratePremiumChest() {



            // Get Chest document from db
            const chest = await firestoreManager.readDocument("Data", "Chest", "/");

            console.log("chest :" + JSON.stringify(chest));
            // Check if user has enough gems
            const premiumChest = chest.PremiumChest[0];

    
            // Deduct gems and generate premium chest
            const chestDetailccc = chest.ChestInfo[premiumChest.type];
            const generatedChest = generatePremiumChest(premiumChest.type, chestDetailccc, chest.CardConstraint , chest.SplitInfo ); // Assuming a function to generate chest
    



    // let chestType = "SILVER_CHEST";
    // console.log(`Testing with chest type: ${chestType}`);
    // const generatedChest = generatePremiumChest(chestType, chestDetail, cardConstrain, splitInfo);
    console.log('Generated Chest:', JSON.stringify(generatedChest, null, 2));
}

// Run the test function
testGeneratePremiumChest();