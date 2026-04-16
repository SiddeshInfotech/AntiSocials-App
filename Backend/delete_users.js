const db = require('./db');

async function deleteUsers() {
    try {
        const result = await db.query('DELETE FROM users');
        console.log(`Successfully deleted ${result.rowCount} users from the database.`);
    } catch (err) {
        console.error('Error deleting users:', err);
    } finally {
        process.exit(0);
    }
}

deleteUsers();
