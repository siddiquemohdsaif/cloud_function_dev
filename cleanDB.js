// const firestoreManager = require("./Firestore/FirestoreManager").getInstance();


// const cleanDbWithBot = async() =>{

//     //clean : /ClanMsg
//     console.log("cleaning : ClanMsg");
//     await cleanCollection("ClanMsg","/");

//     //clean : /ClanWar/War/FinishWar
//     console.log("cleaning : FinishWar");
//     await cleanCollection("FinishWar","/ClanWar/War/");

//     //clean : /ClanWar/War/OnGoingWar
//     console.log("cleaning : OnGoingWar");
//     await cleanCollection("OnGoingWar","/ClanWar/War/");

//     //clean : /Notifications
//     console.log("cleaning : Notifications");
//     await cleanCollection("Notifications","/");

//     //clean : /Users
//     console.log("cleaning : Users");
//     await cleanCollection("Users","/");

//     //clean : /reconnectServerLink
//     console.log("cleaning : reconnectServerLink");
//     await cleanCollection("reconnectServerLink","/");

//     //clean : /Data/UserData/UnlockData
//     console.log("cleaning : UnlockData");
//     await cleanCollection("UnlockData","/Data/UserData/");

//     //clean : /Data/UserData/Challange
//     console.log("cleaning : Challange");
//     await cleanCollection("Challange","/Data/UserData/");

//     //clean : /Clans
//     console.log("cleaning : Clans");
//     await cleanCollection("Clans","/");

//     //clean : /CC-ID-MAP
//     console.log("cleaning : CC-ID-MAP");
//     await cleanCollection("CC-ID-MAP","/");

//     //clean : /GoogleAuth
//     console.log("cleaning : GoogleAuth");
//     await cleanCollection("GoogleAuth","/");

//     //clean : /FacebookAuth
//     console.log("cleaning : FacebookAuth");
//     await cleanCollection("FacebookAuth","/");

//     //clean : /PastResult
//     console.log("cleaning : PastResult");
//     reCreateDocument("Data", "PastResult", "/");

//      //clean : /BotAccountsLvl1
//      console.log("cleaning : BotAccountsLvl1");
//      reCreateDocument("Data", "BotAccountsLvl1", "/");

//       //clean : /BotAccountsLvl3
//     console.log("cleaning : BotAccountsLvl3");
//     reCreateDocument("Data", "BotAccountsLvl3", "/");

//      //clean : /BotAccountsLvl7
//      console.log("cleaning : BotAccountsLvl7");
//      reCreateDocument("Data", "BotAccountsLvl7", "/");

//       //clean : /BotAccountsLvl10
//     console.log("cleaning : BotAccountsLvl10");
//     reCreateDocument("Data", "BotAccountsLvl10", "/");

// }

// const cleanCollection = async (collName, parentPath) => {
//     const documentsArray = await firestoreManager.readCollectionDocumentIds(collName, parentPath);

//     // Function to process a batch of deletions
//     const deleteBatch = async (batch) => {
//         const deletePromises = batch.map(docId => 
//             firestoreManager.deleteDocument(collName, docId, parentPath)
//         );
//         await Promise.all(deletePromises);
//     };

//     // Process in batches of 10
//     for (let i = 0; i < documentsArray.length; i += 50) {
//         const batch = documentsArray.slice(i, i + 50);
//         await deleteBatch(batch);
//         console.log("batch deleted of pos:" + i + " " + (i+50));
//         await new Promise(resolve => setTimeout(resolve, 100)); // Sleep for 100 ms
//     }
// };

// const reCreateDocument = async (collName,docName,parentPath) => {
//     await firestoreManager.deleteDocument(collName,docName,parentPath)
//     const doc = {
//         info: 'Description'
//     }
//     await firestoreManager.createDocument(collName,docName,parentPath, doc)
//     console.log("done");
// }

// cleanDbWithBot();

// // uncoment only when need