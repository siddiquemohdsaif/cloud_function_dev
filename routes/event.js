const express = require('express');
const router = express.Router();
const AES = require("../utils/AES_256");
const GameEventHandler = require('../utils/GameEventHandler');

router.post("/joinEvent",async(req,res)=>{
    try {
        const UID = req.body.UID;
        const eventId = req.body.eventId;
        const trophy = req.body.trophy;

        // Validation for undefined or null values
        if (UID == null || eventId == null || trophy == null ) {
            return res.status(400).json({ success: false, message: 'One or more required fields are undefined or null' });
        }

        //check auth uid
        if (UID !== AES.getAuthUid(req)) {
            return res.status(401).json({ success: false, message: 'Authorization failed' });
        }

        const response = await GameEventHandler.joinEvent(UID,trophy,eventId);
        if(response.success){
            return res.status(200).json(response);
        }else{
            return res.status(400).json(response);
        }

    } catch (error) {
        console.error("Error in game-over :", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});


router.post("/getEventTopPlayers",async(req,res)=>{
    try {

        const UID = req.body.UID;
        const eventId = req.body.eventId;

        // Validation for undefined or null values
        if (UID == null || eventId == null) {
            return res.status(400).json({ success: false, message: 'One or more required fields are undefined or null' });
        }

        //check auth uid
        if (UID !== AES.getAuthUid(req)) {
            return res.status(401).json({ success: false, message: 'Authorization failed' });
        }

        const response = await GameEventHandler.getTopPlayerofEvent(UID, eventId);
        if(response.success){
            return res.status(200).json(response);
        }else{
            return res.status(400).json(response);
        }

    } catch (error) {
        console.error("Error in eventData :", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});


router.post("/claimReward",async(req,res)=>{
    try {

        const UID = req.body.UID;
        const resultKey = req.body.resultKey;
        const details = req.body.details;


        // Validation for undefined or null values
        if (UID == null || resultKey  == null) {
            return res.status(400).json({ success: false, message: 'One or more required fields are undefined or null' });
        }

        //check auth uid
        if (UID !== AES.getAuthUid(req)) {
            return res.status(401).json({ success: false, message: 'Authorization failed' });
        }

        const response = await GameEventHandler.claimReward(UID, resultKey, details);
        if(response.success){
            return res.status(200).json(response.resultAndReward);
        }else{
            return res.status(400).json(response);
        }

    } catch (error) {
        console.error("Error in eventData :", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;