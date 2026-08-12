const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const authenticateToken = require('../middleware/auth');

// Apply auth middleware to all story routes
router.use(authenticateToken);

// Stories
router.get('/', homeController.getStories);
router.post('/', homeController.uploadStory);
router.get('/:id', homeController.getStoryById);
router.delete('/:id', homeController.deleteStory);

// Views
router.post('/:storyId/view', homeController.trackStoryView);
router.get('/:storyId/views', homeController.getStoryViewers);

// Likes
router.post('/:storyId/like', homeController.likeStory);
router.delete('/:storyId/like', homeController.unlikeStory);
router.get('/:storyId/likes', homeController.getStoryLikes);

// Comments
router.get('/:storyId/comments', homeController.getStoryComments);
router.post('/:storyId/comments', homeController.addStoryComment);
router.delete('/:storyId/comments/:commentId', homeController.deleteStoryComment);

// Shares
router.post('/:storyId/share', homeController.trackStoryShare);
router.get('/:storyId/share-count', homeController.getStoryShareCount);

module.exports = router;

