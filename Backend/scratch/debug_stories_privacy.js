const db = require('../db');

async function debugStoriesPrivacy() {
    try {
        console.log("==========================================");
        console.log("🔍 DEBUGGING STORIES PRIVACY & CONNECTIONS");
        console.log("==========================================");

        // 1. Fetch all users
        const usersRes = await db.query('SELECT id, username, email FROM users ORDER BY id ASC');
        console.log("\n👥 USERS IN DATABASE:");
        console.table(usersRes.rows);

        // 2. Fetch all user_connections
        const connRes = await db.query('SELECT id, user_id, friend_id, status, created_at FROM user_connections ORDER BY id ASC');
        console.log("\n🤝 USER CONNECTIONS IN DATABASE:");
        console.table(connRes.rows);

        // 3. Fetch all active stories
        const storiesRes = await db.query(`
            SELECT s.id, s.user_id, u.username, s.is_active, s.expires_at, s.created_at
            FROM stories s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.id ASC
        `);
        console.log("\n📖 ALL STORIES IN DATABASE:");
        console.table(storiesRes.rows);

        // 4. Test query for each user in database
        for (const user of usersRes.rows) {
            const uId = user.id;

            // Accepted connections query
            const acceptedConnRes = await db.query(`
                SELECT CASE WHEN c.user_id = $1 THEN c.friend_id ELSE c.user_id END as connected_user_id,
                       c.status
                FROM user_connections c
                WHERE (c.user_id = $1 OR c.friend_id = $1)
                  AND (LOWER(c.status) = 'accepted' OR LOWER(c.status) = 'connected')
            `, [uId]);

            const connectedUserIds = acceptedConnRes.rows.map(r => r.connected_user_id);

            // Stories returned query
            const userStoriesRes = await db.query(`
                SELECT 
                    s.id, 
                    s.user_id, 
                    u.username,
                    s.expires_at
                FROM stories s
                JOIN users u ON s.user_id = u.id
                WHERE s.is_active = TRUE 
                  AND s.expires_at > NOW()
                  AND (
                      s.user_id = $1 
                      OR s.user_id IN (
                          SELECT CASE WHEN c.user_id = $1 THEN c.friend_id ELSE c.user_id END
                          FROM user_connections c
                          WHERE (c.user_id = $1 OR c.friend_id = $1)
                            AND (LOWER(c.status) = 'accepted' OR LOWER(c.status) = 'connected')
                      )
                  )
                ORDER BY s.created_at ASC
            `, [uId]);

            console.log(`\n🔍 [USER ID ${uId} - ${user.username}]`);
            console.log(`   Accepted Connection IDs: [${connectedUserIds.join(', ')}]`);
            console.log(`   Stories Returned Count: ${userStoriesRes.rows.length}`);
            userStoriesRes.rows.forEach(s => {
                console.log(`   -> Story #${s.id} owned by User ${s.user_id} (${s.username})`);
            });
        }

        console.log("\n==========================================");
        process.exit(0);
    } catch (err) {
        console.error("❌ Debug script error:", err);
        process.exit(1);
    }
}

debugStoriesPrivacy();
