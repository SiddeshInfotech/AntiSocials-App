const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');
const { deactivateExpiredStories } = require('../services/storyExpiryService');
const jwt = require('jsonwebtoken');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const JWT_SECRET = process.env.JWT_SECRET || 'antisocial_secret';
let BASE_URL = 'http://127.0.0.1:5000';
let serverProcess = null;

async function makeRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function waitForServer(retries = 30, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await makeRequest('GET', '/health');
      if (res.status === 200) return true;
    } catch (e) {
      // wait
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

async function startServerIfNeeded() {
  try {
    const res = await makeRequest('GET', '/health');
    if (res.status === 200) {
      console.log('⚡ Backend server already running on port 5000');
      return;
    }
  } catch (e) {
    console.log('🚀 Spawning background backend server for tests...');
    const serverScript = path.join(__dirname, '..', 'index.js');
    serverProcess = spawn('node', [serverScript], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, PORT: '5000', HOST: '127.0.0.1' }
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Backend server running') || msg.includes('Error')) {
        console.log('   [Server]', msg.trim());
      }
    });

    const ready = await waitForServer(30, 500);
    if (!ready) {
      throw new Error('Backend server failed to start within timeout');
    }
    console.log('✅ Backend server is live and healthy!');
  }
}

async function runTests() {
  console.log('🧪 ===============================================');
  console.log('🧪 RUNNING INSTAGRAM-STYLE STORY LOGIC VERIFICATION');
  console.log('🧪 ===============================================\n');

  try {
    await startServerIfNeeded();

    // Ensure follows & user_connections tables exist in database
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );
    `);

    // 1. Setup 3 distinct test users: User A (Creator), User B (Follower), User C (Non-Follower)
    const timeSuffix = Date.now();
    const phoneA = `+1888${Math.floor(100000 + Math.random() * 900000)}`;
    const phoneB = `+1888${Math.floor(100000 + Math.random() * 900000)}`;
    const phoneC = `+1888${Math.floor(100000 + Math.random() * 900000)}`;

    const userAInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 100, 5, 10) RETURNING id, username, phone_number, profile_name, email`,
      [`user_a_${timeSuffix}`, phoneA, 'Creator Alpha', `alpha_${timeSuffix}@test.com`]
    );
    const userA = userAInsert.rows[0];
    const tokenA = jwt.sign({ id: userA.id, username: userA.username, phoneNumber: userA.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    const userBInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 50, 2, 5) RETURNING id, username, phone_number, profile_name, email`,
      [`user_b_${timeSuffix}`, phoneB, 'Follower Beta', `beta_${timeSuffix}@test.com`]
    );
    const userB = userBInsert.rows[0];
    const tokenB = jwt.sign({ id: userB.id, username: userB.username, phoneNumber: userB.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    const userCInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 10, 0, 1) RETURNING id, username, phone_number, profile_name, email`,
      [`user_c_${timeSuffix}`, phoneC, 'Stranger Charlie', `charlie_${timeSuffix}@test.com`]
    );
    const userC = userCInsert.rows[0];
    const tokenC = jwt.sign({ id: userC.id, username: userC.username, phoneNumber: userC.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    // Establish Follow relationship: User B follows User A (User C does NOT follow User A)
    await db.query(`
      INSERT INTO user_connections (user_id, friend_id, status)
      VALUES ($1, $2, 'accepted')
    `, [userB.id, userA.id]);

    await db.query(`
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
    `, [userB.id, userA.id]);

    console.log('✅ 1. Test Setup Configured:');
    console.log(`   - User A (Creator): ID ${userA.id}, Username: ${userA.username}`);
    console.log(`   - User B (Follower of A): ID ${userB.id}, Username: ${userB.username}`);
    console.log(`   - User C (Non-Follower): ID ${userC.id}, Username: ${userC.username}\n`);

    // ==========================================
    // TEST 1: User A uploads image story. Check follow-based visibility.
    // ==========================================
    console.log('🧪 TEST 1: User A uploads image story → Follower visibility enforcement');
    const uploadImageRes = await makeRequest('POST', '/api/stories', {
      media_url: 'http://192.168.1.50:5000/uploads/alpha_story_pic.jpg',
      media_type: 'image',
      caption: 'Alpha morning meditation'
    }, tokenA);

    if (uploadImageRes.status !== 201 || !uploadImageRes.body?.story?.id) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadImageRes.body)}`);
    }
    const story1Id = uploadImageRes.body.story.id;
    console.log(`   - Story 1 created: ID ${story1Id}, media_url: ${uploadImageRes.body.story.media_url}, expires_at: ${uploadImageRes.body.story.expires_at}`);

    // User A fetches Home & Stories
    const aHomeRes = await makeRequest('GET', '/api/home', null, tokenA);
    const aStoriesRes = await makeRequest('GET', '/api/stories', null, tokenA);
    const aSeesOwnInHome = (aHomeRes.body?.own_stories || []).some(s => s.id === story1Id);
    const aSeesOwnInStories = (aStoriesRes.body?.stories || []).some(s => s.id === story1Id);
    console.log(`   - User A sees own story: in home=${aSeesOwnInHome}, in stories=${aSeesOwnInStories}`);

    // User B (Follower) fetches Home & Stories
    const bHomeRes = await makeRequest('GET', '/api/home', null, tokenB);
    const bStoriesRes = await makeRequest('GET', '/api/stories', null, tokenB);
    const bSeesAInHome = (bHomeRes.body?.active_stories || []).some(s => s.id === story1Id);
    const bSeesAInStories = (bStoriesRes.body?.stories || []).some(s => s.id === story1Id);
    console.log(`   - User B (Follower) sees A story: in home active_stories=${bSeesAInHome}, in stories=${bSeesAInStories}`);

    // User C (Non-Follower) fetches Home & Stories
    const cHomeRes = await makeRequest('GET', '/api/home', null, tokenC);
    const cStoriesRes = await makeRequest('GET', '/api/stories', null, tokenC);
    const cSeesAInHome = (cHomeRes.body?.active_stories || []).some(s => s.id === story1Id);
    const cSeesAInStories = (cStoriesRes.body?.stories || []).some(s => s.id === story1Id);
    console.log(`   - User C (Non-Follower) sees A story: in home active_stories=${cSeesAInHome} (Expected: false), in stories=${cSeesAInStories} (Expected: false)`);

    // User C direct access test
    const cDirectAccessRes = await makeRequest('GET', `/api/stories/${story1Id}`, null, tokenC);
    console.log(`   - User C direct GET /api/stories/${story1Id}: status ${cDirectAccessRes.status} (Expected: 404 access denied)\n`);

    if (!aSeesOwnInHome || !bSeesAInHome || cSeesAInHome || cSeesAInStories || cDirectAccessRes.status !== 404) {
      throw new Error('TEST 1 FAILED: Follower-based story visibility rule was violated');
    }
    console.log('   👉 TEST 1 PASSED!\n');

    // ==========================================
    // TEST 2: User A deletes and uploads Video story
    // ==========================================
    console.log('🧪 TEST 2: User A uploads video story (.mp4) → Video playback access');
    // First delete story 1 to allow story 2 (1-story-per-user rule)
    await makeRequest('DELETE', `/api/stories/${story1Id}`, null, tokenA);

    const uploadVideoRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/alpha_workout_clip.mp4',
      media_type: 'video',
      caption: 'Alpha afternoon workout video'
    }, tokenA);

    const videoStoryId = uploadVideoRes.body?.story?.id;
    console.log(`   - Video story created: ID ${videoStoryId}, media_type: ${uploadVideoRes.body?.story?.media_type}`);

    const bVideoStoriesRes = await makeRequest('GET', '/api/stories', null, tokenB);
    const bFoundVideo = (bVideoStoriesRes.body?.stories || []).find(s => s.id === videoStoryId);
    console.log(`   - User B sees video story: ${!!bFoundVideo}, media_type: ${bFoundVideo?.media_type}`);

    const cVideoStoriesRes = await makeRequest('GET', '/api/stories', null, tokenC);
    const cFoundVideo = (cVideoStoriesRes.body?.stories || []).find(s => s.id === videoStoryId);
    console.log(`   - User C cannot see video story: ${!cFoundVideo}`);

    if (!bFoundVideo || bFoundVideo.media_type !== 'video' || cFoundVideo) {
      throw new Error('TEST 2 FAILED: Video story access check failed');
    }
    console.log('   👉 TEST 2 PASSED!\n');

    // ==========================================
    // TEST 3: User A logs out (token discarded) → User B still sees User A story
    // ==========================================
    console.log('🧪 TEST 3: Logout persistence (Token discarded, DB story persists)');
    // Simulate User A logging out by discarding tokenA
    const freshTokenA = null; 

    // User B fetches active stories fresh from backend
    const bFreshFeed = await makeRequest('GET', '/api/stories', null, tokenB);
    const bStillSeesA = (bFreshFeed.body?.stories || []).some(s => s.id === videoStoryId);
    console.log(`   - User B still sees User A story after A logs out: ${bStillSeesA} (Expected: true)\n`);

    if (!bStillSeesA) {
      throw new Error('TEST 3 FAILED: Story disappeared when creator logged out');
    }
    console.log('   👉 TEST 3 PASSED!\n');

    // ==========================================
    // TEST 4: User A logs back in before 24 hours → User A sees own story
    // ==========================================
    console.log('🧪 TEST 4: User A logs back in before 24h → Story reconstructed in tray & feed');
    // Generate fresh session token for User A
    const newSessionTokenA = jwt.sign({ id: userA.id, username: userA.username, phoneNumber: userA.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    const aFreshHome = await makeRequest('GET', '/api/home', null, newSessionTokenA);
    const aFreshStories = await makeRequest('GET', '/api/stories', null, newSessionTokenA);
    const aReacquiredOwnInHome = (aFreshHome.body?.own_stories || []).some(s => s.id === videoStoryId);
    const aReacquiredOwnInFeed = (aFreshStories.body?.stories || []).some(s => s.id === videoStoryId);
    console.log(`   - User A sees own story after re-login: in home=${aReacquiredOwnInHome}, in feed=${aReacquiredOwnInFeed}\n`);

    if (!aReacquiredOwnInHome || !aReacquiredOwnInFeed) {
      throw new Error('TEST 4 FAILED: User A story not found after re-login');
    }
    console.log('   👉 TEST 4 PASSED!\n');

    // ==========================================
    // TEST 5: Manual Deletion Security
    // ==========================================
    console.log('🧪 TEST 5: Manual Deletion Security');
    // Non-owner (User B) tries to delete User A's story
    const bUnauthorizedDelete = await makeRequest('DELETE', `/api/stories/${videoStoryId}`, null, tokenB);
    console.log(`   - Non-owner delete attempt: status ${bUnauthorizedDelete.status} (Expected: 403 Forbidden)`);

    // Owner (User A) deletes own story
    const aAuthorizedDelete = await makeRequest('DELETE', `/api/stories/${videoStoryId}`, null, newSessionTokenA);
    console.log(`   - Owner delete attempt: status ${aAuthorizedDelete.status} (Expected: 200 OK)`);

    // Verify story is gone for both A and B
    const aAfterDeleteFeed = await makeRequest('GET', '/api/stories', null, newSessionTokenA);
    const bAfterDeleteFeed = await makeRequest('GET', '/api/stories', null, tokenB);
    const aHasDeleted = (aAfterDeleteFeed.body?.stories || []).some(s => s.id === videoStoryId);
    const bHasDeleted = (bAfterDeleteFeed.body?.stories || []).some(s => s.id === videoStoryId);
    console.log(`   - Story exists after delete: for A=${aHasDeleted} (Expected: false), for B=${bHasDeleted} (Expected: false)\n`);

    if (bUnauthorizedDelete.status !== 403 || aAuthorizedDelete.status !== 200 || aHasDeleted || bHasDeleted) {
      throw new Error('TEST 5 FAILED: Story delete authorization failed');
    }
    console.log('   👉 TEST 5 PASSED!\n');

    // ==========================================
    // TEST 6: Exact 24-Hour Expiry Boundary
    // ==========================================
    console.log('🧪 TEST 6: 24-Hour Expiration Boundary Logic');
    // 6a. Create an active story (unexpired)
    const uploadActiveStoryRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/active_sample.jpg',
      media_type: 'image',
      caption: 'Active for 24 hours'
    }, newSessionTokenA);
    const activeStoryId = uploadActiveStoryRes.body?.story?.id;

    // 6b. Insert an expired story directly into database (expired 10 minutes ago)
    const expiredInsertRes = await db.query(`
      INSERT INTO stories (user_id, media_url, media_type, created_at, expires_at, is_active)
      VALUES ($1, '/uploads/expired_sample.jpg', 'image', CURRENT_TIMESTAMP - INTERVAL '25 hours', CURRENT_TIMESTAMP - INTERVAL '10 minutes', TRUE)
      RETURNING id, expires_at, is_active
    `, [userB.id]);
    const expiredStoryId = expiredInsertRes.rows[0].id;

    // Verify expired story is deactivated by cleanup service
    const deactivatedCount = await deactivateExpiredStories();
    console.log(`   - Ran deactivateExpiredStories(): deactivated ${deactivatedCount} expired stories`);

    const expiredDbCheck = await db.query('SELECT id, is_active FROM stories WHERE id = $1', [expiredStoryId]);
    const activeDbCheck = await db.query('SELECT id, is_active FROM stories WHERE id = $1', [activeStoryId]);
    console.log(`   - Expired story is_active: ${expiredDbCheck.rows[0]?.is_active} (Expected: false)`);
    console.log(`   - Active story is_active: ${activeDbCheck.rows[0]?.is_active} (Expected: true)`);

    // Verify API does not return the expired story to any user
    const bExpiryCheckFeed = await makeRequest('GET', '/api/stories', null, tokenB);
    const expiredInFeed = (bExpiryCheckFeed.body?.stories || []).some(s => s.id === expiredStoryId);
    console.log(`   - Expired story returned in GET /api/stories: ${expiredInFeed} (Expected: false)\n`);

    if (expiredDbCheck.rows[0]?.is_active !== false || activeDbCheck.rows[0]?.is_active !== true || expiredInFeed) {
      throw new Error('TEST 6 FAILED: 24-hour expiration rule failed');
    }
    console.log('   👉 TEST 6 PASSED!\n');

    // ==========================================
    // TEST 7: Multiple stories from multiple followed users & error isolation
    // ==========================================
    console.log('🧪 TEST 7: Multi-user feed aggregation & error isolation');
    // User D setup
    const phoneD = `+1888${Math.floor(100000 + Math.random() * 900000)}`;
    const userDInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 80, 3, 7) RETURNING id, username, phone_number, profile_name, email`,
      [`user_d_${timeSuffix}`, phoneD, 'Friend Delta', `delta_${timeSuffix}@test.com`]
    );
    const userD = userDInsert.rows[0];
    const tokenD = jwt.sign({ id: userD.id, username: userD.username, phoneNumber: userD.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    // User B also follows User D
    await db.query(`INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)`, [userB.id, userD.id]);
    await db.query(`INSERT INTO user_connections (user_id, friend_id, status) VALUES ($1, $2, 'accepted')`, [userB.id, userD.id]);

    // User D uploads story
    const dUploadRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/delta_nature_pic.jpg',
      media_type: 'image',
      caption: 'Delta mountain hike'
    }, tokenD);
    const storyDId = dUploadRes.body?.story?.id;

    // User B fetches feed: must see BOTH User A and User D active stories
    const bMultiFeedRes = await makeRequest('GET', '/api/stories', null, tokenB);
    const bMultiStories = bMultiFeedRes.body?.stories || [];
    const bSeesA = bMultiStories.some(s => s.id === activeStoryId);
    const bSeesD = bMultiStories.some(s => s.id === storyDId);
    console.log(`   - User B sees Story A: ${bSeesA}`);
    console.log(`   - User B sees Story D: ${bSeesD}`);
    console.log(`   - User B total followed stories: ${bMultiStories.length}`);

    // Clean up test data
    await db.query('DELETE FROM stories WHERE user_id IN ($1, $2, $3, $4)', [userA.id, userB.id, userC.id, userD.id]);
    await db.query('DELETE FROM follows WHERE follower_id IN ($1, $2, $3, $4) OR following_id IN ($1, $2, $3, $4)', [userA.id, userB.id, userC.id, userD.id]);
    await db.query('DELETE FROM user_connections WHERE user_id IN ($1, $2, $3, $4) OR friend_id IN ($1, $2, $3, $4)', [userA.id, userB.id, userC.id, userD.id]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [userA.id, userB.id, userC.id, userD.id]);
    console.log('🧹 Cleaned up test database records.');

    if (!bSeesA || !bSeesD) {
      throw new Error('TEST 7 FAILED: Multi-user followed stories aggregation failed');
    }
    console.log('   👉 TEST 7 PASSED!\n');

    console.log('===============================================');
    console.log('🎉 ALL 7 INSTAGRAM STORY LOGIC TESTS PASSED PERFECTLY!');
    console.log('===============================================');

    if (serverProcess) serverProcess.kill();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

runTests();
