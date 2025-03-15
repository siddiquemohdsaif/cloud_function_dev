// Define the function to evaluate level based on XP
async function evaluateLevelFromXp(xp) {
    const randomNumber = Math.random() * 100; // Number between 0 and 100
    if (randomNumber < xp * 0.5) { // Higher XP, higher chance for level3
        return 'level3';
    } else if (randomNumber < xp * 0.3 + 40) { // Moderate chance for level2
        return 'level2';
    } else {
        return 'level1'; // Default to level1
    }
}

// Function to test evaluateLevelFromXp for each XP from 0 to 100, 10 times each
async function testEvaluateLevelFromXp() {
    const results = {}; // Object to store the test results

    // Loop through XP values from 0 to 100, incrementing by 10
    for (let xp = 0; xp <= 200; xp += 10) {
        results[xp] = { level1: 0, level2: 0, level3: 0 }; // Initialize count for each level per XP

        // Run the test 10 times for each XP value
        for (let i = 0; i < 1000; i++) {
            const level = await evaluateLevelFromXp(xp);
            results[xp][level]++; // Increment the count for the returned level
        }
    }

    console.log('Test results:', results); // Print the test results
}

// Call the test function
testEvaluateLevelFromXp();
