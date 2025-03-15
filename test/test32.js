const axios = require('axios');

async function verifyFacebookToken(accessToken,userId) {
    const appId = '451633481200901';
    const appSecret = '1e1991e0c742376c6950fbebead7ccce';
    try {
        const response = await axios.get(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`);
        if (response.data.data.is_valid && response.data.data.user_id === userId) {
            console.log('Token is valid');
            // Token is valid and we can retrieve user information here if necessary\
            console.log(response.data.data);
            return response.data.data;
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Error verifying Facebook token:', error);
        throw error;
    }
}

const token = "EAAGawh03NQUBOZBNKt7ZBtps3PYZAeWdd6FdJeCRK0tbQkKZAArHOMVxWSJIQmXPaDvHuMlM0FGsU1xgFrWeVsPGU0z1A1E2PcTFKh0ZBrZBdwLNJIIqOHON6YxZCr6NAYCiyQMcd70ymrdnNvTZAQQR5n9KhlbuNmQwpT4e4xVEHuuq3HCcEgOhLe1x50BaQJxMaNPirF9ShAU8ZBqMzZA6uQZBQVIzoh49TVvCXTHOtpZBZC4Wq3klqSgZDZD";
const userId = "1043859067332884";
verifyFacebookToken(token,userId);