const Verifier = require('../Utils/googlePurchaceVerifier.js'); // Assuming Verifier is the class you have shown earlier
const UserDataModifier = require("../../../utils/UserDataModifier.js");
const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();

require('dotenv').config();

const GEMS_100 = "gems.100";
const GEMS_250 = "gems.250";
const GEMS_750 = "gems.750";
const GEMS_2000 = "gems.2000";
const GEMS_5000 = "gems.5000";
const GEMS_10000 = "gems.10000";
const GEMS_SKU_LIST = [GEMS_100, GEMS_250, GEMS_750, GEMS_2000, GEMS_5000, GEMS_10000];

const verifierOptions = {
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};
const verifier = new Verifier(verifierOptions);

const packageName = process.env.PACKAGE_NAME;

const verifyPurchase = async (receipt) => {
    const result = await verifier.verifyINAPP(receipt); // Use the verifier instance

    if (result.isSuccessful) {
        if (GEMS_SKU_LIST.includes(receipt.productId)) {
            return {
                success: true,
                message: 'Purchase verified and gems added!',
                data: result,
            };
        } else {
            throw new Error('Invalid product ID');
        }
    } else {
        throw new Error(result.errorMessage);
    }
};

const addGemsToUserAccount = async (uid, gemsId) => {
    let gemAmount;

    switch (gemsId) {
        case GEMS_100:
            gemAmount = 100;
            break;
        case GEMS_250:
            gemAmount = 250;
            break;
        case GEMS_750:
            gemAmount = 750;
            break;
        case GEMS_2000:
            gemAmount = 2000;
            break;
        case GEMS_5000:
            gemAmount = 5000;
            break;
        case GEMS_10000:
            gemAmount = 10000;
            break;
        default:
            throw new Error("Invalid gemsId provided");
    }

    // Update profile data
    const profileData = await userDataModifier.updateGems(uid, gemAmount);


    return profileData;
};


const getGemsPrice = (gemsId) => {
    let gemAmount;

    switch (gemsId) {
        case GEMS_100:
            gemAmount = 39;
            break;
        case GEMS_250:
            gemAmount = 89;
            break;
        case GEMS_750:
            gemAmount = 249;
            break;
        case GEMS_2000:
            gemAmount = 499;
            break;
        case GEMS_5000:
            gemAmount = 899;
            break;
        case GEMS_10000:
            gemAmount = 1499;
            break;
        default:
            throw new Error("Invalid gemsId provided");
    }
}

const gemsBuy = async (uid, gemsId, token) => {
    try {
        const receipt = {
            packageName,
            productId: gemsId,
            purchaseToken: token
        };

        const response = await verifyPurchase(receipt);

        if (response.success) {
            const profileData = await addGemsToUserAccount(uid, gemsId);

            //save successful purchase receipt to db
            saveSuccessReceipt(response.data, token, gemsId, uid);
            checkCreatorAndSaveReceipt(response.data, token, gemsId, uid);

            return profileData;
        } else {
            throw new Error("Error in GEMS buy: " + response.message);
        }
    } catch (error) {
        console.error(error);
        throw new Error("Error in GEMS buy: " + error.message);
    }
};


const saveSuccessReceipt = async (responseData, token, gemsId, uid) => {

    try {
        const collName = "purchaseHistory";
        const orderIdSanitized = responseData.payload.orderId.replace(/\./g, '-');
        const docName = Date.now() + "_" + orderIdSanitized;
        const parentPath = "/IAP/google"
        await firestoreManager.createDocument(collName, docName, parentPath, { uid, productId: gemsId, token, response: responseData });
    } catch (e) {
        console.error("error in save purchase google IAP :" + e);
    }
}

const checkCreatorAndSaveReceipt = async (responseData, token, gemsId, uid) => {

    try {
        const userData = await firestoreManager.readDocument("Users", uid, "/");
        const userCreatorCode = userData.creatorCode;

        if (!userCreatorCode || userCreatorCode === "null") {
            return;
        }

        const creatorEmail = await userDataModifier.getEmailOfCreatorCode(userCreatorCode)
        console.log("creatorEmail",creatorEmail)

        if (!creatorEmail || typeof creatorEmail !== "string") {
            console.log("Unavailable to find or invalid creator Email");
            return;
        }

        const creatorDocName = creatorEmail.replace(/\./g, "<dot>");
        const creatorDoc = await firestoreManager.readDocument("Creator",creatorDocName,"/");

        const total = getGemsPrice(gemsId);
        const commission = total * 0.1; // 10% commission calculation

        const newOrderDetail = {
            date: Date.now(),
            app: "Carrom Clash",
            product: gemsId,
            order_id: responseData.payload.orderId,
            total: total,
            commission: commission,
        };

        delete creatorDoc._id;

        if (!Array.isArray(creatorDoc.order_Detail)) {
            creatorDoc.order_Detail = [];
        }

        // Append the new order detail to the order_Detail array
        creatorDoc.order_Detail.push(newOrderDetail);

        await firestoreManager.updateDocument("Creator",creatorDocName,"/",creatorDoc);

    } catch (e) {
        console.error("error in save detail in creator's document :" + e);
    }
}


module.exports = {
    gemsBuy
};

