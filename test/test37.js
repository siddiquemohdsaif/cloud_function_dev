const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const deleteEvent= async (eventId) => {
    try{
        const result= await firestoreManager.deleteCollection(eventId,"/Data/Event/");
        console.log(result);
    }catch(error){
        console.log(error)
        return false;
    }
}

deleteEvent("DAILY_PRIZE_TOURNAMENT")