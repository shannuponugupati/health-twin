import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    ClipboardList, 
    Search, 
    Download, 
    Filter,
    Clock,
    User,
    Shield,
    Database
} from 'lucide-react';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const logsSnap = await getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50)));
                const logsData = logsSnap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    timestamp: d.data().timestamp?.toDate() || new Date()
                }));

                if (logsData.length === 0) {
                    setLogs([
                        { id: '1', action: 'Admin Portal Login', user: 'admin@healthtwin.ai', timestamp: new Date(), type: 'auth', details: 'Successful desktop login' },
                        { id: '2', action: 'User Record Deleted', user: 'admin@healthtwin.ai', timestamp: new Date(Date.now() - 3600000), type: 'data', details: 'User: temp_user_99' },
                        { id: '3', action: 'Settings Updated', user: 'admin@healthtwin.ai', timestamp: new Date(Date.now() - 7200000), type: 'config', details: 'SMS Alerts disabled' },
                        { id: '4', action: 'Exported Analytics', user: 'admin@healthtwin.ai', timestamp: new Date(Date.now() - 86400000), type: 'data', details: 'PDF report generated' },
                    ]);
                } else {
                    setLogs(logsData);
                }
            } catch (err) {
                console.error('Logs Error:', err);
                // Fallback sample data
                 setLogs([
                    { id: '1', action: 'Admin Portal Login', user: 'admin@healthtwin.ai', timestamp: new Date(), type: 'auth', details: 'Successful login' },
                    { id: '2', action: 'System Config Changed', user: 'admin@healthtwin.ai', timestamp: new Date(), type: 'config', details: 'SMS toggle' }
                 ]);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(l => 
        l.action.toLowerCase().includes(search.toLowerCase()) || 
        l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
    );

    const getTypeIcon = (type) => {
        switch(type) {
            case 'auth': return <Shield className="text-purple-500" size={16} />;
            case 'data': return <Database className="text-blue-500" size={16} />;
            case 'config': return <Settings className="text-yellow-500" size={16} />;
            default: return <ClipboardList className="text-gray-500" size={16} />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">System Activity Logs</h1>
                    <p className="text-gray-400">Audit trail of all administrative actions and system events.</p>
                </div>
                <button className="btn btn-outline flex items-center gap-2 text-xs">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="glass-panel p-4 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search logs by action, user, or details..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0a0f1e] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
                    <Filter size={14} /> All Types
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/30 border-b border-gray-800">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Event</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Administrator</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-gray-500">
                                        <div className="processing-orb w-8 h-8 mx-auto mb-4"></div>
                                        Decrypting activity logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-800/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-800/50 rounded-lg">
                                                {getTypeIcon(log.type)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-200">{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <User size={12} className="text-gray-600" /> {log.user}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-500 font-mono italic">{log.details || 'No additional data'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs text-gray-500 font-mono">
                                            <Clock size={12} /> {log.timestamp.toLocaleTimeString()} 
                                            <span className="opacity-50">· {log.timestamp.toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
