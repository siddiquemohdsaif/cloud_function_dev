const axios = require('axios');
const CurrentUrlRef = require('../CurrentUrlRef');
const clanSearchUrlRef = new CurrentUrlRef('ClanSearchServerUrl');

let CLAN_SEARCH_SERVER_URL;



async function searchClan(searchName, type, minMember, minClanTrophy, minClanLevel) {
    try {
        CLAN_SEARCH_SERVER_URL = await clanSearchUrlRef.getUrl() + "/";
        const queryParam = { searchName, type, minMember, minClanTrophy, minClanLevel, maxResult: 100 };

        // Filter out null or undefined values and form the query string
        let queryString = Object.keys(queryParam)
            .filter(key => queryParam[key] !== null && queryParam[key] !== undefined)
            .map(key => `${key}=${encodeURIComponent(queryParam[key])}`)
            .join('&');

        const baseUrl = CLAN_SEARCH_SERVER_URL + "search";
        const fullUrl = `${baseUrl}?${queryString}`;

        // Fetch data using axios
        const response = await axios.get(fullUrl);
        const searchClanList = response.data;

        return searchClanList;

    } catch (error) {
        throw new Error("Failed to search clan: " + error.message);
    }
}


async function addNewClanToClanSearch(clan) {
    CLAN_SEARCH_SERVER_URL = await clanSearchUrlRef.getUrl() + "/";
    const parsedURL = `${CLAN_SEARCH_SERVER_URL}addClan`;

    const clanDetails = {
        clanId: clan.clanId,
        clanName: clan.clanName,
        clanLevel: clan.clanLevel,
        clanTrophy: clan.clanTrophy,
        clanLogo: clan.clanLogo,
        clanType: clan.clanType,
        requiredTrophy: clan.requiredTrophy,
        members: clan.members.length
    };

    // Use axios to make a POST request
    const response = await axios.post(parsedURL, clanDetails, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 200) {
        return response.data; // Clan added successfully
    } else {
        throw new Error(response.data); // Handle error message returned from server
    }
}


async function deleteClanToClanSearch(clanId) {
    CLAN_SEARCH_SERVER_URL = await clanSearchUrlRef.getUrl() + "/";
    const parsedURL = `${CLAN_SEARCH_SERVER_URL}deleteClan`;  // Ensure a single slash before "deleteClan"

    // Use axios to make a DELETE request with the clanId in the request body
    const response = await axios.delete(parsedURL, {
        data: { clanId: clanId }
    });

    if (response.status === 200) {
        return response.data; // Clan deleted successfully
    } else {
        throw new Error(response.data); // Handle error message returned from server
    }
}


module.exports = {
    searchClan,
    addNewClanToClanSearch,
    deleteClanToClanSearch
};
