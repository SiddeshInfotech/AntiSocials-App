const db = require('../db');
const activityController = require('../controllers/activityController');

const runAddressTests = async () => {
    console.log('=====================================================');
    console.log('🧪 TESTING COMMUNITY ACTIVITY ADDRESS FLOW 🧪');
    console.log('=====================================================');
    try {
        // Fetch test user
        const usersRes = await db.query('SELECT id, username FROM users LIMIT 1');
        if (usersRes.rows.length === 0) {
            console.error('No user found for testing');
            process.exit(1);
        }
        const user = usersRes.rows[0];
        console.log(`Test User: ${user.username} (ID: ${user.id})`);

        const makeMockRes = () => {
            const res = {
                statusCode: 200,
                body: null,
                status(c) { this.statusCode = c; return this; },
                json(data) { this.body = data; return this; }
            };
            return res;
        };

        // TEST 1: Creation fails if address is missing
        console.log('\n--- TEST 1: Missing Address Validation ---');
        const invalidReq = {
            user: { id: user.id },
            body: {
                title: 'No Address Activity',
                category: 'Sports & Fitness',
                date: '28/08/2026',
                time: '6:00 PM',
                location: 'City Sports Complex',
                capacity: 10,
                pincode: '411057'
            }
        };
        const invalidRes = makeMockRes();
        await activityController.createActivity(invalidReq, invalidRes);
        console.log(`Missing address status: ${invalidRes.statusCode}, error: "${invalidRes.body?.error}"`);
        if (invalidRes.statusCode !== 400) {
            throw new Error('Expected 400 when address is missing');
        }
        console.log('✅ TEST 1 PASSED: Activity creation without address is correctly blocked');

        // TEST 2: Creation succeeds with full Address
        console.log('\n--- TEST 2: Create Activity with Full Venue Address ---');
        const testAddress = 'Court 4, 2nd Floor, Apex Sports Complex, Baner Road';
        const validReq = {
            user: { id: user.id },
            body: {
                title: 'Table Tennis Open Tournament',
                category: 'Gaming',
                date: '30/08/2026',
                time: '5:00 PM',
                location: 'Apex Sports Complex',
                address: testAddress,
                capacity: 12,
                description: 'Open singles and doubles tournament.',
                pincode: '411057',
                city: 'Pune',
                emoji: '🏓'
            }
        };
        const validRes = makeMockRes();
        await activityController.createActivity(validReq, validRes);
        console.log(`Create Activity Result: status=${validRes.statusCode}, id=${validRes.body?.activity?.id}`);
        console.log(`Created Activity Address: "${validRes.body?.activity?.address}"`);

        if (validRes.statusCode !== 201 || validRes.body?.activity?.address !== testAddress) {
            throw new Error('Failed to create activity with address');
        }
        const newActivityId = validRes.body.activity.id;
        console.log('✅ TEST 2 PASSED: Activity created with address');

        // TEST 3: Fetch single activity details by ID
        console.log('\n--- TEST 3: Fetch Activity by ID (Verify Address in Details API) ---');
        const detailReq = {
            user: { id: user.id },
            params: { id: newActivityId }
        };
        const detailRes = makeMockRes();
        await activityController.getActivityById(detailReq, detailRes);
        console.log(`Fetched Activity Details Address: "${detailRes.body?.address}"`);
        if (detailRes.body?.address !== testAddress) {
            throw new Error(`Address mismatch in getActivityById: expected "${testAddress}", got "${detailRes.body?.address}"`);
        }
        console.log('✅ TEST 3 PASSED: getActivityById returns correct address');

        // TEST 4: Direct DB query to verify persistence in PostgreSQL
        console.log('\n--- TEST 4: Direct PostgreSQL Persistence Verification ---');
        const dbCheck = await db.query('SELECT id, title, location, address, city, pincode FROM activities WHERE id = $1', [newActivityId]);
        console.log('DB Row:', dbCheck.rows[0]);
        if (dbCheck.rows.length === 0 || dbCheck.rows[0].address !== testAddress) {
            throw new Error('Direct DB check for address failed');
        }
        console.log('✅ TEST 4 PASSED: Address persisted directly in PostgreSQL');

        // TEST 5: Fetch in getActivities (Discover) and getJoinedActivities
        console.log('\n--- TEST 5: Verify Address in Discover & Joined Endpoints ---');
        const discoverReq = { user: { id: user.id } };
        const discoverRes = makeMockRes();
        await activityController.getActivities(discoverReq, discoverRes);
        const foundInDiscover = (discoverRes.body || []).find(a => a.id === newActivityId.toString());
        console.log(`Found in Discover: id=${foundInDiscover?.id}, address="${foundInDiscover?.address}"`);
        if (!foundInDiscover || foundInDiscover.address !== testAddress) {
            throw new Error('Address missing or mismatch in getActivities');
        }

        const joinedReq = { user: { id: user.id } };
        const joinedRes = makeMockRes();
        await activityController.getJoinedActivities(joinedReq, joinedRes);
        const foundInJoined = (joinedRes.body || []).find(a => a.id === newActivityId.toString());
        console.log(`Found in Joined: id=${foundInJoined?.id}, address="${foundInJoined?.address}"`);
        if (!foundInJoined || foundInJoined.address !== testAddress) {
            throw new Error('Address missing or mismatch in getJoinedActivities');
        }
        console.log('✅ TEST 5 PASSED: Address returned across all activity endpoints');

        // Clean up
        await db.query('DELETE FROM activities WHERE id = $1', [newActivityId]);
        console.log('Cleaned up test activity.');

        console.log('\n=====================================================');
        console.log('🎉 ALL ADDRESS TESTS PASSED SUCCESSFULLY! 🎉');
        console.log('=====================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ ADDRESS TEST ERROR:', err);
        process.exit(1);
    }
};

runAddressTests();
