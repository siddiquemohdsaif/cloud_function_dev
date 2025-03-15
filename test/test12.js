const WarHandler = require("../utils/ClanHandler/resultMaker");


const test = async () => {
    try {
        // Example usage
        const result = { win: { score: 4, clanId: 'clan1' }, lose: { score: 1, clanId: 'clan2' } };
        const clan1 = { clanLevel: 1, clanXp: 0, clanTrophy: 0, clanId: 'clan1' };
        const clan2 = { clanLevel: 1, clanXp: 0, clanTrophy: 0, clanId: 'clan2' };


        WarHandler.increaseXPAndTrophy(result, clan1, clan2, 3).then(console.log);

        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in test: " + error.message);
    }
}

const test2 = async () => {
    try {

        console.log(WarHandler.evaluateTrophyGain(24*3 * 3 * 0.5, 24*3 * 3 * 0.1, 3000, 3000, 9));

        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in test: " + error.message);
    }
}




test();
