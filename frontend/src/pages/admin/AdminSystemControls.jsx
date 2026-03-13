import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    Settings, 
    MessageSquare, 
    Mail, 
    Bot, 
    ShieldAlert, 
    Activity, 
    Clock, 
    ToggleLeft, 
    ToggleRight,
    Save,
    CheckCircle2,
    Database,
    AlertTriangle
} from 'lucide-react';

const AdminSystemControls = () => {
    const [settings, setSettings] = useState({
        smsEnabled: true,
        emailEnabled: false,
        aiAssistantEnabled: true,
        maintenanceMode: false,
        debugMode: false
    });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Settings
                const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
                if (settingsDoc.exists()) {
                    setSettings(settingsDoc.data());
                } else {
                    // Initialize if not exists
                    await setDoc(doc(db, 'settings', 'global'), settings);
                }

                // Fetch Logs (Mocking if collection doesn't exist yet, or typical structure)
                const logsSnap = await getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(10)));
                const logsData = logsSnap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    timestamp: d.data().timestamp?.toDate().toLocaleString() || new Date().toLocaleString()
                }));
                
                if (logsData.length === 0) {
                    // Sample logs if empty
                    setLogs([
                        { id: '1', action: 'Admin Login', user: 'admin@healthtwin.ai', timestamp: new Date().toLocaleString(), status: 'success' },
                        { id: '2', action: 'User Update', user: 'admin@healthtwin.ai', timestamp: new Date().toLocaleString(), status: 'success' },
                        { id: '3', action: 'System Backup', user: 'System', timestamp: new Date().toLocaleString(), status: 'success' }
                    ]);
                } else {
                    setLogs(logsData);
                }
            } catch (err) {
                console.error('Settings Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await setDoc(doc(db, 'settings', 'global'), settings);
            setMessage('Settings updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Save Error:', err);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="processing-orb w-10 h-10"></div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">System Controls</h1>
                    <p className="text-gray-400">Manage platform features, notifications, and security settings.</p>
                </div>
                {message && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} /> {message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Feature Toggles */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Feature Management</h3>
                                <p className="text-xs text-gray-500">Toggle core platform functionalities in real-time.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'smsEnabled', label: 'SMS Reminders', desc: 'Enable automated routine alerts via Twilio.', icon: MessageSquare },
                                { key: 'emailEnabled', label: 'Email Notifications', desc: 'Send daily digests and critical health alerts via email.', icon: Mail },
                                { key: 'aiAssistantEnabled', label: 'AI Health Assistant', desc: 'Enable the Gemini-powered chat interface for users.', icon: Bot },
                                { key: 'debugMode', label: 'System Debugging', desc: 'Enable verbose logging for technical troubleshooting.', icon: Database },
                            ].map((item) => {
                                const Icon = item.icon;
                                const enabled = settings[item.key];
                                return (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/20 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${enabled ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.label}</p>
                                                <p className="text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggle(item.key)} className="focus:outline-none">
                                            {enabled ? (
                                                <ToggleRight className="text-blue-500" size={40} strokeWidth={1} />
                                            ) : (
                                                <ToggleLeft className="text-gray-700" size={40} strokeWidth={1} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="btn btn-primary px-8 py-3 font-bold flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : <><Save size={18} /> Apply Changes</>}
                            </button>
                        </div>
                    </div>

                    {/* Critical Controls */}
                    <div className="glass-panel p-8 border-red-500/10">
                        <div className="flex items-center gap-3 mb-8 text-red-500">
                            <ShieldAlert size={24} />
                            <h3 className="text-xl font-bold">Danger Zone</h3>
                        </div>

                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-red-500">Maintenance Mode</p>
                                <p className="text-xs text-gray-500">Force the application into a read-only state for all users.</p>
                            </div>
                            <button onClick={() => handleToggle('maintenanceMode')} className="focus:outline-none">
                                {settings.maintenanceMode ? (
                                    <ToggleRight className="text-red-500" size={40} strokeWidth={1} />
                                ) : (
                                    <ToggleLeft className="text-gray-700" size={40} strokeWidth={1} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Logs Sidebar */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Activity size={16} className="text-blue-500" /> Recent Activity
                        </h3>
                        <Clock size={16} className="text-gray-600" />
                    </div>

                    <div className="space-y-6">
                        {logs.map((log) => (
                            <div key={log.id} className="relative pl-6 pb-6 border-l border-gray-800 last:pb-0">
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-300">{log.action}</p>
                                    <p className="text-[10px] text-gray-500">{log.user}</p>
                                    <p className="text-[9px] text-gray-600 font-mono mt-1">{log.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-8 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors border-t border-gray-800 pt-4">
                        View Full System Logs
                        <AlertTriangle size={12} className="inline ml-2 opacity-50" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemControls;
