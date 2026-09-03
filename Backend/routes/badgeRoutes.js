const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, badgeController.getBadges);

module.exports = router;
