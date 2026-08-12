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

async function runTaskLifecycleTest() {
    const server = app.listen(5097, '127.0.0.1', async () => {
        console.log('🚀 Task Completion Lifecycle Test Server running on port 5097\n');

        try {
            // 1. Create or get test user
            let userRes = await db.query("SELECT id, username, email FROM users WHERE email = 'test_lifecycle@antisocial.app'");
            let testUser;
            if (userRes.rows.length === 0) {
                const insUser = await db.query(
                    "INSERT INTO users (username, email, phone_number, points, streak_count) VALUES ('test_lifecycle_user', 'test_lifecycle@antisocial.app', '+919999999993', 0, 0) RETURNING id, username, email"
                );
                testUser = insUser.rows[0];
            } else {
                testUser = userRes.rows[0];
            }

            // Clean slate for test user
            await db.query('DELETE FROM points_history WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM task_completions WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM user_tasks WHERE user_id = $1', [testUser.id]);
            await db.query('UPDATE users SET points = 0, streak_count = 0, longest_streak = 0, last_streak_date = NULL WHERE id = $1', [testUser.id]);

            const token = jwt.sign({ id: testUser.id, username: testUser.username, email: testUser.email }, process.env.JWT_SECRET || 'your_secret_key_here');

            const http = require('http');
            function reqPost(path, payload) {
                return new Promise((resolve, reject) => {
                    const data = JSON.stringify(payload);
                    const r = http.request({
                        hostname: '127.0.0.1',
                        port: 5097,
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
                        port: 5097,
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

            // Test 1: First Completion of Drink Water
            console.log('--- TEST 1: Drink a glass of water mindfully (First Completion) ---');
            const comp1 = await reqPost('/api/tasks/complete', { task_name: 'Drink a glass of water mindfully' });
            console.log('Result 1:', JSON.stringify(comp1.data));
            if (comp1.data.pointsEarned !== 100 || comp1.data.rewardClaimed !== true || comp1.data.totalPoints !== 100) {
                throw new Error('Test 1 failed: reward not claimed or points wrong');
            }

            // Verify Home API
            const home1 = await reqGet('/api/home');
            console.log('Home completedTasks:', home1.data.completedTasks);
            const waterTask = home1.data.tasks.find(t => t.title.toLowerCase().includes('water'));
            console.log('Water task item in Home API:', waterTask);
            if (waterTask && !waterTask.is_completed) {
                throw new Error('Water task should be marked is_completed: true in Home API tasks array');
            }
            if (home1.data.total_points !== 100) {
                throw new Error(`Home total_points mismatch: expected 100, got ${home1.data.total_points}`);
            }
            console.log('✅ TEST 1 PASSED: First completion marked as completed with +100 points\n');

            // Test 2: Second Attempt of Drink Water (Duplicate)
            console.log('--- TEST 2: Drink a glass of water mindfully (Second Attempt / Duplicate) ---');
            const comp2 = await reqPost('/api/tasks/complete', { task_name: 'Drink a glass of water mindfully' });
            console.log('Result 2:', JSON.stringify(comp2.data));
            if (comp2.data.pointsEarned !== 0 || comp2.data.rewardClaimed !== false || comp2.data.totalPoints !== 100) {
                throw new Error('Test 2 failed: duplicate should yield 0 points and rewardClaimed: false');
            }

            const home2 = await reqGet('/api/home');
            if (home2.data.total_points !== 100) {
                throw new Error(`Home total_points mismatch after duplicate: expected 100, got ${home2.data.total_points}`);
            }
            console.log('✅ TEST 2 PASSED: Duplicate attempt awarded 0 points and Home total remained 100\n');

            // Test 3: Complete Medium Task (Calm Breath)
            console.log('--- TEST 3: Calm Breath (Medium Task) ---');
            const comp3 = await reqPost('/api/tasks/complete', { task_name: 'Calm Breath' });
            console.log('Result 3:', JSON.stringify(comp3.data));
            if (comp3.data.pointsEarned !== 300 || comp3.data.totalPoints !== 400) {
                throw new Error('Test 3 failed: medium task should award 300 points');
            }

            const home3 = await reqGet('/api/home');
            if (home3.data.total_points !== 400) {
                throw new Error(`Home total_points mismatch: expected 400, got ${home3.data.total_points}`);
            }
            console.log('✅ TEST 3 PASSED: Medium task completion updated Home points to 400\n');

            // Test 4: Complete Hard Task (Courage Unlock)
            console.log('--- TEST 4: Courage Unlock (Hard Task) ---');
            const comp4 = await reqPost('/api/tasks/complete', { task_name: 'Courage Unlock' });
            console.log('Result 4:', JSON.stringify(comp4.data));
            if (comp4.data.pointsEarned !== 600 || comp4.data.totalPoints !== 1000) {
                throw new Error('Test 4 failed: hard task should award 600 points');
            }

            const home4 = await reqGet('/api/home');
            if (home4.data.total_points !== 1000) {
                throw new Error(`Home total_points mismatch: expected 1000, got ${home4.data.total_points}`);
            }
            console.log('✅ TEST 4 PASSED: Hard task completion updated Home points to 1000\n');

            // Test 5: Re-login / Refresh Persistence
            console.log('--- TEST 5: Refresh / Re-login Persistence ---');
            const sum5 = await reqGet('/api/user/summary');
            const home5 = await reqGet('/api/home');
            if (sum5.data.points !== 1000 || home5.data.total_points !== 1000) {
                throw new Error('Test 5 failed: points did not persist');
            }
            console.log('✅ TEST 5 PASSED: Points and completed status remain fully persisted on refresh\n');

            // Clean up
            await db.query('DELETE FROM points_history WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM task_completions WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM user_tasks WHERE user_id = $1', [testUser.id]);
            await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);

            console.log('🎉🎉🎉 ALL TASK COMPLETION AND REWARD TESTS PASSED WITH 100% SUCCESS!');
            server.close();
            process.exit(0);
        } catch (e) {
            console.error('❌ Test failed:', e);
            server.close();
            process.exit(1);
        }
    });
}

runTaskLifecycleTest();
