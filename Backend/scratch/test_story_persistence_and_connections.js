const db = require('../db');
const homeController = require('../controllers/homeController');
const profileController = require('../controllers/profileController');

async function runTests() {
    console.log('🧪 Starting Story Persistence & Connections Tests...\n');

    try {
        // 1. Create or get test users
        let user1Res = await db.query("SELECT id FROM users WHERE phone_number = '8888880001'");
        let user1Id;
        if (user1Res.rows.length === 0) {
            const ins = await db.query("INSERT INTO users (username, phone_number, image_url) VALUES ('persisted_author', '8888880001', '/uploads/author.jpg') RETURNING id");
            user1Id = ins.rows[0].id;
        } else {
            user1Id = user1Res.rows[0].id;
        }

        let user2Res = await db.query("SELECT id FROM users WHERE phone_number = '8888880002'");
        let user2Id;
        if (user2Res.rows.length === 0) {
            const ins = await db.query("INSERT INTO users (username, phone_number, image_url) VALUES ('persisted_friend', '8888880002', '/uploads/friend.jpg') RETURNING id");
            user2Id = ins.rows[0].id;
        } else {
            user2Id = user2Res.rows[0].id;
        }

        // Clean any existing test stories
        await db.query("DELETE FROM stories WHERE user_id IN ($1, $2)", [user1Id, user2Id]);

        // Establish connection between user1 and user2
        await db.query("DELETE FROM user_connections WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)", [user1Id, user2Id]);
        await db.query("INSERT INTO user_connections (user_id, friend_id, status) VALUES ($1, $2, 'accepted')", [user1Id, user2Id]);

        console.log(`✅ Test users created/found: user1=${user1Id}, user2=${user2Id}`);

        // --- TEST 1: Upload Story for user1 ---
        console.log('\n--- TEST 1: Upload Story ---');
        const uploadReq = {
            user: { id: user1Id },
            body: {
                media_url: '/uploads/persistence_test.jpg',
                media_type: 'image',
                caption: 'Persistence Test Story'
            }
        };
        let uploadResult = null;
        const uploadRes = {
            status: (code) => ({
                json: (data) => { uploadResult = { status: code, ...data }; }
            })
        };

        await homeController.uploadStory(uploadReq, uploadRes);
        if (!uploadResult || uploadResult.status !== 201) {
            throw new Error(`Story upload failed: ${JSON.stringify(uploadResult)}`);
        }
        const createdStoryId = uploadResult.story.id;
        console.log(`✅ Story uploaded successfully. Story ID: ${createdStoryId}`);

        // --- TEST 2: GET /api/home (Simulating first fetch before logout) ---
        console.log('\n--- TEST 2: GET /api/home before logout ---');
        let homeResult1 = null;
        const homeReq1 = { user: { id: user1Id } };
        const homeRes1 = {
            status: (code) => ({
                json: (data) => { homeResult1 = { status: code, ...data }; }
            }),
            json: (data) => { homeResult1 = { status: 200, ...data }; }
        };
        await homeController.getHomeData(homeReq1, homeRes1);

        if (!homeResult1.own_stories || homeResult1.own_stories.length === 0) {
            throw new Error(`Own stories not returned in getHomeData: ${JSON.stringify(homeResult1)}`);
        }
        console.log(`✅ getHomeData returned ${homeResult1.own_stories.length} own stories.`);

        // --- TEST 3: Simulating Logout and Login (Fetching getHomeData & getStories after login) ---
        console.log('\n--- TEST 3: Story Persistence after Logout / Login ---');
        // Multiple calls to simulate re-logging in and navigating through tabs
        let homeResult2 = null;
        const homeReq2 = { user: { id: user1Id } };
        const homeRes2 = {
            status: (code) => ({
                json: (data) => { homeResult2 = { status: code, ...data }; }
            }),
            json: (data) => { homeResult2 = { status: 200, ...data }; }
        };
        await homeController.getHomeData(homeReq2, homeRes2);

        if (!homeResult2.own_stories || homeResult2.own_stories.length === 0) {
            throw new Error(`Story disappeared after simulated logout/login in getHomeData!`);
        }
        console.log(`✅ Story successfully persisted in getHomeData after login! (Story ID: ${homeResult2.own_stories[0].id})`);

        // Check getStories for friend
        let storiesResult = null;
        const storiesReq = { user: { id: user2Id }, query: {} };
        const storiesRes = {
            status: (code) => ({
                json: (data) => { storiesResult = { status: code, ...data }; }
            }),
            json: (data) => { storiesResult = { status: 200, ...data }; }
        };
        await homeController.getStories(storiesReq, storiesRes);

        const friendStory = (storiesResult.stories || []).find(s => s.id == createdStoryId);
        if (!friendStory) {
            throw new Error(`Story disappeared from connected friend feed in getStories!`);
        }
        console.log(`✅ Connected friend sees persisted story in getStories! (Story ID: ${friendStory.id}, Owner: ${friendStory.username})`);

        // --- TEST 4: Connection Profile Pictures ---
        console.log('\n--- TEST 4: Connection Profile Pictures ---');
        let connResult = null;
        const connReq = { user: { id: user1Id } };
        const connRes = {
            status: (code) => ({
                json: (data) => { connResult = { status: code, ...data }; }
            }),
            json: (data) => { connResult = { status: 200, ...data }; }
        };
        await profileController.getConnections(connReq, connRes);

        if (!connResult.connections || connResult.connections.length === 0) {
            throw new Error(`No connections returned from getConnections!`);
        }
        const connectedUser = connResult.connections[0];
        console.log(`✅ getConnections returned connection: ${connectedUser.username}`);
        console.log(`   - profile_image: ${connectedUser.profile_image}`);
        console.log(`   - image_url: ${connectedUser.image_url}`);
        console.log(`   - avatar_url: ${connectedUser.avatar_url}`);

        if (!connectedUser.profile_image || !connectedUser.image_url) {
            throw new Error(`Profile image URL missing from connection object!`);
        }

        // Clean up test data
        await db.query("DELETE FROM stories WHERE id = $1", [createdStoryId]);
        console.log('\n🎉 ALL PERSISTENCE AND CONNECTION TESTS PASSED SUCCESSFULLY!\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

runTests();
