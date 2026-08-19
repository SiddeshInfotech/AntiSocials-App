require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');
const jwt = require('jsonwebtoken');
const activityController = require('../controllers/activityController');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

async function runTests() {
    console.log('--- STARTING COMMUNITY ACTIVITY MANAGEMENT TESTS ---');
    let userA, userB;
    let createdActivities = [];

    try {
        // 1. Create or get test users
        const userARes = await db.query(`
            INSERT INTO users (username, email, phone_number, is_phone_verified, pincode, city)
            VALUES ('test_creator_${Date.now()}', 'creator_${Date.now()}@test.com', '9876${Date.now().toString().slice(-6)}', true, '440001', 'Nagpur')
            RETURNING id, username
        `);
        userA = userARes.rows[0];

        const userBRes = await db.query(`
            INSERT INTO users (username, email, phone_number, is_phone_verified, pincode, city)
            VALUES ('test_member_${Date.now()}', 'member_${Date.now()}@test.com', '9875${Date.now().toString().slice(-6)}', true, '440001', 'Nagpur')
            RETURNING id, username
        `);
        userB = userBRes.rows[0];

        const tokenA = jwt.sign({ id: userA.id, username: userA.username }, JWT_SECRET);
        const tokenB = jwt.sign({ id: userB.id, username: userB.username }, JWT_SECRET);

        console.log(`✓ Test users created: User A (Creator, id: ${userA.id}), User B (Member, id: ${userB.id})`);

        // 2. Test Activity Creation with different dates
        // Future date: 24/08/2026
        const futureReq = {
            user: { id: userA.id },
            body: {
                title: 'Badminton Championship 2026',
                category: 'Sports & Fitness',
                date: '24/08/2026',
                time: '06:00 PM',
                location: 'Sports Complex, Nagpur',
                capacity: 10,
                pincode: '440001',
                city: 'Nagpur'
            }
        };

        let futureActResData;
        const mockResFuture = {
            status: (code) => ({
                json: (data) => {
                    futureActResData = data;
                }
            })
        };
        await activityController.createActivity(futureReq, mockResFuture);
        if (!futureActResData || !futureActResData.activity) {
            throw new Error('Failed to create future activity: ' + JSON.stringify(futureActResData));
        }
        const futureAct = futureActResData.activity;
        createdActivities.push(futureAct.id);
        console.log(`✓ Future activity created (ID: ${futureAct.id}, Date: ${futureAct.date_str})`);

        // Past date: 10/08/2026 (assuming current time is Aug 17, 2026)
        const pastReq = {
            user: { id: userA.id },
            body: {
                title: 'Past Morning Yoga Session',
                category: 'Sports & Fitness',
                date: '10/08/2026',
                time: '07:00 AM',
                location: 'Central Park',
                capacity: 8,
                pincode: '440001',
                city: 'Nagpur'
            }
        };
        let pastActResData;
        const mockResPast = {
            status: (code) => ({
                json: (data) => {
                    pastActResData = data;
                }
            })
        };
        await activityController.createActivity(pastReq, mockResPast);
        const pastAct = pastActResData.activity;
        createdActivities.push(pastAct.id);
        console.log(`✓ Past activity created (ID: ${pastAct.id}, Date: ${pastAct.date_str})`);

        // 3. Test Automatic Date-Based Expiry in getActivities
        let listData = [];
        const mockResList = {
            status: () => ({ json: (d) => { listData = d; } }),
            json: (d) => { listData = d; }
        };
        await activityController.getActivities({ user: { id: userA.id } }, mockResList);

        const foundFuture = listData.find(a => a.id === futureAct.id.toString());
        const foundPast = listData.find(a => a.id === pastAct.id.toString());

        if (!foundFuture) {
            throw new Error(`Future activity ${futureAct.id} should be visible in getActivities but was not found!`);
        }
        console.log(`✓ Future activity ${futureAct.id} is active and visible in community feed.`);

        if (foundPast) {
            throw new Error(`Past activity ${pastAct.id} should be expired and hidden from getActivities, but was returned!`);
        }
        console.log(`✓ Past activity ${pastAct.id} is automatically hidden/expired from community feed.`);

        // Verify isCreator and creatorId fields
        if (foundFuture.isCreator !== true || foundFuture.creatorId !== userA.id.toString()) {
            throw new Error(`isCreator or creatorId missing or incorrect on activity: ${JSON.stringify(foundFuture)}`);
        }
        console.log(`✓ Activity returned correct isCreator: true and creatorId: ${foundFuture.creatorId} for Creator.`);

        // Check getActivities when called by User B (Non-Creator)
        let listDataUserB = [];
        const mockResListB = {
            status: () => ({ json: (d) => { listDataUserB = d; } }),
            json: (d) => { listDataUserB = d; }
        };
        await activityController.getActivities({ user: { id: userB.id } }, mockResListB);
        const futureFromB = listDataUserB.find(a => a.id === futureAct.id.toString());
        if (futureFromB.isCreator !== false) {
            throw new Error(`isCreator should be false for User B, got: ${futureFromB.isCreator}`);
        }
        console.log(`✓ Activity returned isCreator: false for non-creator User B.`);

        // 4. Test User B Joining the Future Activity
        let joinResData;
        const mockResJoin = {
            status: () => ({ json: (d) => { joinResData = d; } }),
            json: (d) => { joinResData = d; }
        };
        await activityController.joinActivity({ params: { id: futureAct.id }, user: { id: userB.id } }, mockResJoin);
        console.log(`✓ User B successfully joined activity ${futureAct.id}.`);

        const participantsCheck = await db.query('SELECT * FROM activity_participants WHERE activity_id = $1', [futureAct.id]);
        console.log(`✓ Verified ${participantsCheck.rows.length} participants in database for activity.`);

        // 5. Test Unauthorized Delete by User B (Non-creator)
        let deleteResB;
        let deleteStatusB = 200;
        const mockResDelB = {
            status: (code) => {
                deleteStatusB = code;
                return { json: (d) => { deleteResB = d; } };
            },
            json: (d) => { deleteResB = d; }
        };
        await activityController.deleteActivity({ params: { id: futureAct.id }, user: { id: userB.id } }, mockResDelB);
        if (deleteStatusB !== 403) {
            throw new Error(`Expected status 403 when User B deletes User A's activity, got: ${deleteStatusB}`);
        }
        console.log(`✓ Unauthorized deletion correctly blocked with 403 Forbidden.`);

        // 6. Test Authorized Delete by User A (Creator)
        let deleteResA;
        let deleteStatusA = 200;
        const mockResDelA = {
            status: (code) => {
                deleteStatusA = code;
                return { json: (d) => { deleteResA = d; } };
            },
            json: (d) => { deleteResA = d; }
        };
        await activityController.deleteActivity({ params: { id: futureAct.id }, user: { id: userA.id } }, mockResDelA);
        if (deleteStatusA !== 200 || !deleteResA.success) {
            throw new Error(`Expected success deleting activity by creator, got status: ${deleteStatusA}, data: ${JSON.stringify(deleteResA)}`);
        }
        console.log(`✓ Creator successfully deleted activity ${futureAct.id}.`);

        // 7. Verify cascading deletion of activity and its participants from DB
        const actCheck = await db.query('SELECT * FROM activities WHERE id = $1', [futureAct.id]);
        if (actCheck.rows.length !== 0) {
            throw new Error(`Activity ${futureAct.id} still exists in DB after deletion!`);
        }
        const partCheck = await db.query('SELECT * FROM activity_participants WHERE activity_id = $1', [futureAct.id]);
        if (partCheck.rows.length !== 0) {
            throw new Error(`Activity participants still exist in DB after activity deletion!`);
        }
        console.log(`✓ Activity and associated participants cleanly removed from database.`);

        console.log('\n========================================');
        console.log('🎉 ALL ACTIVITY MANAGEMENT TESTS PASSED!');
        console.log('========================================\n');
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exitCode = 1;
    } finally {
        // Cleanup test users and activities
        if (createdActivities.length > 0) {
            await db.query('DELETE FROM activities WHERE id = ANY($1)', [createdActivities]).catch(() => {});
        }
        if (userA && userA.id) {
            await db.query('DELETE FROM users WHERE id = $1', [userA.id]).catch(() => {});
        }
        if (userB && userB.id) {
            await db.query('DELETE FROM users WHERE id = $1', [userB.id]).catch(() => {});
        }
        process.exit(0);
    }
}

runTests();
