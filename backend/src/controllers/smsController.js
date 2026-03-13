const axios = require('axios');
const schedule = require('node-schedule');

// In-memory store for scheduled jobs (per user session)
const scheduledJobs = {};

/**
 * Parse time string (HH:MM) to a Date object for today.
 */
const timeToDate = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
};

/**
 * Send SMS via Fast2SMS (India free tier) or mock mode.
 * Get your free API key at: https://www.fast2sms.com/
 */
const sendSMS = async (to, message) => {
    const apiKey = process.env.FAST2SMS_API_KEY;

    // Mock mode if no API key set
    if (!apiKey || apiKey === 'YOUR_FAST2SMS_API_KEY') {
        const cleanPhone = to.replace(/[\s\-\+]/g, '').replace(/^91/, '');
        console.log(`\n[MOCK SMS] To: ${cleanPhone}`);
        console.log(`[MOCK SMS] Message: ${message}`);
        console.log(`[MOCK SMS] ─────────────────────────────`);
        return { mock: true };
    }

    // Clean phone number — Fast2SMS expects 10-digit Indian number
    const cleanPhone = to.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
            route: 'q',          // Quick SMS route (transactional)
            message: message,
            language: 'english',
            flash: 0,
            numbers: cleanPhone,
        },
        {
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
            },
        }
    );

    console.log(`[SMS] Sent to ${cleanPhone}:`, response.data);
    return response.data;
};

/**
 * POST /api/sms/schedule
 * Body: { userId, phone, reminders: [{ key, time, smsMessage, enabled }] }
 */
exports.scheduleReminders = async (req, res) => {
    try {
        const { userId, phone, reminders } = req.body;

        if (!userId || !phone || !Array.isArray(reminders)) {
            return res.status(400).json({ message: 'userId, phone, and reminders are required.' });
        }

        // Cancel previous jobs for this user
        if (scheduledJobs[userId]) {
            scheduledJobs[userId].forEach(job => job.cancel());
        }
        scheduledJobs[userId] = [];

        const scheduled = [];

        for (const reminder of reminders) {
            if (!reminder.enabled) continue;

            const fireTime = timeToDate(reminder.time);
            const now = new Date();

            if (fireTime <= now) continue;

            const job = schedule.scheduleJob(fireTime, async () => {
                try {
                    await sendSMS(phone, reminder.smsMessage);
                    console.log(`[SMS] Sent "${reminder.key}" reminder to ${phone} at ${reminder.time}`);
                } catch (err) {
                    console.error(`[SMS] Failed to send ${reminder.key} reminder:`, err.message);
                }
            });

            scheduledJobs[userId].push(job);
            scheduled.push({ key: reminder.key, time: reminder.time });
        }

        console.log(`[SMS] Scheduled ${scheduled.length} reminders for user ${userId}`);

        const isMock = !process.env.FAST2SMS_API_KEY || process.env.FAST2SMS_API_KEY === 'YOUR_FAST2SMS_API_KEY';

        res.status(200).json({
            message: `${scheduled.length} reminders scheduled successfully.`,
            scheduled,
            mode: isMock ? 'mock' : 'live',
        });
    } catch (error) {
        console.error('Schedule reminders error:', error);
        res.status(500).json({ message: 'Error scheduling reminders: ' + error.message });
    }
};

/**
 * POST /api/sms/send-now
 * Body: { phone, message }
 */
exports.sendNow = async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ message: 'phone and message are required.' });
        }
        const result = await sendSMS(phone, message);
        res.status(200).json({ message: 'SMS sent.', result });
    } catch (error) {
        console.error('Send now error:', error);
        res.status(500).json({ message: 'Error sending SMS: ' + error.message });
    }
};

/**
 * DELETE /api/sms/cancel/:userId
 */
exports.cancelReminders = async (req, res) => {
    try {
        const { userId } = req.params;
        if (scheduledJobs[userId]) {
            scheduledJobs[userId].forEach(job => job.cancel());
            delete scheduledJobs[userId];
        }
        res.status(200).json({ message: 'All reminders cancelled.' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling reminders: ' + error.message });
    }
};

/**
 * POST /api/sms/emergency
 * Body: { phone, contactPhone, contactName, userName, symptoms }
 */
exports.sendEmergencyAlert = async (req, res) => {
    try {
        const { phone, contactPhone, contactName, userName, symptoms } = req.body;

        if (!phone || !contactPhone || !userName) {
            return res.status(400).json({ message: 'phone, contactPhone, and userName are required.' });
        }

        const userMessage = `URGENT ALERT: You reported severe symptoms (${symptoms}). Please seek medical attention immediately. Sit or lie down and stay calm.`;
        const contactMessage = `EMERGENCY ALERT: ${userName} has reported severe health symptoms (${symptoms}) via AI Health Twin. Please check on them immediately.`;

        // Send to user
        await sendSMS(phone, userMessage);
        
        // Send to emergency contact
        await sendSMS(contactPhone, contactMessage);

        res.status(200).json({ message: 'Emergency alerts sent successfully to user and contact.' });
    } catch (error) {
        console.error('Emergency alert error:', error);
        res.status(500).json({ message: 'Error sending emergency alerts: ' + error.message });
    }
};

