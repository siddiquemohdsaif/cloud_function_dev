const FirestoreManager = require("./Firestore/FirestoreManager");
const db = FirestoreManager.getInstance();


const createNewAppConfig = async (oldAppConfigVersion, newAppConfigVersion) => {


    let document;
    try {
        document = await db.readDocument("GameInfo", `AppConfiguration_v_${oldAppConfigVersion}`, "/");
    } catch (error) {
        console.log(error);
        throw new Error(`Failed to read document: ${error.message}`);
    }

    delete document._id;

    await db.createDocument("GameInfo", `AppConfiguration_v_${newAppConfigVersion}`, "/",document)

    console.log("done");
}

// createNewAppConfig("4_2_2","4_2_6")
