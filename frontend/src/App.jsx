import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Questionnaire from './pages/Questionnaire';
import Processing from './pages/Processing';
import Dashboard from './pages/Dashboard';
import RoutinePlanner from './pages/RoutinePlanner';
import HealthAssistant from './pages/HealthAssistant';

import './index.css';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                <div className="processing-orb" style={{ width: '50px', height: '50px' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
            </div>
        );
    }

    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

// Route guard
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/auth" />;
};

// Navbar
const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <a className="navbar-brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                    🧬 AI Health Twin
                </a>
                <div className="flex gap-2">
                    {user ? (
                        <>
                            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
                            <button className="btn btn-ghost" onClick={() => navigate('/routine')} style={{ fontSize: '0.85rem' }}>📅 Routine</button>
                            <button className="btn btn-ghost" onClick={() => navigate('/assistant')} style={{ fontSize: '0.85rem' }}>🛡️ Assistant</button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => navigate('/auth')}>
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="app-container">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/questionnaire" element={<PrivateRoute><Questionnaire /></PrivateRoute>} />
                        <Route path="/processing" element={<PrivateRoute><Processing /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/routine" element={<PrivateRoute><RoutinePlanner /></PrivateRoute>} />
                        <Route path="/assistant" element={<PrivateRoute><HealthAssistant /></PrivateRoute>} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
