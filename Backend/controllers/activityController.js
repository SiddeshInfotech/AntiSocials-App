const db = require('../db');

const parseMemberPreview = (raw) => {
    let list = raw;
    if (typeof list === 'string') {
        try { list = JSON.parse(list); } catch (e) { list = []; }
    }
    if (!Array.isArray(list)) return [];
    return list.map(m => ({
        id: m.id ? m.id.toString() : '',
        name: m.name || 'Member',
        profileImage: m.profileImage || null
    }));
};

const parseActivityDate = (dateStr, createdAt) => {
    if (!dateStr || typeof dateStr !== 'string') {
        if (createdAt) {
            const cd = new Date(createdAt);
            if (!isNaN(cd.getTime())) return cd;
        }
        return null;
    }
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // DD/MM/YYYY or D/M/YYYY
    const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmySlash) {
        const [, d, m, y] = dmySlash;
        let day = parseInt(d, 10);
        let month = parseInt(m, 10);
        const year = parseInt(y, 10);
        if (month > 12 && day <= 12) {
            const temp = day;
            day = month;
            month = temp;
        }
        return new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    // DD-MM-YYYY or D-M-YYYY
    const dmyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyDash) {
        const [, d, m, y] = dmyDash;
        let day = parseInt(d, 10);
        let month = parseInt(m, 10);
        const year = parseInt(y, 10);
        if (month > 12 && day <= 12) {
            const temp = day;
            day = month;
            month = temp;
        }
        return new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
        const [, y, m, d] = ymd;
        return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 23, 59, 59, 999);
    }

    // Month names like "Aug 12" or "Aug 12, 2026" or "12 Aug 2026"
    const MONTH_MAP = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11
    };

    const currentYear = new Date().getFullYear();

    const mFirst = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/i);
    if (mFirst) {
        const mKey = mFirst[1].toLowerCase();
        if (MONTH_MAP[mKey] !== undefined) {
            const m = MONTH_MAP[mKey];
            const d = parseInt(mFirst[2], 10);
            const y = mFirst[3] ? parseInt(mFirst[3], 10) : currentYear;
            return new Date(y, m, d, 23, 59, 59, 999);
        }
    }

    const dFirst = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)(?:[,\s]+(\d{4}))?/i);
    if (dFirst) {
        const mKey = dFirst[2].toLowerCase();
        if (MONTH_MAP[mKey] !== undefined) {
            const m = MONTH_MAP[mKey];
            const d = parseInt(dFirst[1], 10);
            const y = dFirst[3] ? parseInt(dFirst[3], 10) : currentYear;
            return new Date(y, m, d, 23, 59, 59, 999);
        }
    }

    const parsed = Date.parse(trimmed.includes(' ') || trimmed.includes(',') || trimmed.length > 6 ? trimmed : `${trimmed} ${currentYear}`);
    if (!isNaN(parsed)) {
        const pd = new Date(parsed);
        pd.setHours(23, 59, 59, 999);
        return pd;
    }

    return null;
};

const isActivityExpired = (dateStr, createdAt, status) => {
    if (status === 'completed' || status === 'past' || status === 'expired') return true;
    const activityDate = parseActivityDate(dateStr, createdAt);
    if (!activityDate) return false;
    const now = new Date();
    return activityDate.getTime() < now.getTime();
};

const getActivityMemberInfo = async (activityId) => {
    const res = await db.query(`
        SELECT 
            COUNT(*)::int as joined_count,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'id', mu.id::text,
                    'name', mu.username,
                    'profileImage', mu.image_url
                ) ORDER BY ap_sub.joined_at ASC, ap_sub.id ASC), '[]'::json)
                FROM (
                    SELECT ap.user_id, ap.joined_at, ap.id
                    FROM activity_participants ap
                    WHERE ap.activity_id = $1
                    ORDER BY ap.joined_at ASC, ap.id ASC
                    LIMIT 6
                ) ap_sub
                JOIN users mu ON ap_sub.user_id = mu.id
            ) as member_preview
        FROM activity_participants
        WHERE activity_id = $1
    `, [activityId]);

    const row = res.rows[0] || {};
    return {
        joined: row.joined_count ? parseInt(row.joined_count) : 0,
        memberPreview: parseMemberPreview(row.member_preview)
    };
};

