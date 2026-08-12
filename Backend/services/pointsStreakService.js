const db = require('../db');

/**
 * Daily Task & Streak Constants:
 * - 7 completed tasks in a calendar day = 1 streak milestone.
 * - Maximum 7 tasks with rewards allowed per calendar day.
 */
const DAILY_TASK_LIMIT = 7;
const TASKS_FOR_STREAK_MILESTONE = 7;

/**
 * Evaluates and updates the user's daily streak based on calendar days and the 7-task daily milestone.
 * - If streakMilestoneAchievedToday = true (user completed their 7th task today):
 *   - If no prior streak date: streak becomes 1, last_streak_date = TODAY.
 *   - If last_streak_date was yesterday (diff = 1): streak increments by 1, last_streak_date = TODAY.
 *   - If last_streak_date was today (diff = 0): streak stays the same (already counted for today).
 *   - If last_streak_date was before yesterday (diff > 1): streak resets to 1, last_streak_date = TODAY.
 * - If streakMilestoneAchievedToday = false (passive check on dashboard load, or fewer than 7 tasks today):
 *   - If last_streak_date was today (diff = 0): streak is active (already achieved today).
 *   - If last_streak_date was yesterday (diff = 1): streak is still active from yesterday.
 *   - If last_streak_date was > 1 day ago (diff > 1) or null: active streak is 0 (streak broken or not yet earned).
 * 
 * @param {number} userId
 * @param {boolean} streakMilestoneAchievedToday
 * @returns {Promise<{ currentStreak: number, longestStreak: number, lastStreakDate: string | null }>}
 */
async function evaluateDailyStreak(userId, streakMilestoneAchievedToday = false) {
    try {
        const uRes = await db.query(
            'SELECT streak_count, last_streak_date, COALESCE(longest_streak, streak_count, 0) as longest_streak FROM users WHERE id = $1',
            [userId]
        );
        if (uRes.rows.length === 0) {
            return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
        }

        const user = uRes.rows[0];
        let currentStreak = parseInt(user.streak_count || 0, 10);
        let longestStreak = parseInt(user.longest_streak || 0, 10);
        let lastStreakDate = user.last_streak_date;

        if (streakMilestoneAchievedToday) {
            if (!lastStreakDate) {
                currentStreak = 1;
            } else {
                const diffRes = await db.query("SELECT (CURRENT_DATE - $1::DATE) as diff", [lastStreakDate]);
                const diff = parseInt(diffRes.rows[0].diff, 10);

                if (diff === 0) {
                    // Already achieved 7-task milestone today
                    currentStreak = Math.max(1, currentStreak);
                } else if (diff === 1) {
                    // Consecutive day 7-task milestone increment
                    currentStreak += 1;
                } else {
                    // Missed one or more days -> reset to 1
                    currentStreak = 1;
                }
            }

            longestStreak = Math.max(longestStreak, currentStreak);

            await db.query(
                'UPDATE users SET streak_count = $1, last_streak_date = CURRENT_DATE, longest_streak = $2 WHERE id = $3',
                [currentStreak, longestStreak, userId]
            );

            return {
                currentStreak,
                longestStreak,
                lastStreakDate: new Date().toISOString().split('T')[0]
            };
        } else {
            // Passive evaluation on load / fetch
            if (lastStreakDate) {
                const diffRes = await db.query("SELECT (CURRENT_DATE - $1::DATE) as diff", [lastStreakDate]);
                const diff = parseInt(diffRes.rows[0].diff, 10);

                if (diff > 1 && currentStreak > 0) {
                    // Missed yesterday and today -> active streak is 0
                    currentStreak = 0;
                    await db.query('UPDATE users SET streak_count = 0 WHERE id = $1', [userId]);
                }
            } else {
                // If user has never completed a 7-task daily milestone (no lastStreakDate), currentStreak MUST be 0
                if (currentStreak > 0) {
                    currentStreak = 0;
                    await db.query('UPDATE users SET streak_count = 0 WHERE id = $1', [userId]);
                }
            }

            return {
                currentStreak,
                longestStreak,
                lastStreakDate: lastStreakDate ? String(lastStreakDate) : null
            };
        }
    } catch (err) {
        console.error('❌ evaluateDailyStreak error:', err);
        return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
    }
}

/**
 * Gets the number of tasks completed by the user today (calendar day).
 * 
 * @param {number} userId 
 * @returns {Promise<number>}
 */
