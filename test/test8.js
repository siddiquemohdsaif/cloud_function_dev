const MapSliderInfo = require("../utils/StaticDocument/Data/XpInfo");
const WarHandler = require("../utils/WarHandler");

const test = async () => {
    try {
        for(let i=0; i< 100; i++){
            const mapSliderInfo = await MapSliderInfo.get();
            console.log(mapSliderInfo);
        }
        
    } catch (error) {
        console.error(error);
        throw new Error("Error in mapSliderInfo: " + error.message);
    }
}



const test2 = async () => {
    try {
        for(let i=0; i< 3; i++){
            await WarHandler.handleWar("EIZXgbPNq7ye2wex","HM3Y5m4kvlfLXXb1","EIZXgbPNq7ye2wex",1,true,false);
        }
        console.log("completed");

    } catch (error) {
        console.error(error);
        throw new Error("Error in WarHandler: " + error.message);
    }
}


test2();