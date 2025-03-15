function evaluateTrophyGain(winScore, loseScore, winTrophy, loseTrophy, noOfPlayers, isDraw) {

    if (winTrophy < 100) {
        winTrophy = 100;
    }

    if (loseTrophy < 100) {
        loseTrophy = 100;
    }

    console.log({winScore, loseScore, winTrophy, loseTrophy, noOfPlayers});

    let trophyPool = 40;

    let winTrophyIncrease;
    let loseTrophyIncrease;
    if(isDraw){
        winTrophyIncrease = trophyPool * 0.2;
        loseTrophyIncrease = trophyPool * 0.2;
    }else{
        winTrophyIncrease = trophyPool * 0.4;
        loseTrophyIncrease = 0;
    }


    trophyPool = trophyPool * 0.6; //40% already given to winner


    const idealWinScore = (Math.min(winTrophy, 3000) / 3000 * 8 * 3) * noOfPlayers * 0.6;
    const idealLoseScore = (Math.min(loseTrophy, 3000) / 3000 * 8 * 3) * noOfPlayers * 0.6;


    // give remaining trophy from trophyPool to both user based on performance
    winTrophyIncrease += Math.min(winScore, idealWinScore) / idealWinScore * trophyPool;
    loseTrophyIncrease += Math.min(loseScore, idealLoseScore) / idealLoseScore * trophyPool;

    // Round off the trophy increase values to integers
    winTrophyIncrease = Math.round(winTrophyIncrease);
    loseTrophyIncrease = Math.round(loseTrophyIncrease);

    return {winTrophyIncrease, loseTrophyIncrease};
}

// Test cases

// Test case 1
let result = evaluateTrophyGain(36, 30, 3000, 3000, 3);
console.log(result); // {winTrophyIncrease: x, loseTrophyIncrease: y}


let result1 = evaluateTrophyGain(36, 30, 2900, 2900, 3);
console.log(result1); // {winTrophyIncrease: x, loseTrophyIncrease: y}


let result2 = evaluateTrophyGain(36, 30, 2800, 2800, 3);
console.log(result2); // {winTrophyIncrease: x, loseTrophyIncrease: y}


let result3 = evaluateTrophyGain(36, 30, 2700, 2700, 3);
console.log(result3); // {winTrophyIncrease: x, loseTrophyIncrease: y}


let result4 = evaluateTrophyGain(36, 36, 2600, 2600, 3, true);
console.log(result4); // {winTrophyIncrease: x, loseTrophyIncrease: y}

let result5 = evaluateTrophyGain(0, 0, 2500, 2500, 3, true);
console.log(result5); // {winTrophyIncrease: x, loseTrophyIncrease: y}

// // Test case 2
// result = evaluateTrophyGain(150, 100, 1000, 800, 3);
// console.log(result); // {winTrophyIncrease: x, loseTrophyIncrease: y}

// // Test case 3
// result = evaluateTrophyGain(50, 30, 2500, 2000, 4);
// console.log(result); // {winTrophyIncrease: x, loseTrophyIncrease: y}

// // Test case 4
// result = evaluateTrophyGain(600, 500, 50, 60, 1);
// console.log(result); // {winTrophyIncrease: x, loseTrophyIncrease: y}

// // Test case 5
// result = evaluateTrophyGain(500, 400, 3000, 3000, 2);
// console.log(result); // {winTrophyIncrease: x, loseTrophyIncrease: y}
