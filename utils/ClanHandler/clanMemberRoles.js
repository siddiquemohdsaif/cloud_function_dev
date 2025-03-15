const FirestoreManager = require("../../Firestore/FirestoreManager");
const WebSocketHttpClient = require('.././WebSocketHttpClient');
const ClanUtilities = require('./clanUtilities');
const BackboneServerUrl = require('../BackboneServerUrl');
const backboneServerUrl = new BackboneServerUrl();

const firestoreManager = FirestoreManager.getInstance();



///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Promote Member ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

async function promote(promoterUID, promotingUID, cid) {
    try {

        // Fetch the clan by cid
        const clan = await firestoreManager.readDocument("Clans", cid, "/");

        const promoterMember = clan.members.find(member => member.UID === promoterUID);
        const promotingMember = clan.members.find(member => member.UID === promotingUID);

        // Validate the promotion action
        if (!isValidPromote(promoterMember, promotingMember)) {
            throw new Error("Promotion action is not valid.");
        }

        // Promote the promotingMember by one step
        promotingMember.TYPE = getNextRank(promotingMember.TYPE);

        //check is Leader promoted Co-Leader to Leader 
        const isLeaderPromotedCoLeader = promotingMember.TYPE === "Leader"
        if (isLeaderPromotedCoLeader) {
            await demote(promoterUID, promoterUID, cid);
            promoterMember.TYPE = "Co-Leader";             //old leader not demoting bug fix
        }


        // Update the clan members and save to the database
        await firestoreManager.updateDocument("Clans", cid, "/", { members: clan.members });

        // Read both promoter and promoting member's usernames
        const users = await firestoreManager.bulkReadDocuments("Users", "/", [promoterUID, promotingUID], { "profileData.userName": 1 });
        const promoterName = users[0].profileData.userName;
        const promotingName = users[1].profileData.userName;

        // Notify the backbone server
        await addPromoteCardToBackboneServer(promoterUID, promotingUID, promoterName, promotingName, cid);

        // Return a success response
        return { status: "success", message: "Member promoted successfully!" };

    } catch (error) {
        throw new Error("Failed to promote member: " + error.message);
    }
}

function isValidPromote(promoterMember, promotingMember) {
    // Logic to validate if the promotion action is valid
    if (!promoterMember || !promotingMember) return false;
    if (promoterMember.TYPE === "Leader" && promotingMember.TYPE !== "Leader") return true;
    if (promoterMember.TYPE === "Co-Leader" && (promotingMember.TYPE === "Member" || promotingMember.TYPE === "Elder")) return true;
    return false;
}

function getNextRank(rank) {
    // Logic to promote the member by one step
    if (rank === "Member") return "Elder";
    if (rank === "Elder") return "Co-Leader";
    if (rank === "Co-Leader") return "Leader";
    return rank; // If already a leader, no further promotion
}

async function addPromoteCardToBackboneServer(promoterUID, promotingUID, promoterName, promotingName, cid) {
    // Logic to call the backbone server to send a promotion message card to all clan members
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'promoteMember',
        promoterUID: promoterUID,
        promotingUID: promotingUID,
        promoterName: promoterName,
        promotingName: promotingName,
        cid: cid
    };
    const response = await client.request(queryParams);
    return response;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Demote Member ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function demote(demoterUID, demotingUID, cid) {
    try {

        // Fetch the clan by cid
        const clan = await firestoreManager.readDocument("Clans", cid, "/");

        const demoterMember = clan.members.find(member => member.UID === demoterUID);
        const demotingMember = clan.members.find(member => member.UID === demotingUID);

        // Validate the demotion action
        if (!isValidDemote(demoterMember, demotingMember)) {
            throw new Error("Demotion action is not valid.");
        }

        // Demote the demotingMember by one step
        demotingMember.TYPE = getPreviousRank(demotingMember.TYPE);

        // Update the clan members and save to the database
        await firestoreManager.updateDocument("Clans", cid, "/", { members: clan.members });

        // Read both demoter and demoting member's usernames
        const users = await firestoreManager.bulkReadDocuments("Users", "/", [demoterUID, demotingUID], { "profileData.userName": 1 });
        //bug fixed leader demoting itself
        let demoterName;
        let demotingName;
        if (demoterUID === demotingUID) {
            demoterName = users[0].profileData.userName;
            demotingName = users[0].profileData.userName;
        } else {
            demoterName = users[0].profileData.userName;
            demotingName = users[1].profileData.userName;
        }


        // Notify the backbone server
        await addDemoteCardToBackboneServer(demoterUID, demotingUID, demoterName, demotingName, cid);

        // Return a success response
        return { status: "success", message: "Member demoted successfully!" };

    } catch (error) {
        throw new Error("Failed to demote member: " + error.message);
    }
}

