const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/following', followController.getFollowing);
router.get('/followers', followController.getFollowers);

router.post('/:userId', followController.followUser);
router.post('/', followController.followUser);

router.delete('/:userId', followController.unfollowUser);

router.get('/:userId/status', followController.getFollowStatus);

module.exports = router;