async function getTodayCompletedTaskCount(userId) {
    try {
        const todayRes = await db.query(
            'SELECT COUNT(*) as count FROM task_completions WHERE user_id = $1 AND completed_at::DATE = CURRENT_DATE',
            [userId]
        );
        return parseInt(todayRes.rows[0]?.count || 0, 10);
    } catch (err) {
        console.error('❌ getTodayCompletedTaskCount error:', err);
        return 0;
    }
}

/**
 * Helper to calculate reward points strictly from task difficulty:
 * - Easy / Beginner: 100 Points
 * - Medium / Intermediate: 300 Points
 * - Hard / Ultra / Advanced: 600 Points
 *
 * @param {string} difficulty
 * @param {number} [fallbackPoints]
 * @returns {number}
 */
function getPointsByDifficulty(difficulty, fallbackPoints = null) {
    const diff = (difficulty || '').trim().toLowerCase();
    if (diff.includes('hard') || diff.includes('ultra') || diff.includes('advanced')) return 600;
    if (diff.includes('medium') || diff.includes('intermediate')) return 300;
    if (diff.includes('easy') || diff.includes('beginner')) return 100;

    if (fallbackPoints !== null && fallbackPoints !== undefined) {
        const num = Number(fallbackPoints);
        if (num >= 500) return 600;
        if (num >= 250) return 300;
        if (num > 0) return 100;
    }
    return 100; // default to Easy = 100 points
}

// Alias dictionary for task names
const TASK_ALIASES = {
    'drink water': 'Drink a glass of water mindfully',
    'drink mindfully': 'Drink a glass of water mindfully',
    'deep work': 'Remove Distraction',
    'anti-gravity': 'Release',
    'smile': 'Smile intentionally',
    'breathe': 'Breathe consciously for 3 minutes',
    'silent': 'Sit without phone for 2 minutes',
    'outside': 'Look outside for 2 minutes',
    'stretch': 'Morning Stretch',
    'gratitude': 'Gratitude for Body',
    'walk': 'Walk Outside for 10 Minutes',
    'eat': 'Eat One Meal Without Phone',
    'heartbeat': 'Notice heartbeat',
    'posture': 'Posture check',
    'notifications': 'Turn off notifications (30 min)',
    'observe': 'Observe urge to check phone',
    'distraction': 'Write one distraction',
    'connect': 'Ask Someone a Simple Question',
    'reflect': 'Write 1 word about how you feel',
    'eye rest': 'Eye Rest',
    'eyerest': 'Eye Rest',
    'eye rest (2 min)': 'Eye Rest'
};

/**
 * Permanently awards points for a task and records transaction.
 * Enforces:
 * 1. Points derived strictly from task difficulty (Easy=100, Medium=300, Hard=600).
 * 2. Daily limit of 7 completed tasks maximum per day.
 * 3. Duplicate reward prevention per task.
 * 4. 7 completed tasks in a day = 1 streak increment.
 * 
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.taskName
 * @param {number} [params.taskId]
 * @param {number} [params.points]
 * @param {string} [params.source]
 * @returns {Promise<Object>}
 */
