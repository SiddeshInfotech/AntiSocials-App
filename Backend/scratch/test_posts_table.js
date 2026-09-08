const db = require('../db');

async function testPostsTable() {
  try {
    console.log('--- Testing Posts Table Creation ---');
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          main_category VARCHAR(255) NOT NULL,
          subcategory VARCHAR(255) NOT NULL,
          caption TEXT,
          media_url TEXT,
          media_type VARCHAR(50) DEFAULT 'image',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, post_id)
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          comment_text TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_shares (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Posts, post_likes, post_comments, post_shares tables created/verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating posts tables:', err);
    process.exit(1);
  }
}

testPostsTable();
