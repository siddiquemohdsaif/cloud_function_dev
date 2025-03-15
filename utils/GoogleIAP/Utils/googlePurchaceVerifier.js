const { androidpublisher } = require('@googleapis/androidpublisher');
const { JWT } = require('google-auth-library');

class Verifier {
    constructor(options) {
        // Service Account Configuration
        this.jwtClient = new JWT(
            options.clientEmail,
            null,
            options.privateKey,
            ['https://www.googleapis.com/auth/androidpublisher'],
        );

        this.playDeveloperApi = androidpublisher('v3');
    }

    async verifyINAPP(receipt) {
        try {
            await this.jwtClient.authorize();
            const result = await this.playDeveloperApi.purchases.products.get({
                auth: this.jwtClient,
                packageName: receipt.packageName,
                productId: receipt.productId,
                token: receipt.purchaseToken,
            });

            if (result.data && result.data.purchaseState === 0) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: result.data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "The purchase token does not match the product ID.",
                    payload: null
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }

    async verifySub(receipt) {
        try {
            await this.jwtClient.authorize();
            const result = await this.playDeveloperApi.purchases.subscriptions.get({
                auth: this.jwtClient,
                packageName: receipt.packageName,
                subscriptionId: receipt.productId,
                token: receipt.purchaseToken,
            });

            if (result.data) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: result.data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "The subscription token is invalid.",
                    payload: null
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }
 
    async consumePurchase(packageName, productId, purchaseToken) { // currently it implemented in client/app
        try {
            await this.jwtClient.authorize();
            const consumeResult = await this.playDeveloperApi.purchases.products.consume({
                auth: this.jwtClient,
                packageName: packageName,
                productId: productId,
                token: purchaseToken,
            });

            if (consumeResult.status === 200) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: consumeResult.data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "Failed to consume the purchase.",
                    payload: null
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }

    async acknowledgePurchase(packageName, productId, purchaseToken) { // currently it implemented in client/app
        try {
            await this.jwtClient.authorize();
            const acknowledgeResult = await this.playDeveloperApi.purchases.products.acknowledge({
                auth: this.jwtClient,
                packageName: packageName,
                productId: productId,
                token: purchaseToken,
            });

            if (acknowledgeResult.status === 200) {
                return {
                    isSuccessful: true,
                    errorMessage: null,
                    payload: acknowledgeResult.data
                };
            } else {
                return {
                    isSuccessful: false,
                    errorMessage: "Failed to acknowledge the purchase.",
                    payload: null
                };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }


    _handleError(error) {
        console.error('Error verifying purchase:', error);
        let errorMessage = 'Unknown error occurred.';
        
        // Handle common errors
        if (error.code === 404) {
            errorMessage = "The purchase token was not found.";
        } else if (error.message.includes('Invalid JWT Signature')) {
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

module.exports = Verifier;


 