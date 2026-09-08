const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../db');

async function verifyFlow() {
  console.log('--- Step 1: Check existing completed user (9414868586) ---');
  const phone = '9414868586';
  await db.query('DELETE FROM otp_verifications WHERE phone_number = $1', [phone]);
  await db.query(
    "INSERT INTO otp_verifications (phone_number, otp, purpose, is_verified, expires_at) VALUES ($1, '123456', 'login', true, NOW() + INTERVAL '10 minutes')",
    [phone]
  );

  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phone })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Login response quizCompleted:', data.quizCompleted, 'quiz_completed:', data.quiz_completed);
  console.log('User object quizCompleted:', data.user?.quizCompleted);

  console.log('\n--- Step 2: Check uncompleted user (8087298179) ---');
  const phoneUncompleted = '8087298179';
  await db.query('DELETE FROM otp_verifications WHERE phone_number = $1', [phoneUncompleted]);
  await db.query(
    "INSERT INTO otp_verifications (phone_number, otp, purpose, is_verified, expires_at) VALUES ($1, '123456', 'login', true, NOW() + INTERVAL '10 minutes')",
    [phoneUncompleted]
  );

  const resUncompleted = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phoneUncompleted })
  });
  const dataUncompleted = await resUncompleted.json();
  console.log('Status:', resUncompleted.status);
  console.log('Login response quizCompleted:', dataUncompleted.quizCompleted, 'quiz_completed:', dataUncompleted.quiz_completed);
  console.log('User object quizCompleted:', dataUncompleted.user?.quizCompleted);

  console.log('\n--- Step 3: Check /api/life-score for uncompleted user ---');
  const tokenUncompleted = dataUncompleted.token;
  const resScore = await fetch('http://localhost:5000/api/life-score', {
    headers: { Authorization: `Bearer ${tokenUncompleted}` }
  });
  const dataScore = await resScore.json();
  console.log('Score API for uncompleted user:', dataScore);
}

verifyFlow()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
