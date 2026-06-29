const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./db');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');
const homeRoutes = require('./routes/homeRoutes');
const storyRoutes = require('./routes/storyRoutes');
const profileRoutes = require('./routes/profileRoutes');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Trust reverse proxy (e.g., Render, Railway) for correct req.protocol (https)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Higher limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Default to .jpg if no extension
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'profile_' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
    }
    // Return relative path only — frontend constructs the full URL using API_BASE_URL
    const relativePath = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: relativePath });
});

// Initialize Database Table
// Catch global errors to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const initDB = async () => {
    try {
        console.log("Checking database connection...");
        await db.query('SELECT NOW()'); // Simple ping to verify connection

        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE,
                email VARCHAR(100) UNIQUE,
                phone_number VARCHAR(20) UNIQUE,
                is_phone_verified BOOLEAN DEFAULT false,
                profession VARCHAR(100),
                about TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_interests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                interest VARCHAR(100) NOT NULL,
                UNIQUE(user_id, interest)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                purpose VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT false,
                attempts INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS stories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                media_url TEXT NOT NULL,
                media_type VARCHAR(50) DEFAULT 'image',
                text_content TEXT,
                text_elements JSONB DEFAULT '[]',
                music_data JSONB DEFAULT '{}',
                music_name VARCHAR(255),
                caption TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
                is_active BOOLEAN DEFAULT TRUE
            );
        `);

        // Ensure new columns exist in stories table
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='text_elements') THEN
                    ALTER TABLE stories ADD COLUMN text_elements JSONB DEFAULT '[]';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='music_data') THEN
                    ALTER TABLE stories ADD COLUMN music_data JSONB DEFAULT '{}';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='text_position') THEN
                    ALTER TABLE stories ADD COLUMN text_position JSONB DEFAULT '{}';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='view_count') THEN
                    ALTER TABLE stories ADD COLUMN view_count INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);

        await db.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='story_views' AND column_name='user_id') THEN
                    ALTER TABLE story_views RENAME COLUMN user_id TO viewer_user_id;
                END IF;
            END $$;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS story_views (
                id SERIAL PRIMARY KEY,
                story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
                viewer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(story_id, viewer_user_id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                points_reward INTEGER DEFAULT 0,
                duration INTEGER, 
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS user_tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'not_started', 
                progress INTEGER DEFAULT 0,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                UNIQUE(user_id, task_id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS points_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
                points INTEGER NOT NULL,
                source VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date_str VARCHAR(100),
                time_str VARCHAR(100),
                location VARCHAR(255) NOT NULL,
                capacity INTEGER NOT NULL,
                image_url TEXT,
                emoji VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_participants (
                id SERIAL PRIMARY KEY,
                activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(activity_id, user_id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS user_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id)
            );
        `);

        // Migrations
        try { await db.query('ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN last_streak_date DATE'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0'); } catch (e) { }
        try { await db.query('ALTER TABLE otp_verifications ADD COLUMN attempts INTEGER DEFAULT 0'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN pincode VARCHAR(10)'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN city VARCHAR(100)'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN state VARCHAR(100)'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 7)'); } catch (e) { }
        try { await db.query('ALTER TABLE users ADD COLUMN longitude DECIMAL(10, 7)'); } catch (e) { }
        try { await db.query('ALTER TABLE activities ADD COLUMN pincode VARCHAR(10)'); } catch (e) { }
        try { await db.query('ALTER TABLE activities ADD COLUMN city VARCHAR(100)'); } catch (e) { }
        try { await db.query('ALTER TABLE activities ADD COLUMN latitude DECIMAL(10, 7)'); } catch (e) { }
        try { await db.query('ALTER TABLE activities ADD COLUMN longitude DECIMAL(10, 7)'); } catch (e) { }
        try { await db.query('ALTER TABLE activities ADD COLUMN location_name VARCHAR(255)'); } catch (e) { }
        try { await db.query('CREATE INDEX IF NOT EXISTS idx_activities_pincode ON activities(pincode)'); } catch (e) { }

        // Migrations for tasks table
        try { await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'Easy'"); } catch (e) { }
        try { await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS mascot VARCHAR(50) DEFAULT 'Cat'"); } catch (e) { }
        try { await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_message VARCHAR(255) DEFAULT 'Great job!'"); } catch (e) { }

        await db.query(`
            CREATE TABLE IF NOT EXISTS task_completions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                task_name VARCHAR(255) NOT NULL,
                points INTEGER DEFAULT 0,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS task_responses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
                response_text TEXT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Enforce uniqueness to prevent duplicate tasks per user
        try { await db.query('ALTER TABLE task_completions ADD CONSTRAINT unique_user_task UNIQUE (user_id, task_name);'); } catch (e) { }

        // Seed Tasks if empty so UI task bindings have IDs to hit API with
        const taskCountRes = await db.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(taskCountRes.rows[0].count, 10) === 0) {
            await db.query(`
                INSERT INTO tasks (title, description, category, points_reward, duration) VALUES 
                ('Reflect', 'Write down your thoughts', 'Mental', 100, 5),
                ('Smile', 'Smile for 10 seconds', 'Mental', 150, 1),
                ('Breathe', 'Take deep breaths', 'Health', 50, 3),
                ('Stretch', 'Stretch your body', 'Physical', 100, 5),
                ('Silent', 'Sit in absolute silence', 'Mental', 200, 10),
                ('Outside', 'Go outside and look around', 'Physical', 100, 10)
            `);
            console.log("Seeded default tasks.");
        }

        // Seeding the Focus on one task separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Focus on one task (10 min)', 
                   'For the next 10 minutes, focus on only one task.\n\nAvoid switching between apps, notifications, or conversations.\n\nStay fully present until the timer finishes.\n\nSmall moments of deep focus build stronger attention over time.', 
                   'Mental', 
                   20, 
                   10, 
                   'Medium', 
                   'Dog', 
                   'You held your attention.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Focus on one task (10 min)'
            );
        `);

        // Seeding the Turn off notifications separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Turn off notifications (30 min)', 
                   'Turn off your phone notifications for the next 30 minutes.\n\nTake a break from constant interruptions and enjoy a quieter environment.\n\nUse this time to relax, work, read, or simply be present without distractions.\n\nSmall moments of silence help improve focus and reduce stress.', 
                   'Mental', 
                   10, 
                   30, 
                   'Easy', 
                   'Dog', 
                   'You reduced noise.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Turn off notifications (30 min)'
            );
        `);

        // Seeding the Observe urge to check phone separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Observe urge to check phone', 
                   'For the next 5 minutes, simply notice whenever you feel the urge to check your phone.\n\nDo not judge yourself or immediately act on the impulse.\n\nTake a deep breath, acknowledge the feeling, and gently return your attention to the present moment.\n\nBuilding awareness is the first step toward healthier digital habits.', 
                   'Mental', 
                   10, 
                   5, 
                   'Easy', 
                   '👀', 
                   'You noticed the impulse.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Observe urge to check phone'
            );
        `);

        // Seeding the Write one distraction separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Write one distraction', 
                   'Take a moment to write down the biggest distraction that pulled your attention away today.\n\nSimply acknowledging the distraction helps you become more mindful and makes it easier to manage similar situations in the future.\n\nThere is no right or wrong answer—just be honest with yourself.', 
                   'Mental', 
                   10, 
                   2, 
                   'Easy', 
                   '📝', 
                   'Awareness increased.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Write one distraction'
            );
        `);

        // Seeding the Eat one bite consciously separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Eat one bite consciously', 
                   'Before rushing through your meal, take one bite slowly and mindfully.\n\nNotice the taste, texture, smell, and how your food feels as you chew.\n\nAvoid looking at your phone while eating this bite.\n\nSmall moments of mindful eating help improve awareness and create healthier habits.', 
                   'Mental', 
                   10, 
                   2, 
                   'Easy', 
                   '🍽️', 
                   'You slowed down eating.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Eat one bite consciously'
            );
        `);

        // Seeding the Notice heartbeat separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Notice heartbeat', 
                   'Pause for a moment and gently notice your heartbeat.\n\nPlace your hand on your chest or wrist and simply observe your heartbeat without trying to change it.\n\nTake slow, natural breaths and bring your attention inward.\n\nThis simple practice builds self-awareness and helps calm the mind.', 
                   'Mental', 
                   10, 
                   2, 
                   'Easy', 
                   '❤️', 
                   'You tuned inward.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Notice heartbeat'
            );
        `);

        // Seeding the Posture check separately (ensures it is seeded even if database is already initialized)
        await db.query(`
            INSERT INTO tasks (title, description, category, points_reward, duration, difficulty, mascot, completion_message)
            SELECT 'Posture check', 
                   'Take a moment to check your posture.\n\nRelax your shoulders, straighten your back, keep your neck aligned, and place both feet comfortably on the ground if you''re sitting.\n\nTake a few slow breaths and notice how a better posture makes you feel.\n\nSmall posture corrections throughout the day can improve focus, reduce fatigue, and support overall well-being.', 
                   'Mental', 
                   10, 
                   2, 
                   'Easy', 
                   '🧍', 
                   'You aligned yourself.'
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE title = 'Posture check'
            );
        `);



        console.log("PostgreSQL tables initialized.");
    } catch (err) {
        console.error("Error creating tables:", err);
    }
};



// Login Endpoint
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, phone_number, profession, about, image_url, pincode, city, state, latitude, longitude FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NEW PHONE AUTH APIs

const fetch = require('node-fetch');

const sendWhatsAppOTP = async (phoneNumber, otp, retries = 1) => {
    try {
        // Clean phone number (remove +, spaces, dashes, etc.)
        let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        // Remove leading zeros
        cleanPhone = cleanPhone.replace(/^0+/, '');
        // Ensure India country code if 10 digits
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }

        const requestId = "auth_" + Date.now();

        const payload = {
            "messaging_product": "whatsapp",
            "to": cleanPhone,
            "type": "template",
            "template": {
                "name": "otpverification",
                "language": {
                    "code": "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    },
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    }
                ]
            },
            "biz_opaque_callback_data": requestId
        };

        const response = await fetch('https://icpaas.in/v23.0/1034434699754088/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ICPAAS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const responseData = await response.text();

        if (!response.ok) {
            console.error(`WhatsApp API Error [${status}]:`, responseData);
            if (retries > 0) {
                console.log("Retrying WhatsApp API...");
                return await sendWhatsAppOTP(phoneNumber, otp, retries - 1);
            }
            return { success: false, error: responseData, status };
        }

        console.log(`WhatsApp API Success [${status}]:`, responseData);
        return { success: true };

    } catch (err) {
        console.error("WhatsApp API Network/Timeout Error:", err.message);
        if (retries > 0) {
            console.log("Retrying WhatsApp API...");
            return await sendWhatsAppOTP(phoneNumber, otp, retries - 1);
        }
        return { success: false, error: err.message, status: 500 };
    }
};

// Fallback Test Route
app.post('/test-whatsapp', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

    const result = await sendWhatsAppOTP(phoneNumber, "123456");
    if (!result.success) {
        return res.status(500).json({
            error: "Failed to send WhatsApp message",
            details: result.error,
            status: result.status
        });
    }

    res.status(200).json({ message: "WhatsApp message sent successfully" });
});

app.post('/auth/send-otp', async (req, res) => {
    const { phoneNumber, purpose } = req.body;
    if (!phoneNumber || !purpose) return res.status(400).json({ error: "Phone number and purpose are required" });

    try {
        // Cleanup old otps
        await db.query("DELETE FROM otp_verifications WHERE expires_at < NOW()");

        // Limit resend attempts (Max 3 OTPs per 15 minutes)
        const recentOtps = await db.query(
            "SELECT COUNT(*) FROM otp_verifications WHERE phone_number = $1 AND created_at > NOW() - INTERVAL '15 minutes'",
            [phoneNumber]
        );
        if (parseInt(recentOtps.rows[0].count) >= 3) {
            return res.status(429).json({ error: "Too many OTP requests. Please try again later." });
        }

        const userCheck = await db.query("SELECT * FROM users WHERE phone_number = $1", [phoneNumber]);

        if (purpose === 'signup') {
            if (userCheck.rows.length > 0) {
                return res.status(409).json({ error: "Phone number already registered" });
            }
        } else if (purpose === 'login') {
            if (userCheck.rows.length === 0) {
                return res.status(404).json({ error: "Phone number not registered" });
            }
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

        console.log(`🔔 OTP for ${phoneNumber} (${purpose}): ${otp}`);

        await db.query(
            "INSERT INTO otp_verifications (phone_number, otp, purpose, expires_at) VALUES ($1, $2, $3, $4)",
            [phoneNumber, otp, purpose, expiresAt]
        );

        const waResult = await sendWhatsAppOTP(phoneNumber, otp);

        if (!waResult.success) {
            // Delete the un-sendable OTP so user can try again without hitting limits as easily
            await db.query("DELETE FROM otp_verifications WHERE phone_number = $1 AND otp = $2", [phoneNumber, otp]);
            return res.status(500).json({ error: "Failed to send OTP message. Please try again." });
        }

        res.status(200).json({ message: "OTP sent successfully via WhatsApp" });

    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/auth/verify-otp', async (req, res) => {
    const { phoneNumber, otp, purpose } = req.body;
    if (!phoneNumber || !otp || !purpose) return res.status(400).json({ error: "Missing required fields" });

    try {
        const result = await db.query(
            "SELECT * FROM otp_verifications WHERE phone_number = $1 AND purpose = $2 AND expires_at > NOW() AND is_verified = false ORDER BY created_at DESC LIMIT 1",
            [phoneNumber, purpose]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const verificationRecord = result.rows[0];

        // Limit wrong attempts
        if (verificationRecord.attempts >= 5) {
            return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
        }

        if (verificationRecord.otp !== otp) {
            await db.query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1", [verificationRecord.id]);
            return res.status(400).json({ error: "Invalid OTP" });
        }

        await db.query("UPDATE otp_verifications SET is_verified = true WHERE id = $1", [verificationRecord.id]);

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error("Verify OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/auth/register', async (req, res) => {
    const { phoneNumber, username, email, profession, about, imageUrl, pincode, city, state, latitude, longitude } = req.body;

    if (!phoneNumber || !username) {
        return res.status(400).json({ error: "Phone number and username are required" });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ error: "Please enter a valid Indian pincode." });
    }

    try {
        // Check if verified
        const verifyCheck = await db.query(
            "SELECT * FROM otp_verifications WHERE phone_number = $1 AND purpose = 'signup' AND is_verified = true ORDER BY created_at DESC LIMIT 1",
            [phoneNumber]
        );

        if (verifyCheck.rows.length === 0) {
            return res.status(401).json({ error: "Phone number not verified" });
        }

        const userExists = await db.query('SELECT * FROM users WHERE phone_number = $1 OR username = $2', [phoneNumber, username]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "User already exists with this phone or username" });
        }

        const newUserInfo = await db.query(
            `INSERT INTO users (phone_number, username, email, profession, about, image_url, is_phone_verified, pincode, city, state, latitude, longitude) 
             VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11) RETURNING id, username, phone_number, email, profession, about, image_url, pincode, city, state, latitude, longitude, created_at`,
            [phoneNumber, username, email || null, profession || null, about || null, imageUrl || null, pincode || null, city || null, state || null, latitude || null, longitude || null]
        );

        // Clear verification to prevent reuse
        await db.query("DELETE FROM otp_verifications WHERE phone_number = $1", [phoneNumber]);

        const user = newUserInfo.rows[0];
        const token = jwt.sign(
            { id: user.id, username: user.username, phoneNumber: user.phone_number },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user
        });

    } catch (err) {
        console.error("Auth Register error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/auth/login', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

    try {
        const verifyCheck = await db.query(
            "SELECT * FROM otp_verifications WHERE phone_number = $1 AND purpose = 'login' AND is_verified = true ORDER BY created_at DESC LIMIT 1",
            [phoneNumber]
        );

        if (verifyCheck.rows.length === 0) {
            return res.status(401).json({ error: "Phone number not verified" });
        }

        const userResult = await db.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Clear verification
        await db.query("DELETE FROM otp_verifications WHERE phone_number = $1", [phoneNumber]);

        const user = userResult.rows[0];
        const token = jwt.sign(
            { id: user.id, username: user.username, phoneNumber: user.phone_number },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                phone_number: user.phone_number,
                profile_name: user.profile_name
            }
        });

    } catch (err) {
        console.error("Auth Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});




// Save Interests Endpoint
app.post('/save-interests', async (req, res) => {
    const { userId, interests } = req.body;

    if (!userId || !Array.isArray(interests)) {
        return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
        for (const interest of interests) {
            await db.query(
                `INSERT INTO user_interests (user_id, interest) 
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [userId, interest]
            );
        }
        res.status(200).json({ message: "Interests saved successfully" });
    } catch (error) {
        console.error("Save interests error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.patch('/user/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { username, profession, about, image_url, pincode, city, state, latitude, longitude } = req.body;

    if (pincode && !/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ error: "Please enter a valid Indian pincode." });
    }

    // Security: Only allow user to update their own profile
    if (req.user.id.toString() !== id) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
    }

    try {
        const result = await db.query(
            `UPDATE users 
             SET username = COALESCE($1, username), 
                 profession = COALESCE($2, profession), 
                 about = COALESCE($3, about), 
                 image_url = COALESCE($4, image_url),
                 pincode = COALESCE($5, pincode),
                 city = COALESCE($6, city),
                 state = COALESCE($7, state),
                 latitude = COALESCE($8, latitude),
                 longitude = COALESCE($9, longitude)
             WHERE id = $10 RETURNING *`,
            [username, profession, about, image_url, pincode, city, state, latitude, longitude, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT username, email, profession, about, image_url FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: "OK", database: "PostgreSQL Configured" });
});

