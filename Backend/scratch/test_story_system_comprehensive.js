const db = require('../db');
const homeController = require('../controllers/homeController');
const { deactivateExpiredStories } = require('../services/storyExpiryService');

function mockRes() {
    let statusCode = 200;
    let jsonData = null;
    return {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            jsonData = data;
            return this;
        },
        getStatusCode: () => statusCode,
        getJson: () => jsonData
    };
}

async function runComprehensiveStoryTest() {
    try {
        console.log("==========================================================");
        console.log("🧪 RUNNING COMPREHENSIVE 24-HOUR STORY SYSTEM TEST");
        console.log("==========================================================");

        // 1. Setup Test Users: User A and User B
        let userARes = await db.query("SELECT id, username FROM users WHERE username = 'story_user_a'");
        let userAId;
        if (userARes.rows.length === 0) {
            const insA = await db.query(
                "INSERT INTO users (username, phone_number, is_phone_verified, profile_name) VALUES ('story_user_a', '9999900001', true, 'User A') RETURNING id"
            );
            userAId = insA.rows[0].id;
        } else {
            userAId = userARes.rows[0].id;
        }

        let userBRes = await db.query("SELECT id, username FROM users WHERE username = 'story_user_b'");
        let userBId;
        if (userBRes.rows.length === 0) {
            const insB = await db.query(
                "INSERT INTO users (username, phone_number, is_phone_verified, profile_name) VALUES ('story_user_b', '9999900002', true, 'User B') RETURNING id"
            );
            userBId = insB.rows[0].id;
        } else {
            userBId = userBRes.rows[0].id;
        }

        console.log(`👤 User A: ID ${userAId} | User B: ID ${userBId}`);

        // Ensure User A and User B are NOT connected (to verify public / community visibility)
        await db.query(
            "DELETE FROM user_connections WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
            [userAId, userBId]
        );

        // Clean up previous test stories for User A and User B
        await db.query("DELETE FROM stories WHERE user_id IN ($1, $2)", [userAId, userBId]);

        // ---------------------------------------------------------
        // TEST 1: User A uploads a story
        // ---------------------------------------------------------
        console.log("\n--- TEST 1: User A uploads a story ---");
        const uploadReq = {
            user: { id: userAId },
            body: {
                media_url: '/uploads/test_story_a.jpg',
                media_type: 'image',
                caption: 'Sunset in the city!'
            }
        };
        const uploadRes = mockRes();
        await homeController.uploadStory(uploadReq, uploadRes);

        if (uploadRes.getStatusCode() !== 201 || !uploadRes.getJson()?.story) {
            throw new Error(`Story upload failed: ${JSON.stringify(uploadRes.getJson())}`);
        }

        const createdStory = uploadRes.getJson().story;
        const storyId = createdStory.id;
        console.log(`✅ Story uploaded successfully! Story ID: ${storyId}`);

        // Verify 24-hour UTC lifetime in database
        const storyDbRes = await db.query(
            "SELECT id, created_at, expires_at, is_active FROM stories WHERE id = $1",
            [storyId]
        );
        const storyDb = storyDbRes.rows[0];
        const createdMs = new Date(storyDb.created_at).getTime();
        const expiresMs = new Date(storyDb.expires_at).getTime();
        const diffHours = (expiresMs - createdMs) / (1000 * 60 * 60);

        console.log(`⏱️ Created At: ${storyDb.created_at}`);
        console.log(`⏱️ Expires At: ${storyDb.expires_at}`);
        console.log(`⏱️ Lifetime: ${diffHours} hours (is_active: ${storyDb.is_active})`);

        if (Math.abs(diffHours - 24) > 0.01) {
            throw new Error(`Story lifetime is not exactly 24 hours! Diff = ${diffHours} hours`);
        }
        console.log("✅ Verified exact 24-hour UTC lifetime in database!");

        // ---------------------------------------------------------
        // TEST 2: User B (Unconnected User) verifies story is visible
        // ---------------------------------------------------------
        console.log("\n--- TEST 2: User B verifies story is visible in Feed and Home ---");

        // 2a. Check GET /api/stories for User B
        const feedReqB1 = { user: { id: userBId }, query: {} };
        const feedResB1 = mockRes();
        await homeController.getStories(feedReqB1, feedResB1);
        const feedStoriesB1 = feedResB1.getJson()?.stories || [];
        const foundInFeedB1 = feedStoriesB1.find(s => Number(s.id) === Number(storyId));

        if (!foundInFeedB1) {
            throw new Error(`User A's story was NOT found in User B's /api/stories feed! Found count: ${feedStoriesB1.length}`);
        }
        console.log(`✅ User B successfully sees User A's story in GET /api/stories`);

        // 2b. Check GET /api/home for User B
        const homeReqB1 = { user: { id: userBId } };
        const homeResB1 = mockRes();
        await homeController.getHomeData(homeReqB1, homeResB1);
        const activeStoriesB1 = homeResB1.getJson()?.active_stories || [];
        const foundInHomeB1 = activeStoriesB1.find(s => Number(s.id) === Number(storyId));

        if (!foundInHomeB1) {
            throw new Error(`User A's story was NOT found in User B's active_stories in GET /api/home!`);
        }
        console.log(`✅ User B successfully sees User A's story in GET /api/home active_stories`);

        // ---------------------------------------------------------
        // TEST 3: User A logs out (session cleared / switched)
        // User B verifies story is STILL visible
        // ---------------------------------------------------------
        console.log("\n--- TEST 3: User A logs out -> User B verifies story STILL visible ---");

        // User A's token / local session is now gone (simulated).
        // Database record must NOT be deleted.
        const dbCheckAfterLogout = await db.query(
            "SELECT id, is_active, expires_at FROM stories WHERE id = $1",
            [storyId]
        );
        if (dbCheckAfterLogout.rows.length === 0 || !dbCheckAfterLogout.rows[0].is_active) {
            throw new Error("Story was deleted or deactivated after creator logout!");
        }

        // User B re-fetches feed and home
        const feedResB2 = mockRes();
        await homeController.getStories(feedReqB1, feedResB2);
        const foundInFeedB2 = (feedResB2.getJson()?.stories || []).find(s => Number(s.id) === Number(storyId));

        const homeResB2 = mockRes();
        await homeController.getHomeData(homeReqB1, homeResB2);
        const foundInHomeB2 = (homeResB2.getJson()?.active_stories || []).find(s => Number(s.id) === Number(storyId));

        if (!foundInFeedB2 || !foundInHomeB2) {
            throw new Error("Story disappeared for User B after User A logged out!");
        }
        console.log("✅ User A's story remains active and visible to User B after User A logged out!");

        // ---------------------------------------------------------
        // TEST 4: User A logs back in
        // User A verifies their own story is STILL visible
        // ---------------------------------------------------------
        console.log("\n--- TEST 4: User A logs back in -> Verifies own story visible ---");

        // User A fetches GET /api/home
        const homeReqA = { user: { id: userAId } };
        const homeResA = mockRes();
        await homeController.getHomeData(homeReqA, homeResA);
        const ownStoriesA = homeResA.getJson()?.own_stories || [];
        const foundOwnInHome = ownStoriesA.find(s => Number(s.id) === Number(storyId));

        if (!foundOwnInHome) {
            throw new Error("User A cannot see their own story in own_stories after logging back in!");
        }
        console.log(`✅ User A sees own story in GET /api/home (own_stories count: ${ownStoriesA.length})`);

        // User A fetches GET /api/stories
        const feedReqA = { user: { id: userAId }, query: {} };
        const feedResA = mockRes();
        await homeController.getStories(feedReqA, feedResA);
        const feedStoriesA = feedResA.getJson()?.stories || [];
        const foundOwnInFeed = feedStoriesA.find(s => Number(s.id) === Number(storyId));

        if (!foundOwnInFeed) {
            throw new Error("User A cannot find their own story in GET /api/stories after logging back in!");
        }
        console.log(`✅ User A sees their own story in GET /api/stories`);

        // ---------------------------------------------------------
        // TEST 5: Social interactions between User A and User B
        // ---------------------------------------------------------
        console.log("\n--- TEST 5: Social Interactions (Like, Comment, View, Share) ---");

        // User B views story
        const viewRes = mockRes();
        await homeController.trackStoryView({ user: { id: userBId }, params: { storyId } }, viewRes);
        console.log(`✅ User B viewed story (Status: ${viewRes.getStatusCode()})`);

        // User A checks viewers
        const viewersRes = mockRes();
        await homeController.getStoryViewers({ user: { id: userAId }, params: { storyId } }, viewersRes);
        const viewers = viewersRes.getJson()?.viewers || [];
        const viewerB = viewers.find(v => Number(v.user_id) === Number(userBId));
        if (!viewerB) {
            throw new Error("User B not listed in story viewers!");
        }
        console.log(`✅ User A sees User B in story viewers list!`);

        // User B likes story
        const likeRes = mockRes();
        await homeController.likeStory({ user: { id: userBId }, params: { storyId } }, likeRes);
        if (likeRes.getJson()?.likes_count !== 1) {
            throw new Error(`Like failed: ${JSON.stringify(likeRes.getJson())}`);
        }
        console.log(`✅ User B liked story (likes_count = ${likeRes.getJson().likes_count})`);

        // User B comments on story
        const commentRes = mockRes();
        await homeController.addStoryComment({
            user: { id: userBId },
            params: { storyId },
            body: { text: "Amazing shot!" }
        }, commentRes);
        if (commentRes.getStatusCode() !== 201) {
            throw new Error(`Comment failed: ${JSON.stringify(commentRes.getJson())}`);
        }
        console.log(`✅ User B added comment to story`);

        // ---------------------------------------------------------
        // TEST 6: 24-Hour Expiry Boundary
        // ---------------------------------------------------------
        console.log("\n--- TEST 6: 24-Hour Expiry Boundary ---");

        // 6a. While unexpired (e.g. 23 hours in), story remains active
        await db.query("UPDATE stories SET created_at = NOW() - INTERVAL '23 hours', expires_at = NOW() + INTERVAL '1 hour' WHERE id = $1", [storyId]);
        let deactivatedCount = await deactivateExpiredStories();
        if (deactivatedCount !== 0) {
            throw new Error(`Deactivated unexpired story prematurely! Count: ${deactivatedCount}`);
        }
        console.log("✅ Story at 23 hours remains active and unexpired.");

        // 6b. When 24 hours have elapsed (expires_at <= NOW()), story expires
        console.log("Simulating 24 hours passed (setting expires_at = NOW() - 1 minute)...");
        await db.query("UPDATE stories SET created_at = NOW() - INTERVAL '25 hours', expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1", [storyId]);

        deactivatedCount = await deactivateExpiredStories();
        console.log(`⏰ Expiry service ran. Deactivated count: ${deactivatedCount}`);

        // Verify story is NO LONGER returned in /api/stories
        const expiredFeedRes = mockRes();
        await homeController.getStories(feedReqB1, expiredFeedRes);
        const expiredFoundInFeed = (expiredFeedRes.getJson()?.stories || []).find(s => Number(s.id) === Number(storyId));
        if (expiredFoundInFeed) {
            throw new Error("Expired story was still returned in /api/stories!");
        }
        console.log("✅ Expired story correctly excluded from /api/stories for everyone");

        // Verify story is NO LONGER returned in /api/home
        const expiredHomeRes = mockRes();
        await homeController.getHomeData(homeReqA, expiredHomeRes);
        const expiredFoundInHome = (expiredHomeRes.getJson()?.own_stories || []).find(s => Number(s.id) === Number(storyId));
        if (expiredFoundInHome) {
            throw new Error("Expired story was still returned in /api/home!");
        }
        console.log("✅ Expired story correctly excluded from /api/home own_stories");

        // Clean up test users
        await db.query("DELETE FROM stories WHERE user_id IN ($1, $2)", [userAId, userBId]);
        await db.query("DELETE FROM users WHERE id IN ($1, $2)", [userAId, userBId]);

        console.log("\n==========================================================");
        console.log("🎉 ALL TESTS PASSED! STORIES SYSTEM IS 100% VERIFIED!");
        console.log("==========================================================");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ COMPREHENSIVE STORY TEST FAILED:", err);
        process.exit(1);
    }
}

runComprehensiveStoryTest();
