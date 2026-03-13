import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import {
    Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler,
    Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import { EMERGENCY_SYMPTOMS, detectEmergency, calculateEmergencyRisk } from '../utils/emergencyDetection';
import axios from 'axios';

ChartJS.register(
    RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
    ArcElement, CategoryScale, LinearScale, BarElement
);

// ── Background Engine ──
const calcPredictions = (d) => {
    const sleep = d.sleep_hours || 7;
    const sleepQ = d.sleep_quality || 5;
    const exercise = d.exercise_frequency || 0;
    const activity = d.physical_activity || 3;
    const water = d.water_intake || 5;
    const diet = d.diet_quality || 5;
    const fastFood = d.fast_food || 5;
    const screen = d.screen_time || 4;
    const stress = d.stress_level || 5;
    const energy = d.energy_level || 5;

    let score = 30;
    score += (sleep >= 7 && sleep <= 9) ? 10 : (sleep >= 6 ? 5 : 0);
    score += sleepQ * 0.8;
    score += exercise * 1.8;
    score += activity * 0.8;
    score += (water >= 5 ? 7 : (water >= 2 ? 4 : 0));
    score += diet * 1.2;
    score -= fastFood * 0.9;
    score -= Math.max(0, screen - 3) * 1.2;
    score -= stress * 1.3;
    score += energy * 0.6;
    score = Math.max(0, Math.min(100, score));

    const obesity_risk = Math.min(100, Math.max(0,
        55 - (exercise * 6) - (activity * 2) - (diet * 2.5) + (fastFood * 4) + (screen * 1.5) + (stress * 1.5) - (water * 0.8)
    ));
    const stress_risk = Math.min(100, Math.max(0,
        stress * 9 - (exercise * 2.5) - (sleep * 1.5) - (sleepQ * 1) + (screen * 1.5) - (energy * 1) + (fastFood * 0.5)
    ));
    const sleep_disorder_risk = Math.min(100, Math.max(0,
        (10 - sleep) * 6 + (10 - sleepQ) * 3 + (screen * 2.5) + (stress * 3) - (exercise * 2) - (activity * 1) - (energy * 0.5)
    ));

    return {
        health_score: parseFloat(score.toFixed(1)),
        obesity_risk: parseFloat(obesity_risk.toFixed(1)),
        stress_risk: parseFloat(stress_risk.toFixed(1)),
        sleep_disorder_risk: parseFloat(sleep_disorder_risk.toFixed(1))
    };
};

// ── UI Components ──
// Animated Counter
const AnimatedCounter = ({ value, duration = 1500 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const target = Math.round(value);
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // easeOutSine
            const easeProgress = Math.sin((progress * Math.PI) / 2);
            setCount(Math.floor(easeProgress * target));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{count}</span>;
}

const ExpandableCard = ({ title, icon, children, expandedContent, className = '', style = {} }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={`dashboard-card ${className}`} style={{ ...style, cursor: 'pointer', position: 'relative', transition: 'all 0.4s ease' }} onClick={() => setExpanded(!expanded)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{icon && <span style={{ marginRight: '0.4rem' }}>{icon}</span>}{title}</h3>
                <span className="expand-icon" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>{expanded ? '▲' : '▼'}</span>
            </div>
            <div style={{ marginTop: '1.25rem' }}>{children}</div>
            <div style={{ maxHeight: expanded ? '1200px' : '0', overflow: 'hidden', transition: 'all 0.4s ease', opacity: expanded ? 1 : 0, marginTop: expanded ? '1.5rem' : '0' }}>
                {expanded && <div onClick={(e) => e.stopPropagation()} style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>{expandedContent}</div>}
            </div>
        </div>
    );
};

const WhatIfSlider = ({ label, icon, value, onChange, min, max, step, unit }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{icon} {label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)' }}>{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
    </div>
);

// Habit Progress Bar
const HabitBar = ({ label, icon, current, goal, unit }) => {
    const percent = Math.min(100, Math.round((current / goal) * 100));
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>{icon} {label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{current} / {goal} {unit}</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(2,6,23,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: percent >= 100 ? '#10B981' : 'var(--primary)', transition: 'width 1.5s ease-out' }}></div>
            </div>
        </div>
    );
};

// Risk Card
const RiskCard = ({ title, icon, risk, color }) => {
    const [animatedWidth, setAnimatedWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setAnimatedWidth(risk), 300);
        return () => clearTimeout(t);
    }, [risk]);

    return (
        <div className="glass-panel risk-card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span>{icon}</span> {title}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: color }}>
                    <AnimatedCounter value={risk} />%
                </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${animatedWidth}%`, background: color, transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>Risk Level</div>
        </div>
    );
};


const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [whatIf, setWhatIf] = useState(null);

    // Track simulated habit logs (UI only)
    const [tracker, setTracker] = useState({
        sleep: Math.floor(Math.random() * 3) + 4, // 4-6 days
        water: Math.floor(Math.random() * 3) + 4,
        exercise: Math.floor(Math.random() * 2) + 2,
        screen: Math.floor(Math.random() * 3) + 4,
    });

    // Emergency Status State
    const [emergencyStatus, setEmergencyStatus] = useState(null); // { level, symptoms, timestamp, advice }
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [alertSending, setAlertSending] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [userDoc, lifestyleDoc, predictionsDoc] = await Promise.all([
                    getDoc(doc(db, 'users', user.uid)), getDoc(doc(db, 'lifestyleData', user.uid)), getDoc(doc(db, 'predictions', user.uid))
                ]);
                if (lifestyleDoc.exists() && predictionsDoc.exists()) {
                    const ls = lifestyleDoc.data();
                    setData({
                        user: userDoc.exists() ? userDoc.data() : { name: user.displayName || 'User', age: 30 },
                        lifestyle: ls,
                        predictions: predictionsDoc.data()
                    });
                    setWhatIf({
                        exercise_frequency: ls.exercise_frequency || 3, sleep_hours: ls.sleep_hours || 7,
                        screen_time: ls.screen_time || 4, diet_quality: ls.diet_quality || 5,
                        stress_level: ls.stress_level || 5, water_intake: ls.water_intake || 5,
                    });
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
    }, [user]);

    const whatIfPredictions = useMemo(() => {
        if (!data || !whatIf) return null;
        return calcPredictions({ ...data.lifestyle, ...whatIf });
    }, [data, whatIf]);

    const [animatedScoreRing, setAnimatedScoreRing] = useState(0);

    useEffect(() => {
        if (data) {
            const t = setTimeout(() => {
                setAnimatedScoreRing(data.predictions.health_score);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [data]);

    if (loading) return <div className="container min-h-screen flex justify-center items-center flex-col"><div className="processing-orb" style={{ width: '60px', height: '60px' }}></div></div>;
    if (!data) return <div className="container min-h-screen flex justify-center items-center animate-fade-in"><div className="glass-panel text-center"><h3>No Profile Found</h3><button className="btn btn-primary mt-4" onClick={() => navigate('/profile')}>Get Started</button></div></div>;

    const { lifestyle: ls, predictions: p, user: userData } = data;
    const actualAge = parseInt(userData.age, 10) || 30;

    // ── Metric Helpers (Cyberpunk Colors) ──
    const scoreColor = p.health_score >= 70 ? '#00FF94' : p.health_score >= 50 ? '#FFE600' : '#FF003C';
    const statusText = p.health_score >= 70 ? 'Optimal' : p.health_score >= 50 ? 'Stable' : 'Critical';
    const avatarGlow = p.health_score >= 70 ? 'glow-green' : p.health_score >= 50 ? 'glow-yellow' : 'glow-red';
    const healthAgeDiff = p.health_score > 80 ? -3 : p.health_score > 60 ? -1 : p.health_score > 40 ? +2 : +5;
    const healthAge = actualAge + healthAgeDiff;

    // ── Water Intake Parsing ──
    const getWaterLiters = (val) => val === 9 ? '8L' : val === 7 ? '5L' : val === 5 ? '3L' : '1L';

    // ── Charts Data ──
    const radarData = {
        labels: ['Sleep', 'Exercise', 'Diet', 'Status', 'Screen Time'],
        datasets: [{
            label: 'System Balance',
            data: [
                Math.min(10, ls.sleep_hours || 7), Math.min(10, (ls.exercise_frequency || 0) * 1.4), ls.diet_quality || 5,
                Math.max(0, 10 - (ls.stress_level || 5)), Math.max(0, 10 - (ls.screen_time || 3) * 0.8)
            ],
            backgroundColor: 'rgba(0, 240, 255, 0.15)', 
            borderColor: '#00F0FF', 
            borderWidth: 2, 
            pointBackgroundColor: '#00A3FF',
            pointBorderColor: '#00F0FF',
            pointHoverBackgroundColor: '#FFF',
            pointHoverBorderColor: '#FF00E5'
        }]
    };

    const radarOptions = {
        maintainAspectRatio: false, 
        animation: { duration: 1500, easing: 'easeOutQuart' },
        scales: { 
            r: { 
                min: 0, max: 10, ticks: { display: false }, 
                angleLines: { color: 'rgba(0, 240, 255, 0.15)' }, 
                grid: { color: 'rgba(0, 240, 255, 0.15)' }, 
                pointLabels: { color: '#00F0FF', font: { size: 10, family: 'Inter', weight: 700 } } 
            } 
        }, 
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(3, 7, 18, 0.9)',
                titleColor: '#00F0FF',
                bodyColor: '#FFFFFF',
                borderColor: 'rgba(0, 240, 255, 0.5)',
                borderWidth: 1,
                padding: 12,
                displayColors: false
            }
        } 
    };

    const currentYear = new Date().getFullYear();
    const optScore = Math.min(100, p.health_score + 15);
    const timelineData = {
        labels: [`${currentYear}`, `${currentYear + 1}`, `${currentYear + 2}`],
        datasets: [
            { 
                label: 'Current Trajectory', 
                data: [p.health_score, Math.max(0, p.health_score - 5), Math.max(0, p.health_score - 10)], 
                borderColor: '#FF00E5', 
                backgroundColor: 'rgba(255, 0, 229, 0.1)',
                fill: true,
                tension: 0.4 
            },
            { 
                label: 'Optimized Trajectory', 
                data: [p.health_score, p.health_score + 8, optScore], 
                borderColor: '#00F0FF', 
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.4 
            },
        ]
    };

    const timelineOptions = {
        maintainAspectRatio: false,
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        },
        scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(0, 240, 255, 0.05)' }, ticks: { color: '#00F0FF' } },
            x: { type: 'category', grid: { display: false }, ticks: { color: '#00A3FF' } }
        },
        plugins: { 
            legend: { position: 'bottom', labels: { color: '#00F0FF', usePointStyle: true, boxWidth: 8, font: { family: 'Inter', weight: 600 } } },
            tooltip: {
                backgroundColor: 'rgba(3, 7, 18, 0.9)',
                titleColor: '#00F0FF',
                bodyColor: '#FFFFFF',
                borderColor: 'rgba(0, 240, 255, 0.5)',
                borderWidth: 1,
                padding: 12,
                displayColors: false
            } 
        }
    };

    // ── Emergency Alert Handlers ──
    const handleReportEmergency = async (symptomKey) => {
        const symptoms = EMERGENCY_SYMPTOMS[symptomKey];
        const risk = calculateEmergencyRisk([symptoms], data.lifestyle);
        
        const newStatus = {
            level: risk.level,
            color: risk.color,
            symptom: symptoms.label,
            advice: symptoms.advice,
            timestamp: new Date().toLocaleTimeString()
        };
        
        setEmergencyStatus(newStatus);
        setShowSymptomModal(false);

        // If High or Moderate Risk, send SMS
        const userPhone = userData.phone || '';
        const contactPhone = userData.emergency_contact_phone || '';
        if ((risk.level === 'HIGH' || risk.level === 'MODERATE') && contactPhone) {
            setAlertSending(true);
            try {
                await axios.post('http://localhost:3000/api/sms/emergency', {
                    phone: userPhone,
                    contactPhone: contactPhone,
                    contactName: userData.emergency_contact_name,
                    userName: userData.name || 'User',
                    symptoms: symptoms.label
                });
                console.log('Emergency Alert SMS sent to', contactPhone);
                if (!userPhone) console.warn('User own phone not set — please update Profile with phone number');
            } catch (err) {
                console.error('SMS Alert failed', err);
            } finally {
                setAlertSending(false);
            }
        } else if (!contactPhone) {
            console.warn('No emergency contact phone — please set one in Profile.');
        }
    };

    const EmergencyBanner = () => {
        if (!emergencyStatus) return null;
        return (
            <div className={`glass-panel ${emergencyStatus.level === 'HIGH' ? 'animate-pulse' : ''}`} style={{
                background: `rgba(${emergencyStatus.level === 'HIGH' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`,
                border: `1px solid ${emergencyStatus.color}`,
                padding: '1.25rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                boxShadow: `0 0 20px rgba(239, 68, 68, 0.2)`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: emergencyStatus.color, fontSize: '1.1rem' }}>
                        <span>🚨</span> URGENT ALERT: {emergencyStatus.level} SEVERITY
                    </div>
                    <button onClick={() => setEmergencyStatus(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    <strong>Detected Symptom:</strong> {emergencyStatus.symptom} <br/>
                    <strong>Recommended Action:</strong> {emergencyStatus.advice}
                </div>
                {emergencyStatus.level === 'HIGH' && (
                    <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="dot-red"></span> Emergency contacts have been notified.
                    </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reported at {emergencyStatus.timestamp}</div>
            </div>
        );
    };

    // ── AI Coach Logic ──
    const coachTips = [];
    if ((ls.sleep_hours || 7) < 7) coachTips.push({ cat: 'Sleep', tip: 'Increase sleep to 7–8 hours', details: 'Limit caffeine afternoon, set a consistent bedtime, and maintain a cool, dark room environment.', icon: '💤', critical: true });
    if ((ls.exercise_frequency || 0) < 3) coachTips.push({ cat: 'Exercise', tip: 'Exercise at least 3 times per week', details: 'Start with 20 minutes of daily walking. Gradually introduce light bodyweight exercises like squats or push-ups.', icon: '🏋️', critical: true });
    if ((ls.screen_time || 4) > 4) coachTips.push({ cat: 'Screen Time', tip: 'Reduce screen time before bedtime', details: 'Activate evening blue light filters. Replace 1 hour of night scrolling with reading a physical book or stretching.', icon: '📵', critical: true });
    if ((ls.water_intake || 5) < 7) coachTips.push({ cat: 'Hydration', tip: 'Drink more water daily (aim for 5L+)', details: 'Carry a reusable water bottle. Set hourly reminders to take a sip, and drink a full glass right when you wake up.', icon: '💧', critical: false });
    if ((ls.stress_level || 5) >= 6) coachTips.push({ cat: 'Stress', tip: 'Practice 10 mins of daily mindfulness', details: 'Try box breathing (4s inhale, hold, exhale, hold) or guided meditation apps when feeling overwhelmed.', icon: '🧘', critical: false });
    if ((ls.diet_quality || 5) < 7) coachTips.push({ cat: 'Diet', tip: 'Improve daily nutrition quality', details: 'Add one serving of leafy greens to your main meals. Swap sugary snacks for mixed nuts or fresh fruit.', icon: '🥗', critical: false });

    // Sort critical first
    coachTips.sort((a, b) => (a.critical === b.critical ? 0 : a.critical ? -1 : 1));

    if (coachTips.length === 0) coachTips.push({ cat: 'Maintenance', tip: 'Maintain your excellent habits!', details: 'Your routines are optimized! Consider tracking your habits continuously to prevent regression.', icon: '🌟', critical: false });

    return (
        <div className="container animate-fade-in" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
            <EmergencyBanner />
            {/* ── Top Header & Avatar ── */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div className={`avatar-container animate-fade-in-up ${avatarGlow}`} style={{ margin: '0 auto 1.5rem', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(10, 15, 30, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${scoreColor}`, position: 'relative', boxShadow: `0 0 30px ${scoreColor}66, inset 0 0 20px ${scoreColor}44` }}>
                    {/* Holographic Inner Ring */}
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', borderRadius: '50%', border: `1px dashed ${scoreColor}`, opacity: 0.5, animation: 'spin 10s linear infinite' }}></div>
                    
                    {userData.gender === 'female' ? (
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00F0FF', filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.8))' }}>
                            <path d="M12 2a4 4 0 0 1 4 4v1c0 2-2 3-4 3s-4-1-4-3V6a4 4 0 0 1 4-4z" />
                            <path d="M12 10c-3.3 0-6 2.7-6 6v5h12v-5c0-3.3-2.7-6-6-6z" />
                            <path d="M7.5 16s2 2 4.5 2 4.5-2 4.5-2" />
                            <path d="M16.5 10c1 0 2.5.5 3.5 2" />
                            <path d="M7.5 10c-1 0-2.5.5-3.5 2" />
                        </svg>
                    ) : (
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00F0FF', filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.8))' }}>
                            <path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                            <path d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" />
                        </svg>
                    )}
                    <div style={{ position: 'absolute', bottom: 5, right: 5, width: '24px', height: '24px', borderRadius: '50%', background: scoreColor, border: '2px solid #030712', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${scoreColor}` }}>
                        <span style={{color: '#030712', fontSize: '14px', fontWeight: 900}}>✓</span>
                    </div>
                </div>
                <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', textShadow: '0 0 30px rgba(0, 240, 255, 0.3)' }}>
                    {userData.name || 'Your'}'s Digital Twin
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 auto 1.5rem', maxWidth: '600px' }}>
                    A real-time AI-powered assessment of your biological health vectors.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1.25rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: `1px solid ${scoreColor}` }}>
                        <span style={{width: '8px', height: '8px', borderRadius: '50%', background: scoreColor, boxShadow: `0 0 10px ${scoreColor}`}}></span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Health Status: <span style={{color: scoreColor, fontWeight: 700}}>{statusText}</span></span>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/routine')}>
                        <span style={{marginRight: '0.4rem'}}>⚙️</span> Routine Planner
                    </button>
                    <button className="btn btn-outline" style={{ borderColor: '#00FF94', color: '#00FF94', boxShadow: 'inset 0 0 10px rgba(0,255,148,0.1)' }} onClick={() => navigate('/assistant')}>
                        <span style={{marginRight: '0.4rem'}}>🛡️</span> AI Assistant
                    </button>
                    <button className="btn btn-outline" style={{ borderColor: '#FF003C', color: '#FF003C', boxShadow: 'inset 0 0 10px rgba(255,0,60,0.1)' }} onClick={() => setShowSymptomModal(true)}>
                        <span style={{marginRight: '0.4rem'}}>🚨</span> Emergency Alert
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/questionnaire')}>
                        <span style={{marginRight: '0.4rem'}}>⚡</span> Update Profile
                    </button>
                </div>
            </div >

            {/* Emergency Symptom Modal */}
            {showSymptomModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="glass-panel animate-scale-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
                            <h2 style={{ margin: 0 }}>Emergency Report</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Select any severe symptoms you are currently experiencing.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                            {Object.entries(EMERGENCY_SYMPTOMS).map(([key, s]) => (
                                <button
                                    key={key}
                                    onClick={() => handleReportEmergency(key)}
                                    className="glass-panel"
                                    style={{
                                        padding: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem',
                                        border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s',
                                        background: 'rgba(255,255,255,0.02)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{s.icon || '⚠️'}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urgency: {s.severity}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline w-full" onClick={() => setShowSymptomModal(false)}>Cancel</button>
                        </div>
                        
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1.5rem', textAlign: 'center' }}>
                            ⚠️ This is not a substitute for 911 or local emergency services.
                        </p>
                    </div>
                </div>
            )}

            <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                marginTop: '3rem',
                lineHeight: 1.5,
                opacity: 0.6
            }}>
                🛡️ <strong>Health Twin Safety Note:</strong> This system provides general health guidance and should not replace professional medical advice. <br/>
                In case of severe symptoms, please contact a healthcare professional or emergency services immediately.
            </p>

            {/* ═══ HEALTH RISKS CARDS ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }} className="animate-fade-in-up delay-1">
                <RiskCard title="Stress Burden Index" icon="🧠" risk={p.stress_risk} color="#FFE600" />
                <RiskCard title="Metabolic Health Risk" icon="⚖️" risk={p.obesity_risk} color="#FF003C" />
                <RiskCard title="Sleep Efficiency Index" icon="💤" risk={p.sleep_disorder_risk} color="#FF00E5" />
            </div>

            <div className="dashboard-grid">

                {/* ═══ GAUGE: BIOLOGICAL HEALTH SCORE ═══ */}
                <ExpandableCard title="VITALS & HEALTH METRICS" icon="🧬" className="animate-fade-in-up delay-2" expandedContent={
                    <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on your lifestyle inputs, we simulate your biological age vector compared to chronological age.</p>
                        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Age</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{actualAge}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: scoreColor, letterSpacing: '0.05em' }}>Bio-Vector Age</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, textShadow: `0 0 20px ${scoreColor}88` }}>{healthAge}</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: healthAgeDiff <= 0 ? '#00FF94' : '#FF003C', background: healthAgeDiff <= 0 ? 'rgba(0, 255, 148, 0.1)' : 'rgba(255, 0, 60, 0.1)', border: `1px solid ${healthAgeDiff <= 0 ? '#00FF94' : '#FF003C'}`, padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.4rem' }}>
                                    {healthAgeDiff <= 0 ? `${Math.abs(healthAgeDiff)} cycles optimized` : `${healthAgeDiff} cycles degraded ⚠️`}
                                </div>
                            </div>
                        </div>
                    </div>
                }>
                    <div className="score-container" style={{ margin: '1rem 0' }}>
                        <div className="score-ring">
                            <svg width="180" height="180" viewBox="0 0 180 180">
                                {/* Background Ring */}
                                <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="12" />
                                {/* Glow Ring (optional) */}
                                <circle cx="90" cy="90" r="75" fill="none" stroke={scoreColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 75} strokeDashoffset={(2 * Math.PI * 75) * (1 - animatedScoreRing / 100)} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 1s ease', filter: `drop-shadow(0 0 15px ${scoreColor}CC)` }} />
                            </svg>
                            <div className="score-ring-value">
                                <span className="score-number" style={{ color: scoreColor, transition: 'color 1s ease', textShadow: `0 0 20px ${scoreColor}AA` }}>
                                    <AnimatedCounter value={p.health_score} duration={1500} />
                                </span>
                                <span className="score-label" style={{ color: '#00F0FF', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>out of 100</span>
                            </div>
                        </div>
                    </div>
                </ExpandableCard>

                {/* ═══ RADAR: LIFESTYLE BALANCE ═══ */}
                <ExpandableCard title="ACTIVITY BALANCE PROFILE" icon="🎯" className="animate-fade-in-up delay-2" expandedContent={
                    <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Comparison of your daily habits against optimal health-tech benchmarks.</p>
                        <table className="comparison-table">
                            <thead><tr><th>Habit Metric</th><th>Your Vector</th><th>Optimum Baseline</th></tr></thead>
                            <tbody>
                                <tr><td>Sleep Quality</td><td className={ls.sleep_hours < 7 ? 'text-warn' : 'text-good'}>{ls.sleep_hours || 7} hrs</td><td>7–8 hrs</td></tr>
                                <tr><td>Physical Activity</td><td className={ls.exercise_frequency < 3 ? 'text-warn' : 'text-good'}>{ls.exercise_frequency || 0} sessions/wk</td><td>3–5 sessions/wk</td></tr>
                                <tr><td>Screen Exposure</td><td className={ls.screen_time > 4 ? 'text-warn' : 'text-good'}>{ls.screen_time || 4} hrs</td><td>&lt; 3 hrs</td></tr>
                                <tr><td>Hydration</td><td className={ls.water_intake < 7 ? 'text-warn' : 'text-good'}>{getWaterLiters(ls.water_intake)}</td><td>3–5 Litres</td></tr>
                                <tr><td>Nutritional Quality</td><td className={ls.diet_quality < 7 ? 'text-warn' : 'text-good'}>{ls.diet_quality || 5} / 10</td><td>7+ / 10</td></tr>
                            </tbody>
                        </table>
                    </div>
                }>
                    <div style={{ height: '220px', margin: '0 auto', maxWidth: '280px' }}>
                        <Radar data={radarData} options={radarOptions} />
                    </div>
                </ExpandableCard>

                {/* ═══ FUTURE HEALTH PROJECTION ═══ */}
                <ExpandableCard title="LONG-TERM HEALTH OUTLOOK" icon="📉" className="dashboard-card-full animate-fade-in-up delay-3" expandedContent={
                    <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Your Digital Twin allows us to forward-simulate your health outcome over the next 3 years. The <strong>Orange Trajectory</strong> maps your current lifestyle score decay, while the <strong>Green Trajectory</strong> projects health gains if you adopt the AI Coach's recommendations.
                        </p>
                    </div>
                }>
                    <div style={{ height: '240px' }}><Line data={timelineData} options={timelineOptions} /></div>
                </ExpandableCard>

                {/* ═══ AI HEALTH COACH ═══ */}
                <ExpandableCard title="AI HEALTH RECOMMENDATIONS" icon="🤖" className="dashboard-card-full animate-fade-in-up delay-4" expandedContent={
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {coachTips.map((t, idx) => (
                            <div key={idx} className="glass-panel hover-glow" style={{ padding: '1.25rem', borderLeft: `4px solid ${t.critical ? '#EF4444' : '#10B981'}`, animationDelay: `${idx * 150}ms`, position: 'relative', overflow: 'hidden' }}>
                                {t.critical && <div style={{position: 'absolute', top: 0, right: 0, background: '#EF4444', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderBottomLeftRadius: '8px', fontWeight: 700}}>URGENT</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: t.critical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                        {t.icon}
                                    </div>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{t.cat}</strong>
                                </div>
                                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>{t.tip}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{t.details}</p>
                            </div>
                        ))}
                    </div>
                }>
                    <div className="coach-bubble" style={{ background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.1), rgba(15, 23, 42, 0.4))', borderLeft: `4px solid var(--primary)`, padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ position: 'relative' }}>
                            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=healthAI&backgroundColor=0ea5e9" alt="AI Coach" className="coach-avatar" style={{ boxShadow: '0 0 15px rgba(14,165,233,0.3)' }} />
                            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: '#10B981', borderRadius: '50%', border: '2px solid var(--bg-card)' }}></div>
                        </div>
                        <div className="coach-message">
                            <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>AI Health Architect</h4>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                "Analyzing your vectors, {userData.name}... to optimize your trajectory, focus aggressively on: <span style={{color: 'var(--primary-light)', fontWeight: 600}}>{coachTips[0].tip}</span>. Click to decrypt your personalized action models."
                            </p>
                        </div>
                    </div>
                </ExpandableCard>

                {/* ═══ WHAT-IF SIMULATION ═══ */}
                {whatIf && whatIfPredictions && (
                    <div className="dashboard-card dashboard-card-full animate-fade-in-up delay-5 hover-glow">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>🔬 LIFESTYLE IMPACT SIMULATOR</h3>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--primary-light)', padding: '0.3rem 0.8rem', borderRadius: '12px', fontWeight: 600 }}>REAL-TIME ENGINE</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Adjust the parameters below to instantly re-calculate your projected Digital Health Score.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                            <div>
                                <WhatIfSlider label="Exercise Frequency" icon="🏃" value={whatIf.exercise_frequency} unit=" days/wk" min={0} max={7} step={1} onChange={(v) => setWhatIf({ ...whatIf, exercise_frequency: v })} />
                                <WhatIfSlider label="Sleep Duration" icon="🌙" value={whatIf.sleep_hours} unit=" hrs/night" min={3} max={12} step={0.5} onChange={(v) => setWhatIf({ ...whatIf, sleep_hours: v })} />
                                <WhatIfSlider label="Screen Time" icon="💻" value={whatIf.screen_time} unit=" hrs/day" min={0} max={14} step={1} onChange={(v) => setWhatIf({ ...whatIf, screen_time: v })} />
                                <WhatIfSlider label="Water Intake" icon="💧" value={whatIf.water_intake} unit=" / 10" min={1} max={10} step={1} onChange={(v) => setWhatIf({ ...whatIf, water_intake: v })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ 
                                    background: 'rgba(15, 23, 42, 0.6)', 
                                    border: `1px solid ${whatIfPredictions.health_score > p.health_score ? 'rgba(16, 185, 129, 0.3)' : (whatIfPredictions.health_score < p.health_score ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)')}`,
                                    borderRadius: 'var(--radius-xl)', 
                                    padding: '2rem', 
                                    textAlign: 'center',
                                    width: '100%',
                                    maxWidth: '300px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: whatIfPredictions.health_score > p.health_score ? '0 0 30px rgba(16, 185, 129, 0.1)' : ''
                                }}>
                                    {whatIfPredictions.health_score > p.health_score && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#10B981'}}></div>}
                                    {whatIfPredictions.health_score < p.health_score && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#EF4444'}}></div>}
                                    
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Projected Score</div>
                                    <div style={{ 
                                        fontSize: '4.5rem', 
                                        fontWeight: 900, 
                                        lineHeight: 1,
                                        color: (whatIfPredictions.health_score > p.health_score ? '#10B981' : (whatIfPredictions.health_score < p.health_score ? '#EF4444' : 'var(--primary-light)')),
                                        transition: 'color 0.4s ease'
                                    }}>
                                        <AnimatedCounter value={whatIfPredictions.health_score} duration={500} />
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{Math.round(p.health_score)}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: whatIfPredictions.health_score > p.health_score ? '#10B981' : (whatIfPredictions.health_score < p.health_score ? '#EF4444' : 'var(--text-muted)') }}>
                                                {whatIfPredictions.health_score > p.health_score ? '↗' : (whatIfPredictions.health_score < p.health_score ? '↘' : '→')}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DELTA</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: whatIfPredictions.health_score > p.health_score ? '#10B981' : (whatIfPredictions.health_score < p.health_score ? '#EF4444' : 'var(--text-muted)') }}>
                                                {whatIfPredictions.health_score > p.health_score ? '+' : ''}{Math.round(whatIfPredictions.health_score - p.health_score)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};

export default Dashboard;
