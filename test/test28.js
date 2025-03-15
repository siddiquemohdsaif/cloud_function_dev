
const AccountDeleteHandler = require("../utils/AccountDeleteHandler");



const del = async () => {
    try{
        return AccountDeleteHandler.deleteAccountProcessInitiate("SN5F1jH2AYhO3DkC")
    }catch (e) {
        console.log(e);
    }
};




const test = async() => {
    // Example usage:
    console.log(await del());
}

test();
