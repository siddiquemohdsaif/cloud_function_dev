function getNextDayTimestampKolkata() {
    // Get the current date and time in the Asia/Kolkata timezone
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    // Create a new Date object for the next day in the Kolkata timezone
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);


    // Adjust the nextDay timestamp to match the intended midnight IST
    return nextDay.getTime() - nextDay.getTimezoneOffset() * 60 * 1000;
}

// Usage:
const nextDayTimestampKolkata = getNextDayTimestampKolkata();
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
console.log("Next day timestamp for Kolkata: ", nextDayTimestampKolkata);
console.log("Readable Current day in Kolkata: ", now.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
}));
console.log("Readable next day in Kolkata: ", new Date(nextDayTimestampKolkata).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
}));
