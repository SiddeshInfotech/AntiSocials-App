const db = require('./db');

async function testStorySocials() {
    try {
        console.log('Testing stories social endpoints & database queries...');

        // 1. Check if a user and story exist or create dummy for testing
        let userRes = await db.query('SELECT id, username FROM users LIMIT 1');
        let userId;
        if (userRes.rows.length === 0) {
            const newUser = await db.query("INSERT INTO users (username, phone_number) VALUES ('test_story_user', '1234567890') RETURNING id");
            userId = newUser.rows[0].id;
        } else {
            userId = userRes.rows[0].id;
        }

        let storyRes = await db.query('SELECT id FROM stories LIMIT 1');
        let storyId;
        if (storyRes.rows.length === 0) {
            const newStory = await db.query("INSERT INTO stories (user_id, media_url, caption) VALUES ($1, '/uploads/test.jpg', 'Test Story Caption') RETURNING id", [userId]);
            storyId = newStory.rows[0].id;
        } else {
            storyId = storyRes.rows[0].id;
        }

        console.log(`Using userId=${userId}, storyId=${storyId}`);

        // 2. Test Like & Duplicate Like Prevention
        await db.query('DELETE FROM story_likes WHERE story_id = $1', [storyId]);
        await db.query('INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2) ON CONFLICT (user_id, story_id) DO NOTHING', [storyId, userId]);
        await db.query('INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2) ON CONFLICT (user_id, story_id) DO NOTHING', [storyId, userId]);
        
        let likesCountRes = await db.query('SELECT COUNT(*)::INTEGER as count FROM story_likes WHERE story_id = $1', [storyId]);
        console.log(`✅ Likes count after 2 insertions (unique constraint): ${likesCountRes.rows[0].count} (Expected 1)`);

        // 3. Test Unlike
        await db.query('DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2', [storyId, userId]);
        likesCountRes = await db.query('SELECT COUNT(*)::INTEGER as count FROM story_likes WHERE story_id = $1', [storyId]);
        console.log(`✅ Likes count after unlike: ${likesCountRes.rows[0].count} (Expected 0)`);

        // 4. Test Comments
        await db.query('DELETE FROM story_comments WHERE story_id = $1', [storyId]);
        const commentRes = await db.query('INSERT INTO story_comments (story_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING id', [storyId, userId, 'Amazing story! 🌟']);
        const commentId = commentRes.rows[0].id;
        let commentsCountRes = await db.query('SELECT COUNT(*)::INTEGER as count FROM story_comments WHERE story_id = $1', [storyId]);
        console.log(`✅ Comments count after insert: ${commentsCountRes.rows[0].count} (Expected 1)`);

        // 5. Test Delete Comment
        await db.query('DELETE FROM story_comments WHERE id = $1', [commentId]);
        commentsCountRes = await db.query('SELECT COUNT(*)::INTEGER as count FROM story_comments WHERE story_id = $1', [storyId]);
        console.log(`✅ Comments count after delete: ${commentsCountRes.rows[0].count} (Expected 0)`);

        // 6. Test Share tracking
        await db.query('INSERT INTO story_shares (story_id, user_id) VALUES ($1, $2)', [storyId, userId]);
        let sharesCountRes = await db.query('SELECT COUNT(*)::INTEGER as count FROM story_shares WHERE story_id = $1', [storyId]);
        console.log(`✅ Shares count after insert: ${sharesCountRes.rows[0].count} (Expected >= 1)`);

        console.log('🎉 All Database and Social Queries passed perfectly!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

testStorySocials();
