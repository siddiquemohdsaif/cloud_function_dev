const ClanHandler = require("../utils/ClanHandler");



const test = async () => {
    try {


        await ClanHandler.clanMemberLastSeenUpdate("5D1PJ9zacxXXJnkz","SEIQPXVRL",Date.now());
        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in clanMemberLastSeenUpdate: " + error.message);
    }
}




test();
