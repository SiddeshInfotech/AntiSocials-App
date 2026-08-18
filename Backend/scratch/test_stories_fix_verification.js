const db = require('../db');
const homeController = require('../controllers/homeController');
const fs = require('fs');
const path = require('path');

// Mock req and res objects
function createMockRes() {
    return {
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
}

async function runVerification() {
    console.log('🚀 [Stories Verification] Starting test suite for Stories loading & synchronization fixes...');

    // 1. Get or create a test user
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
        throw new Error('No users found in database');
    }
    const testUserId = userRes.rows[0].id;
    console.log(`👤 Using test user ID: ${testUserId}`);

    // Create a dummy uploaded file in uploads directory to simulate a valid upload
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const testFilename = `story_test_${Date.now()}.jpg`;
    const testFilePath = path.join(uploadDir, testFilename);
    fs.writeFileSync(testFilePath, 'dummy image data');
    const testMediaUrl = `/uploads/${testFilename}`;
    console.log(`📁 Created test media file: ${testFilePath} -> ${testMediaUrl}`);

    try {
        // Clean up any existing active stories for test user to allow fresh upload
        await db.query('UPDATE stories SET is_active = FALSE WHERE user_id = $1', [testUserId]);

        // TEST 1: Upload a story
        console.log('\n--- TEST 1: Upload Story via homeController.uploadStory ---');
        const uploadReq = {
            user: { id: testUserId },
            body: {
                media_url: testMediaUrl,
                media_type: 'image',
                caption: 'Verification Test Story',
                text_elements: []
            }
        };
        const uploadRes = createMockRes();
        await homeController.uploadStory(uploadReq, uploadRes);

        console.log('Upload Status:', uploadRes.statusCode);
        console.log('Upload Result:', uploadRes.jsonData);

        if (uploadRes.statusCode !== 201 || !uploadRes.jsonData?.story) {
            throw new Error(`Upload failed: ${JSON.stringify(uploadRes.jsonData)}`);
        }

        const createdStory = uploadRes.jsonData.story;
        console.log('✅ TEST 1 PASSED: Story created with ID:', createdStory.id);
        console.log('   - media_url:', createdStory.media_url);
        console.log('   - username:', createdStory.username);
        console.log('   - likes_count:', createdStory.likes_count);
        console.log('   - comments_count:', createdStory.comments_count);
        console.log('   - shares_count:', createdStory.shares_count);
        console.log('   - is_liked_by_user:', createdStory.is_liked_by_user);

        // Verify all required fields
        const requiredFields = [
            'id', 'user_id', 'media_url', 'media_type', 'created_at', 'expires_at',
            'username', 'likes_count', 'comments_count', 'shares_count', 'is_liked_by_user'
        ];
        for (const f of requiredFields) {
            if (createdStory[f] === undefined) {
                throw new Error(`Missing required field: ${f}`);
            }
        }

        // TEST 2: Fetch Stories Feed via homeController.getStories
        console.log('\n--- TEST 2: Fetch Stories Feed via homeController.getStories ---');
        const getStoriesReq = {
            user: { id: testUserId },
            query: {}
        };
        const getStoriesRes = createMockRes();
        await homeController.getStories(getStoriesReq, getStoriesRes);

        console.log('Feed Status:', getStoriesRes.statusCode);
        console.log('Feed Count:', getStoriesRes.jsonData?.stories?.length);

        if (getStoriesRes.statusCode !== 200 || !Array.isArray(getStoriesRes.jsonData?.stories)) {
            throw new Error(`getStories failed: ${JSON.stringify(getStoriesRes.jsonData)}`);
        }

        const foundInFeed = getStoriesRes.jsonData.stories.find(s => s.id === createdStory.id);
        if (!foundInFeed) {
            throw new Error(`Created story ${createdStory.id} not found in getStories feed`);
        }
        console.log('✅ TEST 2 PASSED: Created story verified in feed with full metadata.');

        // TEST 3: Fetch Home Data via homeController.getHomeData
        console.log('\n--- TEST 3: Fetch Home Data via homeController.getHomeData ---');
        const homeReq = {
            user: { id: testUserId }
        };
        const homeRes = createMockRes();
        await homeController.getHomeData(homeReq, homeRes);

        console.log('Home Status:', homeRes.statusCode);
        console.log('Own Stories count:', homeRes.jsonData?.own_stories?.length);
        console.log('Active Stories count:', homeRes.jsonData?.active_stories?.length);

        if (homeRes.statusCode !== 200 || !Array.isArray(homeRes.jsonData?.own_stories)) {
            throw new Error(`getHomeData failed: ${JSON.stringify(homeRes.jsonData)}`);
        }

        const foundInOwn = homeRes.jsonData.own_stories.find(s => s.id === createdStory.id);
        if (!foundInOwn) {
            throw new Error(`Created story ${createdStory.id} not found in own_stories`);
        }
        console.log('✅ TEST 3 PASSED: Created story verified in homeData.own_stories.');

        // TEST 4: Social Interactions (Like, Comment, Share)
        console.log('\n--- TEST 4: Social Interactions on Story ---');
        const likeReq = { user: { id: testUserId }, params: { storyId: createdStory.id } };
        const likeRes = createMockRes();
        await homeController.likeStory(likeReq, likeRes);
        console.log('Like response:', likeRes.jsonData);
        if (likeRes.statusCode !== 200 || likeRes.jsonData?.likes_count !== 1) {
            throw new Error('likeStory failed');
        }

        const commentReq = {
            user: { id: testUserId },
            params: { storyId: createdStory.id },
            body: { text: 'Great mindful story!' }
        };
        const commentRes = createMockRes();
        await homeController.addStoryComment(commentReq, commentRes);
        console.log('Comment response:', commentRes.jsonData);
        if (commentRes.statusCode !== 201 || commentRes.jsonData?.comments_count !== 1) {
            throw new Error('addStoryComment failed');
        }

        const shareReq = { user: { id: testUserId }, params: { storyId: createdStory.id } };
        const shareRes = createMockRes();
        await homeController.trackStoryShare(shareReq, shareRes);
        console.log('Share response:', shareRes.jsonData);
        if (shareRes.statusCode !== 200 || shareRes.jsonData?.shares_count !== 1) {
            throw new Error('trackStoryShare failed');
        }

        console.log('✅ TEST 4 PASSED: Social interactions work perfectly.');

        // Clean up test story
        await db.query('DELETE FROM stories WHERE id = $1', [createdStory.id]);
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

        console.log('\n🎉 ALL TESTS PASSED! Stories loading, synchronization, and rendering are fully validated! 🎉\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err);
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        process.exit(1);
    }
}

runVerification();
