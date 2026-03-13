import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height: '',
        weight: '',
        gender: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: ''
    });

    useEffect(() => {
        // Pre-fill from existing Firestore data
        const loadProfile = async () => {
            if (!user) return;
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                    const d = snap.data();
                    setFormData({
                        name: d.name || user.displayName || '',
                        age: d.age || '',
                        height: d.height || '',
                        weight: d.weight || '',
                        gender: d.gender || '',
                        phone: d.phone || '',
                        emergency_contact_name: d.emergency_contact_name || '',
                        emergency_contact_phone: d.emergency_contact_phone || '',
                        emergency_contact_relation: d.emergency_contact_relation || ''
                    });
                } else {
                    setFormData(prev => ({ ...prev, name: user.displayName || '' }));
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadProfile();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGender = (g) => {
        setFormData({ ...formData, gender: g });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                email: user.email,
                age: parseInt(formData.age) || null,
                height: parseFloat(formData.height) || null,
                weight: parseFloat(formData.weight) || null,
                gender: formData.gender,
                phone: formData.phone,
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_phone: formData.emergency_contact_phone,
                emergency_contact_relation: formData.emergency_contact_relation,
                updatedAt: serverTimestamp()
            }, { merge: true });
            navigate('/questionnaire');
        } catch (err) {
            console.error(err);
            alert('Error saving profile');
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
                    <div className="step-circle active" style={{ border: '2px solid #00F0FF', color: '#00F0FF', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>2</div>
                </div>
                <div className="step-line"></div>
                <div className="step-item">
                    <div className="step-circle">3</div>
                </div>
                <div className="step-line"></div>
                <div className="step-item">
                    <div className="step-circle">4</div>
                </div>
            </div>

            <div className="glass-panel">
                <div className="text-center mb-6">
                    <h2 className="text-gradient">Your Profile</h2>
                    <p>Tell us about yourself to build your digital twin.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text" name="name" className="form-input"
                            placeholder="Enter your name"
                            value={formData.name} onChange={handleChange} required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Age</label>
                        <input
                            type="number" name="age" className="form-input"
                            placeholder="e.g. 25"
                            value={formData.age} onChange={handleChange} required
                            min="10" max="120"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Height (cm)</label>
                            <input
                                type="number" name="height" className="form-input"
                                placeholder="e.g. 170"
                                value={formData.height} onChange={handleChange} required
                                min="50" max="300"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Weight (kg)</label>
                            <input
                                type="number" name="weight" className="form-input"
                                placeholder="e.g. 70"
                                value={formData.weight} onChange={handleChange} required
                                min="10" max="500"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Your Phone Number (for SMS alerts)</label>
                        <input
                            type="tel" name="phone" className="form-input"
                            placeholder="e.g. 9876543210"
                            value={formData.phone} onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className={`gender-btn ${formData.gender === 'Male' ? 'active' : ''}`}
                                onClick={() => handleGender('Male')}
                            >
                                👨 Male
                            </button>
                            <button
                                type="button"
                                className={`gender-btn ${formData.gender === 'Female' ? 'active' : ''}`}
                                onClick={() => handleGender('Female')}
                            >
                                👩 Female
                            </button>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(0, 240, 255, 0.2)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#FF003C', display: 'flex', alignItems: 'center', gap: '0.5rem', textShadow: '0 0 10px rgba(255, 0, 60, 0.5)' }}>
                            🚨 Emergency Override Contact
                        </h4>
                        
                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input
                                type="text" name="emergency_contact_name" className="form-input"
                                placeholder="Person to notify in emergency"
                                value={formData.emergency_contact_name} onChange={handleChange} required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel" name="emergency_contact_phone" className="form-input"
                                    placeholder="e.g. 9876543210"
                                    value={formData.emergency_contact_phone} onChange={handleChange} required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Relationship</label>
                                <input
                                    type="text" name="emergency_contact_relation" className="form-input"
                                    placeholder="e.g. Spouse / Parent"
                                    value={formData.emergency_contact_relation} onChange={handleChange} required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit" className="btn btn-primary btn-lg w-full mt-4"
                        disabled={loading || !formData.gender}
                    >
                        {loading ? 'Saving...' : 'Continue →'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
