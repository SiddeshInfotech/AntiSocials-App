const db = require('../db');
const pointsStreakService = require('./pointsStreakService');

/**
 * Master List of Badges with Definitions & Unlock Rules
 */
const BADGE_DEFINITIONS = [
    // 1. Task Achievements
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Complete your first task.',
        icon: '🏆',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 1
    },
    {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Complete 5 tasks.',
        icon: '🎯',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 5
    },
    {
        id: 'momentum',
        name: 'Momentum',
        description: 'Complete 10 tasks.',
        icon: '⚡',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 10
    },
    {
        id: 'tasks_21',
        name: '21 Tasks',
        description: 'Complete 21 tasks.',
        icon: '🏗️',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 21
    },
    {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 50 tasks.',
        icon: '👑',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 50
    },
    {
        id: 'century',
        name: 'Century',
        description: 'Complete 100 tasks.',
        icon: '💯',
        category: 'tasks',
        requirementType: 'task_count',
        requirementValue: 100
    },

    // 2. Streak Achievements
    {
        id: 'on_track',
        name: 'On Track',
        description: 'Maintain a 3-day active streak.',
        icon: '🔥',
        category: 'streaks',
        requirementType: 'streak_count',
        requirementValue: 3
    },
    {
        id: 'one_week_strong',
        name: 'One Week Strong',
        description: 'Maintain a 7-day active streak.',
        icon: '📅',
        category: 'streaks',
        requirementType: 'streak_count',
        requirementValue: 7
    },
    {
        id: 'streak_21',
        name: '21-Day Streak',
        description: 'Maintain a 21-day active streak.',
        icon: '🛡️',
        category: 'streaks',
        requirementType: 'streak_count',
        requirementValue: 21
    },
    {
        id: 'consistency',
        name: 'Consistency',
        description: 'Maintain a 30-day active streak.',
        icon: '⚔️',
        category: 'streaks',
        requirementType: 'streak_count',
        requirementValue: 30
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Maintain a 60-day active streak.',
        icon: '🚀',
        category: 'streaks',
        requirementType: 'streak_count',
        requirementValue: 60
    },

    // 3. Community Achievements
    {
        id: 'community_starter',
        name: 'Community Starter',
        description: 'Create your first community activity.',
        icon: '🌟',
        category: 'community',
        requirementType: 'community_created',
        requirementValue: 1
    },
    {
        id: 'first_connection',
        name: 'First Connection',
        description: 'Join your first community activity.',
        icon: '🤝',
        category: 'community',
        requirementType: 'activity_joined',
        requirementValue: 1
    },
    {
        id: 'community_builder',
        name: 'Community Builder',
        description: 'Create 3 community activities.',
        icon: '🏘️',
        category: 'community',
        requirementType: 'community_created',
        requirementValue: 3
    },
    {
        id: 'community_leader',
        name: 'Community Leader',
        description: 'Create 5 community activities.',
        icon: '👥',
        category: 'community',
        requirementType: 'community_created',
        requirementValue: 5
    },
    {
        id: 'active_member',
        name: 'Active Member',
        description: 'Join 5 community activities.',
        icon: '🙋‍♂️',
        category: 'community',
        requirementType: 'activity_joined',
        requirementValue: 5
    },
    {
        id: 'community_regular',
        name: 'Community Regular',
        description: 'Participate in 10 community activities.',
        icon: '🏅',
        category: 'community',
        requirementType: 'activity_joined',
        requirementValue: 10
    },

    // 4. Social / Connection Achievements
    {
        id: 'voice_of_community',
        name: 'Voice of the Community',
        description: 'Post a message or suggestion in a community.',
        icon: '💬',
        category: 'social',
        requirementType: 'community_messages',
        requirementValue: 1
    },
    {
        id: 'social_explorer',
        name: 'Social Explorer',
        description: 'Participate in 5 community activities.',
        icon: '🗺️',
        category: 'social',
        requirementType: 'activity_joined',
        requirementValue: 5
    },
    {
        id: 'community_supporter',
        name: 'Community Supporter',
        description: 'Connect with 3 members in the app.',
        icon: '💖',
        category: 'social',
        requirementType: 'connections',
        requirementValue: 3
    },

    // 5. Task Category Achievements
    {
        id: 'early_riser',
        name: 'Early Riser',
        description: 'Complete 5 Morning/Stretch tasks.',
        icon: '🌅',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Morning',
        requirementValue: 5
    },
    {
        id: 'inner_calm',
        name: 'Inner Calm',
        description: 'Complete 5 Meditation/Breathing tasks.',
        icon: '🧘',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Meditation',
        requirementValue: 5
    },
    {
        id: 'reader',
        name: 'Reader',
        description: 'Complete 5 Reading/Reflection tasks.',
        icon: '📖',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Reading',
        requirementValue: 5
    },
    {
        id: 'digital_balance',
        name: 'Digital Balance',
        description: 'Complete 5 Digital Detox/No Media tasks.',
        icon: '📵',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Digital Detox',
        requirementValue: 5
    },
    {
        id: 'active_mind',
        name: 'Active Mind',
        description: 'Complete 5 Exercise/Movement/Walk tasks.',
        icon: '🏃',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Exercise',
        requirementValue: 5
    },
    {
        id: 'social_confidence',
        name: 'Social Confidence',
        description: 'Complete 5 Social/Connection tasks.',
        icon: '🤝',
        category: 'categories',
        requirementType: 'category_task_count',
        requirementCategory: 'Social',
        requirementValue: 5
    },

    // 6. Special / Milestone Achievements
    {
        id: 'superday',
        name: 'Superday',
        description: 'Complete 7 tasks in a single calendar day.',
        icon: '⭐',
        category: 'special',
        requirementType: 'same_day_tasks',
        requirementValue: 7
    },
    {
        id: 'challenge_accepted',
        name: 'Challenge Accepted',
        description: 'Complete a Hard difficulty task.',
        icon: '🥊',
        category: 'special',
        requirementType: 'hard_task_completed',
        requirementValue: 1
    }
];

