const db = require('../db');

async function testStoryViewersFlow() {
    try {
        console.log('🧪 Starting Story Viewers Flow Verification...');

        // 1. Create or ensure test author
        let authorRes = await db.query("SELECT id, username FROM users WHERE username = 'story_author_test'");
        let authorId;
        if (authorRes.rows.length === 0) {
            const newAuthor = await db.query(
                "INSERT INTO users (username, phone_number, image_url) VALUES ('story_author_test', '9999990001', '/uploads/author_pic.jpg') RETURNING id"
            );
            authorId = newAuthor.rows[0].id;
        } else {
            authorId = authorRes.rows[0].id;
        }

        // 2. Create or ensure test viewer 1 (with profile image)
        let viewer1Res = await db.query("SELECT id, username FROM users WHERE username = 'viewer_with_pic'");
        let viewer1Id;
        if (viewer1Res.rows.length === 0) {
            const v1 = await db.query(
                "INSERT INTO users (username, phone_number, image_url) VALUES ('viewer_with_pic', '9999990002', '/uploads/profile_viewer1.jpeg') RETURNING id"
            );
            viewer1Id = v1.rows[0].id;
        } else {
            viewer1Id = viewer1Res.rows[0].id;
            await db.query("UPDATE users SET image_url = '/uploads/profile_viewer1.jpeg' WHERE id = $1", [viewer1Id]);
        }

        // 3. Create or ensure test viewer 2 (without profile image)
        let viewer2Res = await db.query("SELECT id, username FROM users WHERE username = 'viewer_no_pic'");
        let viewer2Id;
        if (viewer2Res.rows.length === 0) {
            const v2 = await db.query(
                "INSERT INTO users (username, phone_number, image_url) VALUES ('viewer_no_pic', '9999990003', NULL) RETURNING id"
            );
            viewer2Id = v2.rows[0].id;
        } else {
            viewer2Id = viewer2Res.rows[0].id;
            await db.query("UPDATE users SET image_url = NULL WHERE id = $1", [viewer2Id]);
        }

        // 4. Create a test story for the author
        const storyInsert = await db.query(
            "INSERT INTO stories (user_id, media_url, media_type, caption) VALUES ($1, '/uploads/test_story.jpg', 'image', 'Viewer Test Story') RETURNING id",
            [authorId]
        );
        const storyId = storyInsert.rows[0].id;
        console.log(`✅ Created test story id=${storyId} for authorId=${authorId}`);

        // 5. Add views for both viewer 1 and viewer 2
        await db.query(
            "INSERT INTO story_views (story_id, viewer_user_id, viewed_at) VALUES ($1, $2, NOW() - INTERVAL '5 minutes') ON CONFLICT (story_id, viewer_user_id) DO NOTHING",
            [storyId, viewer1Id]
        );
        await db.query(
            "INSERT INTO story_views (story_id, viewer_user_id, viewed_at) VALUES ($1, $2, NOW()) ON CONFLICT (story_id, viewer_user_id) DO NOTHING",
            [storyId, viewer2Id]
        );
        await db.query("UPDATE stories SET view_count = 2 WHERE id = $1", [storyId]);

        // 6. Test the updated query from homeController.getStoryViewers
        const viewersRes = await db.query(`
            SELECT 
                u.id as user_id, 
                u.username, 
                u.image_url as profile_image, 
                u.image_url as image_url,
                u.image_url as avatar_url,
                sv.viewed_at
            FROM story_views sv
            JOIN users u ON sv.viewer_user_id = u.id
            WHERE sv.story_id = $1
            ORDER BY sv.viewed_at DESC
        `, [storyId]);

        console.log('📊 Query Results:', JSON.stringify(viewersRes.rows, null, 2));

        if (viewersRes.rows.length !== 2) {
            throw new Error(`Expected 2 viewers, got ${viewersRes.rows.length}`);
        }

        const v1Result = viewersRes.rows.find(v => v.user_id === viewer1Id);
        const v2Result = viewersRes.rows.find(v => v.user_id === viewer2Id);

        if (!v1Result) throw new Error('Viewer 1 not found in results');
        if (!v2Result) throw new Error('Viewer 2 not found in results');

        if (v1Result.profile_image !== '/uploads/profile_viewer1.jpeg' || v1Result.image_url !== '/uploads/profile_viewer1.jpeg') {
            throw new Error(`Viewer 1 profile image mismatch: ${JSON.stringify(v1Result)}`);
        }
        console.log('✅ Viewer 1 profile picture correctly returned:', v1Result.profile_image);

        if (v2Result.profile_image !== null || v2Result.image_url !== null) {
            throw new Error(`Viewer 2 profile image should be null: ${JSON.stringify(v2Result)}`);
        }
        console.log('✅ Viewer 2 (no picture) correctly returns null:', v2Result.profile_image);

        // 7. Cleanup test data
        await db.query('DELETE FROM stories WHERE id = $1', [storyId]);
        await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [authorId, viewer1Id, viewer2Id]);
        console.log('🧹 Cleaned up test records');

        console.log('🎉 Story viewers query and profile image flow verification passed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    }
}

testStoryViewersFlow();
