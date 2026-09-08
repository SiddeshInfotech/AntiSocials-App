/**
 * Life Experience Score Controller
 * 
 * Handles quiz submission, score retrieval, and dynamic experience updates.
 * All score calculations happen server-side only.
 */

const db = require('../db');
const {
  LIFE_EXPERIENCE_QUESTIONS,
  VALID_QUESTION_IDS,
  CATEGORY_SLUGS,
  calculateScores,
  recalculateOverall,
  calculateConnectorLevel,
  getConnectorLevelDetails,
  DEFAULT_EXPERIENCE_DELTA,
  MAX_EXPERIENCE_DELTA,
} = require('../constants/lifeExperienceData');

/**
 * POST /api/life-score/quiz
 * Submit the initial 30-question life experience quiz.
 */
const submitQuiz = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ success: false, error: 'Invalid user.' });
    }

    const { answers } = req.body;

    // Validate answers object
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Answers object is required.' });
    }

    // Check all 30 questions are present
    for (const qId of VALID_QUESTION_IDS) {
      if (answers[qId] === undefined || answers[qId] === null) {
        return res.status(400).json({ success: false, error: `Missing answer for question ${qId}.` });
      }
      const val = parseInt(answers[qId], 10);
      if (isNaN(val) || val < 1 || val > 4) {
        return res.status(400).json({ success: false, error: `Invalid answer for question ${qId}. Must be 1, 2, 3, or 4.` });
      }
    }

    // Check for extra/invalid question IDs
    const answerKeys = Object.keys(answers);
    for (const key of answerKeys) {
      if (!VALID_QUESTION_IDS.includes(key)) {
        return res.status(400).json({ success: false, error: `Unknown question ID: ${key}.` });
      }
    }

    // Check if quiz already completed
    const existing = await db.query(
      'SELECT quiz_completed FROM life_experience_scores WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0 && existing.rows[0].quiz_completed) {
      return res.status(409).json({ success: false, error: 'Quiz has already been completed. Duplicate submission is not allowed.' });
    }

    // Calculate scores server-side
    const { categoryScores, overallScore } = calculateScores(answers);
    const connectorLevel = calculateConnectorLevel(overallScore);
    const levelDetails = getConnectorLevelDetails(overallScore);

    // Upsert scores (insert or update if partially existing row)
    const upsertQuery = `
      INSERT INTO life_experience_scores (
        user_id,
        baseline_age_life_stage, baseline_travel_exploration, baseline_adventure_new_experiences,
        baseline_education_learning, baseline_relationships_family, baseline_community_contribution,
        baseline_health_fitness_physical, baseline_creativity_hobbies_passion, baseline_culture_social_experiences,
        baseline_personal_growth_courage, baseline_overall_score,
        current_age_life_stage, current_travel_exploration, current_adventure_new_experiences,
        current_education_learning, current_relationships_family, current_community_contribution,
        current_health_fitness_physical, current_creativity_hobbies_passion, current_culture_social_experiences,
        current_personal_growth_courage, current_overall_score,
        connector_level, quiz_completed, updated_at
      ) VALUES (
        $1,
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, TRUE, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        baseline_age_life_stage = $2, baseline_travel_exploration = $3, baseline_adventure_new_experiences = $4,
        baseline_education_learning = $5, baseline_relationships_family = $6, baseline_community_contribution = $7,
        baseline_health_fitness_physical = $8, baseline_creativity_hobbies_passion = $9, baseline_culture_social_experiences = $10,
        baseline_personal_growth_courage = $11, baseline_overall_score = $12,
        current_age_life_stage = $2, current_travel_exploration = $3, current_adventure_new_experiences = $4,
        current_education_learning = $5, current_relationships_family = $6, current_community_contribution = $7,
        current_health_fitness_physical = $8, current_creativity_hobbies_passion = $9, current_culture_social_experiences = $10,
        current_personal_growth_courage = $11, current_overall_score = $12,
        connector_level = $13,
        quiz_completed = TRUE, updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      categoryScores.age_life_stage,
      categoryScores.travel_exploration,
      categoryScores.adventure_new_experiences,
      categoryScores.education_learning,
      categoryScores.relationships_family,
      categoryScores.community_contribution,
      categoryScores.health_fitness_physical,
      categoryScores.creativity_hobbies_passion,
      categoryScores.culture_social_experiences,
      categoryScores.personal_growth_courage,
      overallScore,
      connectorLevel,
    ];

    const result = await db.query(upsertQuery, values);
    const saved = result.rows[0];

    // Sync quiz_completed status on users table as well
    try {
      await db.query('UPDATE users SET quiz_completed = TRUE WHERE id = $1', [userId]);
    } catch (uErr) {
      console.warn('⚠️ Could not update users.quiz_completed:', uErr.message);
    }

    console.log(`✅ [Life Score] Quiz completed for user ${userId}. Overall: ${overallScore}, Connector Level: ${connectorLevel}`);

    res.status(201).json({
      success: true,
      message: 'Life Experience Quiz completed successfully.',
      quizCompleted: true,
      quiz_completed: true,
      overallScore,
      overall_score: overallScore,
      connectorLevel,
      connector_level: connectorLevel,
      level: connectorLevel,
      levelDetails,
      data: {
        overallScore,
        overall_score: overallScore,
        categoryScores,
        connectorLevel,
        connector_level: connectorLevel,
        level: connectorLevel,
        levelDetails,
        quizCompleted: true,
        quiz_completed: true,
      },
      current: {
        overall: overallScore,
        categories: categoryScores,
        connectorLevel,
        levelDetails,
      },
      baseline: {
        overall: overallScore,
        categories: categoryScores,
        connectorLevel,
      },
      scores: {
        overall_score: overallScore,
        overallScore,
        categories: categoryScores,
        connectorLevel,
      },
    });
  } catch (error) {
    console.error('❌ [Life Score] Quiz submission error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * GET /api/life-score
 * Retrieve current life experience scores.
 */
const getScores = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ success: false, error: 'Invalid user.' });
    }

    const result = await db.query(
      'SELECT * FROM life_experience_scores WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      const defaultDetails = getConnectorLevelDetails(0);
      return res.status(200).json({
        success: true,
        quizCompleted: false,
        quiz_completed: false,
        overallScore: 0,
        overall_score: 0,
        connectorLevel: 1,
        connector_level: 1,
        level: 1,
        levelDetails: defaultDetails,
        data: {
          quizCompleted: false,
          quiz_completed: false,
          overallScore: 0,
          overall_score: 0,
          connectorLevel: 1,
          connector_level: 1,
          level: 1,
          levelDetails: defaultDetails,
          categoryScores: {},
          baselineScores: {},
        },
        current: {
          overall: 0,
          categories: {},
          connectorLevel: 1,
          levelDetails: defaultDetails,
        },
        baseline: {
          overall: 0,
          categories: {},
          connectorLevel: 1,
        },
        scores: {
          overall_score: 0,
          overallScore: 0,
          connectorLevel: 1,
          categories: {},
        },
      });
    }

    const row = result.rows[0];
    const overallScore = parseFloat(row.current_overall_score);
    const baselineOverallScore = parseFloat(row.baseline_overall_score);
    const connectorLevel = row.connector_level !== null && row.connector_level !== undefined ? parseInt(row.connector_level, 10) : calculateConnectorLevel(overallScore);
    const levelDetails = getConnectorLevelDetails(overallScore);

    const categoryScores = {
      age_life_stage: parseFloat(row.current_age_life_stage),
      travel_exploration: parseFloat(row.current_travel_exploration),
      adventure_new_experiences: parseFloat(row.current_adventure_new_experiences),
      education_learning: parseFloat(row.current_education_learning),
      relationships_family: parseFloat(row.current_relationships_family),
      community_contribution: parseFloat(row.current_community_contribution),
      health_fitness_physical: parseFloat(row.current_health_fitness_physical),
      creativity_hobbies_passion: parseFloat(row.current_creativity_hobbies_passion),
      culture_social_experiences: parseFloat(row.current_culture_social_experiences),
      personal_growth_courage: parseFloat(row.current_personal_growth_courage),
    };

    const baselineCategoryScores = {
      age_life_stage: parseFloat(row.baseline_age_life_stage),
      travel_exploration: parseFloat(row.baseline_travel_exploration),
      adventure_new_experiences: parseFloat(row.baseline_adventure_new_experiences),
      education_learning: parseFloat(row.baseline_education_learning),
      relationships_family: parseFloat(row.baseline_relationships_family),
      community_contribution: parseFloat(row.baseline_community_contribution),
      health_fitness_physical: parseFloat(row.baseline_health_fitness_physical),
      creativity_hobbies_passion: parseFloat(row.baseline_creativity_hobbies_passion),
      culture_social_experiences: parseFloat(row.baseline_culture_social_experiences),
      personal_growth_courage: parseFloat(row.baseline_personal_growth_courage),
    };

    res.status(200).json({
      success: true,
      quizCompleted: row.quiz_completed,
      quiz_completed: row.quiz_completed,
      overallScore,
      overall_score: overallScore,
      connectorLevel,
      connector_level: connectorLevel,
      level: connectorLevel,
      levelDetails,
      data: {
        quizCompleted: row.quiz_completed,
        quiz_completed: row.quiz_completed,
        overallScore,
        overall_score: overallScore,
        connectorLevel,
        connector_level: connectorLevel,
        level: connectorLevel,
        levelDetails,
        categoryScores,
        baselineScores: {
          overallScore: baselineOverallScore,
          ...baselineCategoryScores,
        },
        currentScores: {
          overallScore,
          ...categoryScores,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      current: {
        overall: overallScore,
        categories: categoryScores,
        connectorLevel,
        levelDetails,
      },
      baseline: {
        overall: baselineOverallScore,
        categories: baselineCategoryScores,
        connectorLevel,
      },
      scores: {
        overall_score: overallScore,
        overallScore,
        categories: categoryScores,
        connectorLevel,
      },
    });
  } catch (error) {
    console.error('❌ [Life Score] Get scores error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * POST /api/life-score/update
 * Record a real experience and update the relevant category score.
 * Anti-abuse: unique experience_id per user prevents double-counting.
 */
const updateExperience = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ success: false, error: 'Invalid user.' });
    }

    const { experience_id, category_slug, source_type, source_id, score_delta } = req.body;

    // Validate required fields
    if (!experience_id || typeof experience_id !== 'string') {
      return res.status(400).json({ success: false, error: 'experience_id is required.' });
    }
    if (!category_slug || !CATEGORY_SLUGS.includes(category_slug)) {
      return res.status(400).json({ success: false, error: `Invalid category_slug. Must be one of: ${CATEGORY_SLUGS.join(', ')}` });
    }
    if (!source_type || typeof source_type !== 'string') {
      return res.status(400).json({ success: false, error: 'source_type is required.' });
    }

    // Paid points must never modify Life Experience Score
    if (source_type === 'paid_points' || source_type === 'purchase') {
      return res.status(403).json({ success: false, error: 'Paid points cannot modify Life Experience Score.' });
    }

    // Determine delta
    let delta = score_delta ? parseFloat(score_delta) : DEFAULT_EXPERIENCE_DELTA;
    if (isNaN(delta) || delta <= 0) delta = DEFAULT_EXPERIENCE_DELTA;
    if (delta > MAX_EXPERIENCE_DELTA) delta = MAX_EXPERIENCE_DELTA;

    // Check quiz is completed
    const scoreRow = await db.query(
      'SELECT * FROM life_experience_scores WHERE user_id = $1',
      [userId]
    );
    if (scoreRow.rows.length === 0 || !scoreRow.rows[0].quiz_completed) {
      return res.status(400).json({ success: false, error: 'Complete the Life Experience Quiz before recording experiences.' });
    }

    // Anti-abuse: Check if this experience has already been counted (idempotent)
    try {
      await db.query(
        `INSERT INTO life_experience_updates (user_id, experience_id, category_slug, score_delta, source_type, source_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, experience_id, category_slug, delta, source_type, source_id || null]
      );
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        return res.status(409).json({ success: false, error: 'This experience has already been recorded.' });
      }
      throw err;
    }

    // Update the relevant category score (clamped to 100)
    const currentColumnName = `current_${category_slug}`;
    const updateQuery = `
      UPDATE life_experience_scores
      SET ${currentColumnName} = LEAST(100, ${currentColumnName} + $1),
          updated_at = NOW()
      WHERE user_id = $2
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [delta, userId]);
    const updatedRow = updateResult.rows[0];

    // Recalculate overall score from all current category scores
    const currentCategoryScores = {
      age_life_stage: parseFloat(updatedRow.current_age_life_stage),
      travel_exploration: parseFloat(updatedRow.current_travel_exploration),
      adventure_new_experiences: parseFloat(updatedRow.current_adventure_new_experiences),
      education_learning: parseFloat(updatedRow.current_education_learning),
      relationships_family: parseFloat(updatedRow.current_relationships_family),
      community_contribution: parseFloat(updatedRow.current_community_contribution),
      health_fitness_physical: parseFloat(updatedRow.current_health_fitness_physical),
      creativity_hobbies_passion: parseFloat(updatedRow.current_creativity_hobbies_passion),
      culture_social_experiences: parseFloat(updatedRow.current_culture_social_experiences),
      personal_growth_courage: parseFloat(updatedRow.current_personal_growth_courage),
    };

    const newOverall = recalculateOverall(currentCategoryScores);
    const newLevel = calculateConnectorLevel(newOverall);
    const levelDetails = getConnectorLevelDetails(newOverall);

    await db.query(
      'UPDATE life_experience_scores SET current_overall_score = $1, connector_level = $2, updated_at = NOW() WHERE user_id = $3',
      [newOverall, newLevel, userId]
    );

    console.log(`✅ [Life Score] Experience recorded for user ${userId}: ${experience_id} → ${category_slug} +${delta} (overall: ${newOverall}, level: ${newLevel})`);

    res.status(200).json({
      success: true,
      message: 'Experience recorded successfully.',
      quizCompleted: true,
      quiz_completed: true,
      overallScore: newOverall,
      overall_score: newOverall,
      connectorLevel: newLevel,
      connector_level: newLevel,
      level: newLevel,
      levelDetails,
      data: {
        categoryUpdated: category_slug,
        scoreDelta: delta,
        newCategoryScore: currentCategoryScores[category_slug],
        newOverallScore: newOverall,
        overallScore: newOverall,
        overall_score: newOverall,
        connectorLevel: newLevel,
        connector_level: newLevel,
        level: newLevel,
        levelDetails,
        categoryScores: currentCategoryScores,
      },
      current: {
        overall: newOverall,
        categories: currentCategoryScores,
        connectorLevel: newLevel,
        levelDetails,
      },
    });
  } catch (error) {
    console.error('❌ [Life Score] Update experience error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

/**
 * Internal programmatic helper to record an experience (e.g. from task completion or activity joining)
 */
const recordExperienceInternal = async ({ userId, experience_id, category_slug, source_type, source_id, score_delta }) => {
  try {
    const uid = parseInt(userId, 10);
    if (!uid || isNaN(uid) || !experience_id || !category_slug || !CATEGORY_SLUGS.includes(category_slug)) {
      return null;
    }
    if (source_type === 'paid_points' || source_type === 'purchase') {
      return null;
    }

    // Check if user has completed the quiz
    const scoreRow = await db.query(
      'SELECT quiz_completed FROM life_experience_scores WHERE user_id = $1',
      [uid]
    );
    if (scoreRow.rows.length === 0 || !scoreRow.rows[0].quiz_completed) {
      return null;
    }

    let delta = score_delta ? parseFloat(score_delta) : DEFAULT_EXPERIENCE_DELTA;
    if (isNaN(delta) || delta <= 0) delta = DEFAULT_EXPERIENCE_DELTA;
    if (delta > MAX_EXPERIENCE_DELTA) delta = MAX_EXPERIENCE_DELTA;

    // Unique check
    try {
      await db.query(
        `INSERT INTO life_experience_updates (user_id, experience_id, category_slug, score_delta, source_type, source_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uid, experience_id, category_slug, delta, source_type, source_id ? String(source_id) : null]
      );
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        return null; // Idempotent skip
      }
      throw insertErr;
    }

    const currentColumnName = `current_${category_slug}`;
    const updateResult = await db.query(`
      UPDATE life_experience_scores
      SET ${currentColumnName} = LEAST(100, ${currentColumnName} + $1),
          updated_at = NOW()
      WHERE user_id = $2
      RETURNING *
    `, [delta, uid]);

    if (updateResult.rows.length === 0) return null;
    const updatedRow = updateResult.rows[0];

    const currentCategoryScores = {
      age_life_stage: parseFloat(updatedRow.current_age_life_stage),
      travel_exploration: parseFloat(updatedRow.current_travel_exploration),
      adventure_new_experiences: parseFloat(updatedRow.current_adventure_new_experiences),
      education_learning: parseFloat(updatedRow.current_education_learning),
      relationships_family: parseFloat(updatedRow.current_relationships_family),
      community_contribution: parseFloat(updatedRow.current_community_contribution),
      health_fitness_physical: parseFloat(updatedRow.current_health_fitness_physical),
      creativity_hobbies_passion: parseFloat(updatedRow.current_creativity_hobbies_passion),
      culture_social_experiences: parseFloat(updatedRow.current_culture_social_experiences),
      personal_growth_courage: parseFloat(updatedRow.current_personal_growth_courage),
    };

    const newOverall = recalculateOverall(currentCategoryScores);
    const newLevel = calculateConnectorLevel(newOverall);

    await db.query(
      'UPDATE life_experience_scores SET current_overall_score = $1, connector_level = $2, updated_at = NOW() WHERE user_id = $3',
      [newOverall, newLevel, uid]
    );

    console.log(`✅ [Life Score] Programmatic update: user ${uid}, ${experience_id} → ${category_slug} +${delta} (overall: ${newOverall}, level: ${newLevel})`);
    return { newOverall, connectorLevel: newLevel, category_slug, delta };
  } catch (err) {
    console.warn(`⚠️ [Life Score] Error in recordExperienceInternal:`, err.message);
    return null;
  }
};

module.exports = {
  submitQuiz,
  getScores,
  updateExperience,
  recordExperienceInternal,
};
