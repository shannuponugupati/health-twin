import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Landing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleCTA = () => {
        navigate(user ? '/profile' : '/auth');
    };

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="landing-hero">
                <h1 className="landing-title text-gradient animate-fade-in-up delay-1">
                    AI Digital Twin for Personal Health
                </h1>

                <p className="landing-subtitle animate-fade-in-up delay-3">
                    Predict your future health using AI. Build your digital twin, discover risks, and get personalized wellness recommendations.
                </p>

                <button
                    className="btn btn-primary btn-lg animate-fade-in-up delay-4"
                    onClick={handleCTA}
                >
                    🚀 Create Your Digital Twin
                </button>

                {/* Feature Cards */}
                <div className="features-grid animate-fade-in-up delay-5">
                    <div className="feature-card">
                        <div className="feature-icon">🔮</div>
                        <h3>Health Risk Prediction</h3>
                        <p>AI analyzes your lifestyle to predict future health risks like obesity, stress disorders, and sleep issues.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Lifestyle Analysis</h3>
                        <p>Get a comprehensive breakdown of your habits — sleep, exercise, diet, screen time, and stress levels.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💡</div>
                        <h3>AI Wellness Tips</h3>
                        <p>Receive personalized recommendations powered by AI to improve your health score and reduce risks.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
