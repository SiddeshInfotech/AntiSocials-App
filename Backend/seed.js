const db = require('./db.js');

async function run() {
    try {
        const res = await db.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(res.rows[0].count, 10) === 0) {
            await db.query(`
                INSERT INTO tasks (title, description, category, points_reward, duration) VALUES 
                ('Reflect', 'Write', 'Mental', 100, 5),
                ('Smile', 'Smile', 'Mental', 150, 1),
                ('Breathe', 'Breathe', 'Health', 50, 3),
                ('Stretch', 'Stretch', 'Physical', 100, 5),
                ('Silent', 'Silent', 'Mental', 200, 10),
                ('Outside', 'Outside', 'Physical', 100, 10)
            `);
            console.log('Tasks seeded successfully!');
        } else {
            console.log('Tasks already seeded.');
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
