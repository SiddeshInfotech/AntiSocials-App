const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Start backend or test directly against running server
async function runTest() {
    console.log("=== Testing Image Upload and Signup Flow ===");

    // 1. Create a dummy image buffer
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const dummyImageContent = 'FAKE_JPEG_IMAGE_DATA_' + Date.now();
    const filename = 'profile_test_' + Date.now() + '.jpg';

    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    body += dummyImageContent + '\r\n';
    body += `--${boundary}--\r\n`;

    const bodyBuffer = Buffer.from(body, 'utf-8');

    // 2. Test POST /upload
    console.log("1. Testing POST /upload with multipart/form-data...");
    const uploadRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/upload',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length,
            'Accept': 'application/json'
        }
    }, bodyBuffer);

    console.log(`Upload Response Status: ${uploadRes.status}`);
    console.log('Upload Response Body:', uploadRes.body);

    if (uploadRes.status !== 200 || !uploadRes.body.imageUrl) {
        throw new Error(`Failed to upload image: status ${uploadRes.status}, body: ${JSON.stringify(uploadRes.body)}`);
    }

    const uploadedImageUrl = uploadRes.body.imageUrl;
    console.log(`✅ Upload Succeeded! Image URL: ${uploadedImageUrl}`);

    // Verify file exists in uploads directory
    const expectedFilePath = path.join(__dirname, '..', uploadedImageUrl);
    if (fs.existsSync(expectedFilePath)) {
        console.log(`✅ File confirmed on disk at: ${expectedFilePath}`);
    } else {
        console.warn(`⚠️ File not found at ${expectedFilePath}`);
    }

    // 3. Test Send OTP for signup
    const testPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
    const testUsername = `user_${Date.now()}`;
    console.log(`\n2. Testing Send OTP for ${testPhone}...`);

    const otpSendRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/auth/send-otp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }, JSON.stringify({
        phoneNumber: testPhone,
        purpose: 'signup'
    }));

    console.log(`Send OTP Status: ${otpSendRes.status}`, otpSendRes.body);

    // Fetch OTP from database
    const otpRecord = await db.query(
        "SELECT otp FROM otp_verifications WHERE phone_number = $1 AND purpose = 'signup' ORDER BY created_at DESC LIMIT 1",
        [testPhone]
    );

    if (otpRecord.rows.length === 0) {
        throw new Error(`OTP record not found in database for ${testPhone}`);
    }

    const otpCode = otpRecord.rows[0].otp;
    console.log(`✅ Retrieved OTP from DB: ${otpCode}`);

    // 4. Verify OTP
    console.log("\n3. Verifying OTP...");
    const verifyRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/auth/verify-otp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }, JSON.stringify({
        phoneNumber: testPhone,
        otp: otpCode,
        purpose: 'signup'
    }));

    console.log(`Verify OTP Status: ${verifyRes.status}`, verifyRes.body);
    if (verifyRes.status !== 200) {
        throw new Error(`OTP verification failed: ${JSON.stringify(verifyRes.body)}`);
    }
    console.log(`✅ OTP Verified Successfully!`);

    // 5. Complete Registration with uploadedImageUrl
    console.log("\n4. Registering User with uploaded profile image...");
    const registerRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }, JSON.stringify({
        phoneNumber: testPhone,
        username: testUsername,
        email: `${testUsername}@example.com`,
        profession: 'Software Engineer',
        about: 'Testing image upload flow',
        imageUrl: uploadedImageUrl,
        pincode: '440001',
        city: 'Nagpur',
        state: 'Maharashtra'
    }));

    console.log(`Register Status: ${registerRes.status}`, registerRes.body);
    if (registerRes.status !== 201 && registerRes.status !== 200) {
        throw new Error(`Registration failed: ${JSON.stringify(registerRes.body)}`);
    }

    const token = registerRes.body.token;
    const user = registerRes.body.user;
    console.log(`✅ Registration Succeeded! User ID: ${user?.id}, Token length: ${token?.length}`);

    // 6. Verify User in Database
    const dbUser = await db.query("SELECT id, username, phone_number, image_url FROM users WHERE phone_number = $1", [testPhone]);
    console.log(`\n5. Verifying DB record:`, dbUser.rows[0]);

    if (dbUser.rows[0]?.image_url !== uploadedImageUrl) {
        throw new Error(`DB image_url mismatch! Expected: ${uploadedImageUrl}, Got: ${dbUser.rows[0]?.image_url}`);
    }

    console.log(`✅ User profile image accurately saved in database: ${dbUser.rows[0].image_url}`);

    // Clean up test file and test user
    console.log("\n6. Cleaning up test data...");
    await db.query("DELETE FROM users WHERE phone_number = $1", [testPhone]);
    if (fs.existsSync(expectedFilePath)) {
        fs.unlinkSync(expectedFilePath);
        console.log(`Cleaned up test file.`);
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
}

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => { resData += chunk; });
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(resData);
                } catch (_) {
                    parsed = resData;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

runTest().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
