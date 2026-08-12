const db = require('../db');

async function testMultiStoryFlow() {
    console.log('🚀 Starting Multi-Story Feature Backend Verification...');

    try {
        // 1. Get or create a test user
        let userRes = await db.query("SELECT id, username FROM users WHERE username = 'multi_story_tester'");
        let userId;
        if (userRes.rows.length === 0) {
            const newUser = await db.query("INSERT INTO users (username, phone_number) VALUES ('multi_story_tester', '9876543210') RETURNING id, username");
            userId = newUser.rows[0].id;
        } else {
            userId = userRes.rows[0].id;
        }
        console.log(`👤 Using test user: userId=${userId}`);

        // Clean up previous test stories for this user
        await db.query("DELETE FROM stories WHERE user_id = $1", [userId]);

        // 2. Insert First Story (Story 1 - e.g. 10:00 AM)
        const story1Res = await db.query(
            "INSERT INTO stories (user_id, media_url, media_type, caption, created_at) VALUES ($1, '/uploads/story1.jpg', 'image', 'Story 1', NOW() - INTERVAL '4 hours') RETURNING *",
            [userId]
        );
        const story1 = story1Res.rows[0];
        console.log(`✅ Story 1 created: id=${story1.id}, created_at=${story1.created_at}, expires_at=${story1.expires_at}`);

        // 3. Insert Second Story (Story 2 - e.g. 12:00 PM)
        const story2Res = await db.query(
            "INSERT INTO stories (user_id, media_url, media_type, caption, created_at) VALUES ($1, '/uploads/story2.jpg', 'image', 'Story 2', NOW() - INTERVAL '2 hours') RETURNING *",
            [userId]
        );
        const story2 = story2Res.rows[0];
        console.log(`✅ Story 2 created: id=${story2.id}, created_at=${story2.created_at}, expires_at=${story2.expires_at}`);

        // 4. Insert Third Story (Story 3 - e.g. 3:00 PM)
        const story3Res = await db.query(
            "INSERT INTO stories (user_id, media_url, media_type, caption, created_at) VALUES ($1, '/uploads/story3.jpg', 'image', 'Story 3', NOW()) RETURNING *",
            [userId]
        );
        const story3 = story3Res.rows[0];
        console.log(`✅ Story 3 created: id=${story3.id}, created_at=${story3.created_at}, expires_at=${story3.expires_at}`);

        // 5. Verify getHomeData query returns all 3 stories ordered chronologically (created_at ASC)
        const homeStoriesRes = await db.query(`
            SELECT 
                s.id, 
                s.user_id, 
                s.media_url, 
                s.media_type, 
                s.caption, 
                s.created_at, 
                s.expires_at, 
                u.username
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = TRUE AND s.expires_at > NOW() AND s.user_id = $1
            ORDER BY s.created_at ASC
        `, [userId]);

        console.log(`📋 Total active stories for user: ${homeStoriesRes.rows.length}`);
        if (homeStoriesRes.rows.length !== 3) {
            throw new Error(`Expected 3 stories, but got ${homeStoriesRes.rows.length}`);
        }

        // Verify chronological order
        const titles = homeStoriesRes.rows.map(r => r.caption);
        console.log('Story chronological sequence:', titles);
        if (titles[0] !== 'Story 1' || titles[1] !== 'Story 2' || titles[2] !== 'Story 3') {
            throw new Error('Stories are not in chronological order!');
        }
        console.log('✅ Chronological ordering verified: Story 1 -> Story 2 -> Story 3');

        // 6. Test Individual Story Expiry logic
        // Create an expired story (25 hours ago)
        await db.query(
            "INSERT INTO stories (user_id, media_url, media_type, caption, created_at, expires_at) VALUES ($1, '/uploads/expired.jpg', 'image', 'Expired Story', NOW() - INTERVAL '25 hours', NOW() - INTERVAL '1 hour')",
            [userId]
        );

        const unexpiredRes = await db.query(`
            SELECT id, caption FROM stories 
            WHERE is_active = TRUE AND expires_at > NOW() AND user_id = $1
            ORDER BY created_at ASC
        `, [userId]);

        console.log(`📋 Active unexpired stories count: ${unexpiredRes.rows.length} (Expired story excluded)`);
        if (unexpiredRes.rows.length !== 3) {
            throw new Error(`Expired story was not correctly excluded! Expected 3, got ${unexpiredRes.rows.length}`);
        }
        console.log('✅ Individual 24-hour expiry check passed.');

        // 7. Test Deleting one story in sequence (delete Story 2)
        await db.query("DELETE FROM stories WHERE id = $1", [story2.id]);
        const remainingRes = await db.query(`
            SELECT id, caption FROM stories 
            WHERE is_active = TRUE AND expires_at > NOW() AND user_id = $1
            ORDER BY created_at ASC
        `, [userId]);

        console.log('Remaining stories after deleting Story 2:', remainingRes.rows.map(r => r.caption));
        if (remainingRes.rows.length !== 2 || remainingRes.rows[0].id !== story1.id || remainingRes.rows[1].id !== story3.id) {
            throw new Error('Deletion did not preserve other stories correctly!');
        }
        console.log('✅ Single story deletion within multi-story sequence verified.');

        // Clean up test data
        await db.query("DELETE FROM stories WHERE user_id = $1", [userId]);
        await db.query("DELETE FROM users WHERE id = $1", [userId]);

        console.log('🎉 Multi-Story Backend Verification complete! All tests PASSED.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    }
}

testMultiStoryFlow();
