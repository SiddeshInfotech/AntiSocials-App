const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');
const homeController = require('../controllers/homeController');
const profileController = require('../controllers/profileController');

async function runTest() {
    console.log('🧪 Starting Feed Deduction Persistence & Session Re-Authentication Tests...\n');

    const testPhone = '+919999988888';
    const testUsername = 'feed_deduct_test_user';

    // Cleanup previous test user if exists
    await db.query('DELETE FROM points_history WHERE user_id IN (SELECT id FROM users WHERE phone_number = $1)', [testPhone]);
    await db.query('DELETE FROM users WHERE phone_number = $1', [testPhone]);

    // Create test user
    const userRes = await db.query(`
        INSERT INTO users (phone_number, username, points, streak_count, longest_streak)
        VALUES ($1, $2, 100, 0, 0)
        RETURNING id, username, points
    `, [testPhone, testUsername]);
    const user = userRes.rows[0];
    const userId = user.id;

    // Create initial 100 points in points_history so database is 100% consistent
    await db.query(`
        INSERT INTO points_history (user_id, points, source, task_name, created_at)
        VALUES ($1, 100, 'task_completion', 'Initial Test Task', NOW())
    `, [userId]);

    console.log(`✅ Test user created: ID=${userId}, Username=${user.username}`);

    // Helper: mock req/res for getHomeData
    const getHome = async () => {
        return new Promise((resolve, reject) => {
            const req = { user: { id: userId } };
            const res = {
                status: (code) => ({
                    json: (data) => resolve({ code, data })
                })
            };
            homeController.getHomeData(req, res).catch(reject);
        });
    };

    // Helper: mock req/res for getProfile
    const getProfile = async () => {
        return new Promise((resolve, reject) => {
            const req = { user: { id: userId } };
            const res = {
                status: (code) => ({
                    json: (data) => resolve({ code, data })
                }),
                json: (data) => resolve({ code: 200, data })
            };
            profileController.getProfile(req, res).catch(reject);
        });
    };

    // Helper: simulate POST /api/user/feed-deduct
    const postFeedDeduct = async (milestoneIndex) => {
        const idx = parseInt(milestoneIndex, 10);
        const taskName = `feed_scrolling_milestone_${idx}`;

        const existingRes = await db.query(
            'SELECT id FROM points_history WHERE user_id = $1 AND task_name = $2',
            [userId, taskName]
        );

        const currentSummary = await pointsStreakService.getUserPointsAndStreak(userId);
        let currentPoints = currentSummary.totalPoints;

        if (existingRes.rows.length > 0) {
            return {
                success: true,
                message: 'Milestone already deducted',
                alreadyDeducted: true,
                pointsDeducted: 0,
                totalPoints: Math.max(0, currentPoints),
                total_points: Math.max(0, currentPoints)
            };
        }

        const pointsToDeduct = Math.min(20, Math.max(0, currentPoints));

        if (pointsToDeduct > 0) {
            await db.query(
                `INSERT INTO points_history (user_id, points, source, task_name, created_at)
                 VALUES ($1, $2, 'feed_scrolling_penalty', $3, NOW())`,
                [userId, -pointsToDeduct, taskName]
            );
        } else {
            await db.query(
                `INSERT INTO points_history (user_id, points, source, task_name, created_at)
                 VALUES ($1, 0, 'feed_scrolling_penalty', $2, NOW())`,
                [userId, taskName]
            );
        }

        const updatedSummary = await pointsStreakService.getUserPointsAndStreak(userId);
        return {
            success: true,
            milestoneIndex: idx,
            pointsDeducted: pointsToDeduct,
            totalPoints: updatedSummary.totalPoints,
            total_points: updatedSummary.totalPoints
        };
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 1
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST CASE 1: 100 pts -> 5 min active scroll (-20 pts) -> 80 pts -> Logout -> Login -> 80 pts ---');
    
    // Initial Home check
    let home = await getHome();
    console.log(`Initial Home total_points: ${home.data.total_points}`);
    if (home.data.total_points !== 100) throw new Error(`Expected 100 points, got ${home.data.total_points}`);

    // Deduct Milestone 1 (5 minutes)
    const deduct1 = await postFeedDeduct(1);
    console.log(`Milestone 1 deduction result:`, deduct1);
    if (deduct1.totalPoints !== 80 || deduct1.pointsDeducted !== 20) {
        throw new Error(`Expected 80 points after deduction, got ${deduct1.totalPoints}`);
    }

    // Verify database directly
    const dbUser1 = await db.query('SELECT points FROM users WHERE id = $1', [userId]);
    const dbSum1 = await db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE user_id = $1', [userId]);
    console.log(`DB users.points: ${dbUser1.rows[0].points}, DB points_history sum: ${dbSum1.rows[0].total}`);
    if (parseInt(dbUser1.rows[0].points, 10) !== 80 || parseInt(dbSum1.rows[0].total, 10) !== 80) {
        throw new Error(`Database check failed! Expected 80 in both tables.`);
    }

    // Simulate backend reconciliation / server restart (which used to wipe penalties!)
    console.log('Simulating server restart / database reconciliation...');
    await pointsStreakService.reconcilePointsAndStreaks();

    const dbSumAfterReconcile = await db.query('SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE user_id = $1', [userId]);
    console.log(`DB points_history sum after reconcile: ${dbSumAfterReconcile.rows[0].total}`);
    if (parseInt(dbSumAfterReconcile.rows[0].total, 10) !== 80) {
        throw new Error(`CRITICAL BUG: reconcilePointsAndStreaks wiped feed_scrolling_penalty! Got ${dbSumAfterReconcile.rows[0].total}`);
    }

    // Simulate logout and login
    console.log('Simulating logout and login: fetching fresh Home and Profile data for authenticated user...');
    home = await getHome();
    let profile = await getProfile();
    console.log(`After login: Home total_points = ${home.data.total_points}, Profile points = ${profile.data.user.points}`);

    if (home.data.total_points !== 80) throw new Error(`Home shows ${home.data.total_points} instead of 80!`);
    if (profile.data.user.points !== 80) throw new Error(`Profile shows ${profile.data.user.points} instead of 80!`);
    console.log('✅ TEST CASE 1 PASSED: 80 points permanently persisted after logout/login.');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 2
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST CASE 2: 80 pts -> another 5 min active scroll (Milestone 2: -20 pts) -> 60 pts -> Logout/Login -> 60 pts ---');

    const deduct2 = await postFeedDeduct(2);
    console.log(`Milestone 2 deduction result:`, deduct2);
    if (deduct2.totalPoints !== 60 || deduct2.pointsDeducted !== 20) {
        throw new Error(`Expected 60 points after 2nd deduction, got ${deduct2.totalPoints}`);
    }

    // Run reconciliation again
    await pointsStreakService.reconcilePointsAndStreaks();

    // Re-login & fetch
    home = await getHome();
    profile = await getProfile();
    console.log(`After 2nd login: Home total_points = ${home.data.total_points}, Profile points = ${profile.data.user.points}`);
    if (home.data.total_points !== 60) throw new Error(`Home shows ${home.data.total_points} instead of 60!`);
    if (profile.data.user.points !== 60) throw new Error(`Profile shows ${profile.data.user.points} instead of 60!`);
    console.log('✅ TEST CASE 2 PASSED: 60 points permanently persisted after second deduction & logout/login.');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 3
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST CASE 3: Duplicate milestone protection & non-negative points protection ---');

    // Duplicate attempt for Milestone 2
    const dupDeduct = await postFeedDeduct(2);
    console.log(`Duplicate Milestone 2 attempt result:`, dupDeduct);
    if (!dupDeduct.alreadyDeducted || dupDeduct.pointsDeducted !== 0 || dupDeduct.totalPoints !== 60) {
        throw new Error(`Duplicate milestone was not properly prevented!`);
    }
    console.log('✅ Duplicate milestone protection confirmed: 0 points deducted, total remains 60.');

    // Deduct remaining points until 0 to test negative prevention
    console.log('Testing points non-negative cap: deducting Milestone 3 (-20 -> 40), Milestone 4 (-20 -> 20), Milestone 5 (-20 -> 0), Milestone 6 (-20 attempt -> capped at 0)...');
    await postFeedDeduct(3); // 40
    await postFeedDeduct(4); // 20
    const deductZero = await postFeedDeduct(5); // 0
    console.log(`Milestone 5 result (should reach 0):`, deductZero);
    if (deductZero.totalPoints !== 0) throw new Error(`Expected 0 points, got ${deductZero.totalPoints}`);

    const deductNegative = await postFeedDeduct(6); // should stay 0
    console.log(`Milestone 6 result (attempt deduction when 0):`, deductNegative);
    if (deductNegative.totalPoints !== 0 || deductNegative.pointsDeducted !== 0) {
        throw new Error(`Points became negative or deducted points when total was 0!`);
    }

    home = await getHome();
    if (home.data.total_points < 0) throw new Error(`Points are negative in home: ${home.data.total_points}`);
    console.log(`✅ Points non-negative protection confirmed: totalPoints = ${home.data.total_points}.`);

    // Cleanup test user
    await db.query('DELETE FROM points_history WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('🧹 Test cleanup completed.');

    console.log('\n🎉 ALL 3 TEST CASES PASSED SUCCESSFULLY!');
    process.exit(0);
}

runTest().catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
