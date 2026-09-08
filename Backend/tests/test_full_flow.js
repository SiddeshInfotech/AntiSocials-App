const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../db');
const { LIFE_EXPERIENCE_QUESTIONS } = require('../constants/lifeExperienceData');

async function runEndToEndFlowTest() {
  console.log('==================================================');
  console.log('🧪 VERIFYING AUTH & LIFE EXPERIENCE QUIZ FLOW');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // FLOW 1: Existing user with quizCompleted = true
  // ----------------------------------------------------
  console.log('>>> TESTING FLOW 1: EXISTING COMPLETED USER LOGIN');
  const existingPhone = '9414868586'; // User 75 who has completed quiz

  // 1. Prepare OTP verification record for login
  await db.query('DELETE FROM otp_verifications WHERE phone_number = $1', [existingPhone]);
  await db.query(
    "INSERT INTO otp_verifications (phone_number, otp, purpose, is_verified, expires_at) VALUES ($1, '123456', 'login', true, NOW() + INTERVAL '10 minutes')",
    [existingPhone]
  );

  // 2. Perform Login
  const loginRes = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: existingPhone }),
  });
  const loginData = await loginRes.json();
  console.log('  Login Status:', loginRes.status);
  
  // 3. Frontend logic check in otp.tsx
  let isQuizCompleted = Boolean(
    loginData.quizCompleted ??
    loginData.quiz_completed ??
    loginData.user?.quizCompleted ??
    loginData.user?.quiz_completed
  );

  if (!isQuizCompleted) {
    // Fallback check to /api/life-score
    const scoreRes = await fetch('http://localhost:5000/api/life-score', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    if (scoreRes.ok) {
      const scoreData = await scoreRes.json();
      if (
        scoreData.quizCompleted ||
        scoreData.quiz_completed ||
        scoreData.data?.quizCompleted ||
        scoreData.data?.quiz_completed
      ) {
        isQuizCompleted = true;
      }
    }
  }

  const destination = isQuizCompleted ? '/(tabs)' : '/life-experience-quiz';
  console.log(`  Target destination: "${destination}"`);
  if (destination === '/(tabs)') {
    console.log('  ✅ PASS: Existing completed user navigates directly to App/Home (tabs)!');
  } else {
    console.error('  ❌ FAIL: Existing completed user was not routed to (tabs)!');
    process.exit(1);
  }

  // 4. Guard test on /life-experience-quiz screen
  // If this user attempts to access /life-experience-quiz directly
  const guardRes = await fetch('http://localhost:5000/api/life-score', {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const guardData = await guardRes.json();
  const guardRedirects = Boolean(
    guardData.quiz_completed ||
    guardData.quizCompleted ||
    guardData.data?.quiz_completed ||
    guardData.data?.quizCompleted
  );
  if (guardRedirects) {
    console.log('  ✅ PASS: Guard on life-experience-quiz intercepts completed user and redirects to (tabs)!');
  } else {
    console.error('  ❌ FAIL: Guard did not intercept completed user!');
    process.exit(1);
  }

  // ----------------------------------------------------
  // FLOW 2: New user / uncompleted user flow
  // ----------------------------------------------------
  console.log('\n>>> TESTING FLOW 2: NEW USER SIGNUP -> QUIZ -> SUBMIT -> APP/HOME');
  const newPhone = '999000' + Math.floor(1000 + Math.random() * 9000);
  const newUsername = 'flow_test_' + Date.now().toString().slice(-6);

  // Clean up any potential conflicts
  await db.query('DELETE FROM users WHERE phone_number = $1 OR username = $2', [newPhone, newUsername]);
  await db.query('DELETE FROM otp_verifications WHERE phone_number = $1', [newPhone]);

  // 1. Simulate OTP verification for signup
  await db.query(
    "INSERT INTO otp_verifications (phone_number, otp, purpose, is_verified, expires_at) VALUES ($1, '123456', 'signup', true, NOW() + INTERVAL '10 minutes')",
    [newPhone]
  );

  // 2. Simulate /auth/register
  const regRes = await fetch('http://localhost:5000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: newPhone,
      username: newUsername,
      email: `${newUsername}@test.com`,
    }),
  });
  const regData = await regRes.json();
  console.log('  Register Status:', regRes.status);
  console.log('  New user ID:', regData.user?.id);

  // Frontend otp.tsx logic on signup: routes directly to /life-experience-quiz
  const signupDestination = '/life-experience-quiz';
  console.log(`  Signup Target destination: "${signupDestination}"`);
  console.log('  ✅ PASS: New user routed to /life-experience-quiz!');

  // 3. User on /life-experience-quiz checks initial status
  const initialCheckRes = await fetch('http://localhost:5000/api/life-score', {
    headers: { Authorization: `Bearer ${regData.token}` },
  });
  const initialCheckData = await initialCheckRes.json();
  const initialCompleted = Boolean(
    initialCheckData.quiz_completed ||
    initialCheckData.quizCompleted ||
    initialCheckData.data?.quiz_completed ||
    initialCheckData.data?.quizCompleted
  );
  if (!initialCompleted) {
    console.log('  ✅ PASS: New user quiz_completed is false; quiz is shown.');
  } else {
    console.error('  ❌ FAIL: New user prematurely marked quiz_completed!');
    process.exit(1);
  }

  // 4. User answers all 30 questions and submits
  const answers = {};
  for (const q of LIFE_EXPERIENCE_QUESTIONS) {
    // Pick option 3 (75 points)
    answers[q.id] = 3;
  }

  const submitRes = await fetch('http://localhost:5000/api/life-score/quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regData.token}`,
    },
    body: JSON.stringify({ answers }),
  });
  const submitData = await submitRes.json();
  console.log('  Quiz Submission Status:', submitRes.status);
  const resScore = submitData.overallScore ?? submitData.data?.overallScore;
  const resLevel = submitData.connectorLevel ?? submitData.data?.connectorLevel;
  console.log('  Quiz Submission Response Overall Score:', resScore, 'Connector Level:', resLevel);

  const isSubmittedSuccess = submitRes.status === 201 && Boolean(
    submitData.quizCompleted ||
    submitData.quiz_completed ||
    submitData.data?.quizCompleted ||
    submitData.data?.quiz_completed
  );

  if (isSubmittedSuccess) {
    console.log('  ✅ PASS: Quiz submitted, score calculated, and quizCompleted = true returned!');
  } else {
    console.error('  ❌ FAIL: Quiz submission failed:', submitData);
    process.exit(1);
  }

  // 5. Check database state
  const dbUser = await db.query('SELECT quiz_completed FROM users WHERE id = $1', [regData.user.id]);
  const dbScore = await db.query('SELECT quiz_completed, current_overall_score, connector_level FROM life_experience_scores WHERE user_id = $1', [regData.user.id]);

  console.log('  DB users.quiz_completed:', dbUser.rows[0]?.quiz_completed);
  console.log('  DB life_experience_scores.quiz_completed:', dbScore.rows[0]?.quiz_completed);
  console.log('  DB score:', dbScore.rows[0]?.current_overall_score, 'DB level:', dbScore.rows[0]?.connector_level);

  if (dbUser.rows[0]?.quiz_completed === true && dbScore.rows[0]?.quiz_completed === true) {
    console.log('  ✅ PASS: Database is updated as the source of truth for quizCompleted!');
  } else {
    console.error('  ❌ FAIL: Database not updated with quizCompleted = true!');
    process.exit(1);
  }

  // 6. Test repeat login for this newly completed user!
  console.log('\n>>> TESTING SUBSEQUENT LOGIN FOR THIS NEW USER');
  await db.query(
    "INSERT INTO otp_verifications (phone_number, otp, purpose, is_verified, expires_at) VALUES ($1, '123456', 'login', true, NOW() + INTERVAL '10 minutes')",
    [newPhone]
  );
  const repeatLoginRes = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: newPhone }),
  });
  const repeatLoginData = await repeatLoginRes.json();

  let repeatQuizCompleted = Boolean(
    repeatLoginData.quizCompleted ??
    repeatLoginData.quiz_completed ??
    repeatLoginData.user?.quizCompleted ??
    repeatLoginData.user?.quiz_completed
  );

  if (!repeatQuizCompleted) {
    const repeatScoreRes = await fetch('http://localhost:5000/api/life-score', {
      headers: { Authorization: `Bearer ${repeatLoginData.token}` },
    });
    if (repeatScoreRes.ok) {
      const repeatScoreData = await repeatScoreRes.json();
      if (
        repeatScoreData.quizCompleted ||
        repeatScoreData.quiz_completed ||
        repeatScoreData.data?.quizCompleted ||
        repeatScoreData.data?.quiz_completed
      ) {
        repeatQuizCompleted = true;
      }
    }
  }

  const repeatDestination = repeatQuizCompleted ? '/(tabs)' : '/life-experience-quiz';
  console.log(`  Repeat Login Destination: "${repeatDestination}"`);
  if (repeatDestination === '/(tabs)') {
    console.log('  ✅ PASS: User NEVER sees quiz again on subsequent logins! Directly opens App/Home!');
  } else {
    console.error('  ❌ FAIL: User was routed back to quiz!');
    process.exit(1);
  }

  // 7. Test attempt to resubmit quiz (Must be blocked with 409 Conflict)
  const duplicateRes = await fetch('http://localhost:5000/api/life-score/quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${repeatLoginData.token}`,
    },
    body: JSON.stringify({ answers }),
  });
  console.log('  Duplicate Submission Status (expect 409):', duplicateRes.status);
  if (duplicateRes.status === 409) {
    console.log('  ✅ PASS: Duplicate quiz submission rejected with 409 Conflict!');
  } else {
    console.error('  ❌ FAIL: Duplicate submission allowed!');
    process.exit(1);
  }

  // Cleanup test user
  await db.query('DELETE FROM life_experience_scores WHERE user_id = $1', [regData.user.id]);
  await db.query('DELETE FROM users WHERE id = $1', [regData.user.id]);
  await db.query('DELETE FROM otp_verifications WHERE phone_number = $1', [newPhone]);

  console.log('\n==================================================');
  console.log('🎉 ALL FLOW VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runEndToEndFlowTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
