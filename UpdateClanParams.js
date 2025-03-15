const FirestoreManager = require("./Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const updateClanBYAddParam = (clan) => {
    // Update "LT" for each member to current timestamp
    clan.members = clan.members.map(member => ({
        ...member,
        LT: Date.now() // This sets the current timestamp
    }));

    const clanUpdated = {
        clanId: clan.clanId,
        clanName: clan.clanName,
        clanLevel: clan.clanLevel,
        clanTrophy: clan.clanTrophy,
        clanXp: clan.clanXp,
        clanLogo: clan.clanLogo,
        clanDescription: clan.clanDescription,
        clanType: clan.clanType,
        requiredTrophy: clan.requiredTrophy,
        cct: clan.cct,
        members: clan.members,
        warHistory: clan.warHistory,
        clanWarId: clan.clanWarId
    };

    return clanUpdated;
}

const updateALLClans = async () => {
    const docIds = await firestoreManager.readCollectionDocumentIds('Clans', '/');
    const clansChunks = chunkArray(docIds, 100);

    for (let clansChunk of clansChunks) {
        const clans = await firestoreManager.bulkReadDocuments('Clans', '/', clansChunk, {});

        const updatePromises = clans.map(clan => {
            const updatedClan = updateClanBYAddParam(clan);
            return firestoreManager.createDocument('Clans', updatedClan.clanId, '/', updatedClan);
        });

        await Promise.all(updatePromises);
    }
};

function chunkArray(array, size) {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunked_arr.push(chunk);
    }
    return chunked_arr;
}

const test = async () => {
    const clan = await firestoreManager.readDocument('Clans', 'YEAFGKKQA', '/');
    const updatedClan = updateClanBYAddParam(clan);
    await firestoreManager.createDocument('Clans', updatedClan.clanId, '/', updatedClan);
}

// updateALLClans(); //Uncomment to run the update across all clans
// test();