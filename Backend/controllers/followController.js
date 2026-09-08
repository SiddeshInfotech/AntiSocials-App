const db = require('../db');

// POST /api/follows/:userId - Follow a user
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId || req.body.following_id || req.body.user_id, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ error: 'Valid target user ID is required.' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Verify target user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [followingId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Insert into follows table
    await db.query(
      `INSERT INTO follows (follower_id, following_id) 
       VALUES ($1, $2) 
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [followerId, followingId]
    );

    console.log(`👤 [Follow] User ${followerId} followed User ${followingId}`);

    res.json({
      success: true,
      message: 'Successfully followed user',
      is_following: true
    });
  } catch (error) {
    console.error('❌ Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// DELETE /api/follows/:userId - Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId || req.body.following_id || req.body.user_id, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ error: 'Valid target user ID is required.' });
    }

    await db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    console.log(`👤 [Unfollow] User ${followerId} unfollowed User ${followingId}`);

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
      is_following: false
    });
  } catch (error) {
    console.error('❌ Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// GET /api/follows/:userId/status - Check follow status
exports.getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ error: 'Valid target user ID is required.' });
    }

    const checkRes = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    const isFollowing = checkRes.rows.length > 0;

    res.json({ is_following: isFollowing });
  } catch (error) {
    console.error('❌ Error getting follow status:', error);
    res.status(500).json({ error: 'Failed to get follow status' });
  }
};

// GET /api/follows/following - Get list of users the current user follows
exports.getFollowing = async (req, res) => {
  try {
    const followerId = req.user.id;

    const query = `
      SELECT 
        u.id,
        u.username,
        COALESCE(u.profile_name, u.username) AS display_name,
        u.image_url AS profile_image,
        u.profession,
        u.about,
        f.created_at AS followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await db.query(query, [followerId]);
    res.json({ following: result.rows });
  } catch (error) {
    console.error('❌ Error fetching following users:', error);
    res.status(500).json({ error: 'Failed to fetch following users' });
  }
};

// GET /api/follows/followers - Get list of followers for current user
exports.getFollowers = async (req, res) => {
  try {
    const followingId = req.user.id;

    const query = `
      SELECT 
        u.id,
        u.username,
        COALESCE(u.profile_name, u.username) AS display_name,
        u.image_url AS profile_image,
        u.profession,
        u.about,
        f.created_at AS followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await db.query(query, [followingId]);
    res.json({ followers: result.rows });
  } catch (error) {
    console.error('❌ Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};
