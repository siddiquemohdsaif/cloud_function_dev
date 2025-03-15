// const axios = require('axios');
// const firestoreManager = require("./Firestore/FirestoreManager").getInstance();

// const registerBot = (botNum, level) => {
//     axios.get("https://function.cloudsw3.com/cc-app-api/" + 'loginAsGuest')
//         .then(response => {
//             if (response.status === 200) {
//                 try {

//                     const responseObject = response.data;
//                     const uid = responseObject.UID;
//                     const enc = responseObject.ENC;
//                     console.log(uid +" "+ enc);
//                     const botName = `bot${botNum}`;
//                     firestoreManager.updateDocument("Data", "BotAccountsLvl"+level, "/" , { [botName] : {uid , enc ,isFree : true,lastGamePlayedAt : Date.now()} });

//                 } catch (error) {
//                     console.log(error);
//                 }
//             } else {
//                 console.log(response);
//             }
//         })
//         .catch(error => {
//             console.log(error);
//         });
// }


// const registerAllBot = async () => {

//     // level 1 bot
//     for (let i = 1; i <= 25; i++) {
//         await registerBot(i,1);
//         await new Promise(resolve => setTimeout(resolve, 100)); // Sleep for 100 ms
//     }

//     // level 3 bot
//     for (let i = 1; i <= 25; i++) {
//         await registerBot(i,3);
//         await new Promise(resolve => setTimeout(resolve, 100)); // Sleep for 100 ms
//     }

//     // level 7 bot
//     for (let i = 1; i <= 25; i++) {
//         await registerBot(i,7);
//         await new Promise(resolve => setTimeout(resolve, 100)); // Sleep for 100 ms
//     }

//     // level 10 bot
//     for (let i = 1; i <= 25; i++) {
//         await registerBot(i,10);
//         await new Promise(resolve => setTimeout(resolve, 100)); // Sleep for 100 ms
//     }

// }


// registerAllBot();


// // uncoment only when need