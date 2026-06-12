const db = require('./db');
async function run() {
    try {
        const res = await db.query("SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle';");
        console.log("Active Queries:", res.rows);
        const locks = await db.query("SELECT relation::regclass, mode, locktype, granted, pid FROM pg_locks;");
        console.log("Locks:", locks.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