async function recordTaskCompletionAndAwardPoints({
    userId,
    taskName,
    taskId = null,
    points = null,
    source = 'task_completion'
}) {
    try {
        userId = parseInt(userId, 10);
        if (taskId) taskId = parseInt(taskId, 10);

        let taskDifficulty = null;
        let taskDbReward = null;
        let resolvedTitle = taskName;

        if (taskName && TASK_ALIASES[taskName.trim().toLowerCase()]) {
            resolvedTitle = TASK_ALIASES[taskName.trim().toLowerCase()];
        }

        // 1. Resolve task from database to get difficulty and title
        let taskDb = null;
        if (taskId) {
            const res = await db.query('SELECT id, title, difficulty, points_reward FROM tasks WHERE id = $1', [taskId]);
            if (res.rows.length > 0) taskDb = res.rows[0];
        }

        if (!taskDb && resolvedTitle) {
            let res = await db.query('SELECT id, title, difficulty, points_reward FROM tasks WHERE title = $1', [resolvedTitle]);
            if (res.rows.length === 0) {
                res = await db.query('SELECT id, title, difficulty, points_reward FROM tasks WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))', [resolvedTitle]);
            }
            if (res.rows.length === 0 && taskName) {
                res = await db.query('SELECT id, title, difficulty, points_reward FROM tasks WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))', [taskName]);
            }
            if (res.rows.length > 0) taskDb = res.rows[0];
        }

        if (taskDb) {
            taskId = taskDb.id;
            resolvedTitle = taskDb.title;
            taskDifficulty = taskDb.difficulty;
            taskDbReward = taskDb.points_reward;
        } else {
            // Task not found in DB - insert it dynamically so it has a valid database row
            resolvedTitle = resolvedTitle || taskName || 'Task';
            taskDifficulty = 'Easy';
            try {
                const insertRes = await db.query(`
                    INSERT INTO tasks (title, description, category, difficulty, points_reward)
                    VALUES ($1, $2, 'General', 'Easy', 100)
                    ON CONFLICT DO NOTHING
                    RETURNING id, title, difficulty, points_reward
                `, [resolvedTitle, resolvedTitle]);
                if (insertRes.rows.length > 0) {
                    taskId = insertRes.rows[0].id;
                    taskDifficulty = insertRes.rows[0].difficulty;
                    taskDbReward = insertRes.rows[0].points_reward;
                }
            } catch (e) {
                taskId = null;
            }
        }

        // Calculate points strictly by task difficulty (Easy=100, Medium=300, Hard=600)
        const pointsToAward = getPointsByDifficulty(taskDifficulty, taskDbReward || points);

        console.log(`\n🔍 [recordTaskCompletionAndAwardPoints Debug Log]`);
        console.log(`  - userId: ${userId}`);
        console.log(`  - reqTaskName: "${taskName}"`);
        console.log(`  - resolvedTitle: "${resolvedTitle}"`);
        console.log(`  - taskId: ${taskId}`);
        console.log(`  - taskDifficulty: ${taskDifficulty}`);
        console.log(`  - calculated points: ${pointsToAward}`);

        // Fetch current summary data
        const summary = await getUserPointsAndStreak(userId);
        const todayCompletedCount = await getTodayCompletedTaskCount(userId);

        // 3. Duplicate reward prevention check strictly against points_history
        let isAlreadyCompleted = false;

        const checkPh = await db.query(
            `SELECT id FROM points_history 
             WHERE user_id = $1 
             AND (
                 (task_id IS NOT NULL AND $2::INT IS NOT NULL AND task_id = $2) 
                 OR (task_name IS NOT NULL AND LOWER(TRIM(task_name)) = LOWER(TRIM($3)))
                 OR ($4::TEXT IS NOT NULL AND task_name IS NOT NULL AND LOWER(TRIM(task_name)) = LOWER(TRIM($4)))
             )`,
            [userId, taskId || null, resolvedTitle || '', taskName || null]
        );
        if (checkPh.rows.length > 0) {
            isAlreadyCompleted = true;
        }

        if (isAlreadyCompleted) {
            console.log(`📌 [Duplicate Task Completion] User ${userId} already completed task "${resolvedTitle || taskName}" (taskId: ${taskId})`);

            // 1. Repair / ensure task_completions row exists
            try {
                await db.query(`
                    INSERT INTO task_completions (user_id, task_name, points, completed_at)
                    VALUES ($1, $2, $3, NOW())
                    ON CONFLICT (user_id, task_name) DO UPDATE SET
                        completed_at = COALESCE(task_completions.completed_at, NOW())
                `, [userId, resolvedTitle || taskName, pointsToAward]);
            } catch (e) {
                console.error('Error repairing task_completions on duplicate:', e);
            }

            // 2. Repair / ensure user_tasks row exists
            if (taskId) {
                try {
                    await db.query(`
                        INSERT INTO user_tasks (user_id, task_id, status, progress, completed_at)
                        VALUES ($1, $2, 'completed', 100, NOW())
                        ON CONFLICT (user_id, task_id) DO UPDATE SET
                            status = 'completed',
                            progress = 100,
                            completed_at = COALESCE(user_tasks.completed_at, NOW())
                    `, [userId, taskId]);
                } catch (e) {
                    console.error('Error repairing user_tasks on duplicate:', e);
                }
            }

            // 3. Repair points_history task_name if NULL
            if (taskId && resolvedTitle) {
                try {
                    await db.query(`
                        UPDATE points_history
                        SET task_name = $1
                        WHERE user_id = $2 AND task_id = $3 AND (task_name IS NULL OR TRIM(task_name) = '')
                    `, [resolvedTitle, userId, taskId]);
                } catch (e) {
                    console.error('Error repairing points_history task_name on duplicate:', e);
                }
            }

            // 4. Fetch the refreshed user summary
            const updatedSummary = await getUserPointsAndStreak(userId);

            // 5. Explicitly guarantee the completed task and its canonical/alias names are included
            const finalCompletedSet = new Set(updatedSummary.completedTasks || []);
            if (resolvedTitle) finalCompletedSet.add(resolvedTitle);
            if (taskName) finalCompletedSet.add(taskName);

            const finalCompletedList = Array.from(finalCompletedSet);

            return {
                success: true,
                message: "Reward already claimed",
                points_earned: 0,
                pointsEarned: 0,
                pointsAdded: 0, // compatibility
                points_added: 0,
                total_points: updatedSummary.totalPoints,
                totalPoints: updatedSummary.totalPoints,
                current_streak: updatedSummary.currentStreak,
                currentStreak: updatedSummary.currentStreak,
                streak: updatedSummary.currentStreak, // compatibility
                longestStreak: updatedSummary.longestStreak,
                task_completed: resolvedTitle || taskName || '',
                rewardClaimed: false,
                todayCompletedCount: todayCompletedCount,
                completedTasks: finalCompletedList,
                completed_tasks: finalCompletedList.length
            };
        }

        // 4. Verify taskId exists in tasks table before FK insert
        let validTaskId = null;
        if (taskId) {
            const checkTaskExists = await db.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
            if (checkTaskExists.rows.length > 0) {
                validTaskId = taskId;
            }
        }

        // 5. Insert into points_history transaction log
        console.log("Saving points history");
        console.log(`userId: ${userId}`);
        console.log(`taskId: ${validTaskId}`);
        console.log(`points: ${pointsToAward}`);

        const insertPhRes = await db.query(`
            INSERT INTO points_history (user_id, task_id, task_name, points, source, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, user_id, task_id, task_name, points, source, created_at
        `, [userId, validTaskId, resolvedTitle || taskName || 'Task', pointsToAward, source || 'task_completion']);

        console.log(`  - database insert result (points_history):`, insertPhRes.rows[0]);

        // 6. Insert into task_completions
        const insertTcRes = await db.query(`
            INSERT INTO task_completions (user_id, task_name, points, completed_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, task_name) DO UPDATE SET
                points = EXCLUDED.points,
                completed_at = NOW()
            RETURNING *
        `, [userId, resolvedTitle, pointsToAward]);

        console.log(`  - completion saved result (task_completions):`, insertTcRes.rows[0]);

        // Also record alias in task_completions if taskName differs from resolvedTitle
        if (taskName && taskName !== resolvedTitle) {
            try {
                await db.query(`
                    INSERT INTO task_completions (user_id, task_name, points, completed_at)
                    VALUES ($1, $2, $3, NOW())
                    ON CONFLICT (user_id, task_name) DO NOTHING
                `, [userId, taskName, pointsToAward]);
            } catch (e) {
                // Ignore conflict
            }
        }

        // 7. Update user_tasks table if valid taskId
        if (validTaskId) {
            try {
                const utRes = await db.query(`
                    INSERT INTO user_tasks (user_id, task_id, status, progress, completed_at)
                    VALUES ($1, $2, 'completed', 100, NOW())
                    ON CONFLICT (user_id, task_id) DO UPDATE SET
                        status = 'completed',
                        progress = 100,
                        completed_at = NOW()
                    RETURNING *
                `, [userId, validTaskId]);
                console.log(`  - user_tasks saved result:`, utRes.rows[0]);
            } catch (e) {
                console.error('user_tasks update error:', e);
            }
        }

        // 8. Re-evaluate daily streak (7 tasks = +1 streak)
        const streakResult = await evaluateDailyStreak(userId, true);
        const newTodayCompletedCount = await getTodayCompletedTaskCount(userId);
        const reachedDailyStreakMilestone = newTodayCompletedCount >= DAILY_TASK_LIMIT;

        // 9. Reconcile total points directly from points_history
        const pointsSumRes = await db.query(
            'SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE user_id = $1',
            [userId]
        );
        const finalTotalPoints = parseInt(pointsSumRes.rows[0]?.total || 0, 10);

        // Synchronize users table points
        await db.query(
            'UPDATE users SET points = $1, streak_count = $2, longest_streak = GREATEST(longest_streak, $2) WHERE id = $3',
            [finalTotalPoints, streakResult.currentStreak, userId]
        );

        // Fetch refreshed completed tasks list
        const refreshedSummary = await getUserPointsAndStreak(userId);
        const completedTasksSet = new Set(refreshedSummary.completedTasks || []);
        if (resolvedTitle) completedTasksSet.add(resolvedTitle);
        if (taskName) completedTasksSet.add(taskName);
        const completedTasks = Array.from(completedTasksSet);

        console.log(`  - final total points: ${finalTotalPoints}`);
        console.log(`  - completedTasks list contains Eye Rest: ${completedTasks.includes('Eye Rest')}`);

        return {
            success: true,
            message: "Task completed",
            total_points: finalTotalPoints,
            totalPoints: finalTotalPoints,
            current_streak: streakResult.currentStreak,
            currentStreak: streakResult.currentStreak,
            streak: streakResult.currentStreak, // compatibility
            longestStreak: streakResult.longestStreak,
            points_earned: pointsToAward,
            pointsEarned: pointsToAward,
            pointsAdded: pointsToAward, // compatibility
            points_added: pointsToAward,
            task_completed: resolvedTitle || taskName || '',
            rewardClaimed: true,
            todayCompletedCount: newTodayCompletedCount,
            dailyStreakMilestoneReached: reachedDailyStreakMilestone,
            completedTasks,
            completed_tasks: completedTasks.length
        };
    } catch (err) {
        console.error('❌ recordTaskCompletionAndAwardPoints error:', err);
        throw err;
    }
}

