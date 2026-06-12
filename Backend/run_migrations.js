const db = require('./db');
async function run() {
    try { await db.query('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 7)'); console.log('users lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE users ADD COLUMN longitude DECIMAL(10, 7)'); console.log('users lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN latitude DECIMAL(10, 7)'); console.log('activities lat added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN longitude DECIMAL(10, 7)'); console.log('activities lon added'); } catch (e) { }
    try { await db.query('ALTER TABLE activities ADD COLUMN location_name VARCHAR(255)'); console.log('location_name added'); } catch (e) { }
    console.log("Migrations applied.");
    process.exit();
}
run();
