const getEmailByCreatorCode = (creatorVerifiedList, userCreatorCode) => {
    // Trim any extra spaces from userCreatorCode
    const code = userCreatorCode.trim();

    // Find the email corresponding to the creator code
    for (const email in creatorVerifiedList) {
        if (creatorVerifiedList[email] === code) {
            return email; // Return the email if found
        }
    }

    return null; // Return null if no match is found
};

// Example usage
const creatorVerifiedList = {
    "siddiquemohdsaif19196@gmail.com": "abcd",
    "saif.ad19196@gmail.com": "efgh"
};

const userCreatorCode = "efgh ";
const email = getEmailByCreatorCode(creatorVerifiedList, userCreatorCode);
// const modifyEmail = email.replace(".","<dot>");
const modifyEmail = email.replace(/\./g, "<dot>");

console.log(email); 
console.log(modifyEmail);