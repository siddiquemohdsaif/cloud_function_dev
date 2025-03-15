const ShopHandler = require('../utils/ShopHandler');





const run = async() => {
    const result = await ShopHandler.coinsBuyFlexible("Qe5TUO4Z3vmABlfA",1000);
    console.log(result);
}

run();


