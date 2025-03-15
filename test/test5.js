const UserDataModifier = require("../utils/UserDataModifier.js");
const userDataModifier = new UserDataModifier();

const carromPassBuy = async (uid) => {
    try {
        const profileData = await userDataModifier.activateCarromPass(uid);
        console.log(profileData);

    } catch (error) {
        console.error(error);
        throw new Error("Error in Carrom Pass buy: " + error.message);
    }
}


carromPassBuy("H5tEyByjdl6w8h1N");