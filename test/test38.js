const Verifier = require('../utils/GoogleIAP/Utils/googlePurchaceVerifier.js'); // Assuming Verifier is the class you have shown earlier

require('dotenv').config();

const verifierOptions = {
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};
const verifier = new Verifier(verifierOptions);

const packageName = process.env.PACKAGE_NAME;


const check= async (pt) => {
    try {
        const receipt = {
            packageName,
            productId: "gems.100",
            purchaseToken: pt
        };
        
        const response = await verifier.verifyINAPP(receipt);

        console.error(response);
    } catch (error) {
        console.error(error);
        throw new Error("Error in GEMS buy: " + error.message);
    }
}

check("flfjlmampbaajbhfkidckjkm.AO-J1Ox9-r-RavER-It-1gaRCw1hVvoNEgiHI0vff-fduFNGjiVjOML8gd62gds3FmuKWKS5jI4iDqvkYrKUbNm22S0YHcR_GQ")