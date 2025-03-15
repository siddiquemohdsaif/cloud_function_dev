const UserLock = require('../utils/Lock/UserLock');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const run1 = async(UID) => {

    try{

        let a = 1;
        const b = 90;
        return a+b;

    }catch (e) {
        console.log(e);
    }

}

const run2 = async(UID) => {

 
    let a = 1;
    const b = 9;
    console.log("app2_4");
    await sleep(4000);

    console.log("app2_5");
    //b++;
    return a+b;


}



const app1 = async() => {
    const UID = "Qe5TUO4Z3vmABlfA";
    console.log("app1_1");

    // Process the coins purchase
    const result1 = await UserLock.getInstance().run(UID, async () => {
        console.log("app1_2");
        return await run1(UID);
    });
    console.log("app1_3");

    console.log(result1);

}

const app2 = async() => {
    const UID = "Qe5TUO4Z3vmABlfA";
    console.log("app2_1");

    console.log("app2_2");

    // Process the coins purchase
    const result1 = await UserLock.getInstance().run(UID, async () => {
        console.log("app2_3");

        return await run2(UID);
    });
    console.log("app2_6");

    console.log(result1);


}

const call1 = async() => {

    try{
        await app2();
    }catch(e){
        console.log(e);
    }

};//call1();


const call2 = async() => {
    try{
        await app1();
    }catch(e){
        console.log(e);
    }

};//call2();


const start = async() => {
    try{
        call1();
        call2();

        await sleep(4000)
        call2();

        await sleep(12000)
        call2();

        await sleep(7000)
        call2();

        await sleep(1000)
        call2();

        await sleep(1000)
        call2();

        call1();
        await sleep(1000)
        call2();

        await sleep(1000)
        call2();

    }catch(e){
        console.log(e);
    }

};start();


