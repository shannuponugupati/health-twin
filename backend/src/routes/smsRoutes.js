const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// Schedule reminders for the user's daily routine
router.post('/schedule', smsController.scheduleReminders);

// Send an SMS immediately (for testing or manual sends)
router.post('/send-now', smsController.sendNow);

// Send an emergency alert immediately
router.post('/emergency', smsController.sendEmergencyAlert);

// Cancel all scheduled reminders for a user
router.delete('/cancel/:userId', smsController.cancelReminders);

module.exports = router;
