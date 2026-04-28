const db = require('../db');

exports.getActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                a.*, 
                u.username as creator_name, 
                u.image_url as creator_image,
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as joined_count,
                EXISTS(SELECT 1 FROM activity_participants WHERE activity_id = a.id AND user_id = $1) as is_joined
            FROM activities a
            JOIN users u ON a.creator_id = u.id
            ORDER BY a.created_at DESC
        `;
        const result = await db.query(query, [userId]);
        
        const activities = result.rows.map(row => ({
            id: row.id.toString(),
            category: row.category,
            title: row.title,
            description: row.description,
            date: row.date_str,
            time: row.time_str,
            location: row.location,
            joined: parseInt(row.joined_count),
            capacity: row.capacity,
            isJoined: row.is_joined,
            creator: {
                name: row.creator_name,
                initial: row.creator_name.charAt(0).toUpperCase(),
                color: '#A855F7', // Default purple, could be randomized or based on user profile
                image: row.creator_image
            },
            imageColor: row.image_url ? null : (row.category_color || '#EA580C'),
            imageUrl: row.image_url,
            emoji: row.emoji || '📅'
        }));

        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getJoinedActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                a.*, 
                u.username as creator_name, 
                u.image_url as creator_image,
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as joined_count,
                true as is_joined
            FROM activities a
            JOIN users u ON a.creator_id = u.id
            JOIN activity_participants ap ON a.id = ap.activity_id
            WHERE ap.user_id = $1
            ORDER BY ap.joined_at DESC
        `;
        const result = await db.query(query, [userId]);
        
        const activities = result.rows.map(row => ({
            id: row.id.toString(),
            category: row.category,
            title: row.title,
            description: row.description,
            date: row.date_str,
            time: row.time_str,
            location: row.location,
            joined: parseInt(row.joined_count),
            capacity: row.capacity,
            isJoined: true,
            creator: {
                name: row.creator_name,
                initial: row.creator_name.charAt(0).toUpperCase(),
                color: '#A855F7',
                image: row.creator_image
            },
            imageColor: row.image_url ? null : (row.category_color || '#EA580C'),
            imageUrl: row.image_url,
            emoji: row.emoji || '📅'
        }));

        res.json(activities);
    } catch (error) {
        console.error('Get joined activities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getActivityById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const query = `
            SELECT 
                a.*, 
                u.username as creator_name, 
                u.image_url as creator_image,
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as joined_count,
                EXISTS(SELECT 1 FROM activity_participants WHERE activity_id = a.id AND user_id = $1) as is_joined
            FROM activities a
            JOIN users u ON a.creator_id = u.id
            WHERE a.id = $2
        `;
        const result = await db.query(query, [userId, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const row = result.rows[0];
        const activity = {
            id: row.id.toString(),
            category: row.category,
            title: row.title,
            description: row.description,
            date: row.date_str,
            time: row.time_str,
            location: row.location,
            joined: parseInt(row.joined_count),
            capacity: row.capacity,
            isJoined: row.is_joined,
            creator: {
                name: row.creator_name,
                initial: row.creator_name.charAt(0).toUpperCase(),
                color: '#A855F7',
                image: row.creator_image
            },
            imageColor: row.image_url ? null : '#EA580C',
            imageUrl: row.image_url,
            emoji: row.emoji || '📅'
        };

        res.json(activity);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createActivity = async (req, res) => {
    try {
        const { title, category, date, time, location, capacity, description, image_url, emoji } = req.body;
        const creator_id = req.user.id;

        if (!title || !category || !location || !capacity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            INSERT INTO activities (
                creator_id, category, title, description, date_str, time_str, location, capacity, image_url, emoji
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await db.query(query, [
            creator_id, category, title, description || '', date, time, location, capacity, image_url || null, emoji || '📅'
        ]);

        const newActivity = result.rows[0];
        
        // Auto-join the creator
        await db.query(
            'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newActivity.id, creator_id]
        );

        res.status(201).json({
            message: 'Activity created successfully',
            activity: {
                ...newActivity,
                id: newActivity.id.toString(),
                joined: 1,
                isJoined: true
            }
        });
    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, date, time, location, capacity, description, image_url, emoji } = req.body;
        const userId = req.user.id;

        // Check ownership
        const ownershipCheck = await db.query('SELECT creator_id FROM activities WHERE id = $1', [id]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        if (ownershipCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to update this activity' });
        }

        const query = `
            UPDATE activities SET
                title = COALESCE($1, title),
                category = COALESCE($2, category),
                date_str = COALESCE($3, date_str),
                time_str = COALESCE($4, time_str),
                location = COALESCE($5, location),
                capacity = COALESCE($6, capacity),
                description = COALESCE($7, description),
                image_url = COALESCE($8, image_url),
                emoji = COALESCE($9, emoji),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 RETURNING *
        `;
        const result = await db.query(query, [title, category, date, time, location, capacity, description, image_url, emoji, id]);

        res.json({ message: 'Activity updated successfully', activity: result.rows[0] });
    } catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check ownership
        const ownershipCheck = await db.query('SELECT creator_id FROM activities WHERE id = $1', [id]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        if (ownershipCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this activity' });
        }

        await db.query('DELETE FROM activities WHERE id = $1', [id]);
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.joinActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check capacity
        const activityResult = await db.query(`
            SELECT 
                capacity, 
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = $1) as joined_count 
            FROM activities WHERE id = $1
        `, [id]);

        if (activityResult.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const { capacity, joined_count } = activityResult.rows[0];
        if (parseInt(joined_count) >= capacity) {
            return res.status(400).json({ error: 'Activity is full' });
        }

        await db.query(
            'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, userId]
        );

        res.json({ message: 'Joined activity successfully' });
    } catch (error) {
        console.error('Join activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.leaveActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Creators shouldn't leave their own activity? Or maybe they can?
        // Usually they delete it. But let's just allow leaving.

        await db.query(
            'DELETE FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Left activity successfully' });
    } catch (error) {
        console.error('Leave activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
