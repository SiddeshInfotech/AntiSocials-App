const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middleware/auth');

router.get('/me', authenticateToken, profileController.getProfile);
router.get('/search', authenticateToken, profileController.searchUsers);
router.post('/connect', authenticateToken, profileController.sendConnectionRequest);
router.post('/request', authenticateToken, profileController.sendConnectionRequest);
router.get('/', authenticateToken, profileController.getConnections);
router.get('/list', authenticateToken, profileController.getConnections);
router.get('/requests/incoming', authenticateToken, profileController.getIncomingRequests);
router.get('/requests/outgoing', authenticateToken, profileController.getOutgoingRequests);
router.post('/accept', authenticateToken, profileController.acceptConnectionRequest);
router.post('/:friendId/accept', authenticateToken, profileController.acceptConnectionRequest);
router.post('/decline', authenticateToken, profileController.declineConnectionRequest);
router.post('/:friendId/decline', authenticateToken, profileController.declineConnectionRequest);
router.delete('/:friendId', authenticateToken, profileController.removeConnection);
router.put('/:friendId/tier', authenticateToken, profileController.updateConnectionTier);
router.put('/update', authenticateToken, profileController.updateProfile);
router.get('/stats', authenticateToken, profileController.getStats);
router.get('/interests', authenticateToken, profileController.getInterests);
router.put('/interests', authenticateToken, profileController.updateInterests);

module.exports = router;