/**
 * Calculates current user metrics from the database
 */
async function fetchUserMetrics(userId) {
    // 1. Task & Streak Summary from pointsStreakService
    const summary = await pointsStreakService.getUserPointsAndStreak(userId);
    const tasksCompleted = summary.completedCount || 0;

    const userRes = await db.query('SELECT streak_count, COALESCE(longest_streak, streak_count, 0) as longest_streak FROM users WHERE id = $1', [userId]);
    const userRow = userRes.rows[0] || {};
    const maxStreak = Math.max(
        parseInt(userRow.longest_streak || 0, 10),
        parseInt(userRow.streak_count || 0, 10),
        summary.longestStreak || 0,
        summary.currentStreak || 0
    );

    // 2. Communities created count
    const createdRes = await db.query('SELECT COUNT(*) FROM activities WHERE creator_id = $1', [userId]).catch(() => ({ rows: [{ count: 0 }] }));
    const communityCreated = parseInt(createdRes.rows[0]?.count || 0, 10);

    // 3. Community activities joined count
    const joinedRes = await db.query('SELECT COUNT(*) FROM activity_participants WHERE user_id = $1', [userId]).catch(() => ({ rows: [{ count: 0 }] }));
    const activityJoined = parseInt(joinedRes.rows[0]?.count || 0, 10);

    // 4. Messages posted count
    const messagesRes = await db.query('SELECT COUNT(*) FROM activity_messages WHERE user_id = $1', [userId]).catch(() => ({ rows: [{ count: 0 }] }));
    const communityMessages = parseInt(messagesRes.rows[0]?.count || 0, 10);

    // 5. User connections count
    const connectionsRes = await db.query("SELECT COUNT(*) FROM user_connections WHERE (user_id = $1 OR friend_id = $1) AND (status = 'accepted' OR status = 'connected')", [userId]).catch(() => ({ rows: [{ count: 0 }] }));
    const connections = parseInt(connectionsRes.rows[0]?.count || 0, 10);

    // 6. Max tasks completed in a single day
    const sameDayRes = await db.query(`
        SELECT COUNT(*) as count 
        FROM task_completions 
        WHERE user_id = $1 
        GROUP BY completed_at::DATE 
        ORDER BY count DESC 
        LIMIT 1
    `, [userId]).catch(() => ({ rows: [] }));
    const sameDayMaxTasks = parseInt(sameDayRes.rows[0]?.count || 0, 10);

    // 7. Hard tasks completed count
    const hardRes = await db.query(`
        SELECT COUNT(*) as count
        FROM task_completions tc
        LEFT JOIN tasks t ON LOWER(TRIM(tc.task_name)) = LOWER(TRIM(t.title))
        WHERE tc.user_id = $1 AND LOWER(COALESCE(t.difficulty, 'easy')) IN ('hard', 'ultra', 'advanced')
    `, [userId]).catch(() => ({ rows: [{ count: 0 }] }));
    const hardTaskCompleted = parseInt(hardRes.rows[0]?.count || 0, 10);

    // 8. Category-specific task counts
    const categoryCountsRes = await db.query(`
        SELECT 
            COALESCE(t.category, 'General') as category,
            LOWER(tc.task_name) as task_name,
            COUNT(*) as count
        FROM task_completions tc
        LEFT JOIN tasks t ON LOWER(TRIM(tc.task_name)) = LOWER(TRIM(t.title))
        WHERE tc.user_id = $1
        GROUP BY t.category, tc.task_name
    `, [userId]).catch(() => ({ rows: [] }));

    const categoryCounts = {
        Morning: 0,
        Meditation: 0,
        Reading: 0,
        'Digital Detox': 0,
        Exercise: 0,
        Social: 0
    };

    for (const row of categoryCountsRes.rows) {
        const cat = (row.category || '').toLowerCase();
        const name = (row.task_name || '').toLowerCase();
        const cnt = parseInt(row.count, 10);

        if (cat.includes('morning') || name.includes('morning') || name.includes('stretch') || name.includes('early')) {
            categoryCounts.Morning += cnt;
        }
        if (cat.includes('meditation') || cat.includes('calm') || name.includes('breath') || name.includes('meditat') || name.includes('silent') || name.includes('calm')) {
            categoryCounts.Meditation += cnt;
        }
        if (cat.includes('reading') || name.includes('read') || name.includes('reflect') || name.includes('write')) {
            categoryCounts.Reading += cnt;
        }
        if (cat.includes('digital') || name.includes('digital') || name.includes('detox') || name.includes('media') || name.includes('phone') || name.includes('notification')) {
            categoryCounts['Digital Detox'] += cnt;
        }
        if (cat.includes('exercise') || cat.includes('fitness') || name.includes('walk') || name.includes('exercise') || name.includes('gym') || name.includes('posture')) {
            categoryCounts.Exercise += cnt;
        }
        if (cat.includes('social') || name.includes('social') || name.includes('connect') || name.includes('smile') || name.includes('friend') || name.includes('compliment')) {
            categoryCounts.Social += cnt;
        }
    }

    return {
        tasksCompleted,
        maxStreak,
        communityCreated,
        activityJoined,
        communityMessages,
        connections,
        sameDayMaxTasks,
        hardTaskCompleted,
        categoryCounts
    };
}

