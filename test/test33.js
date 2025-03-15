const axios = require('axios');

const accessToken = "EAAGawh03NQUBOZBNKt7ZBtps3PYZAeWdd6FdJeCRK0tbQkKZAArHOMVxWSJIQmXPaDvHuMlM0FGsU1xgFrWeVsPGU0z1A1E2PcTFKh0ZBrZBdwLNJIIqOHON6YxZCr6NAYCiyQMcd70ymrdnNvTZAQQR5n9KhlbuNmQwpT4e4xVEHuuq3HCcEgOhLe1x50BaQJxMaNPirF9ShAU8ZBqMzZA6uQZBQVIzoh49TVvCXTHOtpZBZC4Wq3klqSgZDZD"; // User's access token

axios.get(`https://graph.facebook.com/v15.0/me`, {
    params: {
        fields: 'name,email', // Specify the fields you need
        access_token: accessToken
    }
})
.then(response => {
    const profile_url = "//graph.facebook.com/"+response.data.id+"/picture?type=large&access_token=$";
    response.data.profile_url = profile_url;
    console.log('User Data:', response.data);
})
.catch(error => {
    console.error('Error fetching user data:', error);
});