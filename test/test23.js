const BotUids = require('../utils/StaticDocument/Data/BotAccounts');

const test = async() => {


    const bots  = await BotUids.getBotAccounts();
    console.log(bots);

    //BotUids.freeBotOnGameOver("9vYUVCOSbl0lCDEG");


}


test();