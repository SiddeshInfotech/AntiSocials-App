const db = require('./db');

async function alterTable() {
    try {
        await db.query(`ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;`);
    } catch (e) {
        console.log("Email column might already exist.");
    }
    try {
        await db.query(`ALTER TABLE users ADD COLUMN password TEXT;`);
    } catch (e) {
        console.log("Password column might already exist.");
    }
    try {
        await db.query(`ALTER TABLE users ALTER COLUMN profile_name DROP NOT NULL;`);
    } catch (e) {}
    try {
        await db.query(`ALTER TABLE users ALTER COLUMN profession DROP NOT NULL;`);
    } catch (e) {}
    console.log("Table alteration checks completed.");
    process.exit(0);
}
alterTable();
