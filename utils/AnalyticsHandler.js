const FirestoreManager = require("../Firestore/FirestoreManager");

class AnalyticsHandler {
  constructor() {
    this.db = FirestoreManager.getInstance();
    this.collName = "Analytics";
    this.parentPath = "/";
  }

  async analytics(uid, deviceId, appOpenTime, appCloseTime, adsShown, purchaseMade) {
    // console.log(`uid: ${uid} deviceId: ${deviceId} appOpenTime: ${appOpenTime} appCloseTime: ${appCloseTime} adsShown: ${adsShown} purchaseMade: ${purchaseMade}`);
    // console.log(adsShown)
    let document;

    // Read user document
    try {
        document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
        throw new Error(`Failed to read document: ${error.message}`);
    }

    delete document._id;
    // Update deviceId, appOpenTime, and appCloseTime directly
    document.deviceId = deviceId;
    document.appOpenTime = appOpenTime;
    document.appCloseTime = appCloseTime;

    // Calculate duration in minutes and update document
    if (appCloseTime && appOpenTime) {
      const duration = (appCloseTime - appOpenTime) / 60000; // Convert milliseconds to minutes
      document.duration_min = (document.duration_min || 0) + Math.abs(duration); // Use Math.abs to ensure no negative durations
    }

    // Ensure adsShown and purchaseMade are initialized as arrays if not present
    document.adsShown = document.adsShown || [];
    document.purchaseMade = document.purchaseMade || [];

    // Process and merge adsShown
    document.adsShown = this.mergeAndSumArrays(document.adsShown, adsShown);

    // Process and merge purchaseMade
    document.purchaseMade = this.mergeAndSumArrays(document.purchaseMade, purchaseMade);

    // Update user document
    try {
        await this.db.updateDocument(this.collName, uid, this.parentPath, document);
        return document; // Return updated user profile data
    } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  // Function to merge and sum arrays of objects
  mergeAndSumArrays(existingArr, newArr) {
    newArr.forEach(newItem => {
      let found = existingArr.some((existingItem, index) => {
        if (existingItem.id === newItem.id) {
          Object.keys(newItem).forEach(key => {
            if (key !== 'id') {
              existingArr[index][key] = (existingArr[index][key] || 0) + newItem[key];
            }
          });
          return true;
        }
        return false;
      });
      if (!found) existingArr.push(newItem);
    });
    return existingArr;
  }
}

module.exports = AnalyticsHandler;
