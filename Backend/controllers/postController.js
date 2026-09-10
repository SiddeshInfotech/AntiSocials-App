const db = require('../db');

// GET /api/posts & GET /api/posts/feed - Get Instagram-style Following Feed posts with pagination
exports.getPosts = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM posts p
      WHERE 
        $1::int IS NULL
        OR p.user_id = $1
        OR EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = $1 AND f.following_id = p.user_id
        )
        OR EXISTS (
          SELECT 1 FROM user_connections conn
          WHERE ((conn.user_id = $1 AND conn.friend_id = p.user_id) OR (conn.friend_id = $1 AND conn.user_id = p.user_id))
            AND (conn.status = 'accepted' OR conn.status = 'connected')
        )
    `;

    const countResult = await db.query(countQuery, [userId]);
    const totalCount = countResult.rows[0]?.total || 0;

    const query = `
      SELECT 
        p.id,
        p.user_id,
        p.main_category,
        p.subcategory,
        p.caption,
        p.media_url,
        p.media_type,
        p.media_format,
        p.created_at,
        p.updated_at,
        u.username,
        COALESCE(u.profile_name, u.username) AS display_name,
        u.image_url AS profile_image,
        COALESCE(l.likes_count, 0)::int AS likes_count,
        COALESCE(c.comments_count, 0)::int AS comments_count,
        COALESCE(s.shares_count, 0)::int AS shares_count,
        CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked_by_user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS likes_count 
        FROM post_likes 
        GROUP BY post_id
      ) l ON p.id = l.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comments_count 
        FROM post_comments 
        GROUP BY post_id
      ) c ON p.id = c.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS shares_count 
        FROM post_shares 
        GROUP BY post_id
      ) s ON p.id = s.post_id
      LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $1
      WHERE 
        $1::int IS NULL
        OR p.user_id = $1
        OR EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = $1 AND f.following_id = p.user_id
        )
        OR EXISTS (
          SELECT 1 FROM user_connections conn
          WHERE ((conn.user_id = $1 AND conn.friend_id = p.user_id) OR (conn.friend_id = $1 AND conn.user_id = p.user_id))
            AND (conn.status = 'accepted' OR conn.status = 'connected')
        )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);
    const hasMore = offset + result.rows.length < totalCount;

    res.json({
      posts: result.rows,
      page,
      limit,
      totalPosts: totalCount,
      hasMore
    });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// POST /api/posts - Create a new post
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    let { main_category, subcategory, caption, media_url, media_type, media_format } = req.body || {};

    const uploadedFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    if (uploadedFile) {
      media_url = `/uploads/${uploadedFile.filename}`;
      if (!media_type) {
        media_type = uploadedFile.mimetype && uploadedFile.mimetype.startsWith('video') ? 'video' : 'image';
      }
    }

    if (!main_category || !subcategory) {
      return res.status(400).json({ error: 'Main category and subcategory are required.' });
    }

    const hasCaption = caption && typeof caption === 'string' && caption.trim().length > 0;
    const hasMedia = media_url && typeof media_url === 'string' && media_url.trim().length > 0;

    if (!hasCaption && !hasMedia) {
      return res.status(400).json({ error: 'Post must contain either text content or an attached photo/video.' });
    }

    const chosenFormat = media_format === 'square' ? 'square' : 'portrait';

    const insertQuery = `
      INSERT INTO posts (user_id, main_category, subcategory, caption, media_url, media_type, media_format)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      main_category.trim(),
      subcategory.trim(),
      hasCaption ? caption.trim() : '',
      hasMedia ? media_url.trim() : null,
      media_type || (hasMedia && media_url.toLowerCase().endsWith('.mp4') ? 'video' : 'image'),
      chosenFormat
    ];

    const result = await db.query(insertQuery, values);
    const newPost = result.rows[0];

    // Fetch author info
    const userRes = await db.query('SELECT username, image_url FROM users WHERE id = $1', [userId]);
    const author = userRes.rows[0] || {};

    const fullPost = {
      ...newPost,
      username: author.username || 'User',
      display_name: author.username || 'User',
      profile_image: author.image_url || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_liked_by_user: false
    };

    console.log(`✅ [Post Created] ID: ${fullPost.id}, Category: ${fullPost.main_category} -> ${fullPost.subcategory}, media: ${fullPost.media_url || 'none'}`);
    res.status(201).json({ post: fullPost });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
};

// DELETE /api/posts/:id - Delete a post (owner only)
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const checkRes = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = checkRes.rows[0];
    if (Number(post.user_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own posts.' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [postId]);
    console.log(`🗑️ [Post Deleted] Post ID ${postId} deleted by User ${userId}`);

    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// POST /api/posts/:id/like - Toggle like on a post
exports.toggleLikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const checkLike = await db.query('SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

    let isLiked = false;
    if (checkLike.rows.length > 0) {
      await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      isLiked = false;
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      isLiked = true;
    }

    const countRes = await db.query('SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1', [postId]);
    const likesCount = countRes.rows[0]?.count || 0;

    res.json({ is_liked: isLiked, likes_count: likesCount });
  } catch (error) {
    console.error('❌ Error toggling post like:', error);
    res.status(500).json({ error: 'Failed to toggle post like' });
  }
};

// GET /api/posts/:id/comments - Fetch comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user ? req.user.id : null;

    const query = `
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.comment_text,
        c.created_at,
        u.username,
        u.username AS display_name,
        u.image_url AS profile_image,
        CASE WHEN c.user_id = $2 THEN TRUE ELSE FALSE END AS can_delete
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await db.query(query, [postId, currentUserId]);
    res.json({ comments: result.rows });
  } catch (error) {
    console.error('❌ Error fetching post comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// POST /api/posts/:id/comments - Add a comment to a post
exports.addPostComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { comment_text } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const insertQuery = `
      INSERT INTO post_comments (post_id, user_id, comment_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [postId, userId, comment_text.trim()]);
    const newComment = result.rows[0];

    const userRes = await db.query('SELECT username, image_url FROM users WHERE id = $1', [userId]);
    const author = userRes.rows[0] || {};

    const fullComment = {
      ...newComment,
      username: author.username || 'User',
      display_name: author.username || 'User',
      profile_image: author.image_url || null,
      can_delete: true
    };

    const countRes = await db.query('SELECT COUNT(*)::int AS count FROM post_comments WHERE post_id = $1', [postId]);

    res.status(201).json({ comment: fullComment, comments_count: countRes.rows[0]?.count || 1 });
  } catch (error) {
    console.error('❌ Error adding post comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// DELETE /api/posts/comments/:commentId - Delete comment
exports.deletePostComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    const checkRes = await db.query('SELECT * FROM post_comments WHERE id = $1', [commentId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const comment = checkRes.rows[0];
    if (Number(comment.user_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
    }

    await db.query('DELETE FROM post_comments WHERE id = $1', [commentId]);

    const countRes = await db.query('SELECT COUNT(*)::int AS count FROM post_comments WHERE post_id = $1', [comment.post_id]);

    res.json({ success: true, comments_count: countRes.rows[0]?.count || 0 });
  } catch (error) {
    console.error('❌ Error deleting post comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// POST /api/posts/:id/share - Track post share
exports.sharePost = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const postId = req.params.id;

    await db.query('INSERT INTO post_shares (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    const countRes = await db.query('SELECT COUNT(*)::int AS count FROM post_shares WHERE post_id = $1', [postId]);

    res.json({ shares_count: countRes.rows[0]?.count || 1 });
  } catch (error) {
    console.error('❌ Error sharing post:', error);
    res.status(500).json({ error: 'Failed to record post share' });
  }
};
