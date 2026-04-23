const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('./middleware/auth');
const homeRoutes = require('./routes/homeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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
    // Return absolute URL
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: publicUrl });
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS stories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                media_url TEXT NOT NULL,
                media_type VARCHAR(50) DEFAULT 'image',
                caption TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
                is_active BOOLEAN DEFAULT TRUE
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

        // Migrations
        try { await db.query('ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0'); } catch(e) {}
        try { await db.query('ALTER TABLE users ADD COLUMN last_streak_date DATE'); } catch(e) {}


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

        console.log("PostgreSQL tables initialized.");
    } catch (err) {
        console.error("Error creating tables:", err);
    }
};



// Login Endpoint
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, phone_number, profession, about, image_url FROM users WHERE id = $1', [req.user.id]);
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
    const { phoneNumber, username, email, profession, about, imageUrl } = req.body;
    
    if (!phoneNumber || !username) {
        return res.status(400).json({ error: "Phone number and username are required" });
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
            `INSERT INTO users (phone_number, username, email, profession, about, image_url, is_phone_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, username, phone_number, email, profession, about, image_url, created_at`,
            [phoneNumber, username, email || null, profession || null, about || null, imageUrl || null]
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
    const { username, profession, about, image_url } = req.body;

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
                 image_url = COALESCE($4, image_url)
             WHERE id = $5 RETURNING *`,
            [username, profession, about, image_url, id]
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

// Home Page Routes
app.use('/api/home', homeRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    initDB(); // create the table right after starting the server
});
