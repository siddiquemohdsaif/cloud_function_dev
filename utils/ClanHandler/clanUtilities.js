const FirestoreManager = require("../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

const MAX_CLAN_MEMBERS = 40;


function generateClanId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function validateClanName(clanName) {
    if (typeof clanName !== "string" || clanName.length < 3 || clanName.length > 14) {
        throw new Error("Invalid clanName. It should be a string of length between 3 to 14 characters.");
    }
    return true;
}

function validateClanDescription(clanDescription) {
    if (typeof clanDescription !== "string" || clanDescription.length > 120) {
        throw new Error("Invalid clanDescription. It should be a string of length up to 120 characters.");
    }
    return true;
}

function validateClanLogo(clanLogo) {
    if (typeof clanLogo !== "number" || clanLogo < 1 || clanLogo > 18) {
        throw new Error("Invalid clanLogo. It should be an integer between 1 and 18.");
    }
    return true;
}

function validateClanType(clanType) {
    const validClanTypes = ["Open", "Invite Only", "Closed"];
    if (!validClanTypes.includes(clanType)) {
        throw new Error("Invalid clanType. It should be one of 'Open', 'Invite Only', or 'Closed'.");
    }
    return true;
}

function validateRequiredTrophy(requiredTrophy) {
    const startValue = 0;
    const stepValue = 100;
    const upperLimit = 5600;

    if (requiredTrophy < startValue || requiredTrophy > upperLimit || requiredTrophy % stepValue !== 0) {
        throw new Error(`Invalid requiredTrophy. It should be a multiple of ${stepValue} between ${startValue} and ${upperLimit}.`);
    }
    return true;
}

function validateInputs(clanName, clanDescription, clanLogo, clanType, requiredTrophy) {
    validateClanName(clanName);
    validateClanDescription(clanDescription);
    validateClanLogo(clanLogo);
    validateClanType(clanType);
    validateRequiredTrophy(requiredTrophy);

    return true;
}


function handleLeaderDeparture(members) {
    // Filter out the current leader
    const nonLeaderMembers = members.filter(member => member.TYPE !== "Leader");

    // Sort based on TYPE and then based on JT
    nonLeaderMembers.sort((a, b) => {
        const typeOrder = ["Co-Leader", "Elder", "Member"];
        const typeDifference = typeOrder.indexOf(a.TYPE) - typeOrder.indexOf(b.TYPE);
        if (typeDifference !== 0) {
            return typeDifference;
        } else {
            return a.JT - b.JT;
        }
    });

    // The first member in the sorted list is the new leader
    nonLeaderMembers[0].TYPE = "Leader";

    return nonLeaderMembers;
}

const getClanChatHistory = async (cid) => {

    const colName = "ClanMsg";
    const docName = cid;
    const parentPath = "/";

    return await firestoreManager.readDocument(colName, docName, parentPath);
}

const isAlreadySendJoinRequest = (uid, clanHistoryMsg) => {
    for (let key in clanHistoryMsg) {
        if(key.endsWith(uid)){
            const clanMessageCard = JSON.parse(clanHistoryMsg[key]);
            if (clanMessageCard.cardType === "clanJoinInviteRequest") {
                if (clanMessageCard.senderId === uid) {
                    return true;
                }
            }
        }

    }
    return false;
}


module.exports = {
    generateClanId,
    validateInputs,
    validateClanName,
    validateClanDescription,
    validateClanLogo,
    validateClanType,
    validateRequiredTrophy,
    handleLeaderDeparture,
    getClanChatHistory,
    isAlreadySendJoinRequest,
    MAX_CLAN_MEMBERS,
}