// TASK INTEGRATION APIs

app.post('/api/tasks/complete', authenticateToken, async (req, res) => {
    const { task_name } = req.body;
    const userId = req.user.id;

    if (!task_name) {
        return res.status(400).json({ error: "task_name is required" });
    }

    // Determine points
    let points = 0;
    if (task_name === "Breathe consciously for 3 minutes") {
        points = 100;
    } else if (task_name === "Drink a glass of water mindfully") {
        points = 150;
    } else if (task_name === "Sit without phone for 2 minutes") {
        points = 200;
    } else if (task_name === "Stretch neck & shoulders") {
        points = 250;
    } else if (task_name === "Smile intentionally") {
        points = 100;
    } else if (task_name === "Call an old friend") {
        points = 400;
    } else if (task_name === "Spend 20 minutes offline with someone") {
        points = 500;
    } else if (task_name === "Focus on one task (10 min)") {
        points = 20;
    } else if (task_name === "Turn off notifications (30 min)") {
        points = 10;
    } else if (task_name === "Observe urge to check phone") {
        points = 10;
    } else if (task_name === "Write one distraction") {
        points = 10;
    } else if (task_name === "Eat one bite consciously") {
        points = 10;
    } else if (task_name === "Notice heartbeat") {
        points = 10;
    } else if (task_name === "Posture check") {
        points = 10;
    } else {
        // Fallback: check if task exists in database
        try {
            const taskDbRes = await db.query('SELECT points_reward FROM tasks WHERE title = $1', [task_name]);
            if (taskDbRes.rows.length > 0) {
                points = taskDbRes.rows[0].points_reward;
            } else {
                return res.status(400).json({ error: "Unknown task" });
            }
        } catch (e) {
            return res.status(400).json({ error: "Unknown task" });
        }
    }

    try {
        // Fetch current total points
        const userResult = await db.query('SELECT COALESCE(points, 0) as points, COALESCE(streak_count, 0) as streak_count FROM users WHERE id = $1', [userId]);
        let totalPoints = userResult.rows[0] ? userResult.rows[0].points : 0;
        let streak = userResult.rows[0] ? userResult.rows[0].streak_count : 0;

        // Check if already completed ever (prevent duplicate points entirely)
        const checkResult = await db.query(`
            SELECT * FROM task_completions 
            WHERE user_id = $1 AND task_name = $2
        `, [userId, task_name]);

        if (checkResult.rows.length > 0) {
            // Compute current streak from total task completions
            const completedRes = await db.query('SELECT COUNT(*) FROM task_completions WHERE user_id = $1', [userId]);
            streak = Math.floor(parseInt(completedRes.rows[0].count) / 7);

            // Fetch completed tasks list
            const completedListRes = await db.query('SELECT task_name FROM task_completions WHERE user_id = $1', [userId]);
            const completedTasks = completedListRes.rows.map(row => row.task_name);

            return res.status(200).json({ 
                success: true, 
                message: "Task already completed", 
                pointsAdded: 0, 
                totalPoints,
                streak,
                completedTasks
            });
        }

        // Insert into task_completions
        await db.query(`
            INSERT INTO task_completions (user_id, task_name, points)
            VALUES ($1, $2, $3)
        `, [userId, task_name, points]);

        // Save distraction text if provided
        const { distraction_text } = req.body;
        if (distraction_text) {
            const taskDb = await db.query('SELECT id FROM tasks WHERE title = $1', [task_name]);
            const taskId = taskDb.rows[0] ? taskDb.rows[0].id : null;
            await db.query(`
                INSERT INTO task_responses (user_id, task_id, response_text)
                VALUES ($1, $2, $3)
            `, [userId, taskId, distraction_text]);
        }

        // Add points to user total
        totalPoints += points;
        
        // Compute new streak
        const completedRes = await db.query('SELECT COUNT(*) FROM task_completions WHERE user_id = $1', [userId]);
        streak = Math.floor(parseInt(completedRes.rows[0].count) / 7);

        await db.query(`
            UPDATE users SET points = $1, streak_count = $3 WHERE id = $2
        `, [totalPoints, userId, streak]);

        // Fetch completed tasks list
        const completedListRes = await db.query('SELECT task_name FROM task_completions WHERE user_id = $1', [userId]);
        const completedTasks = completedListRes.rows.map(row => row.task_name);

        res.status(200).json({ 
            success: true, 
            message: "Task completed", 
            pointsAdded: points, 
            totalPoints,
            streak,
            completedTasks
        });
    } catch (err) {
        console.error("Task completion error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/user/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT COALESCE(points, 0) as points, COALESCE(streak_count, 0) as streak_count FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const completedListRes = await db.query('SELECT task_name FROM task_completions WHERE user_id = $1', [userId]);
        const completedTasks = completedListRes.rows.map(row => row.task_name);
        
        res.json({ 
            points: result.rows[0].points,
            streak: result.rows[0].streak_count,
            completedTasks
        });
    } catch (error) {
        console.error('User summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const activityRoutes = require('./routes/activityRoutes');

// Routes
app.use('/api/home', homeRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/profile', profileRoutes);

// Activity Routes
app.use('/api/activities', activityRoutes);

// Start Server
app.listen(PORT, HOST, () => {
    console.log(`Backend server running on http://${HOST}:${PORT}`);
    initDB(); // create the table right after starting the server
});
