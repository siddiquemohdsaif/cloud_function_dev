const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');

class FCMPushNotification {
    constructor(options) {
        // Service Account Configuration
        this.jwtClient = new JWT(
            options.clientEmail,
            null,
            options.privateKey,
            ['https://www.googleapis.com/auth/firebase.messaging']
        );
    }

    async sendNotification(token, body, title) {
        try {
            // Authorize the JWT client
            const response = await this.jwtClient.authorize();
            const accessToken = response.access_token;

            // Define the notification payload
            const message = {
                message: {
                    token: token,
                    data: {
                        title: title,
                        body: body
                    }
                }
            };

            // Send the notification
            const result = await fetch('https://fcm.googleapis.com/v1/projects/carrom-clash-e2a73/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const data = await result.json();

            if (result.ok) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "Failed to send notification.",
                    payload: data
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }
    
    async sendNotificationToAll(body, title) {
        try {
            // Authorize the JWT client
            const response = await this.jwtClient.authorize();
            const accessToken = response.access_token;

            // Define the notification payload
            const message = {
                message: {
                    topic: "allUsers",
                    data: {
                        title: title,
                        body: body
                    }
                }
            };

            // Send the notification
            const result = await fetch('https://fcm.googleapis.com/v1/projects/carrom-clash-e2a73/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const data = await result.json();

            if (result.ok) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "Failed to send notification.",
                    payload: data
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }

    async sendNotificationToTopic(body, title, topic) {
        try {
            // Authorize the JWT client
            const response = await this.jwtClient.authorize();
            const accessToken = response.access_token;

            // Define the notification payload
            const message = {
                message: {
                    topic: topic,
                    data: {
                        title: title,
                        body: body
                    }
                }
            };

            // Send the notification
            const result = await fetch('https://fcm.googleapis.com/v1/projects/carrom-clash-e2a73/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const data = await result.json();

            if (result.ok) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "Failed to send notification.",
                    payload: data
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }

    _handleError(error) {
        console.error('Error sending notification:', error);
        let errorMessage = 'Unknown error occurred.';
        
        // Handle common errors
        if (error.message.includes('Invalid JWT Signature')) {
            errorMessage = "Invalid JWT Signature.";
        } else if (error.message.includes('insufficient permissions')) {
            errorMessage = "The current user has insufficient permissions to perform the requested operation.";
        }
        // Add more error handling cases if needed

        return {
            isSuccessful: false,
            errorMessage: errorMessage,
            payload: null
        };
    }
}

module.exports = FCMPushNotification;
