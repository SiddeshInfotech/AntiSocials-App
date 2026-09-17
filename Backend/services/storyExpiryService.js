const db = require('../db');
const fs = require('fs');
const path = require('path');

/**
 * Story Expiry Service
 * 
 * Automatically manages 24-hour story lifecycles in AntiSocial:
 * 1. Automatically marks stories as expired (is_active = false) when expires_at <= NOW()
 * 2. Purges old expired stories and associated orphaned files if needed
 * 3. Runs continuously in the background via setInterval
 */

let expiryTimer = null;

/**
 * Deactivates all stories whose 24-hour expiration window has passed.
 * Returns the count of deactivated stories.
 */
async function deactivateExpiredStories(maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const result = await db.query(`
                UPDATE stories 
                SET is_active = FALSE 
                WHERE is_active = TRUE AND expires_at <= CURRENT_TIMESTAMP
                RETURNING id, user_id, expires_at
            `);

            if (result.rows.length > 0) {
                console.log(`⏰ [Story Expiry Service] Deactivated ${result.rows.length} expired stories at ${new Date().toISOString()}`);
                result.rows.forEach(s => {
                    console.log(`   - Story ID: ${s.id} (User: ${s.user_id}, Expired: ${s.expires_at})`);
                });
            }

            return result.rows.length;
        } catch (err) {
            const isConnError = err.code === 'EACCES' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || (err.message && err.message.toLowerCase().includes('connect'));
            if (isConnError && attempt <= maxRetries) {
                console.warn(`⚠️ [Story Expiry Service] Database connection attempt ${attempt} failed (${err.message || err.code}). Retrying in 1s...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }
            console.error('❌ [Story Expiry Service Error] deactivateExpiredStories:', err);
            return 0;
        }
    }
}

/**
 * Optional purge function for cleaning up old expired story records and local files.
 * Removes stories expired for more than 48 hours.
 */
async function purgeOldExpiredStories(retentionHours = 48, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const query = `
                SELECT id, media_url FROM stories 
                WHERE expires_at <= CURRENT_TIMESTAMP - ($1 || ' hours')::INTERVAL
            `;
            const oldStories = await db.query(query, [retentionHours]);

            if (oldStories.rows.length === 0) return 0;

            for (const story of oldStories.rows) {
                // Delete record
                await db.query('DELETE FROM stories WHERE id = $1', [story.id]);

                // Attempt to remove local file if in uploads directory and not referenced elsewhere
                if (story.media_url && story.media_url.startsWith('/uploads/')) {
                    const filename = path.basename(story.media_url);
                    const filePath = path.join(__dirname, '..', 'uploads', filename);
                    
                    // Check if any other story or user uses the same file
                    const usageCheck = await db.query(
                        'SELECT 1 FROM stories WHERE media_url = $1 UNION SELECT 1 FROM users WHERE image_url = $1',
                        [story.media_url]
                    );

                    if (usageCheck.rows.length === 0 && fs.existsSync(filePath)) {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error(`Failed to delete orphaned media file ${filePath}:`, err);
                            else console.log(`🗑️ [Story Expiry Media Cleanup] Deleted file: ${filename}`);
                        });
                    }
                }
            }

            console.log(`🧹 [Story Expiry Service] Purged ${oldStories.rows.length} old expired story records (retention: ${retentionHours}h)`);
            return oldStories.rows.length;
        } catch (err) {
            const isConnError = err.code === 'EACCES' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || (err.message && err.message.toLowerCase().includes('connect'));
            if (isConnError && attempt <= maxRetries) {
                console.warn(`⚠️ [Story Expiry Service] Database connection attempt ${attempt} failed for purge (${err.message || err.code}). Retrying in 1s...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }
            console.error('❌ [Story Expiry Service Error] purgeOldExpiredStories:', err);
            return 0;
        }
    }
}

/**
 * Starts the periodic background story expiry cleanup job.
 * @param {number} intervalMs Frequency of cleanup checks in milliseconds (default: 2 minutes)
 */
function startStoryExpiryJob(intervalMs = 2 * 60 * 1000) {
    if (expiryTimer) {
        clearInterval(expiryTimer);
    }

    console.log(`🚀 [Story Expiry Service] Started background expiry cleanup job (every ${intervalMs / 1000}s)`);

    // Immediate run on startup
    deactivateExpiredStories().catch((err) => console.error('Startup expiry cleanup error:', err));

    expiryTimer = setInterval(async () => {
        await deactivateExpiredStories();
    }, intervalMs);

    // Ensure timer does not prevent process exit in test scripts
    if (process.env.NODE_ENV === 'test' && expiryTimer.unref) {
        expiryTimer.unref();
    }
}

/**
 * Stops the background expiry job
 */
function stopStoryExpiryJob() {
    if (expiryTimer) {
        clearInterval(expiryTimer);
        expiryTimer = null;
        console.log('🛑 [Story Expiry Service] Stopped background expiry cleanup job');
    }
}

module.exports = {
    deactivateExpiredStories,
    purgeOldExpiredStories,
    startStoryExpiryJob,
    stopStoryExpiryJob
};
