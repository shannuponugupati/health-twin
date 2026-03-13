-- AI Digital Twin for Personal Health
-- Database Setup Script

CREATE DATABASE IF NOT EXISTS health_twin_db;
USE health_twin_db;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other', 'Prefer Not to Say'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lifestyle Data Table
CREATE TABLE IF NOT EXISTS Lifestyle_Data (
    data_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sleep_hours DECIMAL(4, 2), -- e.g., 7.5
    exercise_frequency INT, -- days per week
    diet_quality INT, -- scale 1-10
    screen_time DECIMAL(4, 2), -- hours per day
    stress_level INT, -- scale 1-10
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Health Predictions Table
CREATE TABLE IF NOT EXISTS Health_Predictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    health_score DECIMAL(5, 2), -- 0 to 100
    obesity_risk DECIMAL(5, 2), -- percentage
    stress_risk DECIMAL(5, 2), -- percentage
    sleep_disorder_risk DECIMAL(5, 2), -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
