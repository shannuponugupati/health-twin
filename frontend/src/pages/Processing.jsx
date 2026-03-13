import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
    { text: 'Analyzing your lifestyle data...', icon: '📊' },
    { text: 'Building your digital health twin...', icon: '🧬' },
    { text: 'Predicting future health risks...', icon: '🔮' },
    { text: 'Generating personalized insights...', icon: '💡' },
];

const Processing = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= steps.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => navigate('/dashboard'), 1200);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="processing-container animate-fade-in">
            {/* Glowing Orb */}
            <div className="processing-orb"></div>

            <h2 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                Creating Your Digital Twin
            </h2>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-muted)' }}>
                Our AI is analyzing your health data...
            </p>

            {/* Processing Steps */}
            <div style={{ maxWidth: '360px', width: '100%' }}>
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className={`processing-step ${i === currentStep ? 'active' :
                                i < currentStep ? 'done' : ''
                            }`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            justifyContent: 'flex-start',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: i === currentStep ? 'rgba(14, 165, 233, 0.06)' : 'transparent',
                            transition: 'all 0.5s ease',
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>
                            {i < currentStep ? '✅' : step.icon}
                        </span>
                        <span>{step.text}</span>
                    </div>
                ))}
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2.5rem' }}>
                {steps.map((_, i) => (
                    <div key={i} style={{
                        width: i <= currentStep ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: i <= currentStep ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        transition: 'all 0.5s ease',
                    }} />
                ))}
            </div>
        </div>
    );
};

export default Processing;
