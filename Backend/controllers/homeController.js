const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');

// Helper to verify if story exists, is active, and is accessible by user (own story or accepted connection)
const verifyStoryAccess = async (storyId, userId) => {
    const sId = parseInt(storyId, 10);
    const uId = parseInt(userId, 10);
    if (!sId || !uId || isNaN(sId) || isNaN(uId)) return null;

    const res = await db.query(`
        SELECT s.id, s.user_id 
        FROM stories s
        WHERE s.id = $1 
          AND s.is_active = TRUE 
          AND s.expires_at > NOW()
          AND (
              s.user_id = $2 
              OR s.user_id IN (
                  SELECT CASE WHEN c.user_id = $2 THEN c.friend_id ELSE c.user_id END
                  FROM user_connections c
                  WHERE (c.user_id = $2 OR c.friend_id = $2)
                    AND (LOWER(c.status) = 'accepted' OR LOWER(c.status) = 'connected')
              )
          )
    `, [sId, uId]);

    return res.rows.length > 0 ? res.rows[0] : null;
};

exports.getHomeData = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);

        // User info
        const userRes = await db.query('SELECT id, username, email, image_url, points, streak_count FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userRes.rows[0];

        // Points, Streak & Completed tasks from pointsStreakService (single source of truth)
        const userSummary = await pointsStreakService.getUserPointsAndStreak(userId);

        console.log(`📌 [Backend GET /api/home] userId: ${userId}, username: ${user.username}, totalPoints: ${userSummary.totalPoints}, streak: ${userSummary.currentStreak}`);

        // Deactivate any expired stories before returning home data
        await db.query('UPDATE stories SET is_active = FALSE WHERE is_active = TRUE AND expires_at <= NOW()');

        // Fetch accepted connection IDs for debug log
        const connRes = await db.query(`
            SELECT CASE WHEN c.user_id = $1 THEN c.friend_id ELSE c.user_id END as conn_id
            FROM user_connections c
            WHERE (c.user_id = $1 OR c.friend_id = $1)
              AND (LOWER(c.status) = 'accepted' OR LOWER(c.status) = 'connected')
        `, [userId]);
        const acceptedConnIds = connRes.rows.map(r => r.conn_id);

        // Active stories: ONLY own stories OR stories from ACCEPTED connections
        const storiesRes = await db.query(`
            SELECT 
                s.id, 
                s.user_id, 
                s.media_url, 
                s.media_type, 
                s.text_elements, 
                s.text_content, 
                s.text_position, 
                s.music_data, 
                s.caption, 
                s.created_at, 
                s.expires_at, 
                s.view_count, 
                u.username, 
                COALESCE(u.profile_name, u.username) AS display_name,
                u.image_url as profile_image
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
        `, [userId]);

        // Split own story vs others
        const ownStories = storiesRes.rows.filter(s => s.user_id === userId);
        const activeStories = storiesRes.rows.filter(s => s.user_id !== userId);
        const returnedOwners = [...new Set(storiesRes.rows.map(s => `${s.username} (ID: ${s.user_id})`))];

        console.log(`🔒 [STORY ACCESS DEBUG GET /api/home] Viewer: ${user.username} (ID: ${userId}) | Accepted Conns: [${acceptedConnIds.join(', ')}] | Returned Story Owners: [${returnedOwners.join(', ')}]`);

        // Tasks with completion status mapped directly for the user and strictly sorted by difficulty (EASY -> MEDIUM -> HARD)
        const tasksRes = await db.query(`
            SELECT * FROM tasks 
            ORDER BY 
              CASE 
                WHEN LOWER(COALESCE(difficulty, '')) = 'easy' THEN 1
                WHEN LOWER(COALESCE(difficulty, '')) = 'medium' THEN 2
                WHEN LOWER(COALESCE(difficulty, '')) = 'hard' THEN 3
                ELSE 4
              END ASC,
              created_at DESC
        `);
        const completedNamesSet = new Set((userSummary.completedTasks || []).map(t => t.toLowerCase().trim()));
        const difficultyOrderMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
        const rawEnrichedTasks = tasksRes.rows.map(task => {
            const tTitle = task.title.toLowerCase().trim();
            const isCompleted = completedNamesSet.has(tTitle) ||
                (tTitle.includes("water") && completedNamesSet.has("drink a glass of water mindfully")) ||
                (tTitle.includes("breath") && completedNamesSet.has("breathe consciously for 3 minutes")) ||
                (tTitle.includes("eye") && (completedNamesSet.has("eye rest") || completedNamesSet.has("eye rest (2 min)") || completedNamesSet.has("eyerest")));
            return {
                ...task,
                is_completed: isCompleted,
                completed: isCompleted,
                status: isCompleted ? 'completed' : 'pending'
            };
        });

        // Enforce strict EASY -> MEDIUM -> HARD sequence preserving relative order
        const enrichedTasks = [...rawEnrichedTasks].sort((a, b) => {
            const diffA = (a.difficulty || 'easy').toString().toLowerCase().trim();
            const diffB = (b.difficulty || 'easy').toString().toLowerCase().trim();
            const orderA = difficultyOrderMap[diffA] || 4;
            const orderB = difficultyOrderMap[diffB] || 4;
            if (orderA !== orderB) return orderA - orderB;
            return 0;
        });

        return res.status(200).json({
            user: {
                ...user,
                points: userSummary.totalPoints,
                streak_count: userSummary.currentStreak,
                longest_streak: userSummary.longestStreak
            },
            total_points: userSummary.totalPoints,
            totalPoints: userSummary.totalPoints,
            streak_count: userSummary.currentStreak,
            current_streak: userSummary.currentStreak,
            streak: userSummary.currentStreak,
            completed_tasks: userSummary.completedCount,
            completedTasks: userSummary.completedTasks,
            completed_task_count: userSummary.completedCount,
            own_stories: ownStories,
            active_stories: activeStories,
            tasks: enrichedTasks,
            tasks_summary: {
                completed: userSummary.completedCount,
                pending: Math.max(0, tasksRes.rows.length - userSummary.completedCount),
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
        const userId = parseInt(req.user.id, 10);
        const { media_url, media_type = 'image', text_elements, text_content, text_position, music_data, caption } = req.body;

        if (!media_url) {
            console.log(`❌ [Story Upload] Missing media_url from userId: ${userId}`);
            return res.status(400).json({ error: 'media_url is required' });
        }

        // Enforce 1 active story per user rule: check if user already has an active unexpired story
        const existingStoryRes = await db.query(
            'SELECT id FROM stories WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW() LIMIT 1',
            [userId]
        );

        if (existingStoryRes.rows.length > 0) {
            console.log(`❌ [Story Upload Blocked] User ${userId} already has an active story (id: ${existingStoryRes.rows[0].id})`);
            return res.status(400).json({ 
                error: 'You already have an active story.',
                hasActiveStory: true,
                existingStoryId: existingStoryRes.rows[0].id
            });
        }

        console.log(`📤 [Story Upload] Processing story upload for userId: ${userId}, media_type: ${media_type}, url: ${media_url}`);

        const result = await db.query(
            `INSERT INTO stories (
                user_id, 
                media_url, 
                media_type, 
                text_elements, 
                text_content, 
                text_position, 
                music_data, 
                caption, 
                created_at, 
                expires_at, 
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '24 hours', TRUE) RETURNING *`,
            [
                userId, 
                media_url, 
                media_type, 
                JSON.stringify(text_elements || []), 
                text_content || null,
                JSON.stringify(text_position || {}),
                JSON.stringify(music_data || {}), 
                caption || null
            ]
        );

        const newStory = result.rows[0];

        // Fetch full enriched story with user profile info for immediate frontend use
        const fullStoryRes = await db.query(`
            SELECT 
                s.id, 
                s.user_id, 
                s.media_url, 
                s.media_type, 
                s.text_elements, 
                s.text_content, 
                s.text_position, 
                s.music_data, 
                s.caption, 
                s.created_at, 
                s.expires_at, 
                s.view_count, 
                u.username, 
                u.image_url as profile_image,
                0 as likes_count,
                0 as comments_count,
                0 as shares_count,
                false as is_liked_by_user
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [newStory.id]);

        const fullStory = fullStoryRes.rows[0] || newStory;

        console.log(`✅ [Story Upload Success] userId: ${userId}, storyId: ${newStory.id}, media_url: ${media_url}, expires_at: ${newStory.expires_at}`);

        return res.status(201).json({ 
            success: true, 
            message: 'Story created', 
            story: fullStory 
        });
    } catch (err) {
        console.error('❌ [Story Upload Error]:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStories = async (req, res) => {
    try {
        const currentUserId = req.user ? parseInt(req.user.id, 10) : 0;
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { userId } = req.query;

        // Deactivate expired stories before returning feed
        await db.query('UPDATE stories SET is_active = FALSE WHERE is_active = TRUE AND expires_at <= NOW()');

        // Fetch accepted connection IDs for debug log
        const connRes = await db.query(`
            SELECT CASE WHEN c.user_id = $1 THEN c.friend_id ELSE c.user_id END as conn_id
            FROM user_connections c
            WHERE (c.user_id = $1 OR c.friend_id = $1)
              AND (LOWER(c.status) = 'accepted' OR LOWER(c.status) = 'connected')
        `, [currentUserId]);
        const acceptedConnIds = connRes.rows.map(r => r.conn_id);

        // If target userId parameter is passed, verify it is either current user or an accepted connection
        if (userId) {
            const targetId = parseInt(userId, 10);
            if (targetId !== currentUserId) {
                const connCheck = await db.query(
                    `SELECT id FROM user_connections 
                     WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
                       AND (LOWER(status) = 'accepted' OR LOWER(status) = 'connected')`,
                    [currentUserId, targetId]
                );
                if (connCheck.rows.length === 0) {
                    console.log(`🔒 [STORY ACCESS DENIED GET /api/stories] Viewer: ${currentUserId} requested Target: ${targetId} - NOT CONNECTED`);
                    return res.status(200).json({ stories: [] });
                }
            }
        }

        let query = `
            SELECT 
                s.id, 
                s.user_id, 
                s.media_url, 
                s.media_type, 
                s.text_elements, 
                s.text_content,
                s.text_position,
                s.caption,
                s.music_data, 
                s.created_at, 
                s.expires_at, 
                s.view_count, 
                u.username, 
                COALESCE(u.profile_name, u.username) AS display_name,
                u.image_url as profile_image,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_likes sl WHERE sl.story_id = s.id), 0) as likes_count,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_comments sc WHERE sc.story_id = s.id), 0) as comments_count,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_shares ss WHERE ss.story_id = s.id), 0) as shares_count,
                EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1) as is_liked_by_user
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
        `;
        const params = [currentUserId];
        if (userId) {
            query += ' AND s.user_id = $2';
            params.push(parseInt(userId, 10));
        }
        query += ' ORDER BY s.created_at DESC';

        const result = await db.query(query, params);
        const returnedOwners = [...new Set(result.rows.map(s => `${s.username} (ID: ${s.user_id})`))];
        console.log(`🔒 [STORY ACCESS DEBUG GET /api/stories] Viewer ID: ${currentUserId} | Accepted Conns: [${acceptedConnIds.join(', ')}] | Returned Story Owners: [${returnedOwners.join(', ')}] | Count: ${result.rows.length}`);
        return res.status(200).json({ stories: result.rows });
    } catch (err) {
        console.error('getStories error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStoryById = async (req, res) => {
    try {
        const storyId = parseInt(req.params.id, 10);
        const currentUserId = req.user ? parseInt(req.user.id, 10) : 0;
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await db.query(`
            SELECT 
                s.*, 
                u.username, 
                COALESCE(u.profile_name, u.username) AS display_name,
                u.image_url as profile_image,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_likes sl WHERE sl.story_id = s.id), 0) as likes_count,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_comments sc WHERE sc.story_id = s.id), 0) as comments_count,
                COALESCE((SELECT COUNT(*)::INTEGER FROM story_shares ss WHERE ss.story_id = s.id), 0) as shares_count,
                EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $2) as is_liked_by_user
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = $1 
              AND s.is_active = TRUE 
              AND s.expires_at > NOW()
              AND (
                  s.user_id = $2 
                  OR s.user_id IN (
                      SELECT CASE WHEN c.user_id = $2 THEN c.friend_id ELSE c.user_id END
                      FROM user_connections c
                      WHERE (c.user_id = $2 OR c.friend_id = $2)
                        AND (c.status = 'accepted' OR c.status = 'connected')
                  )
              )
        `, [storyId, currentUserId]);

        if (result.rows.length === 0) {
            console.log(`📌 [Backend GET /api/stories/:id] storyId: ${storyId} not found, expired, or access denied`);
            return res.status(404).json({ error: 'This story is no longer available.' });
        }
        console.log(`📌 [Backend GET /api/stories/:id] storyId: ${storyId} found`);
        return res.status(200).json({ story: result.rows[0] });
    } catch (err) {
        console.error('getStoryById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// LIKE FUNCTIONALITY
// ==========================================

exports.likeStory = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        const story = await verifyStoryAccess(storyId, userId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found or access denied' });
        }

        // Insert like (prevent duplicates via UNIQUE constraint & ON CONFLICT)
        await db.query(
            'INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2) ON CONFLICT (user_id, story_id) DO NOTHING',
            [storyId, userId]
        );

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_likes WHERE story_id = $1', [storyId]);
        const totalLikes = countRes.rows[0].total;

        return res.status(200).json({
            success: true,
            message: 'Story liked',
            likes_count: totalLikes,
            totalLikes: totalLikes,
            isLikedByCurrentUser: true,
            isLiked: true
        });
    } catch (err) {
        console.error('likeStory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.unlikeStory = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        const story = await verifyStoryAccess(storyId, userId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found or access denied' });
        }

        await db.query('DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2', [storyId, userId]);

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_likes WHERE story_id = $1', [storyId]);
        const totalLikes = countRes.rows[0].total;

        return res.status(200).json({
            success: true,
            message: 'Story unliked',
            likes_count: totalLikes,
            totalLikes: totalLikes,
            isLikedByCurrentUser: false,
            isLiked: false
        });
    } catch (err) {
        console.error('unlikeStory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStoryLikes = async (req, res) => {
    try {
        const userId = req.user ? parseInt(req.user.id, 10) : null;
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        if (userId) {
            const story = await verifyStoryAccess(storyId, userId);
            if (!story) {
                return res.status(404).json({ error: 'Story not found or access denied' });
            }
        }

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_likes WHERE story_id = $1', [storyId]);
        let isLiked = false;
        if (userId) {
            const likedRes = await db.query('SELECT 1 FROM story_likes WHERE story_id = $1 AND user_id = $2', [storyId, userId]);
            isLiked = likedRes.rows.length > 0;
        }

        return res.status(200).json({
            success: true,
            totalLikes: countRes.rows[0].total,
            likes_count: countRes.rows[0].total,
            isLikedByCurrentUser: isLiked,
            isLiked: isLiked
        });
    } catch (err) {
        console.error('getStoryLikes error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// COMMENT FUNCTIONALITY
// ==========================================

exports.getStoryComments = async (req, res) => {
    try {
        const currentUserId = req.user ? parseInt(req.user.id, 10) : 0;
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        const story = await verifyStoryAccess(storyId, currentUserId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found or access denied' });
        }

        const result = await db.query(`
            SELECT 
                sc.id,
                sc.story_id,
                sc.user_id,
                sc.comment_text,
                sc.created_at,
                sc.updated_at,
                u.username,
                u.image_url as profile_image,
                (sc.user_id = $2) as can_delete
            FROM story_comments sc
            JOIN users u ON sc.user_id = u.id
            WHERE sc.story_id = $1
            ORDER BY sc.created_at ASC
        `, [storyId, currentUserId]);

        return res.status(200).json({
            success: true,
            comments: result.rows,
            comments_count: result.rows.length
        });
    } catch (err) {
        console.error('getStoryComments error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addStoryComment = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const storyId = parseInt(req.params.storyId, 10);
        const { text, comment_text } = req.body;
        const commentContent = (text || comment_text || '').trim();

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        if (!commentContent) {
            return res.status(400).json({ error: 'Comment text cannot be empty' });
        }

        const story = await verifyStoryAccess(storyId, userId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found or access denied' });
        }

        const insertRes = await db.query(
            'INSERT INTO story_comments (story_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING *',
            [storyId, userId, commentContent]
        );

        const userRes = await db.query('SELECT username, image_url as profile_image FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0] || {};

        const fullComment = {
            ...insertRes.rows[0],
            username: user.username || 'User',
            profile_image: user.profile_image || null,
            can_delete: true
        };

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_comments WHERE story_id = $1', [storyId]);

        return res.status(201).json({
            success: true,
            message: 'Comment added',
            comment: fullComment,
            comments_count: countRes.rows[0].total
        });
    } catch (err) {
        console.error('addStoryComment error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteStoryComment = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const commentId = parseInt(req.params.commentId || req.params.id, 10);

        if (!commentId || isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }

        const commentRes = await db.query(`
            SELECT sc.id, sc.user_id, sc.story_id, s.user_id as story_author_id
            FROM story_comments sc
            JOIN stories s ON sc.story_id = s.id
            WHERE sc.id = $1
        `, [commentId]);

        if (commentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const comment = commentRes.rows[0];
        if (comment.user_id !== userId && comment.story_author_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this comment' });
        }

        await db.query('DELETE FROM story_comments WHERE id = $1', [commentId]);

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_comments WHERE story_id = $1', [comment.story_id]);

        return res.status(200).json({
            success: true,
            message: 'Comment deleted',
            comments_count: countRes.rows[0].total,
            story_id: comment.story_id
        });
    } catch (err) {
        console.error('deleteStoryComment error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// SHARE FUNCTIONALITY
// ==========================================

exports.trackStoryShare = async (req, res) => {
    try {
        const userId = req.user ? parseInt(req.user.id, 10) : null;
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        if (userId) {
            const story = await verifyStoryAccess(storyId, userId);
            if (!story) {
                return res.status(404).json({ error: 'Story not found or access denied' });
            }
        }

        await db.query('INSERT INTO story_shares (story_id, user_id) VALUES ($1, $2)', [storyId, userId]);

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_shares WHERE story_id = $1', [storyId]);

        return res.status(200).json({
            success: true,
            message: 'Share tracked',
            shares_count: countRes.rows[0].total,
            sharesCount: countRes.rows[0].total
        });
    } catch (err) {
        console.error('trackStoryShare error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStoryShareCount = async (req, res) => {
    try {
        const userId = req.user ? parseInt(req.user.id, 10) : null;
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        if (userId) {
            const story = await verifyStoryAccess(storyId, userId);
            if (!story) {
                return res.status(404).json({ error: 'Story not found or access denied' });
            }
        }

        const countRes = await db.query('SELECT COUNT(*)::INTEGER as total FROM story_shares WHERE story_id = $1', [storyId]);

        return res.status(200).json({
            success: true,
            shares_count: countRes.rows[0].total,
            sharesCount: countRes.rows[0].total
        });
    } catch (err) {
        console.error('getStoryShareCount error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// VIEWS & DELETION
// ==========================================

exports.trackStoryView = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const storyId = parseInt(req.params.storyId, 10);

        if (!storyId || isNaN(storyId)) {
            return res.status(400).json({ success: false, error: 'Invalid story ID' });
        }

        const story = await verifyStoryAccess(storyId, userId);
        if (!story) {
            return res.status(404).json({ success: false, error: 'Story not found or access denied' });
        }

        // Add view record
        const viewResult = await db.query(
            'INSERT INTO story_views (story_id, viewer_user_id) VALUES ($1, $2) ON CONFLICT (story_id, viewer_user_id) DO NOTHING RETURNING *',
            [storyId, userId]
        );

        // If a new view was actually added, increment view_count in stories table
        if (viewResult.rows.length > 0) {
            await db.query('UPDATE stories SET view_count = view_count + 1 WHERE id = $1', [storyId]);
        }

        return res.status(200).json({ success: true, message: 'View tracked' });
    } catch (err) {
        console.error('trackStoryView error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

exports.getStoryViewers = async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.storyId;
        console.log(`📌 getStoryViewers: storyId=${storyId}, userId=${userId}`);

        if (!storyId || storyId === 'undefined') {
            console.log('❌ Invalid storyId in getStoryViewers');
            return res.status(400).json({ success: false, error: 'Invalid story ID' });
        }

        // Verify ownership and get view count
        const storyRes = await db.query('SELECT user_id, view_count FROM stories WHERE id = $1', [storyId]);
        if (storyRes.rows.length === 0) {
            console.log(`❌ Story ${storyId} not found`);
            return res.status(404).json({ success: false, error: 'Story not found' });
        }
        
        // Use loose equality to handle possible string/number mismatches
        if (storyRes.rows[0].user_id != userId) {
            console.log(`❌ Unauthorized: story.user_id=${storyRes.rows[0].user_id}, req.user.id=${userId}`);
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const viewersRes = await db.query(`
            SELECT 
                u.id as user_id, 
                u.username, 
                u.image_url as profile_image, 
                sv.viewed_at
            FROM story_views sv
            JOIN users u ON sv.viewer_user_id = u.id
            WHERE sv.story_id = $1
            ORDER BY sv.viewed_at DESC
        `, [storyId]);

        console.log(`✅ Found ${viewersRes.rows.length} viewers for story ${storyId}`);

        return res.status(200).json({ 
            success: true,
            viewsCount: storyRes.rows[0].view_count || 0,
            viewers: viewersRes.rows || []
        });
    } catch (err) {
        console.error('❌ getStoryViewers error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
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
            ORDER BY 
              CASE 
                WHEN LOWER(COALESCE(t.difficulty, '')) = 'easy' THEN 1
                WHEN LOWER(COALESCE(t.difficulty, '')) = 'medium' THEN 2
                WHEN LOWER(COALESCE(t.difficulty, '')) = 'hard' THEN 3
                ELSE 4
              END ASC,
              t.created_at DESC
        `, [userId]);

        const difficultyOrderMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
        const sortedTasks = [...result.rows].sort((a, b) => {
            const diffA = (a.difficulty || 'easy').toString().toLowerCase().trim();
            const diffB = (b.difficulty || 'easy').toString().toLowerCase().trim();
            const orderA = difficultyOrderMap[diffA] || 4;
            const orderB = difficultyOrderMap[diffB] || 4;
            if (orderA !== orderB) return orderA - orderB;
            return 0;
        });

        return res.status(200).json({ tasks: sortedTasks });
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
        const userId = parseInt(req.user.id, 10);
        const taskId = parseInt(req.params.id, 10);
        console.log(`📌 completeTask called: userId=${userId}, taskId=${taskId}`);

        const taskRes = await db.query('SELECT id, title, points_reward FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const task = taskRes.rows[0];

        const result = await pointsStreakService.recordTaskCompletionAndAwardPoints({
            userId,
            taskName: task.title,
            taskId: task.id,
            points: task.points_reward,
            source: 'task_completion'
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('completeTask error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.completeTaskByName = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const taskName = req.body.taskName || req.body.task_name || req.body.title || req.body.taskTitle;
        const points = req.body.points;
        console.log(`📌 completeTaskByName called: userId=${userId}, taskName=${taskName}`);

        if (!taskName) {
            return res.status(400).json({ error: 'taskName is required' });
        }

        const result = await pointsStreakService.recordTaskCompletionAndAwardPoints({
            userId,
            taskName,
            points: points || null,
            source: 'task_completion'
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('completeTaskByName error:', err);
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

        const taskExists = await db.query('SELECT id, title, points_reward FROM tasks WHERE id = $1', [taskId]);
        if (taskExists.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const task = taskExists.rows[0];

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

        let rewardResult = null;
        if (progress === 100) {
            rewardResult = await pointsStreakService.recordTaskCompletionAndAwardPoints({
                userId,
                taskName: task.title,
                taskId: task.id,
                points: task.points_reward,
                source: 'task_completion'
            });
        }

        return res.status(200).json({
            message: 'Task progress updated',
            user_task: result.rows[0],
            reward: rewardResult
        });
    } catch (err) {
        console.error('updateTaskProgress error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Points
exports.getPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const summary = await pointsStreakService.getUserPointsAndStreak(userId);
        return res.status(200).json({
            total_points: summary.totalPoints,
            streak: summary.currentStreak,
            currentStreak: summary.currentStreak,
            longestStreak: summary.longestStreak
        });
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
