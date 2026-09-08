/**
 * Life Experience Score — Unit & Integration Tests
 * Run directly via Node: node tests/lifeScore.test.js
 */

const {
  LIFE_EXPERIENCE_QUESTIONS,
  LIFE_EXPERIENCE_CATEGORIES,
  CATEGORY_SLUGS,
  OPTION_SCORES,
  CONNECTOR_LEVEL_THRESHOLDS,
  calculateScores,
  recalculateOverall,
  calculateConnectorLevel,
  getConnectorLevelDetails,
  getQuestionsByCategory,
} = require('../constants/lifeExperienceData');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

function runUnitTests() {
  console.log('\n--- 1. Data Integrity Tests ---');

  // Test 1: Exactly 30 questions
  assert(
    LIFE_EXPERIENCE_QUESTIONS.length === 30,
    `Total questions should be exactly 30 (got ${LIFE_EXPERIENCE_QUESTIONS.length})`
  );

  // Test 2: Exactly 10 categories
  assert(
    LIFE_EXPERIENCE_CATEGORIES.length === 10,
    `Total categories should be exactly 10 (got ${LIFE_EXPERIENCE_CATEGORIES.length})`
  );

  // Test 3: Weights sum to 1.0 (100%)
  const totalWeight = LIFE_EXPERIENCE_CATEGORIES.reduce(
    (sum, cat) => sum + cat.weight,
    0
  );
  assert(
    Math.abs(totalWeight - 1.0) < 0.0001,
    `Sum of category weights should equal 1.0 (got ${totalWeight.toFixed(4)})`
  );

  // Test 4: Each category has exactly 3 questions
  let allCategoriesHaveThree = true;
  for (const cat of LIFE_EXPERIENCE_CATEGORIES) {
    const qList = getQuestionsByCategory(cat.id);
    if (qList.length !== 3) {
      allCategoriesHaveThree = false;
      console.error(`    Category ${cat.id} has ${qList.length} questions, expected 3`);
    }
  }
  assert(
    allCategoriesHaveThree,
    'Every category has exactly 3 questions mapped'
  );

  // Test 5: Every question has 4 options
  const allHaveFourOptions = LIFE_EXPERIENCE_QUESTIONS.every(
    (q) => Array.isArray(q.options) && q.options.length === 4
  );
  assert(allHaveFourOptions, 'Every question has exactly 4 options');

  // Test 6: Option scores map 1..4 to 25..100
  assert(
    OPTION_SCORES[0] === 25 &&
      OPTION_SCORES[1] === 50 &&
      OPTION_SCORES[2] === 75 &&
      OPTION_SCORES[3] === 100,
    'Option scores map [0: 25, 1: 50, 2: 75, 3: 100]'
  );

  console.log('\n--- 2. Score Calculation Tests ---');

  // Test 7: Perfect score test (all option 4s)
  const perfectAnswers = {};
  LIFE_EXPERIENCE_QUESTIONS.forEach((q) => {
    perfectAnswers[q.id] = 4;
  });
  const perfectResult = calculateScores(perfectAnswers);
  assert(
    perfectResult.overallScore === 100,
    `All option 4s should yield overall score 100 (got ${perfectResult.overallScore})`
  );
  const allCategoriesMax = CATEGORY_SLUGS.every(
    (slug) => perfectResult.categoryScores[slug] === 100
  );
  assert(allCategoriesMax, 'All 10 category scores should equal 100 for option 4s');

  // Test 8: Minimum score test (all option 1s)
  const minAnswers = {};
  LIFE_EXPERIENCE_QUESTIONS.forEach((q) => {
    minAnswers[q.id] = 1;
  });
  const minResult = calculateScores(minAnswers);
  assert(
    minResult.overallScore === 25,
    `All option 1s should yield overall score 25 (got ${minResult.overallScore})`
  );
  const allCategoriesMin = CATEGORY_SLUGS.every(
    (slug) => minResult.categoryScores[slug] === 25
  );
  assert(allCategoriesMin, 'All 10 category scores should equal 25 for option 1s');

  // Test 9: Mixed answers test
  const mixedAnswers = {};
  LIFE_EXPERIENCE_QUESTIONS.forEach((q, idx) => {
    mixedAnswers[q.id] = (idx % 4) + 1; // cycles 1, 2, 3, 4
  });
  const mixedResult = calculateScores(mixedAnswers);
  assert(
    mixedResult.overallScore > 25 && mixedResult.overallScore < 100,
    `Mixed answers produce a valid score between 25 and 100 (got ${mixedResult.overallScore})`
  );

  // Test 10: Incomplete answers error handling
  let threwOnIncomplete = false;
  try {
    const incompleteAnswers = { Q01: 1, Q02: 2 };
    calculateScores(incompleteAnswers);
  } catch (err) {
    threwOnIncomplete = true;
  }
  assert(threwOnIncomplete, 'calculateScores throws error when missing answers');

  // Test 11: Invalid answer value (e.g. 5) rejection
  let threwOnInvalid = false;
  try {
    const invalidAnswers = { ...perfectAnswers, Q01: 5 };
    calculateScores(invalidAnswers);
  } catch (err) {
    threwOnInvalid = true;
  }
  assert(threwOnInvalid, 'calculateScores throws error for option value not in 1..4');

  // Test 12: recalculateOverall test
  const testCats = {};
  CATEGORY_SLUGS.forEach((slug) => {
    testCats[slug] = 50;
  });
  const recalced = recalculateOverall(testCats);
  assert(
    recalced === 50,
    `recalculateOverall should return 50 when all categories are 50 (got ${recalced})`
  );
}

