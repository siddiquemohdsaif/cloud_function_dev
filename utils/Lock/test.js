const UserLock = require("./UserLock");


let sharedUserVar = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function criticalSection() {
    const now = new Date();
    console.log("CriticalSection started at:", now.toISOString());

    let initial = sharedUserVar;

    // Simulating a delay
    await sleep(1000); // Sleep for 1 second

    // Modify the shared variable
    sharedUserVar = initial + 1;
    console.log("Modified sharedUserVar to:", sharedUserVar);

    console.log("CriticalSection ended at:", new Date().toISOString());
}

// To use the UserLock
(async () => {
    try {
        const uid = '123'; // Unique identifier
        const result = await UserLock.getInstance().run(uid, criticalSection);
        // Do something with the result
    } catch (err) {
        // Handle errors
        console.error(err);
    }
})();


// To use the UserLock
(async () => {
    try {
        const uid = '123'; // Unique identifier
        const result = await UserLock.getInstance().run(uid, criticalSection);
        // Do something with the result
    } catch (err) {
        // Handle errors
        console.error(err);
    }
})();
