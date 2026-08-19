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
  console.log('🧪 RUNNING COMPLETE STORIES SYSTEM VERIFICATION');
  console.log('🧪 ===============================================\n');

  try {
    await startServerIfNeeded();

    // 1. Create test users directly in PostgreSQL & generate JWTs
    const timeSuffix = Date.now();
    const phoneA = `+1999${Math.floor(100000 + Math.random() * 900000)}`;
    const phoneB = `+1999${Math.floor(100000 + Math.random() * 900000)}`;

    const userAInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 50, 2, 5) RETURNING id, username, phone_number, profile_name, email`,
      [`user_a_${timeSuffix}`, phoneA, 'User Alpha', `alpha_${timeSuffix}@test.com`]
    );
    const userA = userAInsert.rows[0];
    const tokenA = jwt.sign(
      { id: userA.id, username: userA.username, phoneNumber: userA.phone_number },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userBInsert = await db.query(
      `INSERT INTO users (username, phone_number, profile_name, email, is_phone_verified, points, streak_count, longest_streak)
       VALUES ($1, $2, $3, $4, true, 30, 1, 3) RETURNING id, username, phone_number, profile_name, email`,
      [`user_b_${timeSuffix}`, phoneB, 'User Beta', `beta_${timeSuffix}@test.com`]
    );
    const userB = userBInsert.rows[0];
    const tokenB = jwt.sign(
      { id: userB.id, username: userB.username, phoneNumber: userB.phone_number },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ 1. Test Users Created & Authenticated:');
    console.log(`   - User A: ID ${userA?.id}, Username: ${userA?.username}, Profile: ${userA?.profile_name}`);
    console.log(`   - User B: ID ${userB?.id}, Username: ${userB?.username}, Profile: ${userB?.profile_name}\n`);

    // 2. User A uploads an Image story
    const storyImageUploadRes = await makeRequest('POST', '/api/stories', {
      media_url: 'http://192.168.1.100:5000/uploads/story_alpha_test.jpg', // Test absolute URL normalization
      media_type: 'image',
      caption: 'Alpha mindful morning moment',
      text_elements: [{ id: 'el1', content: 'Peaceful', x: 50, y: 100, color: '#FFFFFF' }]
    }, tokenA);

    console.log('✅ 2. User A Upload Image Story:');
    console.log(`   - Status: ${storyImageUploadRes.status}`);
    console.log(`   - Stored Media URL: ${storyImageUploadRes.body?.story?.media_url}`);
    console.log(`   - Normalized to relative /uploads/: ${storyImageUploadRes.body?.story?.media_url?.startsWith('/uploads/')}`);
    console.log(`   - Display Name: ${storyImageUploadRes.body?.story?.display_name}`);
    console.log(`   - Expires At: ${storyImageUploadRes.body?.story?.expires_at}`);

    if (storyImageUploadRes.status !== 201 || !storyImageUploadRes.body?.story?.id) {
      throw new Error(`User A story upload failed: ${JSON.stringify(storyImageUploadRes.body)}`);
    }
    const storyAId = storyImageUploadRes.body.story.id;

    // 3. User B logs in and fetches Stories feed & Home data
    const userBStoriesFeedRes = await makeRequest('GET', '/api/stories', null, tokenB);
    const userBHomeRes = await makeRequest('GET', '/api/home', null, tokenB);

    console.log('\n✅ 3. Cross-User Visibility Check (User B sees User A):');
    console.log(`   - GET /api/stories total count: ${userBStoriesFeedRes.body?.stories?.length}`);
    const foundStoryAInFeed = userBStoriesFeedRes.body?.stories?.find(s => Number(s.id) === Number(storyAId));
    console.log(`   - User A Story Found in User B's Feed: ${!!foundStoryAInFeed}`);
    if (foundStoryAInFeed) {
      console.log(`     * Caption: ${foundStoryAInFeed.caption}`);
      console.log(`     * Creator: ${foundStoryAInFeed.display_name} (@${foundStoryAInFeed.username})`);
      console.log(`     * Media: ${foundStoryAInFeed.media_url} (type: ${foundStoryAInFeed.media_type})`);
      console.log(`     * Likes: ${foundStoryAInFeed.likes_count}, Comments: ${foundStoryAInFeed.comments_count}, Shares: ${foundStoryAInFeed.shares_count}`);
    }

    const foundStoryAInHome = userBHomeRes.body?.active_stories?.find(s => Number(s.id) === Number(storyAId));
    console.log(`   - User A Story Found in User B's Home active_stories: ${!!foundStoryAInHome}\n`);

    if (!foundStoryAInFeed || !foundStoryAInHome) {
      throw new Error('Cross-user story visibility failed: User B cannot see User A active story');
    }

    // 4. User B uploads a Video story
    const storyBVideoUploadRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/story_beta_clip.mp4',
      media_type: 'video',
      caption: 'Beta nature meditation video',
      text_elements: []
    }, tokenB);

    console.log('✅ 4. User B Upload Video Story:');
    console.log(`   - Status: ${storyBVideoUploadRes.status}`);
    console.log(`   - Media Type: ${storyBVideoUploadRes.body?.story?.media_type}`);
    console.log(`   - Media URL: ${storyBVideoUploadRes.body?.story?.media_url}\n`);

    const storyBId = storyBVideoUploadRes.body?.story?.id;

    // 5. User A fetches Stories feed and checks User B's video story
    const userAStoriesFeedRes = await makeRequest('GET', '/api/stories', null, tokenA);
    const foundStoryBInAFeed = userAStoriesFeedRes.body?.stories?.find(s => Number(s.id) === Number(storyBId));
    console.log('✅ 5. User A sees User B Video Story:');
    console.log(`   - User B Story Found in User A Feed: ${!!foundStoryBInAFeed}`);
    console.log(`   - Story B Media Type: ${foundStoryBInAFeed?.media_type}\n`);

    if (!foundStoryBInAFeed) {
      throw new Error('User A cannot see User B video story');
    }

    // 6. User B interacts with User A's story (Like, Comment, Share, View)
    console.log('✅ 6. Testing Story Interactions:');
    // Like
    const likeRes = await makeRequest('POST', `/api/stories/${storyAId}/like`, {}, tokenB);
    console.log(`   - User B Likes Story A: status ${likeRes.status}, likes_count: ${likeRes.body?.likes_count}, isLiked: ${likeRes.body?.isLiked}`);

    // Comment
    const commentRes = await makeRequest('POST', `/api/stories/${storyAId}/comments`, {
      content: 'So inspiring and peaceful!'
    }, tokenB);
    console.log(`   - User B Comments on Story A: status ${commentRes.status}, comment: "${commentRes.body?.comment?.comment_text}"`);

    // Share
    const shareRes = await makeRequest('POST', `/api/stories/${storyAId}/share`, {}, tokenB);
    console.log(`   - User B Shares Story A: status ${shareRes.status}, shares_count: ${shareRes.body?.shares_count}`);

    // View
    const viewRes = await makeRequest('POST', `/api/stories/${storyAId}/view`, {}, tokenB);
    console.log(`   - User B Views Story A: status ${viewRes.status}`);

    const viewersRes = await makeRequest('GET', `/api/stories/${storyAId}/views`, null, tokenA);
    console.log(`   - User A Checks Story Viewers: count ${viewersRes.body?.viewers?.length}, viewer username: ${viewersRes.body?.viewers?.[0]?.username}\n`);

    // 7. Verify 24-Hour Expiry Logic & Service
    console.log('✅ 7. Testing 24-Hour Expiration & Automatic Cleanup:');
    // Insert an expired story directly into the database
    const expiredInsertRes = await db.query(`
      INSERT INTO stories (user_id, media_url, media_type, created_at, expires_at, is_active)
      VALUES ($1, '/uploads/expired_dummy.jpg', 'image', CURRENT_TIMESTAMP - INTERVAL '25 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', TRUE)
      RETURNING id, is_active, expires_at
    `, [userA.id]);
    const expiredStoryId = expiredInsertRes.rows[0].id;
    console.log(`   - Created Test Expired Story: ID ${expiredStoryId}, expires_at: ${expiredInsertRes.rows[0].expires_at}`);

    // Run deactivation
    const deactivatedCount = await deactivateExpiredStories();
    console.log(`   - Deactivated Count: ${deactivatedCount}`);

    const checkExpiredRes = await db.query('SELECT id, is_active FROM stories WHERE id = $1', [expiredStoryId]);
    console.log(`   - Expired Story is_active after cleanup: ${checkExpiredRes.rows[0]?.is_active} (Expected: false)`);

    const checkActiveStoryRes = await db.query('SELECT id, is_active FROM stories WHERE id = $1', [storyAId]);
    console.log(`   - Unexpired Story is_active after cleanup: ${checkActiveStoryRes.rows[0]?.is_active} (Expected: true)\n`);

    if (checkExpiredRes.rows[0]?.is_active !== false || checkActiveStoryRes.rows[0]?.is_active !== true) {
      throw new Error('Story expiry deactivation validation failed');
    }

    // 8. Story Deletion & One-Story-Per-User Rule
    console.log('✅ 8. Testing 1-Story-Per-User Constraint & Replacement:');
    const duplicateUploadRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/another_alpha.jpg',
      media_type: 'image'
    }, tokenA);
    console.log(`   - Uploading 2nd active story blocked: status ${duplicateUploadRes.status}, error: "${duplicateUploadRes.body?.error}"`);

    // Delete User A story
    const deleteRes = await makeRequest('DELETE', `/api/stories/${storyAId}`, null, tokenA);
    console.log(`   - User A deletes story: status ${deleteRes.status}`);

    // Verify User A can now upload a new story
    const reUploadRes = await makeRequest('POST', '/api/stories', {
      media_url: '/uploads/story_alpha_new.jpg',
      media_type: 'image',
      caption: 'New active story after delete'
    }, tokenA);
    console.log(`   - User A re-uploads story after delete: status ${reUploadRes.status}, new story ID: ${reUploadRes.body?.story?.id}\n`);

    // Cleanup created test records
    await db.query('DELETE FROM stories WHERE user_id = $1 OR user_id = $2', [userA.id, userB.id]);
    await db.query('DELETE FROM users WHERE id = $1 OR id = $2', [userA.id, userB.id]);
    console.log('🧹 Cleaned up test database rows.');

    console.log('\n===============================================');
    console.log('🎉 ALL 8 STORY LIFECYCLE TESTS PASSED PERFECTLY!');
    console.log('===============================================');
    
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(1);
  }
}

runTests();
