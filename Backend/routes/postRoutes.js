const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || (file.mimetype && file.mimetype.startsWith('video') ? '.mp4' : '.jpg');
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 100 * 1024 * 1024 } });
const uploadMediaMiddleware = upload.any();

// Apply auth middleware to all post routes
router.use(authenticateToken);

// Posts CRUD
router.get('/', postController.getPosts);
router.get('/feed', postController.getPosts);
router.post('/', (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadMediaMiddleware(req, res, (err) => {
      if (err) {
        console.error("❌ [Posts Upload Middleware Error]:", err);
        return res.status(400).json({ error: err.message || "Media upload failed" });
      }
      next();
    });
  }
  next();
}, postController.createPost);
router.delete('/:id', postController.deletePost);

// Post Likes
router.post('/:id/like', postController.toggleLikePost);

// Post Comments
router.get('/:id/comments', postController.getPostComments);
router.post('/:id/comments', postController.addPostComment);
router.delete('/comments/:commentId', postController.deletePostComment);

// Post Shares
router.post('/:id/share', postController.sharePost);

module.exports = router;
