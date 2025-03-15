




const XpHandler = require("../utils/XpHandler");

const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();





const run = async() => {

    try{

        
        // Get User profile and game data from db
        const profileAndGamedata = await firestoreManager.readDocument("Users", "yJkv8rhPfYGo9BRt", "/");
        console.log(profileAndGamedata);
        await XpHandler.IncreasedXpByLose(profileAndGamedata);
      


        console.log(profileAndGamedata);

    }catch(e){

        console.log(e);

    }

}

run();




