const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const ClanLock = require('../Lock/ClanLock');

async function clanMemberLastSeenUpdate(uid, clanId, LT) {
    try {

        // console.log("clanMemberLastSeenUpdate");
        return await ClanLock.getInstance().run(clanId, async () => {

            // console.log("clanMemberLastSeenUpdate enetred in ")
            const collName = "Clans";
            const parentPath = "/";
    
            // Fetch the desired clan's current data
            const clan = await firestoreManager.readDocument(collName, clanId, parentPath);
    
            if (!clan) {
                throw new Error("Clan not found");
            }
    
            // Check if the member exists in the clan
            const memberIndex = clan.members.findIndex(member => member.UID === uid);
            if (memberIndex === -1) {
                throw new Error("Member not found in clan");
            }
    
            // Update last seen time (LT) for the member with the provided LT value
            clan.members[memberIndex].LT = LT;
    
            // Update the document in Firestore
            await firestoreManager.updateDocument(collName, clanId, parentPath, { members: clan.members });
    
            return clan;

        });

    } catch (error) {
        throw new Error("Failed to update clan member's last seen time: " + error.message);
    }
    
}

module.exports = {
    clanMemberLastSeenUpdate
};
