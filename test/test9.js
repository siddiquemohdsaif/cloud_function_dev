const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const resultMaker = require("../utils/ClanHandler/resultMaker");
const UserLock = require('../utils/Lock/UserLock');



const test = async () => {
    try {
        // for(let i=0; i< 3; i++){
        //     await resultMaker.giveRewardForPlayers(["EIZXgbPNq7ye2wex","xZq85oqjqbFLSGmc","Qczsa9NzqWNgLUlT"],20);

        // }

        await resultMaker.giveRewardForPlayers(["EIZXgbPNq7ye2wex","xZq85oqjqbFLSGmc","Qczsa9NzqWNgLUlT"],40);

        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in WarHandler: " + error.message);
    }
}

const test2 = async () => {
    try {

        await UserLock.getInstance().run("xZq85oqjqbFLSGmc", async () => {
            const user = await firestoreManager.readDocument("Users", "xZq85oqjqbFLSGmc", "/");
            user.gameData.coins += 100;
            await firestoreManager.updateDocument("Users", "xZq85oqjqbFLSGmc", "/" , {"gameData.coins":   user.gameData.coins   });
        });

        await UserLock.getInstance().run("xZq85oqjqbFLSGmc", async () => {
            const user = await firestoreManager.readDocument("Users", "xZq85oqjqbFLSGmc", "/");
            user.gameData.coins += 100;
            await firestoreManager.updateDocument("Users", "xZq85oqjqbFLSGmc", "/" , {"gameData.coins":   user.gameData.coins   });
        });

        await UserLock.getInstance().run("xZq85oqjqbFLSGmc", async () => {
            const user = await firestoreManager.readDocument("Users", "xZq85oqjqbFLSGmc", "/");
            user.gameData.coins += 100;
            await firestoreManager.updateDocument("Users", "xZq85oqjqbFLSGmc", "/" , {"gameData.coins":   user.gameData.coins   });
        });

       
        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in WarHandler: " + error.message);
    }
}


// test();
// test2();