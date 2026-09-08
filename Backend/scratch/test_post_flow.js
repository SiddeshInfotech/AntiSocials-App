const db = require('../db');

async function testPostFlow() {
  try {
    console.log('--- Testing Post DB Insertion & Retrieval ---');
    // Get a test user ID
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No user found to test with.');
      process.exit(0);
    }
    const testUserId = userRes.rows[0].id;

    // Insert test post
    const insertRes = await db.query(
      `INSERT INTO posts (user_id, main_category, subcategory, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [testUserId, 'Sports', 'Cricket', 'Great match today! Testing post creation.']
    );

    const createdPost = insertRes.rows[0];
    console.log('✅ Test Post inserted:', createdPost.id, createdPost.main_category, '->', createdPost.subcategory);

    // Retrieve posts
    const selectRes = await db.query('SELECT * FROM posts WHERE id = $1', [createdPost.id]);
    console.log('✅ Retained post record:', selectRes.rows[0].caption);

    // Clean up test post
    await db.query('DELETE FROM posts WHERE id = $1', [createdPost.id]);
    console.log('✅ Cleaned up test post.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error in testPostFlow:', err);
    process.exit(1);
  }
}

testPostFlow();
