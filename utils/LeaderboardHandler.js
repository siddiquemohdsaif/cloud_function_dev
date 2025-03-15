const axios = require('axios');
const CurrentUrlRef = require('./CurrentUrlRef');
const leaderboardUrlRef = new CurrentUrlRef('LeaderboardServerUrl');

let LEADERBOARD_SERVER_URL;

async function getTopPlayers(from, to, uid) {
    try {
        LEADERBOARD_SERVER_URL = await leaderboardUrlRef.getUrl() + "/";
        const queryString = `from=${from}&to=${to}&uid=${uid}`;
        const fullUrl = `${LEADERBOARD_SERVER_URL}get-top-players?${queryString}`;

        const response = await axios.get(fullUrl);
        const topPlayersList = response.data;

        return topPlayersList;
    } catch (error) {
        throw new Error("Failed to get top players: " + error.message);
    }
}

async function getTopPlayersFresh(from, to, uid) {
    try {
        LEADERBOARD_SERVER_URL = await leaderboardUrlRef.getUrl() + "/";
        const queryString = `from=${from}&to=${to}&uid=${uid}&isFresh=true`;
        const fullUrl = `${LEADERBOARD_SERVER_URL}get-top-players?${queryString}`;

        const response = await axios.get(fullUrl);
        const topPlayersList = response.data;

        return topPlayersList;
    } catch (error) {
        throw new Error("Failed to get top players: " + error.message);
    }
}

async function getTopClans(from, to, cid) {
    try {
        LEADERBOARD_SERVER_URL = await leaderboardUrlRef.getUrl() + "/";
        const queryString = `from=${from}&to=${to}&cid=${cid}`;
        const fullUrl = `${LEADERBOARD_SERVER_URL}get-top-clans?${queryString}`;

        const response = await axios.get(fullUrl);
        const topClansList = response.data;

        return topClansList;
    } catch (error) {
        throw new Error("Failed to get top clans: " + error.message);
    }
}

async function getTopClansFresh(from, to, cid) {
    try {
        LEADERBOARD_SERVER_URL = await leaderboardUrlRef.getUrl() + "/";
        const queryString = `from=${from}&to=${to}&cid=${cid}&isFresh=true`;
        const fullUrl = `${LEADERBOARD_SERVER_URL}get-top-clans?${queryString}`;

        const response = await axios.get(fullUrl);
        const topClansList = response.data;

        return topClansList;
    } catch (error) {
        throw new Error("Failed to get top clans: " + error.message);
    }
}


module.exports = {
    getTopPlayers,
    getTopPlayersFresh,
    getTopClans,
    getTopClansFresh
};
