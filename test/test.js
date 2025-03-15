
const CardUpgradeHandler = require("../utils/CardUpgradeHandler");

const run = async (uid, strikerId) => {

    try{

        const result = await CardUpgradeHandler.upgradePower(uid, strikerId);
        console.log(result);
    }catch(error){
        console.log(error);
    }

}

run("hsD3jyTI3VNi1Hgx", 0);