# AntiSocials - Backend

Welcome to the backend repository for **AntiSocials**. 
This is an Express.js & Node.js application built to power the AntiSocials platform, handling authentication, profiles, activities, tasks, and stories with a Neon PostgreSQL database.

## 🛠️ Tech Stack
* **Framework:** Node.js with Express.js
* **Database:** PostgreSQL (Neon Serverless DB)
* **Authentication:** JWT & WhatsApp OTP (ICPAAS API)
* **Storage:** Local file system (Multer) for media uploads
* **Environment:** dotenv for configuration

## 🚀 Key Features

* **Authentication & OTP:** Secure login and registration using phone numbers and WhatsApp-delivered OTPs.
* **Dynamic User Profiles:** Fully integrated user profiles including editable bios, professions, and interests, synced instantly with the frontend.
* **Activity & Event Tracking:** APIs to create, join, and track local activities and manage event participants.
* **Progress & Streaks:** Tracking mechanisms for task completions, daily streaks, and user points (`points_history`).
* **Interests Management:** Add, edit, and retrieve personalized user interests (`user_interests`).
* **Stories System:** Image and media-based stories with text elements and expiry management.

## 📦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root backend directory:
   ```env
   PORT=5000
   PG_USER=your_postgres_user
   PG_HOST=your_postgres_host
   PG_DATABASE=your_postgres_db
   PG_PASSWORD=your_postgres_password
   PG_PORT=5432
   JWT_SECRET=your_secret_key
   ICPAAS_TOKEN=your_whatsapp_otp_token
   ```

3. **Start the Server**
   ```bash
   node index.js
   ```
   *The server will start on port 5000 by default and automatically initialize the necessary database tables.*

## 🤝 Development
* The primary entry point is `index.js`.
* Controllers are separated out by domain (e.g. `profileController.js`, `activityController.js`).
* Always ensure you pass the `authenticateToken` middleware for protected routes.
