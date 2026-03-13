import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

const questions = [
    {
        key: 'sleep_hours',
        title: '🌙 How many hours do you sleep per night?',
        options: [
            { label: 'Less than 5 hours', value: 4 },
            { label: '5–7 hours', value: 6 },
            { label: '7–8 hours', value: 7.5 },
            { label: 'More than 8 hours', value: 9 },
        ]
    },
    {
        key: 'sleep_quality',
        title: '😴 How would you rate your sleep quality?',
        options: [
            { label: 'Poor – I wake up tired', value: 2 },
            { label: 'Fair – Not great', value: 4 },
            { label: 'Good – I feel rested', value: 7 },
            { label: 'Excellent – Deep sleep', value: 9 },
        ]
    },
    {
        key: 'exercise_frequency',
        title: '🏃 How often do you exercise?',
        options: [
            { label: 'Rarely', value: 0 },
            { label: '1–2 times/week', value: 2 },
            { label: '3–5 times/week', value: 4 },
            { label: 'Daily', value: 7 },
        ]
    },
    {
        key: 'physical_activity',
        title: '🚶 What is your daily physical activity level?',
        options: [
            { label: 'Sedentary (desk job)', value: 1 },
            { label: 'Lightly active', value: 4 },
            { label: 'Moderately active', value: 6 },
            { label: 'Very active', value: 9 },
        ]
    },
    {
        key: 'water_intake',
        title: '💧 How much water do you drink daily?',
        options: [
            { label: '1 litre', value: 2 },
            { label: '3 litres', value: 5 },
            { label: '5 litres', value: 7 },
            { label: '8 litres', value: 9 },
        ]
    },
    {
        key: 'diet_quality',
        title: '🥗 How often do you eat fruits & vegetables?',
        options: [
            { label: 'Rarely', value: 2 },
            { label: 'A few times/week', value: 5 },
            { label: 'Daily', value: 7 },
            { label: 'Every meal', value: 9 },
        ]
    },
    {
        key: 'fast_food',
        title: '🍔 How often do you eat fast food or junk food?',
        options: [
            { label: 'Daily', value: 9 },
            { label: '3–5 times/week', value: 7 },
            { label: '1–2 times/week', value: 4 },
            { label: 'Rarely or never', value: 1 },
        ]
    },
    {
        key: 'screen_time',
        title: '📱 How much screen time do you have daily?',
        options: [
            { label: 'Less than 2 hours', value: 1.5 },
            { label: '2–5 hours', value: 3.5 },
            { label: '5–8 hours', value: 6.5 },
            { label: 'More than 8 hours', value: 9 },
        ]
    },
    {
        key: 'stress_level',
        title: '😰 What is your usual stress level?',
        options: [
            { label: 'Low', value: 2 },
            { label: 'Medium', value: 5 },
            { label: 'High', value: 8 },
            { label: 'Very High', value: 10 },
        ]
    },
    {
        key: 'energy_level',
        title: '⚡ How would you rate your daily energy level?',
        options: [
            { label: 'Very low – Always tired', value: 2 },
            { label: 'Low – Often fatigued', value: 4 },
            { label: 'Good – Energetic most days', value: 7 },
            { label: 'Excellent – Full of energy', value: 9 },
        ]
    }
];

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(10, 15, 30, 0.5)',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    borderRadius: '4px',
    color: '#00F0FF',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 0 10px rgba(0, 240, 255, 0.05)'
};

