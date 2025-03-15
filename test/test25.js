const isAlreadySendJoinRequest = (uid, clanHistoryMsg) => {
    for (let key in clanHistoryMsg) {
        if (key.endsWith(uid)) {
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

const clanHistoryMsg = {
    "1717675565718_0qkUvaYzOuZ93uRT": JSON.stringify({
        "cardType": "clanJoinInviteRequest",
        "senderId": "0qkUvaYzOuZ93uRT",
        "senderName": "guest_svbl",
        "senderLeagueLogo": "1_1",
        "senderAvatar": 0,
        "senderFrame": "0",
        "senderTrophy": "0",
        "isSenderPremium": "true",
        "timeStamp": 1717675565718
    }),
    "1717675584705_cXOaHzKDZd0dyTPP": JSON.stringify({
        "senderId": "cXOaHzKDZd0dyTPP",
        "senderName": "guest_abqi",
        "senderLeagueLogo": "1_3",
        "senderAvatar": 0,
        "senderFrame": "0",
        "senderTrophy": "839",
        "isSenderPremium": "false",
        "timeStamp": 1717675584705
    }),
    "1717675769304_BhamKTHuWQPZKdxO": JSON.stringify({
        "logMessage": "AAAAAAAAAAAAAA was promoted by guest_fazw",
        "type": "MemberPromoted",
        "profileId": "q9PrIjwJ3OQ6D8Bg",
        "timeStamp": 1717675769304
    }),
    "1717675792631_BhamKTHuWQPZKdxO": JSON.stringify({
        "logMessage": "AAAAAAAAAAAAAA was promoted by guest_fazw",
        "type": "MemberPromoted",
        "profileId": "q9PrIjwJ3OQ6D8Bg",
        "timeStamp": 1717675792631
    })
};

// Testing the function with different uid values
console.log(isAlreadySendJoinRequest("0qkUvaYzOuZ93uRT", clanHistoryMsg)); // Expected output: false
console.log(isAlreadySendJoinRequest("cXOaHzKDZd0dyTPP", clanHistoryMsg)); // Expected output: false
console.log(isAlreadySendJoinRequest("BhamKTHuWQPZKdxO", clanHistoryMsg)); // Expected output: false
