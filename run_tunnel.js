const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'pinggy_tunnel.log');
const apiFile = path.join(__dirname, 'Frontend', 'constants', 'Api.ts');

// Function to log
function log(msg) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}\n`;
    console.log(formattedMsg.trim());
    try {
        fs.appendFileSync(logFile, formattedMsg, 'utf8');
    } catch (e) {
        console.error("Log write failed:", e);
    }
}

// Clear log file at start
try {
    fs.writeFileSync(logFile, `=== Tunnel Session Started ===\n`, 'utf8');
} catch (e) {
    console.error("Log init failed:", e);
}

// First, kill any existing ssh processes on Windows
exec('taskkill /F /IM ssh.exe', (err) => {
    log("Killed any existing ssh processes. Starting new tunnel...");

    const ssh = spawn('ssh', [
        '-tt',
        '-p', '443',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=30',
        '-R0:localhost:5000',
        'free.pinggy.io'
    ]);

    let urlFound = false;

    ssh.stdout.on('data', (data) => {
        const str = data.toString();
        // Append raw stdout to log file
        try {
            fs.appendFileSync(logFile, str, 'utf8');
        } catch (e) {}
        
        // Check for URL
        const match = str.match(/https:\/\/[a-zA-Z0-9.-]+\.(pinggy-free\.link|pinggy\.net)/);
        if (match && !urlFound) {
            const url = match[0];
            urlFound = true;
            log(`🎉 Found Pinggy Public HTTPS URL: ${url}`);
            
            // Update Frontend/.env and Api.ts safely
            const envFile = path.join(__dirname, 'Frontend', '.env');
            try {
                fs.writeFileSync(envFile, `EXPO_PUBLIC_API_BASE_URL=${url}\n`, 'utf8');
                log(`✏️ Updated Frontend/.env to EXPO_PUBLIC_API_BASE_URL=${url}`);
            } catch (writeErr) {
                log(`❌ Failed to update Frontend/.env: ${writeErr.message}`);
            }
        }
    });

    ssh.stderr.on('data', (data) => {
        const str = data.toString();
        try {
            fs.appendFileSync(logFile, `[STDERR] ${str}`, 'utf8');
        } catch (e) {}
    });

    ssh.on('close', (code) => {
        log(`Tunnel process exited with code ${code}`);
    });
});
