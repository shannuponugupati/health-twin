const db = require('../config/db');
const axios = require('axios');

exports.submitQuestionnaire = async (req, res) => {
    try {
        const { sleep_hours, exercise_frequency, diet_quality, screen_time, stress_level } = req.body;
        const userId = req.userData.userId;

        // Save lifestyle data
        const [result] = await db.query(
            'INSERT INTO Lifestyle_Data (user_id, sleep_hours, exercise_frequency, diet_quality, screen_time, stress_level) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, sleep_hours, exercise_frequency, diet_quality, screen_time, stress_level]
        );

        // Fetch user data for ML service input (age, gender)
        const [users] = await db.query('SELECT age, gender FROM Users WHERE user_id = ?', [userId]);
        const user = users[0];

        // Call ML Service to get predictions
        let mlResponse;
        try {
            mlResponse = await axios.post(process.env.ML_SERVICE_URL, {
                age: user.age,
                gender: user.gender, // You might need to map this in the ML service
                sleep_hours,
                exercise_frequency,
                diet_quality,
                screen_time,
                stress_level
            });
        } catch (mlError) {
            console.error('Error calling ML service:', mlError.message);
            return res.status(503).json({ message: 'Machine Learning service is currently unavailable. Lifestyle data saved.' });
        }

        const predictions = mlResponse.data;

        // Save health predictions
        await db.query(
            'INSERT INTO Health_Predictions (user_id, health_score, obesity_risk, stress_risk, sleep_disorder_risk) VALUES (?, ?, ?, ?, ?)',
            [userId, predictions.health_score, predictions.obesity_risk, predictions.stress_risk, predictions.sleep_disorder_risk]
        );

        res.status(201).json({ message: 'Questionnaire submitted successfully', predictions });
    } catch (error) {
        console.error('Submit questionnaire error:', error);
        res.status(500).json({ message: 'Server error during submission' });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.userData.userId;

        // Fetch User Info
        const [userQuery] = await db.query('SELECT name, email, age, gender FROM Users WHERE user_id = ?', [userId]);

        // Fetch Latest Lifestyle Data
        const [lifestyleQuery] = await db.query('SELECT * FROM Lifestyle_Data WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);

        // Fetch Latest Predictions
        const [predictionsQuery] = await db.query('SELECT * FROM Health_Predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);

        res.status(200).json({
            user: userQuery[0] || null,
            lifestyle_data: lifestyleQuery[0] || null,
            predictions: predictionsQuery[0] || null
        });

    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
};
