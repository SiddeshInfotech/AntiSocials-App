const db = require('./db');

async function migrate() {
    try {
        console.log('Running stories like/comment/share migration...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS story_likes (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, story_id)
            );
        `);
        console.log('✅ story_likes table created or verified.');

        await db.query(`
            CREATE TABLE IF NOT EXISTS story_comments (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ story_comments table created or verified.');

        await db.query(`
            CREATE TABLE IF NOT EXISTS story_shares (
                id SERIAL PRIMARY KEY,
                story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ story_shares table created or verified.');

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
            CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);
            CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
            CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_story_shares_story_id ON story_shares(story_id);
        `);
        console.log('✅ Indexes created or verified.');

        console.log('🚀 Migration finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
