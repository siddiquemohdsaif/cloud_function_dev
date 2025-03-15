const express = require('express');
const { gemsBuy } = require('../utils/GoogleIAP/PurchaseHandler/GemsBuyHandler');
const { carromPassBuy } = require('../utils/GoogleIAP/PurchaseHandler/CarromPassBuyHandler');
const { goldenShotBuy } = require('../utils/GoogleIAP/PurchaseHandler/GoldenShotBuyHandler');
const router = express.Router();
const AES = require("../utils/AES_256");
const UserLock = require('../utils/Lock/UserLock');

router.post('/gemsBuy', async (req, res) => {
    try {

        // Extract the necessary data from the request body
        const { UID , productId, purchaseToken } = req.body;

        // Validate the payload
        if (!UID || !productId || !purchaseToken) {
            return res.status(400).json({
                success: false,
                message: 'All required field is not provided.' + UID + productId + purchaseToken
            });
        }


        //check auth uid
        if(UID !== AES.getAuthUid(req)){
            return res.status(401).json({ success: false, message: 'Authorization failed'});
        }

        // Process the gem purchase
        const profileData = await UserLock.getInstance().run(UID, async () => {
            return await gemsBuy(UID, productId, purchaseToken);
        });

        // Respond with the updated profile data
        if (profileData) {
            return res.status(200).json(profileData);
        } else {
            return res.status(400).json({ success: false, message: "Unable to buy gems." });
        }

    } catch (error) {
        console.error("Error in gemsBuy:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



router.post('/carromPassBuy', async (req, res) => {
    try {
        // Extract the necessary data from the request body
        const { UID, purchaseToken } = req.body; // productId is not needed if Carrom Pass has a fixed ID

        // Validate the payload
        if (!UID || !purchaseToken) {
            return res.status(400).json({
                success: false,
                message: 'All required fields are not provided.'
            });
        }

        // Check auth uid
        if (UID !== AES.getAuthUid(req)) {
            return res.status(401).json({ success: false, message: 'Authorization failed' });
        }

        // Process the Carrom Pass purchase
        const profileData = await UserLock.getInstance().run(UID, async () => {
            return await carromPassBuy(UID, purchaseToken);
        });

        // Respond with the updated profile data
        if (profileData) {
            return res.status(200).json(profileData);
        } else {
            return res.status(400).json({ success: false, message: "Unable to activate Carrom Pass." });
        }

    } catch (error) {
        console.error("Error in carromPassBuy:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/goldenShotBuy', async (req, res) => {
    try {

        // Extract the necessary data from the request body
        const { UID , productId, purchaseToken } = req.body;

        // Validate the payload
        if (!UID || !productId || !purchaseToken) {
            return res.status(400).json({
                success: false,
                message: 'All required field is not provided.' + UID + productId + purchaseToken
            });
        }


        //check auth uid
        if(UID !== AES.getAuthUid(req)){
            return res.status(401).json({ success: false, message: 'Authorization failed'});
        }

        // Process the gem purchase
        const profileData = await UserLock.getInstance().run(UID, async () => {
            return await goldenShotBuy(UID, productId, purchaseToken);
        });

        // Respond with the updated profile data
        if (profileData) {
            return res.status(200).json(profileData);
        } else {
            return res.status(400).json({ success: false, message: "Unable to buy golden shot." });
        }

    } catch (error) {
        console.error("Error in goldenShotBuy:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
