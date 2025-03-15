const FirestoreManager = require("../../Firestore/FirestoreManager");
const WebSocketHttpClient = require('.././WebSocketHttpClient');
const ClanUtilities = require('./clanUtilities');
const BackboneServerUrl = require('../BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();

const firestoreManager = FirestoreManager.getInstance();



///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Clan war search ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

async function clanWarSearch(searcherUID, selectedPlayersUID, cid) {
    try {

        // Fetch the clan by cid
        const clan = await firestoreManager.readDocument("Clans", cid, "/");

        if(clan.clanWarId !== "null"){
            throw new Error("Aready in war.");
        }

        const searcherMember = clan.members.find(member => member.UID === searcherUID);

        // Validate the clan war search
        if (!searcherMember || (searcherMember.TYPE !== "Leader" && searcherMember.TYPE !== "Co-Leader")) {
            throw new Error("Only leader or coleader can initiate war search.");
        }

        //check duplicate array element
        const hasDuplicates = new Set(selectedPlayersUID).size !== selectedPlayersUID.length;
        if(hasDuplicates){
            //console.log(selectedPlayersUID);
            throw new Error("Duplicate members detected."+ selectedPlayersUID);
        }

        //check have fixed member of (3-5-10-20-40)
        if(selectedPlayersUID.length !== 3 && selectedPlayersUID.length !== 5 && selectedPlayersUID.length !== 10 && selectedPlayersUID.length !== 20 && selectedPlayersUID.length !== 40){
            throw new Error("Invalid member group size for war.");
        }

        //check car war member in clan
        for (let i=0; i<selectedPlayersUID.length ; i++){
            const selectedPlayer = clan.members.find(member => member.UID === selectedPlayersUID[i]);
            if (!selectedPlayer){
                throw new Error("All selected members must be part of the clan.");
            }
        }

        // Check if any player is already in war and update their status
        const playerUIDs = selectedPlayersUID;
        const playersData = await firestoreManager.bulkReadDocuments("Users", "/", playerUIDs, { "uid": 1, "gameData": 1 });
        const playersToUpdate = [];
        
        for (const playerData of playersData) {
            if (playerData.gameData.isInWar) {
                throw new Error("One or more selected members are already in a war.");
            } else {
                // Prepare to update the isInWar status
                playersToUpdate.push({
                    UID: playerData.uid,
                    updateData: { "gameData.isInWar": true }
                });
            }
        }

        //upload war details to war search
        const warDocName = `ClanMatchMaking-${selectedPlayersUID.length}` ;
        const warId = Date.now() + cid;
        const warUpdateDoc = {[warId] : {clanId : cid, members : selectedPlayersUID}};
        const uploadWarSearchResult = await firestoreManager.updateDocument("MatchMaking", warDocName, "/ClanWar/BeforeWar", warUpdateDoc);
        


        //reflect in clan document i.e clan in war
        clan.clanWarId = JSON.stringify({warId, state: "SEARCH"});
        await firestoreManager.updateDocument("Clans", cid, "/", { clanWarId : clan.clanWarId });

        //get searcherName
        const profileAndGameData = await firestoreManager.readDocumentWithProjection("Users", searcherUID, "/", { "profileData.userName": 1 });
        const searcherName = profileAndGameData.profileData.userName;


        // Notify the backbone server
        await addClanWarSearchCardToBackboneServer(searcherUID, searcherName, warId, cid);


        // Update isInWar status for all selected players
        // Prepare an array of update promises
        const updatePromises = playersToUpdate.map(player =>
            firestoreManager.updateDocument("Users", player.UID, "/", player.updateData)  //no lock need for specific and non critical update (mean: loss write is trolerate and it would not create loss write for other because of only one variable update gameData.isInWar)
        );
        // Execute all update operations in parallel
        await Promise.all(updatePromises)
        .catch(error => {
            console.error('An error occurred while updating players:', error);
        });



        // Return a updated clan as response
        return clan;

    } catch (error) {
        throw new Error("Failed to initiate clan war search: " + error.message);
    }
}



async function addClanWarSearchCardToBackboneServer(searcherUID, searcherName, warId, cid) {
    // Logic to call the backbone server to send a war message card to all clan members
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'clanWarSearch',
        searcherUID,
        searcherName,
        warId,
        cid
    };
    return await client.request(queryParams);
}


module.exports = {
    clanWarSearch
}

