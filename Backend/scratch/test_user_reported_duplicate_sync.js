const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');
const homeRoutes = require('../routes/homeRoutes');

const app = express();
app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/tasks/complete', authenticateToken, async (req, res) => {
    const task_name = req.body.task_name || req.body.taskName || req.body.taskTitle || req.body.title;
    const reqTaskId = req.body.taskId || req.body.task_id || req.body.id;
    const userId = parseInt(req.user.id, 10);

    if (!task_name && !reqTaskId) {
        return res.status(400).json({ error: "task_name or taskId is required" });
    }

    try {
        let taskDb = null;
        if (reqTaskId) {
            taskDb = await db.query('SELECT id, title FROM tasks WHERE id = $1', [reqTaskId]);
        }
        if (!taskDb || taskDb.rows.length === 0) {
            taskDb = await db.query('SELECT id, title FROM tasks WHERE title = $1', [task_name]);
        }
        if (taskDb.rows.length === 0 && task_name) {
            taskDb = await db.query('SELECT id, title FROM tasks WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))', [task_name]);
        }

        const resolvedTaskId = reqTaskId ? parseInt(reqTaskId, 10) : (taskDb && taskDb.rows[0] ? taskDb.rows[0].id : null);
        const rewardResult = await pointsStreakService.recordTaskCompletionAndAwardPoints({
            userId,
            taskName: task_name || (taskDb && taskDb.rows[0] ? taskDb.rows[0].title : ''),
            taskId: resolvedTaskId,
            source: 'task_completion'
        });

        return res.status(200).json(rewardResult);
    } catch (err) {
        console.error("Task completion error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/user/summary', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const summary = await pointsStreakService.getUserPointsAndStreak(userId);
        res.json({
            points: summary.totalPoints,
            total_points: summary.totalPoints,
            totalPoints: summary.totalPoints,
            streak: summary.currentStreak,
            currentStreak: summary.currentStreak,
            current_streak: summary.currentStreak,
            longestStreak: summary.longestStreak,
            completedTasks: summary.completedTasks,
            completed_tasks: summary.completedCount
        });
    } catch (error) {
        console.error('User summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('/api/home', homeRoutes);

async function runTest() {
    const server = app.listen(5098, '127.0.0.1', async () => {
        console.log('🚀 Running User Reported Sync Issue Test on port 5098\n');
        try {
            // Setup test user
            let userRes = await db.query("SELECT id, username, email FROM users WHERE email = 'test_sync_report@antisocial.app'");
            let testUser;
            if (userRes.rows.length === 0) {
                const ins = await db.query(
                    "INSERT INTO users (username, email, phone_number, points, streak_count) VALUES ('sync_user', 'test_sync_report@antisocial.app', '+919999999992', 0, 0) RETURNING id, username, email"
                );
                testUser = ins.rows[0];
            } else {
                testUser = userRes.rows[0];
            }

            // Clean slate
            await db.query('DELETE FROM points_history WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM task_completions WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM user_tasks WHERE user_id = $1', [testUser.id]);
            await db.query('UPDATE users SET points = 0, streak_count = 0 WHERE id = $1', [testUser.id]);

            const token = jwt.sign({ id: testUser.id, username: testUser.username, email: testUser.email }, process.env.JWT_SECRET || 'your_secret_key_here');

            const http = require('http');
            function reqPost(path, payload) {
                return new Promise((resolve, reject) => {
                    const data = JSON.stringify(payload);
                    const r = http.request({
                        hostname: '127.0.0.1',
                        port: 5098,
                        path,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(data),
                            'Authorization': `Bearer ${token}`
                        }
                    }, (res) => {
                        let b = '';
                        res.on('data', chunk => b += chunk);
                        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
                    });
                    r.on('error', reject);
                    r.write(data);
                    r.end();
                });
            }

            function reqGet(path) {
                return new Promise((resolve, reject) => {
                    const r = http.request({
                        hostname: '127.0.0.1',
                        port: 5098,
                        path,
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }, (res) => {
                        let b = '';
                        res.on('data', chunk => b += chunk);
                        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
                    });
                    r.on('error', reject);
                    r.end();
                });
            }

            // 1. Complete "Notice Fear"
            console.log('1. Completing "Notice Fear"...');
            const res1 = await reqPost('/api/tasks/complete', { task_name: 'Notice Fear' });
            console.log('Res 1:', res1.data.completedTasks);

            // 2. Complete "Remove Distraction"
            console.log('\n2. Completing "Remove Distraction"...');
            const res2 = await reqPost('/api/tasks/complete', { task_name: 'Remove Distraction' });
            console.log('Res 2:', res2.data.completedTasks);

            // 3. Complete "Drink a glass of water mindfully" First Time
            console.log('\n3. Completing "Drink a glass of water mindfully" (First Time)...');
            const res3 = await reqPost('/api/tasks/complete', { task_name: 'Drink a glass of water mindfully' });
            console.log('Res 3:', res3.data.completedTasks);
            console.log('Total Points:', res3.data.totalPoints);

            // 4. Duplicate Completion of "Drink a glass of water mindfully" (Exact user scenario!)
            console.log('\n4. Attempting Duplicate completion of "Drink a glass of water mindfully"...');
            const res4 = await reqPost('/api/tasks/complete', { task_name: 'Drink a glass of water mindfully' });
            console.log('Res 4 Message:', res4.data.message);
            console.log('Res 4 RewardClaimed:', res4.data.rewardClaimed);
            console.log('Res 4 completedTasks:', res4.data.completedTasks);

            if (res4.data.message !== 'Reward already claimed') {
                throw new Error('Expected message "Reward already claimed"');
            }
            if (!res4.data.completedTasks.some(t => t.toLowerCase().includes('drink') || t.toLowerCase().includes('water'))) {
                throw new Error('CRITICAL FAILURE: completedTasks in duplicate response DOES NOT contain "Drink a glass of water mindfully"!');
            }

            // 5. Test GET /api/home
            console.log('\n5. Checking GET /api/home...');
            const homeRes = await reqGet('/api/home');
            console.log('Home completedTasks:', homeRes.data.completedTasks);
            console.log('Home total_points:', homeRes.data.total_points);
            
            const hasWater = homeRes.data.completedTasks.some(t => t.toLowerCase().includes('water') || t.toLowerCase().includes('drink'));
            const hasFear = homeRes.data.completedTasks.some(t => t.toLowerCase().includes('fear'));
            const hasDistraction = homeRes.data.completedTasks.some(t => t.toLowerCase().includes('distraction'));

            console.log(`Verification: hasWater=${hasWater}, hasFear=${hasFear}, hasDistraction=${hasDistraction}`);
            if (!hasWater || !hasFear || !hasDistraction) {
                throw new Error('GET /api/home is missing one of the 3 completed tasks!');
            }

            // 6. Test GET /api/user/summary
            console.log('\n6. Checking GET /api/user/summary...');
            const summaryRes = await reqGet('/api/user/summary');
            console.log('Summary completedTasks:', summaryRes.data.completedTasks);
            if (!summaryRes.data.completedTasks.some(t => t.toLowerCase().includes('water') || t.toLowerCase().includes('drink'))) {
                throw new Error('GET /api/user/summary is missing water task!');
            }

            // Clean up
            await db.query('DELETE FROM points_history WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM task_completions WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM user_tasks WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);

            console.log('\n✅✅✅ TEST COMPLETED SUCCESSFULLY! All 3 tasks correctly returned in completedTasks on duplicate and refresh!');
            server.close();
            process.exit(0);
        } catch (e) {
            console.error('❌ Test failed:', e);
            server.close();
            process.exit(1);
        }
    });
}

runTest();
