const db = require('./db.js');

async function debug() {
    try {
        console.log('=== DEBUGGING STREAK & POINTS ===\n');

        // 1. Check tasks table
        const tasks = await db.query('SELECT id, title, points_reward FROM tasks ORDER BY id');
        console.log('TASKS in DB:', tasks.rows);

        // 2. Check users
        const users = await db.query('SELECT id, username, streak_count, last_streak_date FROM users');
        console.log('\nUSERS:', users.rows);

        if (users.rows.length === 0) {
            console.log('NO USERS FOUND - nothing to debug');
            process.exit(0);
        }

        const userId = users.rows[0].id;
        console.log('\nUsing user_id:', userId);

        // 3. Check user_tasks
        const userTasks = await db.query('SELECT * FROM user_tasks WHERE user_id = $1', [userId]);
        console.log('\nUSER_TASKS:', userTasks.rows);

        // 4. Check points_history
        const points = await db.query('SELECT * FROM points_history WHERE user_id = $1', [userId]);
        console.log('\nPOINTS_HISTORY:', points.rows);

        // 5. Check total points
        const totalPts = await db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE user_id = $1', [userId]);
        console.log('\nTOTAL POINTS:', totalPts.rows[0].total);

        // 6. Check completed count
        const completed = await db.query("SELECT COUNT(*) as count FROM user_tasks WHERE user_id = $1 AND status = 'completed'", [userId]);
        console.log('COMPLETED TASKS:', completed.rows[0].count);
        console.log('STREAK SHOULD BE:', Math.floor(parseInt(completed.rows[0].count) / 7));

        // 7. Check what getHomeData would return
        const homeRes = await db.query('SELECT id, username, email, image_url, streak_count, last_streak_date FROM users WHERE id = $1', [userId]);
        console.log('\nHOME USER DATA:', homeRes.rows[0]);

        console.log('\n=== END DEBUG ===');
        process.exit(0);
    } catch(e) {
        console.error('DEBUG ERROR:', e);
        process.exit(1);
    }
}
debug();
