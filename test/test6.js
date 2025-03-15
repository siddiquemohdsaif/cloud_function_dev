const CarromPassHandler = require("../utils/carromPassHandler");


const avatarUnlock = async () => {
    try {
        CarromPassHandler.unlockEmoji(3, "ejc3QpiAizughl77");

    } catch (error) {
        console.error(error);
        throw new Error("Error in avatarUnlock: " + error.message);
    }
}


avatarUnlock();