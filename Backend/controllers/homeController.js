const db = require('../db');

async function evaluateStreak(userId) {
    const completedTodayRes = await db.query(`
        SELECT COUNT(*) as count 
        FROM user_tasks 
        WHERE user_id = $1 AND status = 'completed' AND completed_at::DATE = CURRENT_DATE
    `, [userId]);
    const tasksCompletedToday = parseInt(completedTodayRes.rows[0].count, 10);

    if (tasksCompletedToday >= 7) {
        const uRes = await db.query('SELECT streak_count, last_streak_date FROM users WHERE id = $1', [userId]);
        const uData = uRes.rows[0];
        const currentStreak = uData.streak_count || 0;

        let shouldIncrement = false;
        let newStreak = currentStreak;

        if (!uData.last_streak_date) {
            shouldIncrement = true;
            newStreak = 1;
        } else {
            const diffRes = await db.query("SELECT (CURRENT_DATE - $1::DATE) as diff", [uData.last_streak_date]);
            const diff = diffRes.rows[0].diff;
            if (diff >= 1) { // 1 means consecutive day (yesterday) OR missed day > 1
                shouldIncrement = true;
                if (diff === 1) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
            }
        }

        if (shouldIncrement) {
            await db.query('UPDATE users SET streak_count = $1, last_streak_date = CURRENT_DATE WHERE id = $2', [newStreak, userId]);
        }
    }
}

