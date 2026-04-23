const db = require('./db');

async function alterTable() {
    try {
        await db.query(`ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE;`);
        console.log("Added phone_number column");
    } catch (e) {
        console.log("phone_number column might already exist.");
    }
    try {
        await db.query(`ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN DEFAULT false;`);
        console.log("Added is_phone_verified column");
    } catch (e) {
        console.log("is_phone_verified column might already exist.");
    }
    try {
        await db.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
        console.log("Dropped NOT NULL on password");
    } catch (e) {
        console.log("Password column might already be dropped NOT NULL.");
    }
    try {
        await db.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`);
        console.log("Dropped NOT NULL on email");
    } catch (e) {
        console.log("email column might already be dropped NOT NULL.");
    }
    
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                purpose VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created otp_verifications table");
    } catch (e) {
        console.log("Error creating otp_verifications table", e);
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