const SelectField = ({ label, icon, value, onChange, options }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            {icon} {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
        >
            <option value="" disabled>Select an option</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const TimeField = ({ label, icon, value, onChange }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            {icon} {label}
        </label>
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
        />
    </div>
);

const InputField = ({ label, icon, value, onChange, placeholder, type = 'text' }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            {icon} {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
        />
    </div>
);

const Questionnaire = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState('questionnaire'); // 'questionnaire' | 'routine'

    // Load saved answers from localStorage on mount (now namespaced per user)
    React.useEffect(() => {
        if (!user?.uid) return;
        const saved = localStorage.getItem(`healthTwin_answers_${user.uid}`);
        if (saved) {
            try { setAnswers(JSON.parse(saved)); } catch (e) {}
        }

        const savedRoutine = localStorage.getItem(`healthTwin_routine_${user.uid}`);
        if (savedRoutine) {
            try { setRoutinePrefs(JSON.parse(savedRoutine)); } catch (e) {}
        }
    }, [user?.uid]);

    // Routine preferences state
    const [routinePrefs, setRoutinePrefs] = useState({
        phone: '',
        age: '',
        schedule: '',
        wakeTime: '06:00',
        sleepTime: '22:30',
        dietPreference: '',
        exercisePreference: '',
    });

    const setRp = (key, val) => {
        setRoutinePrefs(p => {
            const up = { ...p, [key]: val };
            if (user?.uid) {
                localStorage.setItem(`healthTwin_routine_${user.uid}`, JSON.stringify(up));
            }
            return up;
        });
    };

    const handleAutoFillRoutine = () => {
        const up = {
            phone: '+1234567890',
            age: '30',
            schedule: '9to5',
            wakeTime: '07:00',
            sleepTime: '23:00',
            dietPreference: 'vegetarian',
            exercisePreference: 'morning',
        };
        setRoutinePrefs(up);
        if (user?.uid) {
            localStorage.setItem(`healthTwin_routine_${user.uid}`, JSON.stringify(up));
        }
    };

    const handleSelect = (key, value) => {
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);
        if (user?.uid) {
            localStorage.setItem(`healthTwin_answers_${user.uid}`, JSON.stringify(newAnswers));
        }
    };

    const handleAutoFill = () => {
        const demoAnswers = {
            sleep_hours: 7.5,
            sleep_quality: 7,
            exercise_frequency: 4,
            physical_activity: 6,
            water_intake: 5,
            diet_quality: 7,
            fast_food: 1,
            screen_time: 3.5,
            stress_level: 5,
            energy_level: 7
        };
        setAnswers(demoAnswers);
        if (user?.uid) {
            localStorage.setItem(`healthTwin_answers_${user.uid}`, JSON.stringify(demoAnswers));
        }
    };

    const calculatePredictions = (d) => {
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
        score += water * 0.7;
        score += diet * 1.2;
        score -= fastFood * 0.9;
        score -= Math.max(0, screen - 3) * 1.2;
        score -= stress * 1.3;
        score += energy * 0.6;
        score = Math.max(0, Math.min(100, score));

        const obesity_risk = Math.min(100, Math.max(0,
            55 - (exercise * 6) - (activity * 2) - (diet * 2.5)
            + (fastFood * 4) + (screen * 1.5) + (stress * 1.5) - (water * 0.8)
        ));
        const stress_risk = Math.min(100, Math.max(0,
            stress * 9 - (exercise * 2.5) - (sleep * 1.5) - (sleepQ * 1)
            + (screen * 1.5) - (energy * 1) + (fastFood * 0.5)
        ));
        const sleep_disorder_risk = Math.min(100, Math.max(0,
            (10 - sleep) * 6 + (10 - sleepQ) * 3 + (screen * 2.5)
            + (stress * 3) - (exercise * 2) - (activity * 1) - (energy * 0.5)
        ));

        return {
            health_score: parseFloat(score.toFixed(1)),
            obesity_risk: parseFloat(obesity_risk.toFixed(1)),
            stress_risk: parseFloat(stress_risk.toFixed(1)),
            sleep_disorder_risk: parseFloat(sleep_disorder_risk.toFixed(1))
        };
    };

    const allAnswered = questions.every(q => answers[q.key] !== undefined);
    const progress = Object.keys(answers).length;

    const routinePrefsComplete = routinePrefs.phone.trim() &&
        routinePrefs.age.trim() &&
        routinePrefs.schedule &&
        routinePrefs.wakeTime &&
        routinePrefs.sleepTime &&
        routinePrefs.dietPreference &&
        routinePrefs.exercisePreference;

    const handleNextPhase = () => {
        if (!allAnswered) return;
        setPhase('routine');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!routinePrefsComplete) return;
        setLoading(true);
        try {
            const fullData = {
                ...answers,
                phone: routinePrefs.phone,
                age: parseInt(routinePrefs.age, 10) || 25,
                work_schedule: routinePrefs.schedule,
                wake_time: routinePrefs.wakeTime,
                sleep_time: routinePrefs.sleepTime,
                diet_preference: routinePrefs.dietPreference,
                exercise_preference: routinePrefs.exercisePreference,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, 'lifestyleData', user.uid), fullData);

            const predictions = calculatePredictions(answers);
            await setDoc(doc(db, 'predictions', user.uid), {
                ...predictions,
                updatedAt: serverTimestamp()
            });

            navigate('/processing');
        } catch (err) {
            console.error(err);
            alert('Error saving data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-sm animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            {/* Steps */}
            <div className="steps-bar">
                <div className="step-item">
                    <div className="step-circle completed" style={{ background: '#00F0FF', color: '#030712', boxShadow: '0 0 10px #00F0FF' }}>✓</div>
                </div>
                <div className="step-line active" style={{ background: '#00F0FF', boxShadow: '0 0 5px #00F0FF' }}></div>
                <div className="step-item">
                    <div className="step-circle completed" style={{ background: '#00F0FF', color: '#030712', boxShadow: '0 0 10px #00F0FF' }}>✓</div>
                </div>
                <div className="step-line active" style={{ background: '#00F0FF', boxShadow: '0 0 5px #00F0FF' }}></div>
                <div className="step-item">
                    <div className={`step-circle ${phase === 'questionnaire' ? 'active' : 'completed'}`} style={phase === 'questionnaire' ? { border: '2px solid #00F0FF', color: '#00F0FF', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' } : { background: '#00F0FF', color: '#030712', boxShadow: '0 0 10px #00F0FF' }}>
                        {phase === 'questionnaire' ? '3' : '✓'}
                    </div>
                </div>
                <div className={`step-line ${phase === 'routine' ? 'active' : ''}`} style={phase === 'routine' ? { background: '#00F0FF', boxShadow: '0 0 5px #00F0FF' } : {}}></div>
                <div className="step-item">
                    <div className={`step-circle ${phase === 'routine' ? 'active' : ''}`} style={phase === 'routine' ? { border: '2px solid #00F0FF', color: '#00F0FF', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' } : {}}>4</div>
                </div>
            </div>

            {/* ── PHASE 1: HEALTH QUESTIONNAIRE ── */}
            {phase === 'questionnaire' && (
                <>
                    <div className="glass-panel-static mb-4 text-center" style={{
                        background: 'rgba(10, 15, 30, 0.8)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '2rem',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)'
                    }}>
                        <h2 className="text-gradient" style={{ fontSize: '1.75rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}>System Calibration Questionnaire</h2>
                        <p style={{ margin: '0.5rem 0 0' }}>Answer all 10 questions about your lifestyle habits.</p>
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                            <div style={{
                                flex: 1, maxWidth: '200px', height: '6px',
                                background: 'rgba(0, 240, 255, 0.1)', borderRadius: '3px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(progress / questions.length) * 100}%`,
                                    height: '100%', borderRadius: '3px',
                                    background: 'var(--gradient-primary)',
                                    transition: 'width 0.4s ease',
                                    boxShadow: '0 0 10px #00F0FF'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#00F0FF', fontWeight: 600 }}>
                                {progress}/{questions.length}
                            </span>
                        </div>
                    </div>

                    {questions.map((q, idx) => (
                        <div key={q.key} className="glass-panel mb-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                                    Q{idx + 1}.
                                </span>
                                {q.title}
                            </h3>
                            <div className="option-grid option-grid-2">
                                {q.options.map(opt => (
                                    <div
                                        key={opt.label}
                                        className={`option-card ${answers[q.key] === opt.value ? 'selected' : ''}`}
                                        onClick={() => handleSelect(q.key, opt.value)}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                        <button
                            className="btn btn-outline w-full"
                            onClick={handleAutoFill}
                            style={{ padding: '0.75rem', borderColor: 'rgba(0, 240, 255, 0.3)' }}
                        >
                            ⚡ Auto-Fill Demo Data
                        </button>
                        <button
                            className="btn btn-primary btn-lg w-full"
                            onClick={handleNextPhase}
                            disabled={!allAnswered}
                            style={{ marginBottom: '2rem' }}
                        >
                            {`➡️ Next: Personalize Your Daily Routine (${progress}/${questions.length})`}
                        </button>
                    </div>
                </>
            )}

            {/* ── PHASE 2: ROUTINE PREFERENCES ── */}
            {phase === 'routine' && (
                <div className="animate-fade-in">
                    <div className="glass-panel-static mb-4 text-center" style={{
                        background: 'rgba(10, 15, 30, 0.8)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '2rem',
                        boxShadow: '0 0 30px rgba(0, 240, 255, 0.05)'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.5))' }}>🗓️</div>
                        <h2 className="text-gradient" style={{ fontSize: '1.75rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}>Personalize Your Daily Routine</h2>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                            Your AI core will craft a perfect daily schedule and construct SMS data streams.
                        </p>
                    </div>

                    <div className="glass-panel mb-4 animate-fade-in-up">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem', color: 'white', fontWeight: 700 }}>STEP 1</span>
                            Personal Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1.5rem' }}>
                            <InputField
                                label="Mobile Phone Number"
                                icon="📱"
                                placeholder="+91 98765 43210"
                                value={routinePrefs.phone}
                                onChange={v => setRp('phone', v)}
                                type="tel"
                            />
                            <InputField
                                label="Age"
                                icon="🎂"
                                placeholder="e.g. 25"
                                value={routinePrefs.age}
                                onChange={v => setRp('age', v)}
                                type="number"
                            />
                        </div>
                        <SelectField
                            label="Work / Study Schedule"
                            icon="💼"
                            value={routinePrefs.schedule}
                            onChange={v => setRp('schedule', v)}
                            options={[
                                { label: '9 AM – 5 PM (Office Hours)', value: '9to5' },
                                { label: 'Flexible / Work From Home', value: 'flexible' },
                                { label: 'Shift Worker (Rotating)', value: 'shift' },
                                { label: 'Student', value: 'student' },
                                { label: 'Freelancer', value: 'freelancer' },
                            ]}
                        />
                    </div>

                    <div className="glass-panel mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem', color: 'white', fontWeight: 700 }}>STEP 2</span>
                            Sleep Schedule
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1.5rem' }}>
                            <TimeField
                                label="Preferred Wake-up Time"
                                icon="🌅"
                                value={routinePrefs.wakeTime}
                                onChange={v => setRp('wakeTime', v)}
                            />
                            <TimeField
                                label="Preferred Sleep Time"
                                icon="🌙"
                                value={routinePrefs.sleepTime}
                                onChange={v => setRp('sleepTime', v)}
                            />
                        </div>
                    </div>

                    <div className="glass-panel mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem', color: 'white', fontWeight: 700 }}>STEP 3</span>
                            Health Preferences
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1.5rem' }}>
                            <SelectField
                                label="Diet Preference"
                                icon="🥗"
                                value={routinePrefs.dietPreference}
                                onChange={v => setRp('dietPreference', v)}
                                options={[
                                    { label: '🥦 Vegetarian', value: 'vegetarian' },
                                    { label: '🍗 Non-Vegetarian', value: 'non-vegetarian' },
                                    { label: '🌱 Vegan', value: 'vegan' },
                                ]}
                            />
                            <SelectField
                                label="Exercise Preference"
                                icon="🏃"
                                value={routinePrefs.exercisePreference}
                                onChange={v => setRp('exercisePreference', v)}
                                options={[
                                    { label: '🌄 Morning (6 AM – 8 AM)', value: 'morning' },
                                    { label: '🌇 Evening (5 PM – 7 PM)', value: 'evening' },
                                    { label: '🔄 Flexible / Any Time', value: 'flexible' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* SMS Reminder info box */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(0, 255, 148, 0.05))',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.05)'
                    }}>
                        <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px #00F0FF)' }}>💬</span>
                        <div>
                            <p style={{ margin: 0, color: '#00F0FF', fontWeight: 600, marginBottom: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SMS Data Streams Will Be Synchronized</p>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                Based on your schedule, we'll stream SMS alerts to your mobile network for Wake Up, Meals, Water, Exercise, and Sleep time.
                                You can recalibrate individual signals from your Dashboard.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setPhase('questionnaire')}
                            style={{ flex: '0 0 auto' }}
                        >
                            ← Back
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={handleAutoFillRoutine}
                            style={{ flex: 1, borderColor: 'rgba(0, 240, 255, 0.3)' }}
                        >
                            ⚡ Auto-Fill Demo Routine
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSubmit}
                            disabled={!routinePrefsComplete || loading}
                            style={{ flex: '1 0 100%', marginBottom: '2rem' }}
                        >
                            {loading ? '⏳ Generating Your AI Routine...' : '🧬 Generate Digital Twin & Daily Routine'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questionnaire;