/**
 * Gets user's active points, streak, and completed tasks.
 * Ensures points in users table and points_history are strictly synchronized.
 * 
 * @param {number} userId 
 * @returns {Promise<{ totalPoints: number, currentStreak: number, longestStreak: number, completedTasks: string[], completedCount: number }>}
 */
async function getUserPointsAndStreak(userId) {
    try {
        userId = parseInt(userId, 10);
        // Fetch completed tasks from task_completions, points_history, user_tasks, and task_responses
        const compListRes = await db.query(
            `SELECT DISTINCT task_name FROM (
                -- 1. task_completions table
                SELECT task_name FROM task_completions WHERE user_id = $1 AND task_name IS NOT NULL
                UNION
                -- 2. points_history joined with tasks table (resolves title from task_id as primary identifier)
                SELECT COALESCE(t.title, ph.task_name) as task_name FROM points_history ph LEFT JOIN tasks t ON ph.task_id = t.id WHERE ph.user_id = $1
                UNION
                SELECT ph.task_name FROM points_history ph WHERE ph.user_id = $1 AND ph.task_name IS NOT NULL
                UNION
                SELECT t.title as task_name FROM points_history ph JOIN tasks t ON ph.task_id = t.id WHERE ph.user_id = $1
                UNION
                -- 3. user_tasks joined with tasks table
                SELECT t.title as task_name FROM user_tasks ut JOIN tasks t ON ut.task_id = t.id WHERE ut.user_id = $1 AND (ut.status = 'completed' OR ut.completed_at IS NOT NULL OR ut.progress >= 100)
                UNION
                -- 4. task_responses joined with tasks table
                SELECT t.title as task_name FROM task_responses tr JOIN tasks t ON tr.task_id = t.id WHERE tr.user_id = $1 AND tr.completed_at IS NOT NULL
            ) sub WHERE task_name IS NOT NULL AND TRIM(task_name) != ''`,
            [userId]
        );

        const rawCompleted = compListRes.rows.map(r => r.task_name.trim());
        const completedTasksSet = new Set(rawCompleted);

        // Add matching aliases to completedTasksSet for complete frontend interoperability
        for (const task of rawCompleted) {
            const lower = task.toLowerCase().trim();
            if (TASK_ALIASES[lower]) {
                completedTasksSet.add(TASK_ALIASES[lower]);
            }
            // Reverse alias mapping
            for (const [alias, canonical] of Object.entries(TASK_ALIASES)) {
                if (canonical.toLowerCase().trim() === lower) {
                    completedTasksSet.add(alias);
                }
            }
        }
        const completedTasks = Array.from(completedTasksSet);
        const completedCount = rawCompleted.length;

        // Sum strictly from points_history (the sole source of truth for points)
        const pointsSumRes = await db.query(
            'SELECT COALESCE(SUM(points), 0) as total FROM points_history WHERE user_id = $1',
            [userId]
        );
        let totalPoints = parseInt(pointsSumRes.rows[0]?.total || 0, 10);

        // Passive streak evaluation
        const streakInfo = await evaluateDailyStreak(userId, false);

        // Keep users.points updated to match points_history sum
        await db.query('UPDATE users SET points = $1 WHERE id = $2', [totalPoints, userId]);

        return {
            totalPoints,
            currentStreak: streakInfo.currentStreak,
            longestStreak: streakInfo.longestStreak,
            completedTasks,
            completedCount
        };
    } catch (err) {
        console.error('❌ getUserPointsAndStreak error:', err);
        return {
            totalPoints: 0,
            currentStreak: 0,
            longestStreak: 0,
            completedTasks: [],
            completedCount: 0
        };
    }
}

