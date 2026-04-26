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
router.post('/:id/view', homeController.trackStoryView);
router.get('/:id/views', homeController.getStoryViewers);

module.exports = router;
