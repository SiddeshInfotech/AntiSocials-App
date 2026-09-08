require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');
const badgeService = require('../services/badgeService');

async function runBadgeTests() {
    console.log('--- STARTING DYNAMIC BADGE SYSTEM TESTS ---');
    let testUser;
    try {
        // 1. Create a test user
        const userRes = await db.query(`
            INSERT INTO users (username, email, phone_number, is_phone_verified, points, streak_count, longest_streak)
            VALUES ('badge_tester_${Date.now()}', 'badge_${Date.now()}@test.com', '9991${Date.now().toString().slice(-6)}', true, 0, 0, 0)
            RETURNING id, username
        `);
        testUser = userRes.rows[0];
        console.log(`✓ Test user created: ID ${testUser.id}, username: ${testUser.username}`);

        // 2. Fetch badges for fresh user
        let initialBadges = await badgeService.getUserBadges(testUser.id);
        const unlockedInitial = initialBadges.filter(b => b.isUnlocked);
        console.log(`✓ Fresh user initial unlocked badges count: ${unlockedInitial.length} (expected 0)`);
        if (unlockedInitial.length > 0) {
            throw new Error('Fresh user should have 0 unlocked badges!');
        }

        // 3. Complete 1 task -> Should unlock "First Step"
        await db.query(`INSERT INTO task_completions (user_id, task_name, points) VALUES ($1, 'Test Task 1', 100)`, [testUser.id]);

        let updatedBadges = await badgeService.getUserBadges(testUser.id);
        let firstStepBadge = updatedBadges.find(b => b.id === 'first_step');
        if (!firstStepBadge || !firstStepBadge.isUnlocked) {
            throw new Error('Completing 1 task failed to unlock "First Step" badge!');
        }
        console.log(`✓ "First Step" badge unlocked successfully after 1 task completion! (Unlocked at: ${firstStepBadge.unlockedAt})`);

        // 4. Verify user_badges DB persistence
        const dbBadgeCheck = await db.query('SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2', [testUser.id, 'first_step']);
        if (dbBadgeCheck.rows.length === 0) {
            throw new Error('Unlocked badge was not persisted in user_badges DB table!');
        }
        console.log(`✓ Verified persistence in user_badges DB table (id: ${dbBadgeCheck.rows[0].id})`);

        // 5. Complete 4 more tasks (total 5) -> Should unlock "Getting Started"
        for (let i = 2; i <= 5; i++) {
            await db.query(`INSERT INTO task_completions (user_id, task_name, points) VALUES ($1, $2, 100)`, [testUser.id, `Test Task ${i}`]);
        }

        updatedBadges = await badgeService.getUserBadges(testUser.id);
        let gettingStartedBadge = updatedBadges.find(b => b.id === 'getting_started');
        if (!gettingStartedBadge || !gettingStartedBadge.isUnlocked) {
            throw new Error('Completing 5 tasks failed to unlock "Getting Started" badge!');
        }
        console.log(`✓ "Getting Started" badge unlocked successfully after 5 tasks!`);

        // 6. Test Community Activity creation -> Should unlock "Community Starter"
        await db.query(`
            INSERT INTO activities (creator_id, category, title, description, date_str, time_str, location, capacity, status)
            VALUES ($1, 'Sports & Fitness', 'Badge Test Match', 'Testing', '25/08/2026', '06:00 PM', 'Stadium', 10, 'active')
        `, [testUser.id]);

        updatedBadges = await badgeService.getUserBadges(testUser.id);
        let commStarterBadge = updatedBadges.find(b => b.id === 'community_starter');
        if (!commStarterBadge || !commStarterBadge.isUnlocked) {
            throw new Error('Creating community failed to unlock "Community Starter" badge!');
        }
        console.log(`✓ "Community Starter" badge unlocked successfully after creating community activity!`);

        // 7. Test Locked badge progress tracking
        let centuryBadge = updatedBadges.find(b => b.id === 'century');
        console.log(`✓ "Century" badge progress correctly tracked: ${centuryBadge.progress}/${centuryBadge.maxProgress} (isUnlocked: ${centuryBadge.isUnlocked})`);
        if (centuryBadge.progress !== 5 || centuryBadge.isUnlocked !== false) {
            throw new Error(`Century badge progress mismatch! Expected 5/100 unlocked=false, got ${centuryBadge.progress} unlocked=${centuryBadge.isUnlocked}`);
        }

        console.log('\n========================================');
        console.log('🎉 DYNAMIC BADGE SYSTEM TESTS PASSED!');
        console.log('========================================\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Badge test failed:', err);
        process.exit(1);
    } finally {
        if (testUser && testUser.id) {
            await db.query('DELETE FROM user_badges WHERE user_id = $1', [testUser.id]).catch(() => {});
            await db.query('DELETE FROM task_completions WHERE user_id = $1', [testUser.id]).catch(() => {});
            await db.query('DELETE FROM points_history WHERE user_id = $1', [testUser.id]).catch(() => {});
            await db.query('DELETE FROM activities WHERE creator_id = $1', [testUser.id]).catch(() => {});
            await db.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
        }
    }
}

runBadgeTests();