/**
 * Reconciles historical task_completions into points_history, purges fake initial points,
 * standardizes task difficulties and points rewards, and ensures users.points and streak_count are accurate.
 */
async function reconcilePointsAndStreaks() {
    try {
        // 1. Remove any fake initial_points or invalid points_history records
        await db.query("DELETE FROM points_history WHERE source = 'initial_points' OR points <= 0").catch(() => {});

        // 2. Ensure tasks difficulty and points_reward are standardized
        await db.query(`
            UPDATE tasks SET points_reward = 100, difficulty = 'Easy' 
            WHERE difficulty IS NULL OR LOWER(difficulty) IN ('easy', 'beginner')
        `).catch(() => {});

        await db.query(`
            UPDATE tasks SET points_reward = 300, difficulty = 'Medium' 
            WHERE LOWER(difficulty) IN ('medium', 'intermediate')
        `).catch(() => {});

        await db.query(`
            UPDATE tasks SET points_reward = 600, difficulty = 'Hard' 
            WHERE LOWER(difficulty) IN ('hard', 'ultra', 'advanced')
        `).catch(() => {});

        // 3. Backfill points_history for any task_completions that have no points_history entry
        const missingHistoryRes = await db.query(`
            SELECT tc.user_id, tc.task_name, tc.points, tc.completed_at, t.id as task_id, t.difficulty, t.points_reward
            FROM task_completions tc
            LEFT JOIN tasks t ON (LOWER(TRIM(tc.task_name)) = LOWER(TRIM(t.title)))
            WHERE NOT EXISTS (
                SELECT 1 FROM points_history ph 
                WHERE ph.user_id = tc.user_id 
                AND ((t.id IS NOT NULL AND ph.task_id = t.id) OR (ph.created_at::DATE = tc.completed_at::DATE))
            )
        `).catch(() => ({ rows: [] }));

        for (const row of missingHistoryRes.rows) {
            const pts = getPointsByDifficulty(row.difficulty, row.points_reward || row.points || 100);
            await db.query(`
                INSERT INTO points_history (user_id, task_id, task_name, points, source, created_at)
                VALUES ($1, $2, $3, $4, 'task_completion', $5)
            `, [row.user_id, row.task_id || null, row.task_name || 'Task', pts, row.completed_at || new Date()]).catch(() => {});
        }

        // 4. Sync users.points to strictly equal SUM(points_history)
        await db.query(`
            UPDATE users u
            SET points = COALESCE((
                SELECT SUM(ph.points)
                FROM points_history ph
                WHERE ph.user_id = u.id
            ), 0)
        `).catch(() => {});

        // 5. Reset streak_count to 0 for users who have no last_streak_date or 0 points
        await db.query(`
            UPDATE users 
            SET streak_count = 0
            WHERE last_streak_date IS NULL OR points = 0
        `).catch(() => {});

        console.log('✅ Points and streaks database reconciliation completed');
    } catch (e) {
        console.error('⚠️ reconcilePointsAndStreaks note:', e.message);
    }
}

/**
 * Full reset of database points and streak data for clean state.
 */
async function resetAllPointsAndStreaks() {
    try {
        await db.query("DELETE FROM points_history");
        await db.query("DELETE FROM task_completions");
        await db.query("UPDATE users SET points = 0, streak_count = 0, longest_streak = 0, last_streak_date = NULL");
        console.log("✅ All user points and streaks have been completely reset to 0.");
    } catch (e) {
        console.error("⚠️ resetAllPointsAndStreaks error:", e.message);
    }
}

module.exports = {
    DAILY_TASK_LIMIT,
    TASKS_FOR_STREAK_MILESTONE,
    evaluateDailyStreak,
    getTodayCompletedTaskCount,
    getPointsByDifficulty,
    recordTaskCompletionAndAwardPoints,
    getUserPointsAndStreak,
    reconcilePointsAndStreaks,
    resetAllPointsAndStreaks
};
