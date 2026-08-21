const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');

// 3-tier relationship model. CLOSE = highest trust, GROWING_FOLLOWER = default for new connections.
const RELATIONSHIP_TIERS = ['CLOSE', 'FAMILY_REGULAR', 'GROWING_FOLLOWER'];
const DEFAULT_RELATIONSHIP_TIER = 'GROWING_FOLLOWER';

exports.getProfile = async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        
        // Fetch stats first
        const summary = await pointsStreakService.getUserPointsAndStreak(userId);
        const tasksCompleted = summary.completedCount;
        const taskPoints = summary.totalPoints;

        // Fetch user data
        const userResult = await db.query(
            'SELECT id, username, email, phone_number, profession, about, image_url, created_at, points, pincode, city, state, latitude, longitude FROM users WHERE id = $1', 
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = {
            ...userResult.rows[0],
            points: taskPoints,
            streak_count: summary.currentStreak
        };

        // Fetch stats
        const activitiesResult = await db.query('SELECT COUNT(*) FROM activity_participants WHERE user_id = $1', [userId]);
        const activitiesJoined = parseInt(activitiesResult.rows[0].count, 10);

        const connectionsResult = await db.query("SELECT COUNT(*) FROM user_connections WHERE (user_id = $1 OR friend_id = $1) AND (status = 'accepted' OR status = 'connected')", [userId]).catch(() => ({ rows: [{ count: 0 }] }));
        const connections = parseInt(connectionsResult.rows[0]?.count || 0, 10);

        const storiesResult = await db.query("SELECT COUNT(*) FROM stories WHERE user_id = $1", [userId]);
        const storiesCount = parseInt(storiesResult.rows[0].count, 10);

        const stats = {
            activitiesJoined,
            tasksCompleted,
            connections,
            taskPoints,
            totalPoints: taskPoints,
            total_points: taskPoints,
            streak: summary.currentStreak,
            longestStreak: summary.longestStreak,
            storiesCount,
            postsCount: 0 // Placeholder if posts exist in future
        };

        // Fetch interests
        const interestsResult = await db.query('SELECT interest FROM user_interests WHERE user_id = $1', [userId]);
        const interests = interestsResult.rows.map(row => row.interest);

        res.json({ user, stats, interests });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, username, profession, about, image_url, full_name, pincode, city, state } = req.body;

        if (pincode && !/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Please enter a valid Indian pincode.' });
        }
        
        let updateEmail = email ? email.trim().toLowerCase() : null;
        
        if (updateEmail) {
            // Check for duplicate email
            const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [updateEmail, userId]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        
        // Assuming we map full_name to username if full_name is not present in schema
        const updateUsername = username || full_name;

        const result = await db.query(
            `UPDATE users 
             SET username = COALESCE($1, username), 
                 email = COALESCE($2, email),
                 profession = COALESCE($3, profession), 
                 about = COALESCE($4, about), 
                 image_url = COALESCE($5, image_url),
                 pincode = COALESCE($6, pincode),
                 city = COALESCE($7, city),
                 state = COALESCE($8, state)
             WHERE id = $9 RETURNING id, username, email, phone_number, profession, about, image_url, points, pincode, city, state`,
            [updateUsername, updateEmail, profession, about, image_url, pincode, city, state, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const activitiesResult = await db.query('SELECT COUNT(*) FROM activity_participants WHERE user_id = $1', [userId]);
        const activitiesJoined = parseInt(activitiesResult.rows[0].count, 10);

        const summary = await pointsStreakService.getUserPointsAndStreak(userId);
        const tasksCompleted = summary.completedCount;

        const connectionsResult = await db.query("SELECT COUNT(*) FROM user_connections WHERE (user_id = $1 OR friend_id = $1) AND (status = 'accepted' OR status = 'connected')", [userId]).catch(() => ({ rows: [{ count: 0 }] }));
        const connections = parseInt(connectionsResult.rows[0]?.count || 0, 10);

        const taskPoints = summary.totalPoints;

        const storiesResult = await db.query("SELECT COUNT(*) FROM stories WHERE user_id = $1", [userId]);
        const storiesCount = parseInt(storiesResult.rows[0].count, 10);

        res.json({
            activitiesJoined,
            tasksCompleted,
            connections,
            taskPoints,
            streak: summary.currentStreak,
            longestStreak: summary.longestStreak,
            storiesCount,
            postsCount: 0
        });
    } catch (error) {
        console.error('getStats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getInterests = async (req, res) => {
    try {
        const userId = req.user.id;
        const interestsResult = await db.query('SELECT interest FROM user_interests WHERE user_id = $1', [userId]);
        const interests = interestsResult.rows.map(row => row.interest);
        
        res.json({ interests });
    } catch (error) {
        console.error('getInterests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateInterests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { interests } = req.body;

        if (!Array.isArray(interests)) {
            return res.status(400).json({ error: 'Interests must be an array' });
        }

        // Clean up duplicates and trim
        const cleanedInterests = [...new Set(interests.map(i => typeof i === 'string' ? i.trim() : '').filter(i => i))];

        if (cleanedInterests.length === 0) {
            return res.status(400).json({ error: 'At least one valid interest is required' });
        }

        // Begin transaction
        await db.query('BEGIN');
        
        // 1. Delete old interests
        await db.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);

        // 2. Insert new interests
        for (const interest of cleanedInterests) {
            await db.query('INSERT INTO user_interests (user_id, interest) VALUES ($1, $2)', [userId, interest]);
        }

        await db.query('COMMIT');

        res.json({ message: 'Interests updated successfully', interests: cleanedInterests });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('updateInterests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = (req.query.q || '').trim();

        if (!query || query.length < 2) {
            return res.json({ users: [] });
        }

        const searchPattern = `%${query}%`;

        const sql = `
            SELECT 
                u.id,
                u.username,
                COALESCE(u.profile_name, u.username) AS display_name,
                u.profession,
                u.about,
                u.image_url,
                c.status AS raw_status,
                c.user_id AS requester_id,
                c.friend_id AS receiver_id
            FROM users u
            LEFT JOIN user_connections c 
                ON (c.user_id = $1 AND c.friend_id = u.id) 
                OR (c.user_id = u.id AND c.friend_id = $1)
            WHERE u.id != $1
              AND (
                u.username ILIKE $2
                OR u.profile_name ILIKE $2
                OR u.email ILIKE $2
              )
            ORDER BY 
                CASE 
                    WHEN LOWER(u.username) = LOWER($3) THEN 1
                    WHEN LOWER(COALESCE(u.profile_name, '')) = LOWER($3) THEN 2
                    WHEN u.username ILIKE $4 THEN 3
                    WHEN u.profile_name ILIKE $4 THEN 4
                    ELSE 5
                END,
                u.username ASC
            LIMIT 20
        `;

        const result = await db.query(sql, [userId, searchPattern, query, `${query}%`]);

        const users = result.rows.map(row => {
            let connection_status = 'none';
            
            if (row.raw_status === 'accepted' || row.raw_status === 'connected') {
                connection_status = 'connected';
            } else if (row.raw_status === 'pending') {
                if (row.requester_id === userId) {
                    connection_status = 'requested';
                } else if (row.receiver_id === userId) {
                    connection_status = 'incoming';
                }
            }

            return {
                id: row.id,
                user_id: row.id,
                username: row.username,
                display_name: row.display_name,
                profile_image: row.image_url,
                image_url: row.image_url,
                avatar_url: row.image_url,
                profession: row.profession,
                about: row.about,
                connection_status
            };
        });

        res.json({ users });
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.sendConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friend_id, user_id } = req.body;
        const targetUserId = parseInt(friend_id || user_id, 10);

        if (!targetUserId || isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Valid friend_id is required' });
        }

        if (targetUserId === userId) {
            return res.status(400).json({ error: 'Cannot connect with yourself' });
        }

        const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingRes = await db.query(
            `SELECT id, status, user_id, friend_id FROM user_connections 
             WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [userId, targetUserId]
        );

        if (existingRes.rows.length > 0) {
            const existing = existingRes.rows[0];
            if (existing.status === 'accepted' || existing.status === 'connected') {
                return res.json({ 
                    message: 'Already connected', 
                    connection_status: 'connected' 
                });
            }
            if (existing.status === 'pending') {
                if (existing.user_id === userId) {
                    return res.json({ 
                        message: 'Connection request already sent', 
                        connection_status: 'requested' 
                    });
                } else {
                    return res.json({ 
                        message: 'Incoming request exists from this user', 
                        connection_status: 'incoming' 
                    });
                }
            }
            // If declined, re-open as pending
            await db.query(
                `UPDATE user_connections SET user_id = $1, friend_id = $2, status = 'pending', created_at = CURRENT_TIMESTAMP WHERE id = $3`,
                [userId, targetUserId, existing.id]
            );
            return res.json({ 
                success: true, 
                message: 'Connection request sent', 
                connection_status: 'requested' 
            });
        }

        await db.query(
            `INSERT INTO user_connections (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
            [userId, targetUserId]
        );

        res.json({ 
            success: true, 
            message: 'Connection request sent', 
            connection_status: 'requested' 
        });
    } catch (error) {
        console.error('sendConnectionRequest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT DISTINCT
                u.id,
                u.id AS user_id,
                u.username,
                COALESCE(u.profile_name, u.username) AS display_name,
                u.profession,
                u.about,
                u.image_url AS profile_image,
                u.image_url AS image_url,
                u.image_url AS avatar_url,
                CASE WHEN c.user_id = $1 THEN c.user_relationship_tier ELSE c.friend_relationship_tier END AS relationship_tier
            FROM user_connections c
            JOIN users u ON u.id = CASE WHEN c.user_id = $1 THEN c.friend_id ELSE c.user_id END
            WHERE (c.user_id = $1 OR c.friend_id = $1)
              AND (c.status = 'accepted' OR c.status = 'connected')
            ORDER BY display_name ASC
        `;

        const result = await db.query(sql, [userId]);

        const connections = result.rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            username: row.username,
            display_name: row.display_name,
            profile_image: row.profile_image || row.image_url,
            image_url: row.image_url || row.profile_image,
            avatar_url: row.avatar_url || row.profile_image,
            profession: row.profession,
            about: row.about,
            connection_status: 'connected',
            relationship_tier: row.relationship_tier || DEFAULT_RELATIONSHIP_TIER
        }));

        res.json({ connections });
    } catch (error) {
        console.error('getConnections error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getIncomingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT 
                c.id AS request_id,
                c.created_at,
                u.id AS sender_id,
                u.username,
                COALESCE(u.profile_name, u.username) AS display_name,
                u.profession,
                u.about,
                u.image_url AS profile_image
            FROM user_connections c
            JOIN users u ON u.id = c.user_id
            WHERE c.friend_id = $1 AND c.status = 'pending'
            ORDER BY c.created_at DESC
        `;

        const result = await db.query(sql, [userId]);

        const requests = result.rows.map(row => ({
            request_id: row.request_id,
            created_at: row.created_at,
            status: 'pending',
            sender: {
                id: row.sender_id,
                user_id: row.sender_id,
                username: row.username,
                display_name: row.display_name,
                profile_image: row.profile_image,
                image_url: row.profile_image,
                avatar_url: row.profile_image,
                profession: row.profession,
                about: row.about,
                connection_status: 'incoming'
            }
        }));

        res.json({ requests });
    } catch (error) {
        console.error('getIncomingRequests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOutgoingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT 
                c.id AS request_id,
                c.created_at,
                u.id AS receiver_id,
                u.username,
                COALESCE(u.profile_name, u.username) AS display_name,
                u.profession,
                u.about,
                u.image_url AS profile_image
            FROM user_connections c
            JOIN users u ON u.id = c.friend_id
            WHERE c.user_id = $1 AND c.status = 'pending'
            ORDER BY c.created_at DESC
        `;

        const result = await db.query(sql, [userId]);

        const requests = result.rows.map(row => ({
            request_id: row.request_id,
            created_at: row.created_at,
            status: 'pending',
            receiver: {
                id: row.receiver_id,
                user_id: row.receiver_id,
                username: row.username,
                display_name: row.display_name,
                profile_image: row.profile_image,
                profession: row.profession,
                about: row.about,
                connection_status: 'requested'
            }
        }));

        res.json({ requests });
    } catch (error) {
        console.error('getOutgoingRequests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.acceptConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friend_id, target_user_id, sender_id } = req.body;
        const paramId = req.params?.friendId || req.params?.id;
        const targetId = parseInt(friend_id || target_user_id || sender_id || paramId, 10);

        if (!targetId || isNaN(targetId)) {
            return res.status(400).json({ error: 'Valid friend_id or id parameter is required' });
        }

        // Security check: Only the actual receiver (friend_id = userId) can accept a pending request from sender (user_id = targetId)
        const updateRes = await db.query(
            `UPDATE user_connections 
             SET status = 'accepted' 
             WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
             RETURNING id, status`,
            [targetId, userId]
        );

        if (updateRes.rows.length === 0) {
            // Check if connection is already accepted
            const checkAlready = await db.query(
                `SELECT id, status FROM user_connections 
                 WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
                   AND (status = 'accepted' OR status = 'connected')`,
                [targetId, userId]
            );

            if (checkAlready.rows.length > 0) {
                return res.json({
                    success: true,
                    message: 'Already connected',
                    connection_status: 'connected'
                });
            }

            return res.status(400).json({ error: 'No pending connection request found to accept' });
        }

        res.json({
            success: true,
            message: 'Connection request accepted',
            connection_status: 'connected'
        });
    } catch (error) {
        console.error('acceptConnectionRequest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.declineConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friend_id, target_user_id, sender_id } = req.body;
        const paramId = req.params?.friendId || req.params?.id;
        const targetId = parseInt(friend_id || target_user_id || sender_id || paramId, 10);

        if (!targetId || isNaN(targetId)) {
            return res.status(400).json({ error: 'Valid friend_id or id parameter is required' });
        }

        // Security check: Only the actual receiver (friend_id = userId) can decline a pending request from sender (user_id = targetId)
        const updateRes = await db.query(
            `UPDATE user_connections 
             SET status = 'declined' 
             WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
             RETURNING id, status`,
            [targetId, userId]
        );

        if (updateRes.rows.length === 0) {
            // Check if already declined or no relationship
            const checkDeclined = await db.query(
                `SELECT id, status FROM user_connections 
                 WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) AND status = 'declined'`,
                [targetId, userId]
            );

            if (checkDeclined.rows.length > 0) {
                return res.json({
                    success: true,
                    message: 'Connection request already declined',
                    connection_status: 'none'
                });
            }
        }

        res.json({
            success: true,
            message: 'Connection request declined',
            connection_status: 'none'
        });
    } catch (error) {
        console.error('declineConnectionRequest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.removeConnection = async (req, res) => {
    try {
        const userId = req.user.id;
        const paramId = req.params?.friendId || req.params?.id;
        const targetId = parseInt(paramId, 10);

        if (!targetId || isNaN(targetId)) {
            return res.status(400).json({ error: 'Valid friendId parameter is required' });
        }

        await db.query(
            `DELETE FROM user_connections 
             WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [userId, targetId]
        );

        res.json({
            success: true,
            message: 'Connection removed successfully',
            connection_status: 'none'
        });
    } catch (error) {
        console.error('removeConnection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateConnectionTier = async (req, res) => {
    try {
        const userId = req.user.id;
        const paramId = req.params?.friendId;
        const targetId = parseInt(paramId, 10);
        const { tier } = req.body;

        if (!targetId || isNaN(targetId)) {
            return res.status(400).json({ error: 'Valid friendId parameter is required' });
        }

        if (!RELATIONSHIP_TIERS.includes(tier)) {
            return res.status(400).json({ error: `Invalid tier. Must be one of: ${RELATIONSHIP_TIERS.join(', ')}` });
        }

        const existingRes = await db.query(
            `SELECT id, user_id, friend_id, status FROM user_connections
             WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            [userId, targetId]
        );

        if (existingRes.rows.length === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        const connection = existingRes.rows[0];

        if (connection.status !== 'accepted' && connection.status !== 'connected') {
            return res.status(400).json({ error: 'Can only set a relationship tier on an accepted connection' });
        }

        // The tier is stored per-direction: whichever column represents "how userId sees the other person".
        const column = connection.user_id === userId ? 'user_relationship_tier' : 'friend_relationship_tier';

        await db.query(
            `UPDATE user_connections SET ${column} = $1 WHERE id = $2`,
            [tier, connection.id]
        );

        res.json({
            success: true,
            message: 'Relationship tier updated',
            relationship_tier: tier
        });
    } catch (error) {
        console.error('updateConnectionTier error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



