const express = require('express');
const AES = require("./utils/AES_256");
const app = express();
const port = process.env.PORT || 3100;

// Import routes
const healthCheck = require('./routes/healthCheck');
const guestLogin = require('./routes/guestLogin');
const googleLogin = require('./routes/googleLogin');
const changeAvatar = require('./routes/changeAvatar');
const changeFrame = require('./routes/changeFrame');
const changeUserName = require('./routes/changeUserName.js');
const changeCreatorCode = require('./routes/changeCreatorCode.js');
const changeStriker = require('./routes/changeStriker');
const changePower = require('./routes/changePower');
const changePuck = require('./routes/changePuck');
const changeTrail = require('./routes/changeTrail');
const clan = require('./routes/clan');
const getUserData = require('./routes/getUserData');
const leaderBoard = require('./routes/leaderBoard');
const collectCoins = require('./routes/collectCoins');
const luckyShot = require('./routes/luckyShot');
const uploadGamePlayLink = require('./routes/uploadGamePlayLink');
const sendReview = require('./routes/sendReview');
const googleIAP = require('./routes/googleIAP');
const shop = require('./routes/shop');
const cardUpgrade = require('./routes/cardUpgrade');
const gamePlayServer = require('./routes/gamePlayServer');
const clanWarServer = require('./routes/clanWarServer');
const backBoneServer = require('./routes/backBoneServer');
const seasonServer = require('./routes/seasonServer');
const InternalServerAPIs = require('./routes/InternalServerAPIs');
const carromPass = require('./routes/carromPass');
const league = require('./routes/league');
const profile = require('./routes/profile');
const friends = require('./routes/friends');
const pushNotification = require('./routes/pushNotification');
const event = require('./routes/event');
const cardBuy = require('./routes/cardBuy');
const facebookLogin = require('./routes/facebookLogin');
const checkFBExists = require('./routes/checkFBExists');
const analytics = require('./routes/analytics.js');


app.use(express.json());

// Use routes without authorization
app.use('/healthCheck', healthCheck);
app.use('/loginAsGuest', guestLogin);
app.use('/loginAsGoogle', googleLogin);
app.use('/gamePlayServer', gamePlayServer);
app.use('/clanWarServer', clanWarServer);
app.use('/backBoneServer', backBoneServer);
app.use('/seasonLeaderboardServer', leaderBoard);
app.use('/seasonServer', seasonServer);
app.use('/InternalServerAPIs', InternalServerAPIs);
app.use('/loginFromFacebook',facebookLogin);
app.use('/checkFBExists',checkFBExists);
app.use('/backBoneServer/pushNotification', pushNotification);


// Authorization middleware
const authMiddleware = (req, res, next) => {
    if (!AES.validateEncryptedCredentialByHeader(req)) {
        return res.status(401).json({ success: false, message: 'Authorization failed' });
    }
    next();
};


// Grouped routes that require authorization
const authorizedRoutes = express.Router();
authorizedRoutes.use(authMiddleware); // Apply the middleware

authorizedRoutes.use('/changeAvatar', changeAvatar);
authorizedRoutes.use('/changeFrame', changeFrame);
authorizedRoutes.use('/changeUserName', changeUserName);
authorizedRoutes.use('/changeCreatorCode',changeCreatorCode)
authorizedRoutes.use('/changeStriker', changeStriker);
authorizedRoutes.use('/changePower', changePower);
authorizedRoutes.use('/changePuck', changePuck);
authorizedRoutes.use('/changeTrail', changeTrail);
authorizedRoutes.use('/clan', clan);
authorizedRoutes.use('/getUserData', getUserData);
authorizedRoutes.use('/leaderBoard', leaderBoard);
authorizedRoutes.use('/collectCoins', collectCoins);
authorizedRoutes.use('/luckyShot', luckyShot);
authorizedRoutes.use('/uploadGamePlayLink', uploadGamePlayLink);
authorizedRoutes.use('/sendReview', sendReview);
authorizedRoutes.use('/googleIAP', googleIAP);
authorizedRoutes.use('/shop', shop);
authorizedRoutes.use('/cardUpgrade', cardUpgrade);
authorizedRoutes.use('/carromPass', carromPass);
authorizedRoutes.use('/league', league);
authorizedRoutes.use('/profile', profile);
authorizedRoutes.use('/friends', friends);
authorizedRoutes.use('/pushNotification', pushNotification);
authorizedRoutes.use('/event', event);
authorizedRoutes.use('/cardBuy', cardBuy);
authorizedRoutes.use('/analytics', analytics);

app.use('/', authorizedRoutes); // Use the grouped routes

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