/**
 * Gets user progress and unlocks badges based on criteria
 */
async function getUserBadges(userId) {
    userId = parseInt(userId, 10);

    // Fetch user stats
    const metrics = await fetchUserMetrics(userId);

    // Fetch already unlocked badges from user_badges table
    const unlockedDbRes = await db.query('SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = $1', [userId]);
    const unlockedMap = new Map();
    for (const row of unlockedDbRes.rows) {
        unlockedMap.set(row.badge_id, row.unlocked_at);
    }

    const newlyUnlockedIds = [];

    // Evaluate each badge
    const badgeResults = BADGE_DEFINITIONS.map(def => {
        let currentVal = 0;

        switch (def.requirementType) {
            case 'task_count':
                currentVal = metrics.tasksCompleted;
                break;
            case 'streak_count':
                currentVal = metrics.maxStreak;
                break;
            case 'community_created':
                currentVal = metrics.communityCreated;
                break;
            case 'activity_joined':
                currentVal = metrics.activityJoined;
                break;
            case 'community_messages':
                currentVal = metrics.communityMessages;
                break;
            case 'connections':
                currentVal = metrics.connections;
                break;
            case 'same_day_tasks':
                currentVal = metrics.sameDayMaxTasks;
                break;
            case 'hard_task_completed':
                currentVal = metrics.hardTaskCompleted;
                break;
            case 'category_task_count':
                currentVal = metrics.categoryCounts[def.requirementCategory] || 0;
                break;
            default:
                currentVal = 0;
        }

        const conditionMet = currentVal >= def.requirementValue;
        let isUnlocked = unlockedMap.has(def.id) || conditionMet;
        let unlockedAt = unlockedMap.get(def.id) || null;

        if (conditionMet && !unlockedMap.has(def.id)) {
            newlyUnlockedIds.push(def.id);
            unlockedAt = new Date().toISOString();
        }

        const progress = Math.min(currentVal, def.requirementValue);

        return {
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            category: def.category,
            requirementType: def.requirementType,
            requirementValue: def.requirementValue,
            requirementCategory: def.requirementCategory || null,
            isUnlocked: Boolean(isUnlocked),
            unlockedAt: unlockedAt ? new Date(unlockedAt).toISOString() : null,
            progress,
            maxProgress: def.requirementValue
        };
    });

    // Save newly unlocked badges to user_badges database table
    if (newlyUnlockedIds.length > 0) {
        for (const badgeId of newlyUnlockedIds) {
            await db.query(`
                INSERT INTO user_badges (user_id, badge_id, unlocked_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id, badge_id) DO NOTHING
            `, [userId, badgeId]).catch(() => {});
        }
    }

    return badgeResults;
}

module.exports = {
    BADGE_DEFINITIONS,
    fetchUserMetrics,
    getUserBadges
};
