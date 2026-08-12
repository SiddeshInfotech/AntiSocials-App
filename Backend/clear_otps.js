const db = require('./db');

async function clearOtps() {
    try {
        const result = await db.query('DELETE FROM otp_verifications');
        console.log(`Successfully cleared ${result.rowCount} OTP verification records from the database.`);
    } catch (err) {
        console.error('Error clearing OTP records:', err);
    } finally {
        process.exit(0);
    }
}

clearOtps();
