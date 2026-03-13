import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { generateRoutine, generateDietPlan, formatTime12 } from '../utils/routineGenerator';

// ── Config ──────────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// ── Sub-Components ───────────────────────────────────────────────────────────

const TimelineEvent = ({ event, index, isNext, onToggle, onComplete, onTimeChange }) => {
    const [visible, setVisible] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editTime, setEditTime] = useState(event.time);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), index * 80);
        return () => clearTimeout(t);
    }, [index]);

    const handleTimeSave = () => {
        setIsEditingTime(false);
        if (editTime !== event.time) {
            onTimeChange(event.key, editTime);
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            marginBottom: '0.5rem',
        }}>
            {/* Time column */}
            <div style={{ minWidth: '85px', textAlign: 'right', paddingTop: '0.75rem' }}>
                {isEditingTime ? (
                    <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        onBlur={handleTimeSave}
                        autoFocus
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.5)',
                            border: `1px solid ${event.color}`,
                            color: '#fff',
                            borderRadius: '4px',
                            padding: '0.2rem',
                            fontSize: '0.75rem',
                            outline: 'none',
                        }}
                    />
                ) : (
                    <span 
                        onClick={() => setIsEditingTime(true)}
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isNext ? event.color : 'var(--text-muted)',
                            lineHeight: 1,
                            cursor: 'pointer',
                            display: 'inline-block',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid transparent',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                        title="Click to edit time"
                    >
                        {formatTime12(event.time)} ✏️
                    </span>
                )}
            </div>

            {/* Spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '36px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: event.enabled ? `${event.color}22` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${event.enabled ? event.color : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    boxShadow: isNext && event.enabled ? `0 0 16px ${event.color}55` : 'none',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                }}>
                    {event.icon}
                </div>
                <div style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '24px',
                    background: `linear-gradient(180deg, ${event.color}55, transparent)`,
                    marginTop: '4px',
                }} />
            </div>

            {/* Card */}
            <div style={{
                flex: 1,
                background: isNext ? `linear-gradient(135deg, ${event.color}22, rgba(10, 15, 30, 0.8))` : 'rgba(10, 15, 30, 0.5)',
                border: `1px solid ${isNext ? event.color : 'rgba(0, 240, 255, 0.1)'}`,
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isNext ? `0 0 20px ${event.color}22` : 'inset 0 0 10px rgba(0, 240, 255, 0.02)'
            }}>
                {isNext && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: event.color,
                        boxShadow: `0 0 10px ${event.color}`
                    }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                        {/* Completion Checkbox */}
                        <button
                            onClick={() => onComplete(event.key)}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: `2px solid ${event.completed ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                                background: event.completed ? '#10B981' : 'transparent',
                                color: event.completed ? '#030712' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                marginTop: '0.2rem',
                                padding: 0,
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                boxShadow: event.completed ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                            title={event.completed ? "Mark as pending" : "Mark as completed"}
                        >
                            ✓
                        </button>
                        <div style={{ 
                            textDecoration: event.completed ? 'line-through' : 'none', 
                            opacity: event.completed ? 0.5 : 1,
                            transition: 'opacity 0.3s'
                        }}>
                            <div style={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: event.enabled ? 'var(--text-main)' : 'var(--text-muted)',
                                marginBottom: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                {event.label}
                                {isNext && !event.completed && (
                                    <span style={{
                                        fontSize: '0.65rem',
                                        background: event.color,
                                        color: '#030712',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: 900,
                                        letterSpacing: '0.1em',
                                        boxShadow: `0 0 10px ${event.color}`
                                    }}>
                                        NEXT UP
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {event.description}
                            </div>
                        </div>
                    </div>

                    {/* SMS Toggle */}
                    <div
                        onClick={() => onToggle(event.key)}
                        title={event.enabled ? 'Disable SMS reminder' : 'Enable SMS reminder'}
                        style={{
                            marginLeft: '1rem',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{
                            width: '42px',
                            height: '24px',
                            borderRadius: '12px',
                            background: event.enabled ? event.color : 'rgba(255,255,255,0.05)',
                            position: 'relative',
                            transition: 'background 0.3s ease',
                            border: `1px solid ${event.enabled ? event.color : 'rgba(0, 240, 255, 0.2)'}`,
                            boxShadow: event.enabled ? `0 0 10px ${event.color}88` : 'none'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: event.enabled ? '20px' : '2px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'white',
                                transition: 'left 0.3s ease',
                                boxShadow: event.enabled ? `0 0 10px #FFFFFF` : 'none',
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DietMealCard = ({ meal, icon, color, items, tips }) => (
    <div style={{
        background: `rgba(10, 15, 30, 0.6)`,
        border: `1px solid ${color}44`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '4px',
        padding: '1.25rem',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: `0 4px 15px ${color}11, inset 0 0 20px ${color}05`
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${color}33, inset 0 0 20px ${color}11`; e.currentTarget.style.border = `1px solid ${color}`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 15px ${color}11, inset 0 0 20px ${color}05`; e.currentTarget.style.border = `1px solid ${color}44`; e.currentTarget.style.borderLeft = `3px solid ${color}`; }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 5px ${color}88)` }}>{icon}</span>
            <strong style={{ color: color, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meal}</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: 2 }}>
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        {tips && (
            <div style={{
                marginTop: '1rem',
                fontSize: '0.8rem',
                color: '#00F0FF',
                background: `rgba(0, 240, 255, 0.1)`,
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '4px',
                padding: '0.5rem 0.75rem',
                lineHeight: 1.5,
            }}>
                💡 {tips}
            </div>
        )}
    </div>
);

// ── Main Page ───────────────────────────────────────────────────────────────

const RoutinePlanner = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [routine, setRoutine] = useState([]);
    const [dietPlan, setDietPlan] = useState(null);
    const [userData, setUserData] = useState(null);
    const [smsStatus, setSmsStatus] = useState('idle'); // 'idle' | 'scheduling' | 'scheduled' | 'error'
    const [globalSmsEnabled, setGlobalSmsEnabled] = useState(true);
    const [smsMode, setSmsMode] = useState('mock');

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const [lifestyleSnap, userSnap] = await Promise.all([
                    getDoc(doc(db, 'lifestyleData', user.uid)),
                    getDoc(doc(db, 'users', user.uid)),
                ]);

                if (!lifestyleSnap.exists()) {
                    navigate('/questionnaire');
                    return;
                }

                const ls = lifestyleSnap.data();
                const ud = userSnap.exists() ? userSnap.data() : { name: user.displayName || 'User' };
                setUserData({ ...ud, ...ls });

                const generatedRoutine = generateRoutine(ls);
                setRoutine(generatedRoutine);

                const diet = generateDietPlan(ls.diet_preference || 'vegetarian');
                setDietPlan(diet);

                // Save routine to Firestore
                await setDoc(doc(db, 'routines', user.uid), {
                    routine: generatedRoutine,
                    dietPlan: diet,
                    generatedAt: serverTimestamp(),
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, navigate]);

    const toggleReminder = useCallback((key) => {
        setRoutine(prev => prev.map(e => e.key === key ? { ...e, enabled: !e.enabled } : e));
    }, []);

    const toggleCompletion = useCallback((key) => {
        setRoutine(prev => {
            const up = prev.map(e => e.key === key ? { ...e, completed: !e.completed } : e);
            if (user) {
                setDoc(doc(db, 'routines', user.uid), { routine: up }, { merge: true }).catch(console.error);
            }
            return up;
        });
    }, [user]);

    const changeTime = useCallback((key, newTime) => {
        setRoutine(prev => {
            // Update time and re-sort
            const updated = prev.map(e => e.key === key ? { ...e, time: newTime } : e);
            const sorted = updated.sort((a, b) => {
                const aMins = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
                const bMins = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
                return aMins - bMins;
            });

            if (user) {
                setDoc(doc(db, 'routines', user.uid), { routine: sorted }, { merge: true }).catch(console.error);
            }
            return sorted;
        });
    }, [user]);

    const handleEnableAllSms = async () => {
        if (!userData?.phone) {
            alert('No phone number found. Please update your questionnaire.');
            return;
        }
        setSmsStatus('scheduling');

        const enabledRoutine = globalSmsEnabled ? routine : routine.map(r => ({ ...r, enabled: true }));

        try {
            const res = await fetch(`${BACKEND_URL}/api/sms/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    phone: userData.phone,
                    reminders: enabledRoutine.map(r => ({
                        key: r.key,
                        time: r.time,
                        smsMessage: r.smsMessage,
                        enabled: r.enabled,
                    }))
                }),
            });
            const data = await res.json();
            setSmsStatus('scheduled');
            setSmsMode(data.mode || 'mock');
            setGlobalSmsEnabled(true);
        } catch (err) {
            console.error('SMS schedule error:', err);
            setSmsStatus('error');
        }
    };

    const handleCancelSms = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/sms/cancel/${user.uid}`, { method: 'DELETE' });
            setGlobalSmsEnabled(false);
            setSmsStatus('idle');
        } catch (err) {
            console.error('Cancel error:', err);
        }
    };

    // Determine which event is "next"
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const nextEventKey = (() => {
        const toMins = str => { const [h, m] = str.split(':').map(Number); return h * 60 + m; };
        const future = routine.filter(r => toMins(r.time) > nowMinutes);
        return future.length > 0 ? future[0].key : (routine[0]?.key);
    })();

    const dietLabel = userData?.diet_preference === 'non-vegetarian' ? 'Non-Vegetarian'
        : userData?.diet_preference === 'vegan' ? 'Vegan' : 'Vegetarian';

    if (loading) return (
        <div className="container min-h-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="processing-orb" style={{ width: '60px', height: '60px', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Analyzing health vectors and optimizing your plan...</p>
            </div>
        </div>
    );

    const enabledCount = routine.filter(r => r.enabled).length;
    const completedCount = routine.filter(r => r.completed).length;
    const totalCount = routine.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getFeedbackMessage = () => {
        if (totalCount === 0) return null;
        if (completionPercentage === 100) return { emoji: '🏆', text: 'Perfect Day! You nailed every single habit.', color: '#10B981' };
        if (completionPercentage >= 75) return { emoji: '🔥', text: 'Excellent work! Your consistency is building strong neural pathways.', color: '#3B82F6' };
        if (completionPercentage >= 50) return { emoji: '📈', text: 'Good effort! You are halfway there. Keep pushing momentum.', color: '#F59E0B' };
        if (completionPercentage > 0) return { emoji: '🌱', text: 'Every step counts. Focus on completing just one more habit tomorrow.', color: '#8B5CF6' };
        return { emoji: '🌅', text: 'A new day is a fresh start. Try completing your first habit tomorrow morning!', color: 'var(--text-secondary)' };
    };

    const feedback = getFeedbackMessage();

    return (
        <div className="container animate-fade-in" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>

            {/* ── Header ── */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗓️</div>
                <h1 className="text-gradient" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                    Personalized Health Optimization Plan
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
                    Your personalized health schedule, crafted by AI based on your lifestyle data.
                </p>

                {/* User info pill */}
                {userData && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[
                            { icon: '🌅', label: `Wake: ${formatTime12(userData.wake_time || '06:00')}` },
                            { icon: '🌙', label: `Sleep: ${formatTime12(userData.sleep_time || '22:30')}` },
                            { icon: '🥗', label: dietLabel },
                            { icon: '🏃', label: (userData.exercise_preference || 'flexible').charAt(0).toUpperCase() + (userData.exercise_preference || 'flexible').slice(1) + ' Exercise' },
                        ].map((pill, i) => (
                            <div key={i} style={{
                                background: 'rgba(14,165,233,0.1)',
                                border: '1px solid rgba(14,165,233,0.2)',
                                borderRadius: '20px',
                                padding: '0.35rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: '0.35rem'
                            }}>
                                {pill.icon} {pill.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>

                {/* ── LEFT: Timeline ── */}
                <div>
                    {/* SMS Control Panel */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(255, 0, 229, 0.05))',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '1.5rem',
                        boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                    📲 SMS Reminders
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {userData?.phone || 'No phone number saved'} · {enabledCount} active reminders
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {smsStatus === 'scheduled' ? (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '0.3rem' }}>
                                            ✅ {smsMode === 'mock' ? 'Mock Mode Active' : 'Reminders Live'}
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}
                                            onClick={handleCancelSms}
                                        >
                                            Cancel All
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 1.2rem' }}
                                        onClick={handleEnableAllSms}
                                        disabled={smsStatus === 'scheduling'}
                                    >
                                        {smsStatus === 'scheduling' ? '⏳ Scheduling...' : '🔔 Enable SMS Reminders'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {smsStatus === 'scheduled' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.75rem' }}>
                                {smsMode === 'mock'
                                    ? '⚠️ Running in mock mode. Add real Twilio credentials to backend/.env to send actual SMS.'
                                    : '✅ Real SMS reminders are active! You will receive messages at the scheduled times.'}
                            </div>
                        )}
                        {smsStatus === 'error' && (
                            <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.5rem' }}>
                                ❌ Could not connect to backend. Ensure the backend server is running on port 3000.
                            </div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>📅 Daily Timeline</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Toggle 🔔 to manage SMS
                            </span>
                        </div>

                        {routine.map((event, idx) => (
                            <TimelineEvent
                                key={event.key}
                                event={event}
                                index={idx}
                                isNext={event.key === nextEventKey}
                                onToggle={toggleReminder}
                                onComplete={toggleCompletion}
                                onTimeChange={changeTime}
                            />
                        ))}
                    </div>

                    {/* Feedback Card */}
                    {feedback && (
                        <div className="glass-panel" style={{ 
                            marginTop: '1.5rem', 
                            padding: '1.5rem', 
                            borderLeft: `4px solid ${feedback.color}`,
                            background: `linear-gradient(90deg, ${feedback.color}11, transparent)`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📊</span> Daily Recap
                                </h3>
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: '1.2rem', 
                                    color: feedback.color,
                                    textShadow: `0 0 10px ${feedback.color}55`
                                }}>
                                    {completionPercentage}%
                                </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${completionPercentage}%`, 
                                    background: feedback.color,
                                    borderRadius: '4px',
                                    transition: 'width 1s ease-out',
                                    boxShadow: `0 0 10px ${feedback.color}`
                                }} />
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem',
                                color: 'var(--text-main)',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ fontSize: '1.5rem', filter: `drop-shadow(0 0 5px ${feedback.color}55)` }}>
                                    {feedback.emoji}
                                </span>
                                <span>{feedback.text}</span>
                            </div>
                            <div style={{ 
                                marginTop: '0.75rem', 
                                fontSize: '0.8rem', 
                                color: 'var(--text-secondary)',
                                textAlign: 'right'
                            }}>
                                {completedCount} of {totalCount} tasks completed
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-outline w-full mt-4"
                        onClick={() => navigate('/dashboard')}
                        style={{ marginTop: '1rem' }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {/* ── RIGHT: Diet Plan ── */}
                <div>
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.75rem' }}>🥗</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Clinical Dietary Guidance</h3>
                                <span style={{
                                    fontSize: '0.75rem',
                                    background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700,
                                }}>
                                    {dietLabel} Plan
                                </span>
                            </div>
                        </div>

                        {dietPlan && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <DietMealCard meal="Breakfast" icon="🌄" color="#F97316" items={dietPlan.breakfast.items} tips={dietPlan.breakfast.tips} />
                                <DietMealCard meal="Mid-Morning Snack" icon="🍎" color="#EF4444" items={dietPlan.midMorning.items} tips={dietPlan.midMorning.tips} />
                                <DietMealCard meal="Lunch" icon="🥗" color="#22C55E" items={dietPlan.lunch.items} tips={dietPlan.lunch.tips} />
                                <DietMealCard meal="Evening Snack" icon="☕" color="#F59E0B" items={dietPlan.eveningSnack.items} tips={dietPlan.eveningSnack.tips} />
                                <DietMealCard meal="Dinner" icon="🍜" color="#8B5CF6" items={dietPlan.dinner.items} tips={dietPlan.dinner.tips} />
                            </div>
                        )}
                    </div>

                    {/* Health Tips Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 148, 0.05), rgba(0, 240, 255, 0.05))',
                        border: '1px solid rgba(0, 255, 148, 0.3)',
                        borderRadius: '4px',
                        padding: '1.5rem',
                        boxShadow: '0 0 20px rgba(0, 255, 148, 0.05)'
                    }}>
                        <h4 style={{ margin: '0 0 1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>💡</span> Daily Health Tips
                        </h4>
                        {[
                            { icon: '💧', text: 'Drink a glass of water first thing after waking up.' },
                            { icon: '🧘', text: 'Even 10 minutes of light stretching improves focus and energy.' },
                            { icon: '📵', text: 'Avoid screens 30 minutes before bedtime for deeper sleep.' },
                            { icon: '🍽️', text: 'Eat slowly and mindfully — stop eating when 80% full.' },
                            { icon: '🌿', text: 'Step outside for at least 15 minutes of sunlight each day.' },
                        ].map((tip, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'flex-start',
                                marginBottom: '0.75rem',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                            }}>
                                <span style={{ flexShrink: 0, marginTop: '1px' }}>{tip.icon}</span>
                                <span style={{ lineHeight: 1.5 }}>{tip.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoutinePlanner;
