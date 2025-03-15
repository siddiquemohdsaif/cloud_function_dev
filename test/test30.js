class MockDB {
    constructor() {
        this.documents = {
            'users': {},
            'UnlockData': {}
        };
    }

    async readDocument(collName, uid, parentPath) {
        if (!this.documents[collName][uid]) {
            throw new Error(`Document not found: ${collName}/${uid}`);
        }
        return this.documents[collName][uid];
    }

    async updateDocument(collName, uid, parentPath, updateDoc) {
        if (!this.documents[collName][uid]) {
            throw new Error(`Document not found: ${collName}/${uid}`);
        }
        this.documents[collName][uid] = { ...this.documents[collName][uid], ...updateDoc };
        return this.documents[collName][uid];
    }

    addDocument(collName, uid, doc) {
        this.documents[collName][uid] = doc;
    }
}

const mockDB = new MockDB();
const collName = 'users';
const parentPath = '';

// Add a sample user document
mockDB.addDocument(collName, 'user123', {
    profileData: {
        userName: 'OldName',
        userPicture: {
            avatar: 'oldAvatarUrl',
            loginPhotoUrl: 'oldLoginPhotoUrl'
        }
    }
});

// Define the function to be tested
async function updateProfileOnLogin(uid, loginAuth, name, photo_url) {
    // Read user document
    let document;
    try {
        document = await mockDB.readDocument(collName, uid, parentPath);
    } catch (error) {
        throw new Error(`Failed to read document: ${error.message}`);
    }

    // Validate username for allowed characters and length
    const validUsernamePattern = /^[a-zA-Z0-9 _-]+$/;
    if (validUsernamePattern.test(name) && name.length <= 15 && name.trim().length >= 4) {
        document.profileData.userName = name;
    } // If validation fails, the name remains unchanged

    // Update loginAuth and photo fields
    document.profileData.userPicture.avatar = photo_url;
    document.profileData.userPicture.loginPhotoUrl = photo_url;
    const updateDoc = { loginAuth: loginAuth, profileData: document.profileData };

    // Update user document
    try {
        const response = await mockDB.updateDocument(collName, uid, parentPath, updateDoc);
        return response;
    } catch (error) {
        throw new Error(`Failed to update document: ${error.message}`);
    }
}

// Test cases
(async () => {
    // Test case 1: Valid username and photo_url
    try {
        const result1 = await updateProfileOnLogin('user123', 'auth123', 'NewUser', 'newPhotoUrl');
        console.log('Test case 1 passed:', result1);
    } catch (error) {
        console.log('Test case 1 failed:', error.message);
    }

    // Test case 2: Invalid username (too short)
    try {
        const result2 = await updateProfileOnLogin('user123', 'auth123', 'Nu', 'newPhotoUrl2');
        console.log('Test case 2 passed:', result2);
    } catch (error) {
        console.log('Test case 2 failed:', error.message);
    }

    // Test case 3: Invalid username (special characters)
    try {
        const result3 = await updateProfileOnLogin('user123', 'auth123', 'New@User!', 'newPhotoUrl3');
        console.log('Test case 3 passed:', result3);
    } catch (error) {
        console.log('Test case 3 failed:', error.message);
    }

    // Test case 4: Valid photo_url and unchanged username
    try {
        const result4 = await updateProfileOnLogin('user123', 'auth123', 'dtgfrht', 'newPhotoUrl4');
        console.log('Test case 4 passed:', result4);
    } catch (error) {
        console.log('Test case 4 failed:', error.message);
    }
})();
