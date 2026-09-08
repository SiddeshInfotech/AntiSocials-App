const db = require('./db');
async function run() {
    try { await db.query('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 7)'); console.log('users lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE users ADD COLUMN longitude DECIMAL(10, 7)'); console.log('users lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN latitude DECIMAL(10, 7)'); console.log('activities lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN longitude DECIMAL(10, 7)'); console.log('activities lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN location_name VARCHAR(255)'); console.log('location_name added'); } catch (e) { }
    try { await db.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'"); console.log('activities status added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN IF NOT EXISTS event_date DATE'); console.log('activities event_date added'); } catch (e) { }
    try { await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE'); console.log('users quiz_completed added'); } catch (e) { }
    try { 
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                badge_id VARCHAR(100) NOT NULL,
                unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
            )
        `);
        console.log('user_badges table created');
    } catch (e) { console.error('user_badges table error:', e.message); }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS life_experience_scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                baseline_age_life_stage NUMERIC(5,2) DEFAULT 0,
                baseline_travel_exploration NUMERIC(5,2) DEFAULT 0,
                baseline_adventure_new_experiences NUMERIC(5,2) DEFAULT 0,
                baseline_education_learning NUMERIC(5,2) DEFAULT 0,
                baseline_relationships_family NUMERIC(5,2) DEFAULT 0,
                baseline_community_contribution NUMERIC(5,2) DEFAULT 0,
                baseline_health_fitness_physical NUMERIC(5,2) DEFAULT 0,
                baseline_creativity_hobbies_passion NUMERIC(5,2) DEFAULT 0,
                baseline_culture_social_experiences NUMERIC(5,2) DEFAULT 0,
                baseline_personal_growth_courage NUMERIC(5,2) DEFAULT 0,
                baseline_overall_score NUMERIC(5,2) DEFAULT 0,
                current_age_life_stage NUMERIC(5,2) DEFAULT 0,
                current_travel_exploration NUMERIC(5,2) DEFAULT 0,
                current_adventure_new_experiences NUMERIC(5,2) DEFAULT 0,
                current_education_learning NUMERIC(5,2) DEFAULT 0,
                current_relationships_family NUMERIC(5,2) DEFAULT 0,
                current_community_contribution NUMERIC(5,2) DEFAULT 0,
                current_health_fitness_physical NUMERIC(5,2) DEFAULT 0,
                current_creativity_hobbies_passion NUMERIC(5,2) DEFAULT 0,
                current_culture_social_experiences NUMERIC(5,2) DEFAULT 0,
                current_personal_growth_courage NUMERIC(5,2) DEFAULT 0,
                current_overall_score NUMERIC(5,2) DEFAULT 0,
                connector_level INTEGER DEFAULT 1,
                quiz_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_life_score UNIQUE (user_id)
            );
            CREATE INDEX IF NOT EXISTS idx_life_scores_user_id ON life_experience_scores(user_id);
            ALTER TABLE life_experience_scores ADD COLUMN IF NOT EXISTS connector_level INTEGER DEFAULT 1;

            CREATE TABLE IF NOT EXISTS life_experience_updates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                experience_id VARCHAR(255) NOT NULL,
                category_slug VARCHAR(100) NOT NULL,
                score_delta NUMERIC(5,2) NOT NULL,
                source_type VARCHAR(50) NOT NULL,
                source_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_experience UNIQUE (user_id, experience_id)
            );
            CREATE INDEX IF NOT EXISTS idx_life_updates_user ON life_experience_updates(user_id);
            CREATE INDEX IF NOT EXISTS idx_life_updates_category ON life_experience_updates(category_slug);

            -- Auto-sync trigger between life_experience_scores and users table
            CREATE OR REPLACE FUNCTION sync_user_quiz_completed()
            RETURNS TRIGGER AS $func$
            BEGIN
                IF NEW.quiz_completed = TRUE THEN
                    UPDATE users SET quiz_completed = TRUE WHERE id = NEW.user_id;
                END IF;
                RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_sync_user_quiz_completed ON life_experience_scores;
            CREATE TRIGGER trg_sync_user_quiz_completed
            AFTER INSERT OR UPDATE OF quiz_completed ON life_experience_scores
            FOR EACH ROW
            EXECUTE FUNCTION sync_user_quiz_completed();
        `);
        console.log('life_experience_scores and life_experience_updates tables created with sync trigger');
    } catch (e) { console.error('life experience tables error:', e.message); }

    console.log("Migrations applied.");
    process.exit();
}
run();
