const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authenticateToken = require('../middleware/auth');

// All activity routes require authentication
router.use(authenticateToken);

// Discovery
router.get('/', activityController.getActivities);
router.get('/joined', activityController.getJoinedActivities);

// Single Activity & Feedback
router.get('/:id', activityController.getActivityById);
router.post('/:id/feedback', activityController.submitFeedback);

// Create / Update / Delete
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Join / Leave
router.post('/:id/join', activityController.joinActivity);
router.delete('/:id/leave', activityController.leaveActivity);

// Suggestions & Messages
router.get('/:id/messages', activityController.getActivityMessages);
router.post('/:id/messages', activityController.postActivityMessage);
router.delete('/:id/messages/:messageId', activityController.deleteActivityMessage);

module.exports = router;
