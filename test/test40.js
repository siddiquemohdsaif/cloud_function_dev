const FirestoreManager = require('./../Firestore/FirestoreManager')
const db = FirestoreManager.getInstance();
const collName = "Users";
const parentPath = "/";


const updateProfileOnLogin = async(uid, loginAuth, name, photo_url) => {
    // Read user document
    let document;
    try {
      document = await db.readDocument(collName, uid, parentPath);
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }

    // Validate username for allowed characters and length
    const validUsernamePattern = /^[a-zA-Z0-9 _-]+$/;
    if (validUsernamePattern.test(name) ) {
        console.log(name)
        document.profileData.userName = await limitName(name,14);
    } // If validation fails, the name remains unchanged


    // Update loginAuth field
    // document.profileData.userName = await limitName(name,name);
    document.profileData.userPicture.avatar = photo_url;
    document.profileData.userPicture.loginPhotoUrl = photo_url;
    const updateDoc = { loginAuth: loginAuth, profileData: document.profileData };

    console.log(updateDoc);
    // Update user document
    try {
    //   const response = await db.updateDocument(collName, uid, parentPath, updateDoc);
    //   return response;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  const limitName= async (name, maxLength) => {
    if (name.length <= maxLength) return name;
    let trimmedName = name.substring(0, maxLength);
    return trimmedName;
  }


  updateProfileOnLogin("9h5pjGon2eLh1hlu","guest_9h5pjGon2eLh1hlu","gdhgvsdhjghjsdhgfjafghsdfgsdgdf","https://graph.facebook.com/628274962903896/picture?type=large&access_token=$");