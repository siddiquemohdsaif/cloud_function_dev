const FirestoreManager = require("../Firestore/FirestoreManager");
const ChestCache = require('./StaticDocument/Data/Chest');
const ChestHandler = require("./ChestHandler");
const { ConnectionClosedEvent } = require("mongodb");

class UserDataModifier {
  constructor() {
    this.db = FirestoreManager.getInstance();
    this.collName = "Users";
    this.parentPath = "/";
  }

  async limitName(name, maxLength) {
    if (name.length <= maxLength) return name;
    let trimmedName = name.substring(0, maxLength);
    return trimmedName;
  }

  async updateProfileOnLogin(uid, loginAuth, name, photo_url) {
    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Validate username for allowed characters and length
    const validUsernamePattern = /^[a-zA-Z0-9 _-]+$/;
    if (validUsernamePattern.test(name)) {
      document.profileData.userName = await this.limitName(name,14);
    } // If validation fails, the name remains unchanged

    // Update loginAuth field
    document.profileData.userPicture.avatar = photo_url;
    document.profileData.userPicture.loginPhotoUrl = photo_url;
    const updateDoc = { loginAuth: loginAuth, profileData: document.profileData };

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, updateDoc);
      return response;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async getUserProfileAndGameData(uid) {
    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
    return document
  }

  async getUserProfileData(uid) {
    // Read user document
    let document;
    try {
      document = await this.db.bulkReadDocuments(this.collName, this.parentPath, [uid], { profileData: 1 });
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
    return document[0].profileData;
  }

  async getUserGameData(uid) {
    // Read user document
    let document;
    try {
      document = await this.db.bulkReadDocuments(this.collName, this.parentPath, [uid], { gameData: 1 });
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
    return document[0].gameData;
  }


  async updateAvatar(uid, avatarId) {
    // Read user document
    let document;
    let avatarUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      avatarUnlocked = UnlockedDataDoc.avatarUnlocked; // Unlocked Avatar array eg: [{id: 0}, {id: 2}, {id: 5}, {id: 6}]
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if avatarId is unlocked
    if (!avatarUnlocked.some(avatar => avatar.id === avatarId) && avatarId !== -1) {
      throw new Error(`Avatar ID ${avatarId} is not unlocked for this user.`);
    }

    // Update avatar field
    if (avatarId === -1) {
      if (document.profileData.userPicture.loginPhotoUrl === "null") {
        throw new Error(`Avatar ID ${avatarId} is not unlocked for this user, because not login.`);
      }
      document.profileData.userPicture.avatar = document.profileData.userPicture.loginPhotoUrl;
    } else {
      document.profileData.userPicture.avatar = avatarId + ""; //update and converting to string
    }


    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return document; // return updated user profileData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async updateUserName(uid, userName) {
    // Validate username for allowed characters
    const validUsernamePattern = /^[a-zA-Z0-9 _-]+$/;
    if (!validUsernamePattern.test(userName) || userName.length > 15) {
      throw new Error('Invalid username. Allowed characters: a-z, A-Z, 0-9, _, -. Maximum length: 15 characters.');
    }

    // Check if the trimmed username length is at least 4 characters
    if (userName.trim().length < 4) {
      throw new Error('Username must be at least 4 characters long.');
    }

    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    if (document.profileData.nameChangeCount > 0) {
      if (document.gameData.gems >= 100) {
        document.gameData.gems -= 100;
      } else {
        throw new Error(`Not have enough gems to update userName`);
      }
    }


    // Update username field
    document.profileData.userName = userName;
    document.profileData.nameChangeCount += 1;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData, "gameData.gems": document.gameData.gems });
      return document; // return updated user profileData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async addCreatorCode(uid, creatorCode) {
    // Validate username for allowed characters
    const validCreatorCodePattern = /^[a-zA-Z0-9 _-]+$/;
    if (!validCreatorCodePattern.test(creatorCode) || creatorCode.length > 15) {
      throw new Error('Invalid username. Allowed characters: a-z, A-Z, 0-9, _, -. Maximum length: 15 characters.');
    }

    // Check if the trimmed CreatorCode length is at least 4 characters
    if (creatorCode.trim().length < 4) {
      throw new Error('CreatorCode must be at least 4 characters long.');
    }

    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);

