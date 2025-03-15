const Verifier = require('../Utils/googlePurchaceVerifier.js');
const UserDataModifier = require("../../../utils/UserDataModifier.js");
const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const userDataModifier = new UserDataModifier();

require('dotenv').config();

const verifierOptions = {
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};
const verifier = new Verifier(verifierOptions);

const packageName = process.env.PACKAGE_NAME;

const GOLDEN_SHOT_SKU = "golden.shot"; 

const verifyPurchase = async (receipt) => {
    const result = await verifier.verifyINAPP(receipt);

    if (result.isSuccessful) {
        if (receipt.productId === GOLDEN_SHOT_SKU) {
            return {
                success: true,
                message: 'Purchase verified and Golden Shot activated!',
                data: result,
            };
        } else {
            throw new Error('Invalid product ID for Golden Shot');
        }
    } else {
        throw new Error(result.errorMessage);
    }
};



const goldenShotBuy = async (uid, token) => {
    try {
        const receipt = {
            packageName,
            productId: GOLDEN_SHOT_SKU,
            purchaseToken: token
        };
        
        const response = await verifyPurchase(receipt);

        if (response.success) {
            const profileData = await userDataModifier.activateGoldenShot(uid);

            // Save successful purchase receipt to db
            saveSuccessReceipt(response.data, token, GOLDEN_SHOT_SKU, uid);
            checkCreatorAndSaveReceipt(response.data, token, GOLDEN_SHOT_SKU, uid)

            return profileData;
        } else {
            throw new Error("Error in Golden Shot buy: " + response.message);
        }
    } catch (error) {
        console.error(error);
        throw new Error("Error in Golden Shot buy: " + error.message);
    }
};

const saveSuccessReceipt = async (responseData, token, productId, uid) => {
    try {
        const collName = "purchaseHistory";
        const orderIdSanitized = responseData.payload.orderId.replace(/\./g, '-');
        const docName = Date.now() + "_" + orderIdSanitized;
        const parentPath = "/IAP/google";
        await firestoreManager.createDocument(collName, docName, parentPath, {uid, productId, token, response: responseData});
    } catch (e) {
        console.error("Error in save purchase google IAP: " + e);
    }
};

const getGoldenShotPrice = 99;

const checkCreatorAndSaveReceipt = async (responseData, token, gemsId, uid) => {

    try {

        const userData = await firestoreManager.readDocument("Users", uid, "/");
        const userCreatorCode = userData.creatorCode;

        if (!userCreatorCode || userCreatorCode === "null") {
            return;
        }

        const creatorEmail = await userDataModifier.getEmailOfCreatorCode(userCreatorCode)

        if (!creatorEmail || typeof creatorEmail !== "string") {
            console.log("Unavailable to find or invalid creator Email");
            return;
        }

        const creatorDocName = creatorEmail.replace(/\./g, "<dot>");
        const creatorDoc = await firestoreManager.readDocument("Creator",creatorDocName,"/");

        const total = getGoldenShotPrice ;
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
    goldenShotBuy
};