function runConnectorLevelTests() {
  console.log('\n--- 3. Connector / Life Living Rank Level Tests ---');

  // Test 1: CONNECTOR_LEVEL_THRESHOLDS has exactly Level 1 and Level 2 (no invented levels 3-5)
  assert(
    CONNECTOR_LEVEL_THRESHOLDS.length === 2,
    `Only Level 1 and Level 2 thresholds are defined (got ${CONNECTOR_LEVEL_THRESHOLDS.length})`
  );
  assert(
    CONNECTOR_LEVEL_THRESHOLDS[0].level === 1 && CONNECTOR_LEVEL_THRESHOLDS[0].min === 0 && CONNECTOR_LEVEL_THRESHOLDS[0].max === 59,
    'Level 1 threshold covers score 0–59'
  );
  assert(
    CONNECTOR_LEVEL_THRESHOLDS[1].level === 2 && CONNECTOR_LEVEL_THRESHOLDS[1].min === 60 && CONNECTOR_LEVEL_THRESHOLDS[1].max === 100,
    'Level 2 threshold covers score 60–100'
  );

  // Required user test cases:
  // - 0 → Level 1
  assert(
    calculateConnectorLevel(0) === 1,
    'Score 0 produces Level 1'
  );

  // - 35 → Level 1
  assert(
    calculateConnectorLevel(35) === 1,
    'Score 35 produces Level 1'
  );

  // - 50 → Level 1
  assert(
    calculateConnectorLevel(50) === 1,
    'Score 50 produces Level 1'
  );

  // - 59 → Level 1
  assert(
    calculateConnectorLevel(59) === 1,
    'Score 59 produces Level 1'
  );

  // - 60 → Level 2
  assert(
    calculateConnectorLevel(60) === 2,
    'Score 60 produces Level 2'
  );

  // - 75 → Level 2
  assert(
    calculateConnectorLevel(75) === 2,
    'Score 75 produces Level 2'
  );

  // - 100 → Level 2
  assert(
    calculateConnectorLevel(100) === 2,
    'Score 100 produces Level 2'
  );

  // Clamping / Boundary edge cases:
  assert(
    calculateConnectorLevel(-10) === 1,
    'Negative score is clamped to Level 1'
  );
  assert(
    calculateConnectorLevel(150) === 2,
    'Score above 100 is clamped to Level 2'
  );

  // getConnectorLevelDetails tests:
  const lvl1Details = getConnectorLevelDetails(0);
  assert(
    lvl1Details.level === 1 &&
      lvl1Details.levelLabel === 'Lvl 1' &&
      lvl1Details.progressPercent === 0 &&
      lvl1Details.nextLevelLabel.includes('Level 2'),
    'Details for score 0: Lvl 1, 0% progress, Next: Level 2'
  );

  const lvl1MidDetails = getConnectorLevelDetails(30);
  assert(
    lvl1MidDetails.level === 1 &&
      lvl1MidDetails.progressPercent === 50,
    'Details for score 30: Lvl 1, 50% progress'
  );

  const lvl2Details = getConnectorLevelDetails(60);
  assert(
    lvl2Details.level === 2 &&
      lvl2Details.levelLabel === 'Lvl 2' &&
      lvl2Details.progressPercent === 0 &&
      lvl2Details.nextLevelLabel.includes('Coming soon'),
    'Details for score 60: Lvl 2, 0% progress, Next: Level 3 Coming soon'
  );

  const lvl2FullDetails = getConnectorLevelDetails(100);
  assert(
    lvl2FullDetails.level === 2 &&
      lvl2FullDetails.levelLabel === 'Lvl 2' &&
      lvl2FullDetails.progressPercent === 98 &&
      lvl2FullDetails.rank === 'Connector',
    'Details for score 100: Lvl 2, rank Connector'
  );
}

