const axios = require('axios');
require('dotenv').config({ path: './frontend/.env' }); // Just for env loading if needed, but I'll use backend's .env

const fs = require('fs');
const path = require('path');

async function testSMS() {
    const envPath = path.join(__dirname, 'backend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/FAST2SMS_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.log("No FAST2SMS_API_KEY found in backend/.env");
        return;
    }

    console.log("Testing Fast2SMS Key ending in:", apiKey.slice(-4));

    try {
        const response = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
                route: 'q',
                message: 'Health Twin Test Alert',
                language: 'english',
                flash: 0,
                numbers: '9123456789', // Placeholder dummy number for testing response
            },
            {
                headers: {
                    authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log("Success Response:", response.data);
    } catch (err) {
        console.log("Failed Response:", err.response ? err.response.data : err.message);
    }
}

testSMS();
