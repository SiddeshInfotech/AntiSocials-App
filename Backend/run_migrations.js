const db = require('./db');
async function run() {
    try { await db.query('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 7)'); console.log('users lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE users ADD COLUMN longitude DECIMAL(10, 7)'); console.log('users lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN latitude DECIMAL(10, 7)'); console.log('activities lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN longitude DECIMAL(10, 7)'); console.log('activities lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN location_name VARCHAR(255)'); console.log('location_name added'); } catch (e) { }
    try { await db.query("ALTER TABLE activities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'"); console.log('activities status added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN IF NOT EXISTS event_date DATE'); console.log('activities event_date added'); } catch (e) { }
    console.log("Migrations applied.");
    process.exit();
}
run();
