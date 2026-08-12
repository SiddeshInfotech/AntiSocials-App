const db = require('../db');
const pointsStreakService = require('../services/pointsStreakService');

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

        const connectionsResult = await db.query('SELECT COUNT(*) FROM user_connections WHERE user_id = $1 OR friend_id = $1', [userId]).catch(() => ({ rows: [{ count: 0 }] }));
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

        const connectionsResult = await db.query('SELECT COUNT(*) FROM user_connections WHERE user_id = $1 OR friend_id = $1', [userId]).catch(() => ({ rows: [{ count: 0 }] }));
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