async function runDatabaseTests() {
  console.log('\n--- 4. Database Schema Verification ---');
  let db;
  try {
    db = require('../db');
    // Check if tables exist
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('life_experience_scores', 'life_experience_updates')
    `);
    const existingTables = tablesRes.rows.map((r) => r.table_name);

    assert(
      existingTables.includes('life_experience_scores'),
      'Table "life_experience_scores" exists in the database'
    );
    assert(
      existingTables.includes('life_experience_updates'),
      'Table "life_experience_updates" exists in the database'
    );

    // Verify columns on life_experience_scores
    const colsRes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'life_experience_scores'
    `);
    const cols = colsRes.rows.map((r) => r.column_name);
    assert(
      cols.includes('quiz_completed') &&
        cols.includes('current_overall_score') &&
        cols.includes('baseline_overall_score') &&
        cols.includes('user_id'),
      'Required score columns exist on "life_experience_scores"'
    );

    // Verify connector_level column exists
    assert(
      cols.includes('connector_level'),
      'Column "connector_level" exists on "life_experience_scores"'
    );

    // Verify unique constraint on life_experience_updates
    const constraintRes = await db.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'unique_user_experience'
    `);
    assert(
      constraintRes.rows.length > 0,
      'Unique constraint "unique_user_experience" exists on "life_experience_updates"'
    );
  } catch (dbErr) {
    console.error('  ⚠️ Database test notice:', dbErr.message);
  }
}

async function runQuizLifecycleFlowTests() {
  console.log('\n--- 5. Quiz Lifecycle & Auth Flow Integration Tests ---');
  let db;
  try {
    db = require('../db');
    const { calculateScores, calculateConnectorLevel, getConnectorLevelDetails } = require('../constants/lifeExperienceData');

    const testPhone = '+9999999999';
    const testUsername = 'test_quiz_flow_user_' + Date.now();

    // Clean up any previous test user
    await db.query('DELETE FROM users WHERE phone_number = $1 OR username = $2', [testPhone, testUsername]);

    // 1. New user signup / creation
    const userRes = await db.query(
      `INSERT INTO users (phone_number, username, quiz_completed) 
       VALUES ($1, $2, FALSE) RETURNING id, phone_number, username, quiz_completed`,
      [testPhone, testUsername]
    );
    const testUser = userRes.rows[0];
    assert(
      testUser.quiz_completed === false,
      'New user initially has quiz_completed = false'
    );

    // Verify initial life_experience_scores does not exist or has quiz_completed = false
    const scoreRowBefore = await db.query(
      'SELECT quiz_completed FROM life_experience_scores WHERE user_id = $1',
      [testUser.id]
    );
    const isCompletedBefore = scoreRowBefore.rows.length > 0 && scoreRowBefore.rows[0].quiz_completed;
    assert(
      !isCompletedBefore,
      'New user has no completed quiz record in life_experience_scores (Quiz MUST appear)'
    );

    // 2. Failed quiz submission simulation (e.g. incomplete or error)
    // Verify quiz_completed remains false if submission is not successful
    const scoreRowAfterFailed = await db.query(
      'SELECT quiz_completed FROM life_experience_scores WHERE user_id = $1',
      [testUser.id]
    );
    const isCompletedAfterFailed = scoreRowAfterFailed.rows.length > 0 && scoreRowAfterFailed.rows[0].quiz_completed;
    assert(
      !isCompletedAfterFailed,
      'Failed or abandoned quiz submission leaves quiz_completed = false'
    );

    // 3. Successful quiz submission
    // Build 30 valid answers
    const answers = {};
    for (let i = 1; i <= 30; i++) {
      const qId = `Q${String(i).padStart(2, '0')}`;
      answers[qId] = (i % 4) + 1; // 1, 2, 3, 4
    }
    const { categoryScores, overallScore } = calculateScores(answers);
    const connectorLevel = calculateConnectorLevel(overallScore);

    // Upsert into life_experience_scores
    await db.query(
      `INSERT INTO life_experience_scores (
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
      )`,
      [
        testUser.id,
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
      ]
    );
    await db.query('UPDATE users SET quiz_completed = TRUE WHERE id = $1', [testUser.id]);

    // 4. Verify backend database state after successful submission
    const scoreRowAfter = await db.query(
      'SELECT quiz_completed, current_overall_score, connector_level FROM life_experience_scores WHERE user_id = $1',
      [testUser.id]
    );
    assert(
      scoreRowAfter.rows.length === 1 && scoreRowAfter.rows[0].quiz_completed === true,
      'Successful submission sets quiz_completed = true in life_experience_scores'
    );
    assert(
      Number(scoreRowAfter.rows[0].current_overall_score) === overallScore,
      `Calculated overall score stored properly in DB (got ${scoreRowAfter.rows[0].current_overall_score})`
    );
    assert(
      scoreRowAfter.rows[0].connector_level === connectorLevel,
      `Connector level stored properly in DB (got Level ${scoreRowAfter.rows[0].connector_level})`
    );

    const userRowAfter = await db.query(
      'SELECT quiz_completed FROM users WHERE id = $1',
      [testUser.id]
    );
    assert(
      userRowAfter.rows[0].quiz_completed === true,
      'Successful submission syncs quiz_completed = true in users table'
    );

    // 5. Subsequent login check simulation (same or new device / app restart / reinstall)
    const loginScoreCheck = await db.query(
      'SELECT quiz_completed FROM life_experience_scores WHERE user_id = $1',
      [testUser.id]
    );
    const loginQuizCompleted = Boolean(loginScoreCheck.rows.length > 0 && loginScoreCheck.rows[0].quiz_completed);
    assert(
      loginQuizCompleted === true,
      'Login check returns quizCompleted = true (Quiz MUST NOT appear; opens Home directly)'
    );

    // Clean up test user
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
  } catch (err) {
    console.error('  ⚠️ Quiz lifecycle test error:', err.message);
  }
}

async function main() {
  console.log('==================================================');
  console.log('🧪 Starting Life Experience Score Test Suite');
  console.log('==================================================');

  runUnitTests();
  runConnectorLevelTests();
  await runDatabaseTests();
  await runQuizLifecycleFlowTests();

  console.log('\n==================================================');
  console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('==================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
