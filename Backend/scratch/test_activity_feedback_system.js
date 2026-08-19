const db = require('../db');
const activityController = require('../controllers/activityController');

const runTests = async () => {
    console.log('--- STARTING COMMUNITY ACTIVITIES BACKEND TESTS ---');
    try {
        // 1. Get or create test users
        const u1Res = await db.query('SELECT id, username FROM users LIMIT 1');
        if (u1Res.rows.length === 0) {
            console.error('No users found in database for testing');
            process.exit(1);
        }
        const ownerUser = u1Res.rows[0];
        const ownerId = ownerUser.id;

        const u2Res = await db.query('SELECT id, username FROM users WHERE id != $1 LIMIT 1', [ownerId]);
        const otherUser = u2Res.rows.length > 0 ? u2Res.rows[0] : { id: 999999, username: 'other_user' };

        console.log(`Test Owner User: ${ownerUser.username} (ID: ${ownerId})`);
        console.log(`Test Other User: ${otherUser.username} (ID: ${otherUser.id})`);

        // 2. Create a test completed activity
        const pastDateStr = '10/08/2026';
        const createRes = await db.query(`
            INSERT INTO activities (
                creator_id, category, title, description, date_str, time_str, location, capacity, emoji, status
            ) VALUES ($1, 'Sports & Fitness', 'Test Badminton Match', 'Great game test', $2, '6:00 PM', 'Sports Complex', 10, '🏸', 'completed')
            RETURNING id
        `, [ownerId, pastDateStr]);

        const testActivityId = createRes.rows[0].id;
        console.log(`Created test completed activity with ID: ${testActivityId}`);

        // 3. Test getActivityById
        const mockReqOwner = {
            user: { id: ownerId },
            params: { id: testActivityId }
        };
        let resData = null;
        let statusCode = 200;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { resData = data; return mockRes; }
        };

        await activityController.getActivityById(mockReqOwner, mockRes);
        console.log('getActivityById Response Status:', statusCode);
        console.log('Activity Title:', resData?.title);
        console.log('Activity Status:', resData?.status);
        console.log('Activity isCreator:', resData?.isCreator);
        console.log('Activity isCompleted:', resData?.isCompleted);

        if (!resData || resData.id !== testActivityId.toString() || !resData.isCreator || !resData.isCompleted) {
            throw new Error('getActivityById failed assertions');
        }
        console.log('✅ TEST 1 PASSED: getActivityById correctly returns full details, completion status, and creator flag');

        // 4. Test non-owner trying to submit feedback (Should fail with 403)
        const mockReqOther = {
            user: { id: otherUser.id },
            params: { id: testActivityId },
            body: { rating: 5, participationRating: 4, feedback: 'Unauthorized review' }
        };
        let failStatus = 200;
        let failData = null;
        const mockFailRes = {
            status: (code) => { failStatus = code; return mockFailRes; },
            json: (data) => { failData = data; return mockFailRes; }
        };

        await activityController.submitFeedback(mockReqOther, mockFailRes);
        console.log('Unauthorized feedback attempt status:', failStatus, 'error:', failData?.error);
        if (failStatus !== 403) {
            throw new Error('Expected 403 Unauthorized for non-owner feedback submission');
        }
        console.log('✅ TEST 2 PASSED: Non-owner feedback submission correctly rejected with 403');

        // 5. Test owner submitting feedback
        const mockFeedbackReq = {
            user: { id: ownerId },
            params: { id: testActivityId },
            body: { rating: 5, participationRating: 4, feedback: 'Awesome turnout, great sportsmanship!' }
        };
        let fbStatus = 200;
        let fbData = null;
        const mockFbRes = {
            status: (code) => { fbStatus = code; return mockFbRes; },
            json: (data) => { fbData = data; return mockFbRes; }
        };

        await activityController.submitFeedback(mockFeedbackReq, mockFbRes);
        console.log('Owner feedback submission status:', fbStatus);
        console.log('Owner Feedback Data:', fbData);

        if (fbStatus !== 200 || !fbData?.success || fbData?.ownerFeedback?.rating !== 5) {
            throw new Error('Owner feedback submission failed');
        }
        console.log('✅ TEST 3 PASSED: Owner feedback submitted and saved successfully');

        // 6. Test getActivityById again to verify feedback persistence
        let verifiedData = null;
        const mockVerifyRes = {
            status: (code) => mockVerifyRes,
            json: (data) => { verifiedData = data; return mockVerifyRes; }
        };
        await activityController.getActivityById(mockReqOwner, mockVerifyRes);
        console.log('Persisted feedback on activity:', verifiedData?.ownerFeedback);

        if (!verifiedData?.ownerFeedback || verifiedData.ownerFeedback.rating !== 5 || verifiedData.ownerFeedback.feedback !== 'Awesome turnout, great sportsmanship!') {
            throw new Error('Feedback persistence verification failed');
        }
        console.log('✅ TEST 4 PASSED: Feedback persists and loads on getActivityById');

        // 7. Verify activity still exists in DB (not deleted)
        const checkDb = await db.query('SELECT id, status, owner_feedback FROM activities WHERE id = $1', [testActivityId]);
        if (checkDb.rows.length === 0) {
            throw new Error('Activity was unexpectedly deleted from DB');
        }
        console.log('✅ TEST 5 PASSED: Completed activity permanently preserved in database');

        // Clean up test activity
        await db.query('DELETE FROM activities WHERE id = $1', [testActivityId]);
        console.log('Cleaned up test activity.');

        console.log('\n🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY! 🎉\n');
        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
};

runTests();