exports.getHomeData = async (req, res) => {
    try {
        const userId = req.user.id;

        // User info
        const userRes = await db.query('SELECT id, username, email, image_url, streak_count, last_streak_date FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        // Total points (Dynamic sum from history)
        const pointsRes = await db.query('SELECT COALESCE(SUM(points), 0) as total_points FROM points_history WHERE user_id = $1', [userId]);
        const totalPoints = parseInt(pointsRes.rows[0].total_points, 10);

        // Active stories
        const storiesRes = await db.query(`
            SELECT s.id, s.user_id, s.media_url, s.media_type, s.text_elements, s.music_data, s.created_at, s.view_count, u.username, u.image_url as profile_image
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = TRUE AND s.expires_at > NOW()
            ORDER BY s.created_at DESC
        `);

        // Split own story vs others
        const ownStories = storiesRes.rows.filter(s => s.user_id === userId);
        const activeStories = storiesRes.rows.filter(s => s.user_id !== userId);

        // Tasks
        const tasksRes = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');

        // User task stats
        const userTasksRes = await db.query('SELECT task_id, status FROM user_tasks WHERE user_id = $1', [userId]);
        const completedCount = userTasksRes.rows.filter(ut => ut.status === 'completed').length;
        const pendingCount = userTasksRes.rows.filter(ut => ut.status !== 'completed').length;

        // Simple Streak Calculation
        const streakCount = Math.floor(completedCount / 7);

        return res.status(200).json({
            user: { ...user, streak_count: streakCount },
            total_points: totalPoints,
            own_stories: ownStories,
            active_stories: activeStories,
            tasks: tasksRes.rows,
            tasks_summary: {
                completed: completedCount,
                pending: pendingCount,
                available: tasksRes.rows.length
            }
        });
    } catch (err) {
        console.error('getHomeData error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Stories
exports.uploadStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { media_url, media_type = 'image', text_elements, text_content, text_position, music_data, caption } = req.body;

        if (!media_url) return res.status(400).json({ error: 'media_url is required' });

        const result = await db.query(
            'INSERT INTO stories (user_id, media_url, media_type, text_elements, text_content, text_position, music_data, caption) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [
                userId, 
                media_url, 
                media_type, 
                JSON.stringify(text_elements || []), 
                text_content || null,
                JSON.stringify(text_position || {}),
                JSON.stringify(music_data || {}), 
                caption
            ]
        );

        return res.status(201).json({ message: 'Story created', story: result.rows[0] });
    } catch (err) {
        console.error('uploadStory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStories = async (req, res) => {
    try {
        // Option to pass user_id as query
        const { userId } = req.query;
        let query = `
            SELECT s.id, s.user_id, s.media_url, s.media_type, s.text_elements, s.music_data, s.created_at, s.expires_at, s.view_count, u.username, u.image_url as profile_image
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = TRUE AND s.expires_at > NOW()
        `;
        const params = [];
        if (userId) {
            query += ' AND s.user_id = $1';
            params.push(userId);
        }
        query += ' ORDER BY s.created_at DESC';

        const result = await db.query(query, params);
        return res.status(200).json({ stories: result.rows });
    } catch (err) {
        console.error('getStories error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStoryById = async (req, res) => {
    try {
        const storyId = req.params.id;
        const result = await db.query(`
            SELECT s.*, u.username, u.image_url as profile_image
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [storyId]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
        return res.status(200).json({ story: result.rows[0] });
    } catch (err) {
        console.error('getStoryById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.trackStoryView = async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;

        // Add view record
        const viewResult = await db.query(
            'INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT (story_id, user_id) DO NOTHING RETURNING *',
            [storyId, userId]
        );

        // If a new view was actually added, increment view_count in stories table
        if (viewResult.rows.length > 0) {
            await db.query('UPDATE stories SET view_count = view_count + 1 WHERE id = $1', [storyId]);
        }

        return res.status(200).json({ message: 'View tracked' });
    } catch (err) {
        console.error('trackStoryView error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStoryViewers = async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;

        if (!storyId || storyId === 'undefined') {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        // Verify ownership and get view count
        const storyRes = await db.query('SELECT user_id, view_count FROM stories WHERE id = $1', [storyId]);
        if (storyRes.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
        
        // Use loose equality to handle possible string/number mismatches
        if (storyRes.rows[0].user_id != userId) return res.status(403).json({ error: 'Unauthorized' });

        const viewersRes = await db.query(`
            SELECT u.id as user_id, u.username, u.image_url as profile_image, sv.viewed_at
            FROM story_views sv
            JOIN users u ON sv.user_id = u.id
            WHERE sv.story_id = $1
            ORDER BY sv.viewed_at DESC
        `, [storyId]);

        return res.status(200).json({ 
            viewsCount: storyRes.rows[0].view_count || 0,
            viewers: viewersRes.rows || []
        });
    } catch (err) {
        console.error('getStoryViewers error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;

        // Verify story ownership
        const storyRes = await db.query('SELECT user_id FROM stories WHERE id = $1', [storyId]);
        if (storyRes.rows.length === 0) {
            return res.status(404).json({ error: 'Story not found' });
        }

        if (storyRes.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own stories' });
        }

        await db.query('DELETE FROM stories WHERE id = $1', [storyId]);

        return res.status(200).json({ message: 'Story deleted successfully' });
    } catch (err) {
        console.error('deleteStory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Tasks
exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT t.*, ut.status, ut.progress, ut.started_at, ut.completed_at
            FROM tasks t
            LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = $1
            ORDER BY t.created_at DESC
        `, [userId]);

        return res.status(200).json({ tasks: result.rows });
    } catch (err) {
        console.error('getTasks error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const result = await db.query(`
            SELECT t.*, ut.status, ut.progress, ut.started_at, ut.completed_at
            FROM tasks t
            LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = $1
            WHERE t.id = $2
        `, [userId, taskId]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

        return res.status(200).json({ task: result.rows[0] });
    } catch (err) {
        console.error('getTaskById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.startTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const status = req.body.status || 'in_progress';

        const taskExists = await db.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
        if (taskExists.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Upsert user_task
        const result = await db.query(`
            INSERT INTO user_tasks (user_id, task_id, status, started_at) 
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, task_id) DO UPDATE SET 
                status = $3,
                started_at = COALESCE(user_tasks.started_at, NOW())
            RETURNING *
        `, [userId, taskId, status]);

        return res.status(200).json({ message: 'Task started', user_task: result.rows[0] });
    } catch (err) {
        console.error('startTask error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.completeTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        console.log(`📌 completeTask called: userId=${userId}, taskId=${taskId}`);

        const taskRes = await db.query('SELECT id, points_reward FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const pointsReward = taskRes.rows[0].points_reward;

        // Check if already completed
        const utRes = await db.query('SELECT status FROM user_tasks WHERE user_id = $1 AND task_id = $2', [userId, taskId]);
        if (utRes.rows.length > 0 && utRes.rows[0].status === 'completed') {
            return res.status(400).json({ error: 'Task is already completed. Points were already awarded.' });
        }

        // Upsert to completed
        const result = await db.query(`
            INSERT INTO user_tasks (user_id, task_id, status, progress, completed_at) 
            VALUES ($1, $2, 'completed', 100, NOW())
            ON CONFLICT (user_id, task_id) DO UPDATE SET 
                status = 'completed',
                progress = 100,
                completed_at = NOW()
            RETURNING *
        `, [userId, taskId]);

        // Award points
        if (pointsReward > 0) {
            await db.query(`
                INSERT INTO points_history (user_id, task_id, points, source) 
                VALUES ($1, $2, $3, 'task_completion')
            `, [userId, taskId, pointsReward]);
        }

        await evaluateStreak(userId);

        return res.status(200).json({ message: 'Task completed', points_rewarded: pointsReward, user_task: result.rows[0] });
    } catch (err) {
        console.error('completeTask error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateTaskProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const { progress } = req.body;

        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({ error: 'Invalid progress value. Must be between 0 and 100' });
        }

        const taskExists = await db.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
        if (taskExists.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const status = progress === 100 ? 'completed' : 'in_progress';

        const result = await db.query(`
            INSERT INTO user_tasks (user_id, task_id, progress, status, started_at) 
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, task_id) DO UPDATE SET 
                progress = $3,
                status = $4,
                completed_at = CASE WHEN $3 = 100 THEN NOW() ELSE NULL END
            RETURNING *
        `, [userId, taskId, progress, status]);

        // If progress=100 from this endpoint, award points safely
        if (progress === 100) {
            const pointsCheck = await db.query('SELECT id FROM points_history WHERE user_id = $1 AND task_id = $2', [userId, taskId]);
            if (pointsCheck.rows.length === 0) {
                const taskRes = await db.query('SELECT points_reward FROM tasks WHERE id = $1', [taskId]);
                if (taskRes.rows[0].points_reward > 0) {
                    await db.query(`
                        INSERT INTO points_history (user_id, task_id, points, source) 
                        VALUES ($1, $2, $3, 'task_completion')
                    `, [userId, taskId, taskRes.rows[0].points_reward]);
                }
            }
            await evaluateStreak(userId);
        }

        return res.status(200).json({ message: 'Task progress updated', user_task: result.rows[0] });
    } catch (err) {
        console.error('updateTaskProgress error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Points
exports.getPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const pointsRes = await db.query('SELECT COALESCE(SUM(points), 0) as total_points FROM points_history WHERE user_id = $1', [userId]);

        return res.status(200).json({ total_points: parseInt(pointsRes.rows[0].total_points, 10) });
    } catch (err) {
        console.error('getPoints error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPointsHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT ph.*, t.title as task_title 
            FROM points_history ph
            LEFT JOIN tasks t ON ph.task_id = t.id
            WHERE ph.user_id = $1
            ORDER BY ph.created_at DESC
        `, [userId]);

        return res.status(200).json({ history: result.rows });
    } catch (err) {
        console.error('getPointsHistory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
