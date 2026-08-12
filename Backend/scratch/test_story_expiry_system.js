const db = require('../db');
const { deactivateExpiredStories, purgeOldExpiredStories } = require('../services/storyExpiryService');
const homeController = require('../controllers/homeController');

async function runExpiryTests() {
    console.log('🧪 ========================================================');
    console.log('🧪 STARTING 24-HOUR STORY EXPIRY SYSTEM VERIFICATION TESTS');
    console.log('🧪 ========================================================');

    let testUser1Id, testUser2Id;
    let story1Id, story2Id;

    try {
        // 1. Setup test users
        const u1 = await db.query(`
            INSERT INTO users (username, phone_number, email)
            VALUES ('expiry_test_user1', '9999999901', 'test1@expiry.com')
            ON CONFLICT (phone_number) DO UPDATE SET username = 'expiry_test_user1'
            RETURNING id
        `);
        testUser1Id = u1.rows[0].id;

        const u2 = await db.query(`
            INSERT INTO users (username, phone_number, email)
            VALUES ('expiry_test_user2', '9999999902', 'test2@expiry.com')
            ON CONFLICT (phone_number) DO UPDATE SET username = 'expiry_test_user2'
            RETURNING id
        `);
        testUser2Id = u2.rows[0].id;

        // Clean up previous stories for test users
        await db.query('DELETE FROM stories WHERE user_id IN ($1, $2)', [testUser1Id, testUser2Id]);

        // =================================================================
        // TEST 1: Upload a New Story & Verify 24-Hour Expiration Timestamps
        // =================================================================
        console.log('\n--- TEST 1: Uploading Story & Verifying 24-Hour Expiration ---');
        const req1 = {
            user: { id: testUser1Id },
            body: {
                media_url: '/uploads/test_story_1.jpg',
                media_type: 'image',
                caption: 'Sunset Vibes'
            }
        };

        let resStatus1, resData1;
        const res1 = {
            status: (s) => { resStatus1 = s; return res1; },
            json: (d) => { resData1 = d; return res1; }
        };

        await homeController.uploadStory(req1, res1);

        if (resStatus1 !== 201 || !resData1.story) {
            throw new Error(`Failed to upload story: status=${resStatus1}, error=${JSON.stringify(resData1)}`);
        }

        story1Id = resData1.story.id;
        const createdAt = new Date(resData1.story.created_at);
        const expiresAt = new Date(resData1.story.expires_at);
        const diffHours = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        console.log(`✅ Story 1 created successfully: ID=${story1Id}`);
        console.log(`   - created_at: ${createdAt.toISOString()}`);
        console.log(`   - expires_at: ${expiresAt.toISOString()}`);
        console.log(`   - Expiration duration: ${diffHours.toFixed(2)} hours (Expected: 24.00)`);
        console.log(`   - is_active: ${resData1.story.is_active !== undefined ? resData1.story.is_active : true}`);

        if (Math.abs(diffHours - 24) > 0.1) {
            throw new Error(`Expected 24 hour expiry duration, got ${diffHours}`);
        }

        // =================================================================
        // TEST 2: Active Story Query Verification (Home and Stories Feed)
        // =================================================================
        console.log('\n--- TEST 2: Active Story Visibility in Feeds ---');

        // Test GET /api/stories
        let storiesResData;
        const storiesRes = {
            status: () => storiesRes,
            json: (d) => { storiesResData = d; return storiesRes; }
        };
        await homeController.getStories({ user: { id: testUser2Id }, query: {} }, storiesRes);

        const foundInFeed = storiesResData.stories.find(s => s.id === story1Id);
        if (!foundInFeed) {
            throw new Error('Active unexpired story not found in /api/stories');
        }
        console.log(`✅ Story visible to other users in /api/stories: ID=${foundInFeed.id}`);

        // Test GET /api/home for User 1 (Own Story)
        let homeData1;
        const homeRes1 = {
            status: () => homeRes1,
            json: (d) => { homeData1 = d; return homeRes1; }
        };
        await homeController.getHomeData({ user: { id: testUser1Id } }, homeRes1);

        if (!homeData1.own_stories || homeData1.own_stories.length !== 1 || homeData1.own_stories[0].id !== story1Id) {
            throw new Error('Active unexpired story not found in own_stories in /api/home');
        }
        console.log(`✅ Story visible in own_stories for owner: ID=${homeData1.own_stories[0].id}`);

        // Test GET /api/stories/:id
        let storyDetailData, storyDetailStatus;
        const storyDetailRes = {
            status: (s) => { storyDetailStatus = s; return storyDetailRes; },
            json: (d) => { storyDetailData = d; return storyDetailRes; }
        };
        await homeController.getStoryById({ params: { id: story1Id }, user: { id: testUser2Id } }, storyDetailRes);

        if (storyDetailStatus !== 200 || !storyDetailData.story) {
            throw new Error(`Failed to fetch story by ID: status=${storyDetailStatus}`);
        }
        console.log(`✅ Story fetched by ID successfully: ID=${storyDetailData.story.id}`);

        // =================================================================
        // TEST 3: Simulate 24-Hour Expiration
        // =================================================================
        console.log('\n--- TEST 3: Simulating 24-Hour Expiration ---');
        // Fast-forward story1 expiration to 10 minutes in the past
        await db.query("UPDATE stories SET expires_at = NOW() - INTERVAL '10 minutes' WHERE id = $1", [story1Id]);
        console.log(`⏳ Simulated 24-hour expiration by setting expires_at to 10 minutes ago for story ID=${story1Id}`);

        // Trigger the automatic background expiry cleanup service
        const deactivatedCount = await deactivateExpiredStories();
        console.log(`🧹 Background cleanup job ran: deactivated ${deactivatedCount} story/stories`);

        // Check DB state
        const dbCheck = await db.query('SELECT id, is_active, expires_at FROM stories WHERE id = $1', [story1Id]);
        if (dbCheck.rows[0].is_active !== false) {
            throw new Error(`Expected is_active to be false after expiry, got ${dbCheck.rows[0].is_active}`);
        }
        console.log(`✅ Database confirmed story ID=${story1Id} is_active = false`);

        // =================================================================
        // TEST 4: Expired Story Removed From All Feeds & Endpoints
        // =================================================================
        console.log('\n--- TEST 4: Verifying Expired Story is Hidden/Removed ---');

        // Verify GET /api/stories does NOT contain expired story
        await homeController.getStories({ user: { id: testUser2Id }, query: {} }, storiesRes);
        const expiredInFeed = storiesResData.stories.find(s => s.id === story1Id);
        if (expiredInFeed) {
            throw new Error('Expired story was unexpectedly returned in /api/stories');
        }
        console.log(`✅ Expired story correctly excluded from /api/stories`);

        // Verify GET /api/home does NOT contain expired story in own_stories or active_stories
        await homeController.getHomeData({ user: { id: testUser1Id } }, homeRes1);
        if (homeData1.own_stories && homeData1.own_stories.length > 0) {
            throw new Error(`Expired story was unexpectedly returned in own_stories: ${JSON.stringify(homeData1.own_stories)}`);
        }
        console.log(`✅ Expired story correctly excluded from own_stories in /api/home (User sees '+ Your Story')`);

        // Verify GET /api/stories/:id returns 404
        await homeController.getStoryById({ params: { id: story1Id }, user: { id: testUser2Id } }, storyDetailRes);
        if (storyDetailStatus !== 404) {
            throw new Error(`Expected 404 for expired story ID fetch, got ${storyDetailStatus}`);
        }
        console.log(`✅ Expired story ID fetch returns 404 Not Found / Expired`);

        // =================================================================
        // TEST 5: User Can Now Upload a Brand New Active Story
        // =================================================================
        console.log('\n--- TEST 5: Uploading New Story After Previous Story Expired ---');
        const req2 = {
            user: { id: testUser1Id },
            body: {
                media_url: '/uploads/test_story_new_24h.jpg',
                media_type: 'image',
                caption: 'Fresh New 24-Hour Day'
            }
        };

        let resStatus2, resData2;
        const res2 = {
            status: (s) => { resStatus2 = s; return res2; },
            json: (d) => { resData2 = d; return res2; }
        };

        await homeController.uploadStory(req2, res2);

        if (resStatus2 !== 201 || !resData2.story) {
            throw new Error(`Failed to upload new story after previous expired: status=${resStatus2}, error=${JSON.stringify(resData2)}`);
        }

        story2Id = resData2.story.id;
        console.log(`✅ New story uploaded after expiration: ID=${story2Id}, expires_at=${resData2.story.expires_at}`);

        // Verify new story appears in /api/home
        await homeController.getHomeData({ user: { id: testUser1Id } }, homeRes1);
        if (!homeData1.own_stories || homeData1.own_stories.length !== 1 || homeData1.own_stories[0].id !== story2Id) {
            throw new Error('New active story not appearing in own_stories');
        }
        console.log(`✅ New story appears in own_stories: ID=${homeData1.own_stories[0].id}`);

        console.log('\n🎉 ========================================================');
        console.log('🎉 ALL 24-HOUR STORY EXPIRY TESTS PASSED WITH 100% SUCCESS!');
        console.log('🎉 ========================================================');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    } finally {
        // Cleanup test data
        if (testUser1Id || testUser2Id) {
            await db.query('DELETE FROM stories WHERE user_id IN ($1, $2)', [testUser1Id || 0, testUser2Id || 0]);
            await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUser1Id || 0, testUser2Id || 0]);
            console.log('🧹 Cleaned up test users and stories');
        }
        process.exit(0);
    }
}

runExpiryTests();
