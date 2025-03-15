
const deductClanTrophy = (clanTrophyReset, clan) => {
    // Find the trophy deduction based on the current clan trophies using linear interpolation
    let deduction = 0;
    for (const reset of clanTrophyReset) {
        if (clan.clanTrophy >= reset.min && clan.clanTrophy <= reset.max) {
            const range = reset.max - reset.min;
            const scale = (clan.clanTrophy - reset.min) / range;
            deduction = reset.trophyDeductMin + (reset.trophyDeductMax - reset.trophyDeductMin) * scale;
            break;
        }
    }

    if(clan.clanTrophy > 3000){
        deduction = clanTrophyReset[clanTrophyReset.length-1].trophyDeductMax;
    }

    // Deduct the trophies from the clan's current trophy count
    clan.clanTrophy -= Math.round(deduction);

    // Ensuring the trophy count does not go negative
    if (clan.clanTrophy < 0) {
        clan.clanTrophy = 0;
    }
    
    if(clan.clanTrophy > 3000){
        clan.clanTrophy = 3000;
    }
};
// Example clan object
const clan = {
    clanId: "UXHZHGBXO",
    clanName: "DON",
    clanLevel: 1,
    clanTrophy: 3400, // Test with different values for interpolation
    clanXp: 0,
    clanLogo: 1
};

// Example clanTrophyReset configuration
const clanTrophyReset = [
    { min: 0, max: 500, trophyDeductMin: 0, trophyDeductMax: 100 },
    { min: 501, max: 1000, trophyDeductMin: 100, trophyDeductMax: 150 },
    { min: 1001, max: 1500, trophyDeductMin: 150, trophyDeductMax: 200 },
    { min: 1501, max: 2000, trophyDeductMin: 200, trophyDeductMax: 250 },
    { min: 2001, max: 2500, trophyDeductMin: 250, trophyDeductMax: 300 },
    { min: 2501, max: 3000, trophyDeductMin: 300, trophyDeductMax: 400 }
];

// Running the function to update clan trophies
deductClanTrophy(clanTrophyReset, clan);

// Output the updated clan trophy
console.log("Updated Clan Trophy:", clan.clanTrophy);
