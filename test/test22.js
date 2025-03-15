const GemsBuyHandler = require('../utils/GoogleIAP/PurchaseHandler/GemsBuyHandler');

const test = async() => {


    const result  = await GemsBuyHandler.gemsBuy("Nvq9f1cZQ3VdiLPf","gems__100","nlapfheaoehnihgcneekllla.AO-J1Ozs-AlGMDfGKReYGvQK5FNM2H8idmFOL6UhDgN6WadIsmRewOySx-JD41lMIR1s8LCUgZzEM5zHUACskh8WyvNfahgu96RlQTHF1fE18OQCAAtrZrw");

    console.log(result);


}


test();