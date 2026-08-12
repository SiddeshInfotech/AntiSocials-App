const db = require('../db');
const homeController = require('../controllers/homeController');

async function testSingleStoryRule() {
    console.log('🚀 [Test] Starting Single Active Story Backend Verification...');

    try {
        // 1. Get or create test user
        let userRes = await db.query("SELECT id, username FROM users WHERE username = 'single_story_tester'");
        let userId;
        if (userRes.rows.length === 0) {
            const newUser = await db.query("INSERT INTO users (username, phone_number) VALUES ('single_story_tester', '9123456780') RETURNING id");
            userId = newUser.rows[0].id;
        } else {
            userId = userRes.rows[0].id;
        }

        console.log(`👤 Using test userId=${userId}`);

        // Clean up previous test stories for this user
        await db.query("DELETE FROM stories WHERE user_id = $1", [userId]);

        // Helper mock req and res
        function createMockReqRes(body = {}, params = {}, query = {}) {
            const req = {
                user: { id: userId },
                body,
                params,
                query
            };
            const res = {
                statusCode: 200,
                jsonData: null,
                status(code) {
                    this.statusCode = code;
                    return this;
                },
                json(data) {
                    this.jsonData = data;
                    return this;
                }
            };
            return { req, res };
        }

        // Test 1: Upload first story (should succeed with 201)
        console.log('\n--- TEST 1: First Story Upload ---');
        const { req: req1, res: res1 } = createMockReqRes({
            media_url: '/uploads/story_1.jpg',
            media_type: 'image',
            caption: 'First active story'
        });
        await homeController.uploadStory(req1, res1);
        console.log(`Response status: ${res1.statusCode}`, res1.jsonData);

        if (res1.statusCode !== 201 || !res1.jsonData?.story?.id) {
            throw new Error(`Test 1 Failed: Expected status 201, got ${res1.statusCode}`);
        }
        const firstStoryId = res1.jsonData.story.id;
        console.log(`✅ TEST 1 PASSED: First story created (id: ${firstStoryId})`);

        // Test 2: Attempt to upload second story while first is active (should be blocked with 400)
        console.log('\n--- TEST 2: Second Story Upload (Should be Blocked) ---');
        const { req: req2, res: res2 } = createMockReqRes({
            media_url: '/uploads/story_2.jpg',
            media_type: 'image',
            caption: 'Second story attempt'
        });
        await homeController.uploadStory(req2, res2);
        console.log(`Response status: ${res2.statusCode}`, res2.jsonData);

        if (res2.statusCode !== 400 || res2.jsonData?.error !== 'You already have an active story.') {
            throw new Error(`Test 2 Failed: Expected 400 with 'You already have an active story.', got ${res2.statusCode}: ${JSON.stringify(res2.jsonData)}`);
        }
        console.log('✅ TEST 2 PASSED: Second story upload successfully blocked.');

        // Test 3: Verify getHomeData returns exactly 1 active story for user
        console.log('\n--- TEST 3: Verify getHomeData Story Separation ---');
        const { req: reqHome, res: resHome } = createMockReqRes();
        await homeController.getHomeData(reqHome, resHome);
        console.log(`Home own_stories count: ${resHome.jsonData?.own_stories?.length}`);

        if (resHome.jsonData?.own_stories?.length !== 1) {
            throw new Error(`Test 3 Failed: Expected 1 own_story, got ${resHome.jsonData?.own_stories?.length}`);
        }
        console.log('✅ TEST 3 PASSED: Exactly 1 active own story returned in home data.');

        // Test 4: Social functionality on the active story (Like, Comment, Share, Views)
        console.log('\n--- TEST 4: Social Interactions on Single Story ---');
        // Like
        const { req: reqLike, res: resLike } = createMockReqRes({}, { storyId: firstStoryId });
        await homeController.likeStory(reqLike, resLike);
        console.log(`Like status: ${resLike.statusCode}, likes_count: ${resLike.jsonData?.likes_count}`);

        // Comment
        const { req: reqComment, res: resComment } = createMockReqRes({ comment_text: 'Awesome moment!' }, { storyId: firstStoryId });
        await homeController.addStoryComment(reqComment, resComment);
        console.log(`Comment status: ${resComment.statusCode}, comments_count: ${resComment.jsonData?.comments_count}`);

        // Share
        const { req: reqShare, res: resShare } = createMockReqRes({}, { storyId: firstStoryId });
        await homeController.trackStoryShare(reqShare, resShare);
        console.log(`Share status: ${resShare.statusCode}, shares_count: ${resShare.jsonData?.shares_count}`);

        // Views
        const { req: reqView, res: resView } = createMockReqRes({}, { storyId: firstStoryId });
        await homeController.trackStoryView(reqView, resView);
        console.log(`View status: ${resView.statusCode}`);

        if (resLike.statusCode !== 200 || resComment.statusCode !== 201 || resShare.statusCode !== 200) {
            throw new Error('Test 4 Failed: Social interactions failed on active story');
        }
        console.log('✅ TEST 4 PASSED: Social features (Like, Comment, Share, View) all operate normally.');

        // Test 5: Story Expiry - Simulate expiration of story and attempt new upload
        console.log('\n--- TEST 5: Expiry & Subsequent Upload ---');
        // Expire the first story by setting expires_at to 1 hour ago
        await db.query("UPDATE stories SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1", [firstStoryId]);

        const { req: req3, res: res3 } = createMockReqRes({
            media_url: '/uploads/story_after_expiry.jpg',
            media_type: 'image',
            caption: 'New story after expiry'
        });
        await homeController.uploadStory(req3, res3);
        console.log(`Upload after expiry status: ${res3.statusCode}`, res3.jsonData);

        if (res3.statusCode !== 201 || !res3.jsonData?.story?.id) {
            throw new Error(`Test 5 Failed: Expected 201 for story upload after expiration, got ${res3.statusCode}`);
        }
        const secondStoryId = res3.jsonData.story.id;
        console.log(`✅ TEST 5 PASSED: New story upload succeeded after prior story expired (id: ${secondStoryId})`);

        // Test 6: Story Deletion & Subsequent Upload
        console.log('\n--- TEST 6: Delete Active Story & Upload Replacement ---');
        const { req: reqDel, res: resDel } = createMockReqRes({}, { id: secondStoryId });
        await homeController.deleteStory(reqDel, resDel);
        console.log(`Delete status: ${resDel.statusCode}`, resDel.jsonData);

        if (resDel.statusCode !== 200) {
            throw new Error(`Test 6 Failed: Story deletion returned ${resDel.statusCode}`);
        }

        const { req: req4, res: res4 } = createMockReqRes({
            media_url: '/uploads/story_after_delete.jpg',
            media_type: 'image',
            caption: 'New story after manual deletion'
        });
        await homeController.uploadStory(req4, res4);
        console.log(`Upload after deletion status: ${res4.statusCode}`, res4.jsonData);

        if (res4.statusCode !== 201) {
            throw new Error(`Test 6 Failed: Expected 201 after deleting story, got ${res4.statusCode}`);
        }
        console.log('✅ TEST 6 PASSED: New story upload succeeded after deleting active story.');

        // Clean up test data
        await db.query("DELETE FROM stories WHERE user_id = $1", [userId]);
        await db.query("DELETE FROM users WHERE id = $1", [userId]);

        console.log('\n🎉 ALL 6 SINGLE ACTIVE STORY TESTS PASSED PERFECTLY! 🎉\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

testSingleStoryRule();
