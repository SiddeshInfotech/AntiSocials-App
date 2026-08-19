const db = require('../db');
const activityController = require('../controllers/activityController');

const runFullTest = async () => {
    console.log('=====================================================');
    console.log('🚀 RUNNING COMPREHENSIVE ACTIVITY LIFECYCLE TESTS 🚀');
    console.log('=====================================================');
    try {
        // Clean up any test leftovers
        await db.query(`DELETE FROM activities WHERE title LIKE 'Weekend Badminton Tournament%'`);

        // Fetch 2 test users
        const usersRes = await db.query('SELECT id, username FROM users LIMIT 2');
        if (usersRes.rows.length < 2) {
            console.error('Need at least 2 users in database for full lifecycle testing');
            process.exit(1);
        }
        const hostUser = usersRes.rows[0];
        const participantUser = usersRes.rows[1];

        // Ensure both have matching pincode for location proximity check
        await db.query(`UPDATE users SET pincode = '411057' WHERE id IN ($1, $2)`, [hostUser.id, participantUser.id]);

        console.log(`Host User: ${hostUser.username} (ID: ${hostUser.id})`);
        console.log(`Participant User: ${participantUser.username} (ID: ${participantUser.id})`);

        // Helper mock response
        const makeMockRes = () => {
            const res = {
                statusCode: 200,
                body: null,
                status(c) { this.statusCode = c; return this; },
                json(data) { this.body = data; return this; }
            };
            return res;
        };

        // STEP 1: Host creates a new Community Activity
        console.log('\n--- STEP 1: Creating Activity ---');
        const createReq = {
            user: { id: hostUser.id },
            body: {
                title: 'Weekend Badminton Tournament',
                category: 'Sports & Fitness',
                date: '24/08/2026',
                time: '7:00 AM',
                location: 'City Sports Arena, Court 3',
                address: 'Court 3, City Sports Arena, MG Road',
                capacity: 8,
                description: 'Friendly competitive badminton games for all skill levels. Rackets available.',
                pincode: '411057',
                emoji: '🏸'
            }
        };
        const createRes = makeMockRes();
        await activityController.createActivity(createReq, createRes);
        console.log(`Create Activity Result: status=${createRes.statusCode}, id=${createRes.body?.activity?.id}`);
        if (createRes.statusCode !== 201 || !createRes.body?.activity?.id) {
            throw new Error('Failed to create activity');
        }
        const activityId = createRes.body.activity.id;

        // STEP 2: Participant joins the activity
        console.log('\n--- STEP 2: Participant Joining Activity ---');
        const joinReq = {
            user: { id: participantUser.id },
            params: { id: activityId }
        };
        const joinRes = makeMockRes();
        await activityController.joinActivity(joinReq, joinRes);
        console.log(`Join Activity Result: status=${joinRes.statusCode}, joined=${joinRes.body?.joined}`);
        if (joinRes.statusCode !== 200 || joinRes.body?.joined < 2) {
            throw new Error('Failed to join activity');
        }

        // STEP 3: Fetch Activity Details for Participant
        console.log('\n--- STEP 3: Fetching Activity Details (Upcoming) ---');
        const detailReqPart = {
            user: { id: participantUser.id },
            params: { id: activityId }
        };
        const detailResPart = makeMockRes();
        await activityController.getActivityById(detailReqPart, detailResPart);
        console.log(`Details for Participant: title="${detailResPart.body?.title}", status=${detailResPart.body?.status}, isJoined=${detailResPart.body?.isJoined}, isCreator=${detailResPart.body?.isCreator}`);
        if (!detailResPart.body?.isJoined || detailResPart.body?.isCreator !== false) {
            throw new Error('Participant detail assertions failed');
        }

        // STEP 4: Non-owner tries to submit feedback (Should fail with 403)
        console.log('\n--- STEP 4: Unauthorized Feedback Attempt by Participant ---');
        const unauthFbReq = {
            user: { id: participantUser.id },
            params: { id: activityId },
            body: { rating: 5, feedback: 'Should not be allowed' }
        };
        const unauthFbRes = makeMockRes();
        await activityController.submitFeedback(unauthFbReq, unauthFbRes);
        console.log(`Unauthorized Feedback: status=${unauthFbRes.statusCode}, error="${unauthFbRes.body?.error}"`);
        if (unauthFbRes.statusCode !== 403) {
            throw new Error('Expected 403 Forbidden for participant feedback');
        }

        // STEP 5: Activity date passes / marked as completed
        console.log('\n--- STEP 5: Simulating Past Activity Completion ---');
        await db.query(`UPDATE activities SET date_str = '10/08/2026', status = 'completed' WHERE id = $1`, [activityId]);

        // STEP 6: Host submits owner feedback
        console.log('\n--- STEP 6: Owner Submitting Feedback ---');
        const ownerFbReq = {
            user: { id: hostUser.id },
            params: { id: activityId },
            body: {
                rating: 5,
                participationRating: 5,
                feedback: 'Incredible turnout and great rallies! Thanks everyone for coming out.'
            }
        };
        const ownerFbRes = makeMockRes();
        await activityController.submitFeedback(ownerFbReq, ownerFbRes);
        console.log(`Owner Feedback Submission: status=${ownerFbRes.statusCode}, rating=${ownerFbRes.body?.ownerFeedback?.rating}`);
        if (ownerFbRes.statusCode !== 200 || ownerFbRes.body?.ownerFeedback?.rating !== 5) {
            throw new Error('Owner feedback submission failed');
        }

        // STEP 7: Participant reads Activity Details with Owner Feedback
        console.log('\n--- STEP 7: Participant Viewing Completed Activity with Owner Feedback ---');
        const detailResAfterFb = makeMockRes();
        await activityController.getActivityById(detailReqPart, detailResAfterFb);
        console.log(`Activity Status: ${detailResAfterFb.body?.status}`);
        console.log(`Owner Feedback Data:`, detailResAfterFb.body?.ownerFeedback);
        if (
            detailResAfterFb.body?.status !== 'completed' ||
            !detailResAfterFb.body?.ownerFeedback ||
            detailResAfterFb.body?.ownerFeedback?.feedback !== 'Incredible turnout and great rallies! Thanks everyone for coming out.'
        ) {
            throw new Error('Saved feedback display verification failed');
        }

        // STEP 8: Verify persistence in database (Activity not deleted)
        console.log('\n--- STEP 8: Verifying Persistence in Database ---');
        const dbCheck = await db.query('SELECT id, status, owner_feedback, feedback_rating FROM activities WHERE id = $1', [activityId]);
        if (dbCheck.rows.length === 0 || dbCheck.rows[0].status !== 'completed') {
            throw new Error('Activity persistence check failed');
        }
        console.log('✅ Activity record securely persisted in DB with completed status and feedback.');

        // STEP 9: Test manual delete by host
        console.log('\n--- STEP 9: Manual Delete by Host ---');
        const deleteReq = {
            user: { id: hostUser.id },
            params: { id: activityId }
        };
        const deleteRes = makeMockRes();
        await activityController.deleteActivity(deleteReq, deleteRes);
        console.log(`Delete Activity Result: status=${deleteRes.statusCode}`);
        if (deleteRes.statusCode !== 200) {
            throw new Error('Manual delete failed');
        }

        const verifyDeleted = await db.query('SELECT id FROM activities WHERE id = $1', [activityId]);
        if (verifyDeleted.rows.length !== 0) {
            throw new Error('Activity was not deleted after manual deletion');
        }
        console.log('✅ Activity successfully removed upon explicit manual deletion.');

        console.log('\n=====================================================');
        console.log('🎉 ALL COMMUNITY ACTIVITIES LIFECYCLE TESTS PASSED! 🎉');
        console.log('=====================================================\n');
        process.exit(0);
    } catch (e) {
        console.error('❌ LIFECYCLE TEST FAILED:', e);
        process.exit(1);
    }
};

runFullTest();
