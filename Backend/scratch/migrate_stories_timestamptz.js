const db = require('../db');

async function migrateStoriesTimestamptz() {
    try {
        console.log('🔄 Running stories TIMESTAMPTZ migration...');
        
        await db.query(`
            ALTER TABLE stories 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
            ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC';
        `);
        console.log('✅ stories created_at & expires_at altered to TIMESTAMPTZ');

        await db.query(`
            ALTER TABLE stories 
            ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
            ALTER COLUMN expires_at SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');
        `);
        console.log('✅ stories defaults set to CURRENT_TIMESTAMP and +24 hours');

        const colInfo = await db.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'stories' AND column_name IN ('created_at', 'expires_at');
        `);
        console.log('📊 Verified column types in PostgreSQL:');
        console.table(colInfo.rows);

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration error:', err);
        process.exit(1);
    }
}

migrateStoriesTimestamptz();