      const creatorEmail = await this.getEmailOfCreatorCode(creatorCode);
      if (!creatorEmail || creatorEmail === "null") {
        throw new Error('No such creator code exist.');
      }
      // Update CreatorCode field
      document.creatorCode = creatorCode;


      // Update user document

      await this.db.updateDocument(this.collName, uid, this.parentPath, { "creatorCode": document.creatorCode });
      return document; // return updated user profileData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async removeCreatorCode(uid) {
    try {
      // Read the user document
      const document = await this.db.readDocument(this.collName, uid, this.parentPath);
  
      if (!document) {
        throw new Error(`Document with UID ${uid} not found.`);
      }
  
      // Update the CreatorCode field to null
      document.creatorCode = "null";
  
      // Update the user document in the database
      await this.db.updateDocument(this.collName, uid, this.parentPath, { creatorCode: document.creatorCode });
  
      return document; // Return the updated user profile data
    } catch (error) {
      throw new Error(`Failed to update document for UID ${uid}: ${error.message}`);
    }
  }
  

  async updateFrame(uid, frameId) {
    // Read user document
    let document;
    let frameUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      frameUnlocked = UnlockedDataDoc.frameUnlocked; // Unlocked Frame array eg: [{id: 0}, {id: 2}, {id: 5}, {id: 6}]
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if frameId is unlocked
    if (!frameUnlocked.some(frame => frame.id === frameId)) {
      throw new Error(`Frame ID ${frameId} is not unlocked for this user.`);
    }

    // Update frame field
    document.profileData.userPicture.frame = frameId;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return document; // return updated user profileData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async updateStriker(uid, strikerId) {
    // Read user document
    let document;
    let strikerUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      strikerUnlocked = UnlockedDataDoc.strikerUnlocked; //unlocked strikers array eg: [ { "id": 0, "level": 1, "collected": 0 }, { "id": 3, "level": 1, "collected": 0 } ] , where id == strikerId
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if striker is unlocked , if yes store in selectedStriker variable
    let selectedStriker;
    const striker = strikerUnlocked.find(s => s.id === strikerId);
    if (striker) {
      if (striker.level !== 0) {
        selectedStriker = striker;
      } else {
        throw new Error(`Striker ID ${strikerId} is not unlocked for this user.`);
      }
    } else {
      throw new Error(`Striker ID ${strikerId} is not unlocked for this user.`);
    }


    // Update frame field
    document.gameData.collection.striker = selectedStriker;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.collection": document.gameData.collection });
      return document; // return updated user gameData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }




  async updatePower(uid, powerId) {
    // Read user document
    let document;
    let powerUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      powerUnlocked = UnlockedDataDoc.powerUnlocked; // unlocked powers array eg: [ { "id": 0, "level": 1, "collected": 0 }, { "id": 3, "level": 1, "collected": 0 } ] , where id == powerId
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if power is unlocked, if yes store in selectedPower variable
    let selectedPower;
    const power = powerUnlocked.find(p => p.id === powerId);
    if (power) {
      if (power.level !== 0) {
        selectedPower = power;
      } else {
        throw new Error(`Power ID ${powerId} is not unlocked for this user.`);
      }
    } else {
      throw new Error(`Power ID ${powerId} is not unlocked for this user.`);
    }

    // Update power field
    document.gameData.collection.power = selectedPower;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.collection": document.gameData.collection });
      return document; // return updated user gameData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async updatePuck(uid, puckId) {
    // Read user document
    let document;
    let puckUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      puckUnlocked = UnlockedDataDoc.puckUnlocked; // unlocked pucks array eg: [ { "id": 0, "collected": 0 }, { "id": 3, "collected": 0 } ] , where id == puckId
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if puck is unlocked, if yes store in selectedPuck variable
    let selectedPuck;
    const puck = puckUnlocked.find(p => p.id === puckId);
    if (puck) {
      if (puck.level !== 0) {
        selectedPuck = puck;
      } else {
        throw new Error(`Puck ID ${puckId} is not unlocked for this user.`);
      }
    } else {
      throw new Error(`Puck ID ${puckId} is not unlocked for this user.`);
    }

    // Update puck field
    document.gameData.collection.puck = selectedPuck;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.collection": document.gameData.collection });
      return document; // return updated user gameData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async updateTrail(uid, trailId) {
    // Read user document
    let document;
    let trailUnlocked;
    let UnlockedDataDoc;
    try {
      [document, UnlockedDataDoc] = await Promise.all([
        this.db.readDocument(this.collName, uid, this.parentPath),
        this.db.readDocument('UnlockData', uid, 'Data/UserData/')
      ]);

      trailUnlocked = UnlockedDataDoc.trailUnlocked;
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Check if trail is unlocked, if yes store in selectedTrail variable
    let selectedTrail;
    const trail = trailUnlocked.find(p => p.id === trailId);
    if (trail) {
      if (trail.level !== 0) {
        selectedTrail = trail;
      } else {
        throw new Error(`Trail ID ${trailId} is not unlocked for this user.`);
      }
    } else {
      throw new Error(`Trail ID ${trailId} is not unlocked for this user.`);
    }


    // Update Trail field
    document.gameData.collection.trail = selectedTrail;

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.collection": document.gameData.collection });
      return document; // return updated user gameData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async updateNewClanJoin(uid, clanId) {
    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Validate clanId is null means its logout or not , it required to logout before join any clan.
    if (document.profileData.clanId == "null") {
      //now join the clan
      document.profileData.clanId = clanId; //joined to that clan
    } else {
      throw new Error(`It already joined other clan!`);
    }

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return document;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async updateLogoutClan(uid) {
    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    document.profileData.clanId = "null"; //logout to that clan

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return document;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async leaveClan(uid) {
    // Read user document
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    const leavedClan = document.profileData.clanId;

    if (leavedClan == "null") {
      throw new Error(`already leaved clan`);
    }

    document.profileData.clanId = "null"; //logout to that clan

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return { profileAndGamedata: document, leavedClan };
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }




  isSameDayInTimeZone(timestamp1, timestamp2, timeZone) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: timeZone };

    const date1String = new Intl.DateTimeFormat('en-US', options).format(timestamp1);
    const date2String = new Intl.DateTimeFormat('en-US', options).format(timestamp2);

    return date1String === date2String;
  }


  async collectCoinsAndRewards(uid, isAd) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    const now = Date.now();
    const freeCoinData = document.gameData.freeCoin;

    if (now - freeCoinData.lastOpen >= freeCoinData.duration * 1000 && isAd === "false") {
      const rewards = ['reward1', 'reward2', 'reward3', 'reward4'];
      if (!this.isSameDayInTimeZone(now, freeCoinData.lastOpen, "Asia/Kolkata")) {
        rewards.forEach(rewardKey => {
          freeCoinData.collected[rewardKey] = false;
        });
      }

      let collected = false;
      for (const rewardKey of rewards) {
        if (!freeCoinData.collected[rewardKey]) {
          const rewardIndex = rewardKey.slice(-1); // Extract the number from the key
          const { type, reward } = freeCoinData.free[`reward${rewardIndex}`];
          if (type === "coins") {
            document.gameData.coins += reward;
          }
          freeCoinData.collected[rewardKey] = true;
          collected = true;
          break;
        }
      }

      if (!collected) {
        throw new Error("All rewards have already been collected today.");
      }

      if (freeCoinData.collected.reward4) {
        const nextDay = new Date(now);
        nextDay.setHours(24, 0, 0, 0);
        freeCoinData.lastOpen = nextDay.getTime() - freeCoinData.duration * 1000;
      } else {
        freeCoinData.lastOpen = now;
      }

      try {
        await this.db.updateDocument(this.collName, uid, this.parentPath, {
          "gameData.coins": document.gameData.coins,
          "gameData.freeCoin": document.gameData.freeCoin,
        });
        return document;
      } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }

    } else if (isAd === "true") {
      const adRewards = ['adReward1', 'adReward2', 'adReward3', 'adReward4'];
      // console.log(now);
      // console.log(freeCoinData.nextAdRewardCollect);
      // console.log(now >= freeCoinData.nextAdRewardCollect);
      if (now >= freeCoinData.nextAdRewardCollect) {
        adRewards.forEach(rewardKey => {
          freeCoinData.collected[rewardKey] = false;
        });
        // Get the current date and time in the Asia/Kolkata timezone
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

        // Create a new Date object for the next day in the Kolkata timezone
        const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

        freeCoinData.nextAdRewardCollect = nextDay.getTime() - nextDay.getTimezoneOffset() * 60 * 1000;
      }

      let collected = false;
      for (const rewardKey of adRewards) {
        if (!freeCoinData.collected[rewardKey]) {
          const rewardIndex = rewardKey.slice(-1);
          const { type, reward } = freeCoinData.adReward[`reward${rewardIndex}`];
          if (type === "coins") {
            document.gameData.coins += reward;
          } else if (type === "gems") {
            document.gameData.gems += reward;
          } else if (type.endsWith("_chest")) {
            const chestData = await ChestCache.get();
            const chestType = type.toUpperCase();
            const chestDetail = chestData.ChestInfo[chestType];
            const chest = await ChestHandler.generateChest(uid, chestType, chestDetail, chestData.CardConstraint, chestData.SplitInfo, chestData.cardExchangeCoin);
            document.gameData.chestData.currentOpenChest = chest;
          }
          freeCoinData.collected[rewardKey] = true;
          collected = true;
          break;
        }
      }

      if (!collected) {
        throw new Error("All rewards have already been collected today.");
      }

      try {
        await this.db.updateDocument(this.collName, uid, this.parentPath, {
          "gameData.coins": document.gameData.coins,
          "gameData.gems": document.gameData.gems,
          "gameData.chestData.currentOpenChest": document.gameData.chestData.currentOpenChest,
          "gameData.freeCoin": document.gameData.freeCoin,
        });
        return document;
      } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }

    } else {
      throw new Error("Not enough time has passed to collect coins.");
    }
  }



  async getLuckyShot(uid) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    const now = Date.now();
    const luckyShot = document.gameData.luckyShot;

    // Check if the time elapsed since lastOpen is greater than or equal to duration.
    if (now - luckyShot.lastOpen >= luckyShot.duration * 1000) {

      const luckyShotsDoc = await this.db.readDocument("Data", "LuckyShot", "/");
      const level = luckyShotsDoc.level1;

      // Pick a random shot from level1 array
      const randomIndex = Math.floor(Math.random() * level.length);
      const randomShot = level[randomIndex];


      try {
        return randomShot; // Return the lyckyshot
      } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }
    } else {
      throw new Error("Not enough time has passed to play lucky Shot.");
    }
  }


  async playedLuckyShot(uid, playedResult, isGoldenShot) {
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    const xp = document.gameData.xp.x;
    const now = Date.now();
    const luckyShot = document.gameData.luckyShot;

    // Function to handle rewards
    const giveReward = async () => {
      const luckyShotRewardsDoc = await this.db.readDocument("Data", "LuckyShotRewards", "/");
      // console.log(luckyShotRewardsDoc);
      const rewardsArray = isGoldenShot ? luckyShotRewardsDoc.GoldenShotReward : luckyShotRewardsDoc.FreeReward;
      // console.log(rewardsArray);
      const reward = rewardsArray[playedResult - 1];
      if (reward == undefined) {
        return;
      }
      // console.log(reward);
      if (reward.type === 'coins') {
        document.gameData.coins += reward.unit;
      } else if (reward.type === 'gems') {
        document.gameData.gems += reward.unit;
      }
    };

    // Function to update random shot from lucky shot document
    const updateRandomShot = async () => {
      const luckyShotsDoc = await this.db.readDocument("Data", "LuckyShot", "/");
      const levelKey = await this.evaluateLevelFromXp(xp);
      const level = luckyShotsDoc[levelKey];
      const randomIndex = Math.floor(Math.random() * level.length);
      luckyShot.randomShot = level[randomIndex];
    };

    // Function to update user document
    const updateUserDocument = async () => {
      try {
        await this.db.updateDocument(this.collName, uid, this.parentPath, {
          "gameData.coins": document.gameData.coins,
          "gameData.gems": document.gameData.gems,
          "gameData.luckyShot": document.gameData.luckyShot,
        });
        return document; // Return updated profile
      } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }
    };

    // Golden Shot
    if (isGoldenShot && luckyShot.goldenExtra > 0) {
      luckyShot.goldenExtra--;
      await giveReward();
      await updateRandomShot();
      return await updateUserDocument();
    }

    // console.log(luckyShot.extra)
    // Regular Shot
    if (!isGoldenShot && luckyShot.extra > 0) {
      luckyShot.extra--;
      await giveReward();
      await updateRandomShot();
      return await updateUserDocument();
    }

    // Time-based Lucky Shot
    if (now - luckyShot.lastOpen >= luckyShot.duration * 1000) {
      await giveReward();
      luckyShot.lastOpen = now; // Update last open time
      await updateRandomShot();
      return await updateUserDocument();
    } else {
      throw new Error("Not enough time has passed to play Lucky Shot.");
    }
  }

  // Function to determine the level based on XP probability
  /**
   * 
   * Test results: {
      '0': { level1: 615, level2: 385, level3: 0 },
      '10': { level1: 570, level2: 374, level3: 56 },
      '20': { level1: 523, level2: 368, level3: 109 },
      '30': { level1: 501, level2: 342, level3: 157 },
      '40': { level1: 513, level2: 303, level3: 184 },
      '50': { level1: 441, level2: 292, level3: 267 },
      '60': { level1: 387, level2: 280, level3: 333 },
      '70': { level1: 415, level2: 259, level3: 326 },
      '80': { level1: 361, level2: 246, level3: 393 },
      '90': { level1: 327, level2: 230, level3: 443 },
      '100': { level1: 272, level2: 214, level3: 514 }
    }
   */
  async evaluateLevelFromXp(xp) {
    const randomNumber = Math.random() * 100; // Number between 0 and 100
    if (randomNumber < xp * 0.5) { // Higher XP, higher chance for level3
      return 'level3';
    } else if (randomNumber < xp * 0.3 + 40) { // Moderate chance for level2
      return 'level2';
    } else {
      return 'level1'; // Default to level1
    }
  }


  async updateGems(uid, gemsToAdd) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    document.gameData.gems += gemsToAdd;

    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.gems": document.gameData.gems });
      return document; // Return the updated profile
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async updateCoinsAndGems(uid, coinsToAdd, gemsToAdd) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    document.gameData.gems += gemsToAdd;
    document.gameData.coins += coinsToAdd;

    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.coins": document.gameData.coins, "gameData.gems": document.gameData.gems });
      return document; // Return the updated profile
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async activateCarromPass(uid) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Set the carromPass.isPremiumMember flag to true
    document.gameData.carromPass.isPremiumMember = true;

    try {
      // Update the document in the database
      await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.carromPass.isPremiumMember": document.gameData.carromPass.isPremiumMember });
      return document; // Return the updated profile
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async activateGoldenShot(uid) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    document.gameData.luckyShot.goldenExtra += 3;

    try {
      // Update the document in the database
      await this.db.updateDocument(this.collName, uid, this.parentPath, { "gameData.luckyShot.goldenExtra": document.gameData.luckyShot.goldenExtra });
      return document; // Return the updated profile
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async uploadGamePlayLink(uid, link) {
    try {
      const videoId = await this.extractVideoId(link);
      //console.log("Video ID:", videoId);

      let documentFound = false;

      try {
        const document = await this.db.readDocument("GamePlayUploaded", videoId, "Data/Event");
        if (document) {
          documentFound = true;
        }

      } catch (error) {
        //document not found
      }

      if (!documentFound) {
        const result = await this.db.createDocument("GamePlayUploaded", videoId, "Data/Event", { uid, videoId, uploadedAt: Date.now() });
        return result;
      } else {
        return false;
      }

    } catch (error) {
      console.error("Error extracting video ID:", error.message);
    }
  }

  async extractVideoId(url) {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname === 'youtu.be') {
        // Handle short URLs like https://youtu.be/WIPrN6VTP48
        return parsedUrl.pathname.slice(1);
      } else if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
        // Handle full URLs like https://www.youtube.com/watch?v=ZoId_-DT8AQ
        const videoId = parsedUrl.searchParams.get("v");
        if (videoId) {
          return videoId;
        }
        // Handle URLs like https://www.youtube.com/v/ZoId_-DT8AQ and https://www.youtube.com/embed/ZoId_-DT8AQ
        const pathMatch = parsedUrl.pathname.match(/^\/(v|embed)\/([^/?&]+)/);
        if (pathMatch && pathMatch[2]) {
          return pathMatch[2];
        }
      }
      throw new Error("Unable to extract video ID from URL");
    } catch (error) {
      throw new Error("Invalid URL");
    }
  }


  async sendReview(uid, stars, review, cc_id) {
    try {

      const timestamp = Math.floor(Date.now() / 1000); // Generate a timestamp in seconds

      const contactDocument = {
        "CC-ID": cc_id,
        Email: "null",
        Subject: `Review by User ${uid} with ${stars} Stars`,
        Message: review,
        Timestamp: timestamp
      };

      const documentId = contactDocument.Timestamp + contactDocument["CC-ID"];

      const result = await this.db.createDocument("ContactUs", documentId, "/", contactDocument);

      return result;

    } catch (error) {
      console.error("Error in sending review:", error.message);
    }
  }

  async updateLastSeen(uid, lastSeen) {
    // Fetch the user's data.
    let document;
    try {
      document = await this.db.readDocument(this.collName, uid, this.parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    document.lastSeen = lastSeen;

    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { "lastSeen": document.lastSeen });
      // console.log(lastSeen);
      // console.log(document);
      return document; // Return the updated profile
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


  async getEmailOfCreatorCode(userCreatorCode) {
    try {
      const creatorData = await this.db.readDocument("Creator", "admin", "/");
      const creatorVerifiedList = creatorData.creatorVerifiedList;

      // Trim any extra spaces from userCreatorCode
      const code = userCreatorCode.trim();

      // Find the email corresponding to the creator code
      for (const email in creatorVerifiedList) {
        if (creatorVerifiedList[email] === code) {
          return email; // Return the email if found
        }
      }

      return null; // Return null if no match is found
    } catch (e) {
      console.error("Error getting creatorEmail" + e)
    }

  }

  
  async analytics(uid, deviceId,appOpenTime,appCloseTime,adsShown,purchaseMade) {
    // Read user document
    let document;
    
    try {
        document =  this.db.readDocument(this.collName, uid, this.parentPath)
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Update user document
    try {
      const response = await this.db.updateDocument(this.collName, uid, this.parentPath, { profileData: document.profileData });
      return document; // return updated user profileData
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }


}

module.exports = UserDataModifier;