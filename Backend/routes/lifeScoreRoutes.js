const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const lifeScoreController = require('../controllers/lifeScoreController');

// POST /api/life-score/quiz — Submit initial quiz
router.post('/quiz', authenticateToken, lifeScoreController.submitQuiz);

// GET /api/life-score — Get current scores
router.get('/', authenticateToken, lifeScoreController.getScores);

// POST /api/life-score/update — Record a real experience
router.post('/update', authenticateToken, lifeScoreController.updateExperience);

module.exports = router;
