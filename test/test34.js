const {sendMsgToAll,sendMsgToClan,sendMsgToPlayer} = require('../utils/FCM/PushNotificationHandler')

const test = async (receiverUID)=>{
    const body = {
        type: 2,
        text: `Parvez have sent you Friend Request.`,
        icon: "https://i.ibb.co/JRbX00p9/event-info-1.png"
    }
    const title = "Friend Request Received";
    const res = await sendMsgToPlayer(JSON.stringify(body),title,receiverUID);
    console.log(res)
}

test("D9BvayKbPQhUqjbv");