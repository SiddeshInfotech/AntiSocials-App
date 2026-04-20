const db = require('./db');

async function test() {
    try {
        const userExists = await db.query(
            'SELECT * FROM users WHERE email = $1 OR username = $1', 
            ['test']
        );
        console.log("Success", userExists.rows);
    } catch (e) {
        console.error("Error", e);
    }
    process.exit(0);
}
test();
