const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const checkAuth = require('../middlewares/authMiddleware');

router.post('/questionnaire', checkAuth, healthController.submitQuestionnaire);
router.get('/dashboard', checkAuth, healthController.getDashboardData);

module.exports = router;
