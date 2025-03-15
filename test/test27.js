// function convertIndiaTimeToUTC(indiaTimeMillis) {
//     // India Standard Time (IST) is UTC+5:30
//     const IST_OFFSET = 5.5 * 60 * 60 * 1000; // Offset in milliseconds

//     // Convert India time (milliseconds) to UTC time
//     const utcTimeMillis = indiaTimeMillis - IST_OFFSET;

//     return utcTimeMillis;
// }

// // Example usage:
// const indiaTimeMillis = Date.now(); // Current time in India in milliseconds
// const utcTimeMillis = convertIndiaTimeToUTC(indiaTimeMillis);
// console.log(`UTC Time in Milliseconds: ${utcTimeMillis}`);

const CarromPassCache = require("../utils/StaticDocument/Data/CarromPass");



const secondSeasonEndTime = async () => {
    // Season end at 1/x_month/x_year at 5:00:00 AM


    const carromPass = await CarromPassCache.get();
    if(carromPass.secondSeasonEndTime){
        return carromPass.secondSeasonEndTime;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();
    
    // Calculate the month of the second season end
    let secondSeasonMonth = currentMonth + 2;
    let secondSeasonYear = currentYear;
    
    // If the month goes beyond December, adjust the year and month
    if (secondSeasonMonth > 11) {
        secondSeasonMonth -= 12;
        secondSeasonYear += 1;
    }
    
    // Create the date for the second season end in UTC
    const secondSeasonEndDate = new Date(Date.UTC(secondSeasonYear, secondSeasonMonth, 1, 5, 0, 0));

    // India Standard Time (IST) is UTC+5:30
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // Offset in milliseconds
    const IndiaTime = secondSeasonEndDate.getTime() - IST_OFFSET;

    return IndiaTime;
};




const test = async() => {
    // Example usage:
    console.log(await secondSeasonEndTime());
}

test();
