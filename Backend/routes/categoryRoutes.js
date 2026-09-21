const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const categoryXpService = require('../services/categoryXpService');

// All category routes require authentication
router.use(authenticateToken);

/**
 * POST /api/categories/complete
 * Completes a category subcategory activity and awards its fixed XP.
 * 
 * Security & Integrity:
 * - Backend is the sole source of truth for XP values.
 * - Any client-supplied 'xp', 'points', or other override is strictly ignored.
 * - Idempotent: repeated calls for the same activity award 0 additional XP and flag already_claimed.
 */
router.post('/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subcategory } = req.body || {};

    if (!category || !subcategory || typeof category !== 'string' || typeof subcategory !== 'string') {
      return res.status(400).json({
        error: 'Both category and subcategory strings are required.'
      });
    }

    const isCompleted = await categoryXpService.isSubcategoryCompleted(userId, category, subcategory);
    if (isCompleted) {
      return res.status(400).json({
        error: `Subcategory "${subcategory}" is already completed. Each subcategory can be completed only once.`,
        already_claimed: true,
        already_completed: true,
        xp_awarded: 0
      });
    }

    const result = await categoryXpService.awardCategoryActivityXp({
      userId,
      category: category.trim(),
      subcategory: subcategory.trim()
    });

    if (!result.success && result.error) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('❌ [POST /api/categories/complete Error]:', error);
    return res.status(500).json({ error: 'Failed to process category activity completion' });
  }
});

/**
 * GET /api/categories/xp
 * Returns user's earned category XP and completed activities.
 */
router.get('/xp', async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await categoryXpService.getUserCategoryProgress(userId);
    res.json({
      success: true,
      ...progress
    });
  } catch (error) {
    console.error('❌ [GET /api/categories/xp Error]:', error);
    res.status(500).json({ error: 'Failed to fetch user category progress' });
  }
});

/**
 * GET /api/categories/completed
 * Returns array of completed activity names for the current user.
 */
router.get('/completed', async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await categoryXpService.getUserCategoryProgress(userId);
    res.json({
      success: true,
      completedList: progress.completedList || [],
      completedSet: progress.completedSet || []
    });
  } catch (error) {
    console.error('❌ [GET /api/categories/completed Error]:', error);
    res.status(500).json({ error: 'Failed to fetch completed categories' });
  }
});

/**
 * GET /api/categories/stats
 * Authoritative system verification metrics (100 categories, 2,000 activities, 152,220 total XP).
 */
router.get('/stats', (req, res) => {
  try {
    const validation = categoryXpService.validateXpMapping();
    res.json(validation);
  } catch (error) {
    console.error('❌ [GET /api/categories/stats Error]:', error);
    res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

/**
 * GET /api/categories/mapping
 * Returns the complete authoritative category and subcategory map with fixed XP.
 */
router.get('/mapping', (req, res) => {
  try {
    const mapping = categoryXpService.getAllCategoriesWithXp();
    res.json({
      categoriesCount: 100,
      activitiesCount: 2000,
      totalPossibleXp: 152220,
      mapping
    });
  } catch (error) {
    console.error('❌ [GET /api/categories/mapping Error]:', error);
    res.status(500).json({ error: 'Failed to fetch category mapping' });
  }
});

module.exports = router;
