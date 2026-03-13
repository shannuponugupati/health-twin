import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                navigate('/dashboard');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: formData.name });
                await setDoc(doc(db, 'users', user.uid), {
                    name: formData.name,
                    email: formData.email,
                    createdAt: serverTimestamp()
                });
                navigate('/profile');
            }
        } catch (err) {
            const errorMessages = {
                'auth/email-already-in-use': 'This email is already registered.',
                'auth/invalid-email': 'Invalid email address.',
                'auth/weak-password': 'Password should be at least 6 characters.',
                'auth/user-not-found': 'No account found with this email.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-credential': 'Invalid email or password.',
            };
            setError(errorMessages[err.code] || err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container min-h-screen flex items-center justify-center animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem', flexDirection: 'column' }}>
            {/* Steps */}
            <div className="steps-bar mb-6">
                <div className="step-item">
                    <div className="step-circle active">1</div>
                </div>
                <div className="step-line"></div>
                <div className="step-item">
                    <div className="step-circle">2</div>
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

            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-6">
                    <h2 className="text-gradient" style={{ fontSize: '1.75rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ margin: 0 }}>
                        {isLogin ? 'Sign in to access your digital twin' : 'Start building your health digital twin'}
                    </p>
                </div>

                {error && (
                    <div className={`alert ${error.includes('successful') ? 'alert-success' : 'alert-error'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text" name="name" className="form-input"
                                placeholder="John Doe"
                                onChange={handleInputChange} required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email" name="email" className="form-input"
                            placeholder="you@example.com"
                            onChange={handleInputChange} required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password" name="password" className="form-input"
                            placeholder="••••••••"
                            onChange={handleInputChange} required
                        />
                    </div>

                    <button
                        type="submit" className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In →' : 'Create Account →')}
                    </button>
                </form>

                <div className="text-center mt-6" style={{ fontSize: '0.875rem' }}>
                    <p style={{ margin: 0 }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            style={{ color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {isLogin ? 'Sign up' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