function isValidDemote(demoterMember, demotingMember) {
    // Logic to validate if the demotion action is valid
    if (!demoterMember || !demotingMember) return false;
    if (demoterMember.TYPE === "Leader" && (demotingMember.TYPE === "Leader" || demotingMember.TYPE === "Co-Leader" || demotingMember.TYPE === "Elder")) return true;
    if (demoterMember.TYPE === "Co-Leader" && demotingMember.TYPE === "Elder") return true;
    return false;
}

function getPreviousRank(rank) {
    // Logic to demote the member by one step
    if (rank === "Leader") return "Co-Leader";
    if (rank === "Co-Leader") return "Elder";
    if (rank === "Elder") return "Member";
    return rank; // If already a member, no further demotion
}

async function addDemoteCardToBackboneServer(demoterUID, demotingUID,  demoterName, demotingName, cid) {
    // Logic to call the backbone server to send a demotion message card to all clan members
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'demoteMember',
        demoterUID: demoterUID,
        demotingUID: demotingUID,
        demoterName: demoterName,
        demotingName: demotingName,
        cid: cid
    };
    const response = await client.request(queryParams);
    return response;
}


///////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////// Kick Member ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function kick(kickerUID, kickingUID, cid) {
    try {

        // Fetch the clan by cid
        const clan = await firestoreManager.readDocument("Clans", cid, "/");

        const kickerMember = clan.members.find(member => member.UID === kickerUID);
        const kickingMember = clan.members.find(member => member.UID === kickingUID);

        // Validate the kick action
        if (!isValidKick(kickerMember, kickingMember)) {
            throw new Error("Kick action is not valid.");
        }

        // Remove the kickingMember from the clan members list
        clan.members = clan.members.filter(member => member.UID !== kickingUID);

        // Update the clan members and save to the database
        await firestoreManager.updateDocument("Clans", cid, "/", { members: clan.members });

        // Read both kicker and kicking member's profileData
        const users = await firestoreManager.bulkReadDocuments("Users", "/", [kickerUID, kickingUID], { "profileData": 1 });
        const kickerName = users[0].profileData.userName;
        const kickingName = users[1].profileData.userName;

        // Update the kicking user's profile to reflect that they are no longer in a clan
        users[1].profileData.clanId = "null";
        await firestoreManager.updateDocument("Users", kickingUID, "/", { profileData: users[1].profileData });

        // Notify the backbone server
        await addKickCardToBackboneServer(kickerUID, kickingUID, kickerName, kickingName, cid);

        // Return a success response
        return { status: "success", message: "Member kicked successfully!" };

    } catch (error) {
        throw new Error("Failed to kick member: " + error.message);
    }
}

function isValidKick(kickerMember, kickingMember) {
    // Logic to validate is the kick action is valid
    if (!kickerMember || !kickingMember) return false;
    if (kickerMember.TYPE === "Leader") return true;
    if (kickerMember.TYPE === "Co-Leader" && (kickingMember.TYPE === "Member" || kickingMember.TYPE === "Elder")) return true;
    return false;
}

async function addKickCardToBackboneServer(kickerUID, kickingUID, kickerName, kickingName, cid) {
    // Logic to call the backbone server to send a kick message card to all clan members
    const url = await backboneServerUrl.getUrl();
    const client = new WebSocketHttpClient(url);
    const queryParams = {
        uid: 'InternalServerServicesCall',
        callType: 'kickMember',
        kickerUID: kickerUID,
        kickingUID: kickingUID,
        kickerName: kickerName,
        kickingName: kickingName,
        cid: cid
    };
    const response = await client.request(queryParams);
    return response;
}




module.exports = {
    promote,
    demote,
    kick
};