exports.getActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userRes = await db.query('SELECT pincode, latitude, longitude FROM users WHERE id = $1', [userId]);
        const { pincode: userPincode, latitude: userLat, longitude: userLon } = userRes.rows[0] || {};

        let query, params;

        if (userLat && userLon) {
            query = `
                SELECT 
                    a.*, 
                    u.username as creator_name, 
                    u.image_url as creator_image,
                    (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as joined_count,
                    EXISTS(SELECT 1 FROM activity_participants WHERE activity_id = a.id AND user_id = $1) as is_joined,
                    (
                        SELECT COALESCE(json_agg(json_build_object(
                            'id', mu.id::text,
                            'name', mu.username,
                            'profileImage', mu.image_url
                        ) ORDER BY ap_sub.joined_at ASC, ap_sub.id ASC), '[]'::json)
                        FROM (
                            SELECT ap.user_id, ap.joined_at, ap.id
                            FROM activity_participants ap
                            WHERE ap.activity_id = a.id
                            ORDER BY ap.joined_at ASC, ap.id ASC
                            LIMIT 6
                        ) ap_sub
                        JOIN users mu ON ap_sub.user_id = mu.id
                    ) as member_preview,
                    (6371 * acos( LEAST(1.0, GREATEST(-1.0, cos(radians($2)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians($3)) + sin(radians($2)) * sin(radians(a.latitude)))) )) AS distance
                FROM activities a
                JOIN users u ON a.creator_id = u.id
                WHERE (a.latitude IS NOT NULL AND a.longitude IS NOT NULL AND 
                      (6371 * acos( LEAST(1.0, GREATEST(-1.0, cos(radians($2)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians($3)) + sin(radians($2)) * sin(radians(a.latitude)))) )) < 20)
                      OR (a.pincode = $4 AND $4::varchar IS NOT NULL)
                ORDER BY distance ASC NULLS LAST, a.created_at DESC
            `;
            params = [userId, userLat, userLon, userPincode];
        } else {
            query = `
                SELECT 
                    a.*, 
                    u.username as creator_name, 
                    u.image_url as creator_image,
                    (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as joined_count,
                    EXISTS(SELECT 1 FROM activity_participants WHERE activity_id = a.id AND user_id = $1) as is_joined,
                    (
                        SELECT COALESCE(json_agg(json_build_object(
                            'id', mu.id::text,
                            'name', mu.username,
                            'profileImage', mu.image_url
                        ) ORDER BY ap_sub.joined_at ASC, ap_sub.id ASC), '[]'::json)
                        FROM (
                            SELECT ap.user_id, ap.joined_at, ap.id
                            FROM activity_participants ap
                            WHERE ap.activity_id = a.id
                            ORDER BY ap.joined_at ASC, ap.id ASC
                            LIMIT 6
                        ) ap_sub
                        JOIN users mu ON ap_sub.user_id = mu.id
                    ) as member_preview
                FROM activities a
                JOIN users u ON a.creator_id = u.id
                WHERE $2::varchar IS NULL OR a.pincode = $2
                ORDER BY a.created_at DESC
            `;
            params = [userId, userPincode];
        }

        const result = await db.query(query, params);
        
        // Filter out completed/past activities from Discover active feed
        const activeRows = result.rows.filter(row => !isActivityExpired(row.date_str, row.created_at, row.status));

        // Mark completed activities in database asynchronously for record tracking (never delete)
        const completedIds = result.rows.filter(row => isActivityExpired(row.date_str, row.created_at, row.status) && row.status !== 'completed').map(r => r.id);
        if (completedIds.length > 0) {
            db.query("UPDATE activities SET status = 'completed' WHERE id = ANY($1)", [completedIds]).catch(() => {});
        }
        
        const activities = activeRows.map(row => ({
            id: row.id.toString(),
            creatorId: row.creator_id ? row.creator_id.toString() : null,
            isCreator: parseInt(row.creator_id, 10) === parseInt(userId, 10),
            category: row.category,
            title: row.title,
            description: row.description,
            date: row.date_str,
            time: row.time_str,
            location: row.location,
            locationName: row.location_name,
            address: row.address || '',
            pincode: row.pincode,
            city: row.city,
            distance: row.distance,
            joined: parseInt(row.joined_count || 0),
            capacity: row.capacity,
            isJoined: row.is_joined,
            status: 'upcoming',
            isCompleted: false,
            creator: {
                name: row.creator_name,
                initial: row.creator_name ? row.creator_name.charAt(0).toUpperCase() : 'U',
                color: '#A855F7',
                image: row.creator_image
            },
            imageColor: row.image_url ? null : (row.category_color || '#EA580C'),
            imageUrl: row.image_url,
            image_url: row.image_url,
            emoji: row.emoji || '📅',
            memberPreview: parseMemberPreview(row.member_preview)
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
                true as is_joined,
                (
                    SELECT COALESCE(json_agg(json_build_object(
                        'id', mu.id::text,
                        'name', mu.username,
                        'profileImage', mu.image_url
                    ) ORDER BY ap_sub.joined_at ASC, ap_sub.id ASC), '[]'::json)
                    FROM (
                        SELECT ap.user_id, ap.joined_at, ap.id
                        FROM activity_participants ap
                        WHERE ap.activity_id = a.id
                        ORDER BY ap.joined_at ASC, ap.id ASC
                        LIMIT 6
                    ) ap_sub
                    JOIN users mu ON ap_sub.user_id = mu.id
                ) as member_preview
            FROM activities a
            JOIN users u ON a.creator_id = u.id
            JOIN activity_participants ap ON a.id = ap.activity_id
            WHERE ap.user_id = $1
            ORDER BY ap.joined_at DESC
        `;
        const result = await db.query(query, [userId]);
        
        // Joined activities should retain history (do not delete or hide completed activities)
        const activities = result.rows.map(row => {
            const isCompleted = isActivityExpired(row.date_str, row.created_at, row.status);
            return {
                id: row.id.toString(),
                creatorId: row.creator_id ? row.creator_id.toString() : null,
                isCreator: parseInt(row.creator_id, 10) === parseInt(userId, 10),
                category: row.category,
                title: row.title,
                description: row.description,
                date: row.date_str,
                time: row.time_str,
                location: row.location,
                locationName: row.location_name,
                address: row.address || '',
                pincode: row.pincode,
                city: row.city,
                joined: parseInt(row.joined_count || 0),
                capacity: row.capacity,
                isJoined: true,
                status: isCompleted ? 'completed' : 'upcoming',
                isCompleted,
                creator: {
                    name: row.creator_name,
                    initial: row.creator_name ? row.creator_name.charAt(0).toUpperCase() : 'U',
                    color: '#A855F7',
                    image: row.creator_image
                },
                imageColor: row.image_url ? null : (row.category_color || '#EA580C'),
                imageUrl: row.image_url,
                image_url: row.image_url,
                emoji: row.emoji || '📅',
                memberPreview: parseMemberPreview(row.member_preview),
                ownerFeedback: row.owner_feedback || row.feedback_rating ? {
                    rating: row.feedback_rating ? parseFloat(row.feedback_rating) : null,
                    participationRating: row.feedback_participation_rating ? parseFloat(row.feedback_participation_rating) : null,
                    feedback: row.owner_feedback || '',
                    timestamp: row.feedback_timestamp || null
                } : null
            };
        });

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
                EXISTS(SELECT 1 FROM activity_participants WHERE activity_id = a.id AND user_id = $1) as is_joined,
                (
                    SELECT COALESCE(json_agg(json_build_object(
                        'id', mu.id::text,
                        'name', mu.username,
                        'profileImage', mu.image_url
                    ) ORDER BY ap_sub.joined_at ASC, ap_sub.id ASC), '[]'::json)
                    FROM (
                        SELECT ap.user_id, ap.joined_at, ap.id
                        FROM activity_participants ap
                        WHERE ap.activity_id = a.id
                        ORDER BY ap.joined_at ASC, ap.id ASC
                        LIMIT 10
                    ) ap_sub
                    JOIN users mu ON ap_sub.user_id = mu.id
                ) as member_preview
            FROM activities a
            JOIN users u ON a.creator_id = u.id
            WHERE a.id = $2
        `;
        const result = await db.query(query, [userId, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const row = result.rows[0];
        const isCompleted = isActivityExpired(row.date_str, row.created_at, row.status);

        // Asynchronously ensure status is marked 'completed' in DB if expired
        if (isCompleted && row.status !== 'completed') {
            db.query("UPDATE activities SET status = 'completed' WHERE id = $1", [id]).catch(() => {});
        }

        const activity = {
            id: row.id.toString(),
            creatorId: row.creator_id ? row.creator_id.toString() : null,
            isCreator: parseInt(row.creator_id, 10) === parseInt(userId, 10),
            category: row.category,
            title: row.title,
            description: row.description,
            date: row.date_str,
            time: row.time_str,
            location: row.location,
            locationName: row.location_name,
            address: row.address || '',
            pincode: row.pincode,
            city: row.city,
            latitude: row.latitude,
            longitude: row.longitude,
            joined: parseInt(row.joined_count || 0),
            capacity: row.capacity,
            isJoined: row.is_joined,
            status: isCompleted ? 'completed' : 'upcoming',
            isCompleted,
            creator: {
                name: row.creator_name,
                initial: row.creator_name ? row.creator_name.charAt(0).toUpperCase() : 'U',
                color: '#A855F7',
                image: row.creator_image
            },
            imageColor: row.image_url ? null : '#EA580C',
            imageUrl: row.image_url,
            image_url: row.image_url,
            emoji: row.emoji || '📅',
            memberPreview: parseMemberPreview(row.member_preview),
            ownerFeedback: (row.owner_feedback || row.feedback_rating) ? {
                rating: row.feedback_rating ? parseFloat(row.feedback_rating) : null,
                participationRating: row.feedback_participation_rating ? parseFloat(row.feedback_participation_rating) : null,
                feedback: row.owner_feedback || '',
                timestamp: row.feedback_timestamp || null
            } : null
        };

        res.json(activity);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createActivity = async (req, res) => {
    try {
        const { title, category, date, time, location, address, capacity, description, image_url, emoji, pincode, city, latitude, longitude, location_name } = req.body;
        const creator_id = req.user.id;

        const trimmedAddress = (address || '').trim();

        if (!title || !category || !location || !trimmedAddress || !capacity) {
            return res.status(400).json({ error: 'Missing required fields. Venue/Address is required.' });
        }

        if (!pincode && (!latitude || !longitude)) {
            return res.status(400).json({ error: 'Please provide either a pincode or location coordinates.' });
        }

        if (pincode && !/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Please enter a valid Indian pincode.' });
        }

        const parsedDate = parseActivityDate(date);
        const eventDateSQL = parsedDate ? parsedDate.toISOString().split('T')[0] : null;

        const query = `
            INSERT INTO activities (
                creator_id, category, title, description, date_str, time_str, location, address, capacity, image_url, emoji, pincode, city, latitude, longitude, location_name, event_date, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active')
            RETURNING *
        `;
        const result = await db.query(query, [
            creator_id, category, title, description || '', date, time, location, trimmedAddress, capacity, image_url || null, emoji || '📅', pincode || null, city || null, latitude || null, longitude || null, location_name || null, eventDateSQL
        ]);

        const newActivity = result.rows[0];
        
        // Auto-join the creator
        await db.query(
            'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newActivity.id, creator_id]
        );

        const memberInfo = await getActivityMemberInfo(newActivity.id);

        res.status(201).json({
            message: 'Activity created successfully',
            activity: {
                ...newActivity,
                id: newActivity.id.toString(),
                creatorId: creator_id.toString(),
                isCreator: true,
                imageUrl: newActivity.image_url,
                image_url: newActivity.image_url,
                address: newActivity.address,
                date: newActivity.date_str,
                time: newActivity.time_str,
                joined: memberInfo.joined,
                isJoined: true,
                memberPreview: memberInfo.memberPreview
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
        const { title, category, date, time, location, address, capacity, description, image_url, emoji } = req.body;
        const userId = req.user.id;

        // Check ownership
        const ownershipCheck = await db.query('SELECT creator_id FROM activities WHERE id = $1', [id]);
        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        if (ownershipCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to update this activity' });
        }

        const parsedDate = date ? parseActivityDate(date) : null;
        const eventDateSQL = parsedDate ? parsedDate.toISOString().split('T')[0] : null;

        const query = `
            UPDATE activities SET
                title = COALESCE($1, title),
                category = COALESCE($2, category),
                date_str = COALESCE($3, date_str),
                time_str = COALESCE($4, time_str),
                location = COALESCE($5, location),
                address = COALESCE($6, address),
                capacity = COALESCE($7, capacity),
                description = COALESCE($8, description),
                image_url = COALESCE($9, image_url),
                emoji = COALESCE($10, emoji),
                event_date = COALESCE($11, event_date),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12 RETURNING *
        `;
        const result = await db.query(query, [title, category, date, time, location, address, capacity, description, image_url, emoji, eventDateSQL, id]);

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
            return res.status(403).json({ error: 'Unauthorized: Only the activity creator can delete this activity' });
        }

        // Delete activity from database (cascades to activity_participants)
        await db.query('DELETE FROM activities WHERE id = $1', [id]);
        res.json({ success: true, message: 'Activity deleted successfully', activityId: id });
    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.joinActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const userRes = await db.query('SELECT pincode, latitude, longitude FROM users WHERE id = $1', [userId]);
        const { pincode: userPincode, latitude: userLat, longitude: userLon } = userRes.rows[0] || {};

        // Check capacity and pincode/distance
        const activityResult = await db.query(`
            SELECT 
                capacity, 
                pincode,
                latitude,
                longitude,
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = $1) as joined_count 
            FROM activities WHERE id = $1
        `, [id]);

        if (activityResult.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const { capacity, joined_count, pincode: activityPincode, latitude: activityLat, longitude: activityLon } = activityResult.rows[0];

        let isAllowed = false;
        
        // Match by pincode
        if (activityPincode && userPincode && activityPincode === userPincode) {
            isAllowed = true;
        }

        // Match by distance
        if (!isAllowed && userLat && userLon && activityLat && activityLon) {
            // Calculate distance
            const distance = 6371 * Math.acos(
                Math.min(1.0, Math.max(-1.0,
                    Math.cos(userLat * Math.PI / 180) * Math.cos(activityLat * Math.PI / 180) * Math.cos((activityLon - userLon) * Math.PI / 180) + 
                    Math.sin(userLat * Math.PI / 180) * Math.sin(activityLat * Math.PI / 180)
                ))
            );
            if (distance <= 20) {
                isAllowed = true;
            }
        }

        if (!isAllowed) {
            return res.status(403).json({ error: 'This activity is only available for users within a 20km radius or same locality.' });
        }

        if (parseInt(joined_count) >= capacity) {
            return res.status(400).json({ error: 'Activity is full' });
        }

        await db.query(
            'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, userId]
        );

        const memberInfo = await getActivityMemberInfo(id);

        res.json({ 
            message: 'Joined activity successfully',
            joined: memberInfo.joined,
            isJoined: true,
            memberPreview: memberInfo.memberPreview
        });
    } catch (error) {
        console.error('Join activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.leaveActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            'DELETE FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
            [id, userId]
        );

        const memberInfo = await getActivityMemberInfo(id);

        res.json({ 
            message: 'Left activity successfully',
            joined: memberInfo.joined,
            isJoined: false,
            memberPreview: memberInfo.memberPreview
        });
    } catch (error) {
        console.error('Leave activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { rating, participationRating, feedback } = req.body;

        // Fetch activity
        const actRes = await db.query('SELECT * FROM activities WHERE id = $1', [id]);
        if (actRes.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const activity = actRes.rows[0];

        // Verify creator/owner
        if (parseInt(activity.creator_id, 10) !== parseInt(userId, 10)) {
            return res.status(403).json({ error: 'Unauthorized: Only the activity creator can submit feedback.' });
        }

        // Verify activity is completed/past
        const isCompleted = isActivityExpired(activity.date_str, activity.created_at, activity.status);
        if (!isCompleted) {
            return res.status(400).json({ error: 'Feedback can only be submitted after the activity date/time has passed.' });
        }

        // Validate rating (1 to 5)
        const parsedRating = rating ? Math.min(5, Math.max(1, parseFloat(rating))) : 5;
        const parsedParticipationRating = participationRating ? Math.min(5, Math.max(1, parseFloat(participationRating))) : null;
        const trimmedFeedback = (feedback || '').trim();

        const updateRes = await db.query(`
            UPDATE activities SET
                owner_feedback = $1,
                feedback_rating = $2,
                feedback_participation_rating = $3,
                feedback_timestamp = CURRENT_TIMESTAMP,
                status = 'completed',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [trimmedFeedback, parsedRating, parsedParticipationRating, id]);

        const updated = updateRes.rows[0];

        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            ownerFeedback: {
                rating: updated.feedback_rating ? parseFloat(updated.feedback_rating) : null,
                participationRating: updated.feedback_participation_rating ? parseFloat(updated.feedback_participation_rating) : null,
                feedback: updated.owner_feedback || '',
                timestamp: updated.feedback_timestamp
            },
            status: 'completed'
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getActivityMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const actRes = await db.query('SELECT creator_id FROM activities WHERE id = $1', [id]);
        if (actRes.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        const creatorId = actRes.rows[0].creator_id;

        const messagesQuery = `
            SELECT 
                m.id,
                m.activity_id,
                m.user_id,
                m.message,
                m.created_at,
                u.username as user_name,
                u.image_url as user_image
            FROM activity_messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.activity_id = $1
            ORDER BY m.created_at ASC, m.id ASC
        `;
        const result = await db.query(messagesQuery, [id]);

        const messages = result.rows.map(row => ({
            id: row.id.toString(),
            activityId: row.activity_id.toString(),
            userId: row.user_id.toString(),
            userName: row.user_name || 'Member',
            userImage: row.user_image || null,
            message: row.message,
            createdAt: row.created_at,
            isOwner: parseInt(row.user_id, 10) === parseInt(userId, 10),
            canDelete: parseInt(row.user_id, 10) === parseInt(userId, 10) || parseInt(creatorId, 10) === parseInt(userId, 10)
        }));

        res.json(messages);
    } catch (error) {
        console.error('Get activity messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.postActivityMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        const trimmedMessage = message.trim();

        const actRes = await db.query('SELECT creator_id FROM activities WHERE id = $1', [id]);
        if (actRes.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        const creatorId = actRes.rows[0].creator_id;

        const isCreator = parseInt(creatorId, 10) === parseInt(userId, 10);
        const partRes = await db.query(
            'SELECT 1 FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
            [id, userId]
        );
        const isJoined = partRes.rows.length > 0;

        if (!isCreator && !isJoined) {
            return res.status(403).json({ error: 'Only joined participants can post messages to this activity.' });
        }

        const insertRes = await db.query(`
            INSERT INTO activity_messages (activity_id, user_id, message)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [id, userId, trimmedMessage]);

        const newMsg = insertRes.rows[0];

        const userRes = await db.query('SELECT username, image_url FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0] || {};

        res.status(201).json({
            id: newMsg.id.toString(),
            activityId: newMsg.activity_id.toString(),
            userId: newMsg.user_id.toString(),
            userName: user.username || 'Member',
            userImage: user.image_url || null,
            message: newMsg.message,
            createdAt: newMsg.created_at,
            isOwner: true,
            canDelete: true
        });
    } catch (error) {
        console.error('Post activity message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteActivityMessage = async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const userId = req.user.id;

        const msgRes = await db.query(`
            SELECT m.*, a.creator_id
            FROM activity_messages m
            JOIN activities a ON m.activity_id = a.id
            WHERE m.id = $1 AND m.activity_id = $2
        `, [messageId, id]);

        if (msgRes.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const msg = msgRes.rows[0];
        const isMsgAuthor = parseInt(msg.user_id, 10) === parseInt(userId, 10);
        const isActivityCreator = parseInt(msg.creator_id, 10) === parseInt(userId, 10);

        if (!isMsgAuthor && !isActivityCreator) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete your own messages or messages in your activity.' });
        }

        await db.query('DELETE FROM activity_messages WHERE id = $1', [messageId]);

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete activity message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

