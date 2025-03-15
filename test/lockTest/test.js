const ResourceLock = require("./ResourceLock");
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let state = {
    r1 : 100,
    r2 : 100
}


const app1 = async(id) => {

    try{

        let task1 = await ResourceLock.getInstance().run("r1", async() => {
            let update = state.r1 + 10;
            await sleep(1000);
            state.r1 = update;
        });
    
        await sleep(4000);
    
        // let task2 = await ResourceLock.getInstance().run("r2", async() => {
        //     let update = state.r2 + 10;
        //     await sleep(1000);
        //     state.r2 = update;
        // });
    
        console.log(`id : ${id}`);
        console.log(state);


    }catch(e){
        console.log("error timeout: " + id + " error:"+e);
    }



}


app1(1);
app1(2);
app1(3);
app1(4);
app1(5);
app1(6);
app1(7);
app1(8);
app1(9);
app1(10);
app1(11);