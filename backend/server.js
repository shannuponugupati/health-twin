require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const smsRoutes = require('./src/routes/smsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/sms', smsRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('AI Digital Twin Backend is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
