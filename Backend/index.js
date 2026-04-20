const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Higher limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
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
        console.log("PostgreSQL 'users' table initialized.");
    } catch (err) {
        console.error("Error creating tables:", err);
    }
};

// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password, profession, about } = req.body;
    console.log(`Registering user: ${username}, hasProfilePhoto: ${!!req.body.imageUrl}`);

    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Please fill all required fields: username, email, password" });
    }

    try {
        // Check if user already exists (by email OR username)
        const userExists = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            const existingUser = userExists.rows[0];
            if (existingUser.email === email) {
                return res.status(409).json({ error: "Email already exists" });
            }
            if (existingUser.username === username) {
                return res.status(409).json({ error: "Username already exists" });
            }
        }

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into the PostgreSQL database
        const newUserInfo = await db.query(
            `INSERT INTO users (username, email, password, profession, about, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, profession, about, image_url, created_at`,
            [username, email, hashedPassword, profession || null, about || null, req.body.imageUrl || null]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUserInfo.rows[0]
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login Endpoint
// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, profession, about, image_url FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
        return res.status(400).json({ error: "Please fill all required fields" });
    }

    try {
        const userExists = await db.query(
            'SELECT * FROM users WHERE email = $1 OR username = $1', 
            [emailOrUsername]
        );

        if (userExists.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = userExists.rows[0];
        
        // Safety check if an older user has no password
        if (!user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_name: user.profile_name
            }
        });

    } catch (error) {
        console.error("Login error:", error);
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

// Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    initDB(); // create the table right after starting the server
});
