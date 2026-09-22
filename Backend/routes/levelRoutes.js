const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pointsStreakService = require('../services/pointsStreakService');
const {
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  MAX_LEVEL_XP,
  calculateUserLevel,
  getUserLevelDetails
} = require('../constants/levelConfig');

/**
 * GET /api/level or /api/user/level
 * Returns current level, current XP, next level, next-level XP requirement, and progress percentage.
 * Authoritative: calculated from backend single source of truth for total points.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const summary = await pointsStreakService.getUserPointsAndStreak(userId);
    const totalXp = summary.totalPoints;
    const levelDetails = getUserLevelDetails(totalXp);

    return res.status(200).json({
      success: true,
      userId,
      ...levelDetails
    });
  } catch (err) {
    console.error('❌ [GET /api/level Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve level details'
    });
  }
});

/**
 * GET /api/level/thresholds
 * Returns all 50 level thresholds.
 */
router.get('/thresholds', (req, res) => {
  return res.status(200).json({
    success: true,
    max_level: MAX_LEVEL,
    max_level_xp: MAX_LEVEL_XP,
    levels: LEVEL_THRESHOLDS
  });
});

module.exports = router;
