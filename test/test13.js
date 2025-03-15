class ChestSelector {
    static determineChestType(FreeChestInfo, freeChestLastOpen) {
        const currentTime = new Date().getTime();
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

        if (eligibleChests.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleChests.length);
            const selectedChest = eligibleChests[randomIndex];
            freeChestLastOpen[selectedChest] = currentTime; // Update the last open time
            return selectedChest;
        } else {
            return null;
        }
    }
}

// Mock data
const FreeChestInfo = {
    "instantUnlockRate": 4,
    "SILVER_CHEST": {
        "duration": 10800,
        "minDay": 0
    },
    "GOLDEN_CHEST": {
        "duration": 21600,
        "minDay": 2
    },
    "EPIC_CHEST": {
        "duration": 43200,
        "minDay": 7
    },
    "LEGENDARY_CHEST": {
        "duration": 86400,
        "minDay": 30
    }
};

// Test function
function testDetermineChestType() {
    // Simulating the opening times for chests
    const currentTime = new Date().getTime();
    const freeChestLastOpen = {
        "SILVER_CHEST": currentTime - 31 * 24 * 60 * 60 * 1000, // 1 day ago
        "GOLDEN_CHEST": currentTime - 31 * 24 * 60 * 60 * 1000, // 3 days ago
        "EPIC_CHEST": currentTime - 31 * 24 * 60 * 60 * 1000, // 10 days ago
        "LEGENDARY_CHEST": currentTime - 31 * 24 * 60 * 60 * 1000 // 31 days ago
    };

    // Calling the function to get the chest type
    const chestType = ChestSelector.determineChestType(FreeChestInfo, freeChestLastOpen);
    console.log(`Eligible chest type: ${chestType}`);
    console.log(freeChestLastOpen)
}

// Run the test
testDetermineChestType();
