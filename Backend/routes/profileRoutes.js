const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middleware/auth');

router.get('/me', authenticateToken, profileController.getProfile);
router.put('/update', authenticateToken, profileController.updateProfile);
router.get('/stats', authenticateToken, profileController.getStats);
router.get('/interests', authenticateToken, profileController.getInterests);
router.put('/interests', authenticateToken, profileController.updateInterests);

module.exports = router;
