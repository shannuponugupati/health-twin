import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    Search, 
    Filter, 
    Edit2, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    User,
    Mail,
    Hash,
    Heart,
    Zap,
    X,
    Save
} from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState({ age: 'all', score: 'all' });
    const [editingUser, setEditingUser] = useState(null);
    const [editData, setEditData] = useState({});
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const lifestyleSnap = await getDocs(collection(db, 'lifestyleData'));
            const predictionsSnap = await getDocs(collection(db, 'predictions'));

            const lifestyleMap = {};
            lifestyleSnap.forEach(d => lifestyleMap[d.id] = d.data());

            const predictionsMap = {};
            predictionsSnap.forEach(d => predictionsMap[d.id] = d.data());

            const combinedData = usersSnap.docs.map(uDoc => {
                const uData = uDoc.data();
                const lData = lifestyleMap[uDoc.id] || {};
                const pData = predictionsMap[uDoc.id] || {};
                return {
                    id: uDoc.id,
                    name: uData.name || 'Anonymous',
                    email: uData.email || 'N/A',
                    age: lData.age || 'N/A',
                    score: pData.health_score || 0,
                    stress: lData.stress_level || 'N/A',
                    phone: uData.phone || 'N/A'
                };
            });

            setUsers(combinedData);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This will remove all their health data.')) return;
        
        try {
            await deleteDoc(doc(db, 'users', id));
            await deleteDoc(doc(db, 'lifestyleData', id));
            await deleteDoc(doc(db, 'predictions', id));
            await deleteDoc(doc(db, 'routines', id));
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete user.');
        }
    };

    const handleEditSave = async () => {
        try {
            const userRef = doc(db, 'users', editingUser.id);
            const lifestyleRef = doc(db, 'lifestyleData', editingUser.id);

            await updateDoc(userRef, { name: editData.name, phone: editData.phone });
            await updateDoc(lifestyleRef, { age: editData.age });

            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editData } : u));
            setEditingUser(null);
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update user.');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const ageVal = parseInt(u.age);
        const matchesAge = filter.age === 'all' || 
                          (filter.age === '18-30' && ageVal >= 18 && ageVal <= 30) ||
                          (filter.age === '31-50' && ageVal >= 31 && ageVal <= 50) ||
                          (filter.age === '50+' && ageVal > 50);

        const scoreVal = parseInt(u.score);
        const matchesScore = filter.score === 'all' ||
                            (filter.score === 'high' && scoreVal >= 80) ||
                            (filter.score === 'mid' && scoreVal >= 50 && scoreVal < 80) ||
                            (filter.score === 'low' && scoreVal < 50);

        return matchesSearch && matchesAge && matchesScore;
    });

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400">View, search, and manage platform users and their health records.</p>
                </div>
                <button onClick={fetchUsers} className="btn btn-outline flex items-center gap-2">
                    <Activity size={16} /> Refresh Data
                </button>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0f1e] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Filter size={16} /> Filter by:
                    </div>
                    <select 
                        value={filter.age}
                        onChange={(e) => setFilter({...filter, age: e.target.value})}
                        className="bg-gray-800/50 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                        <option value="all">Any Age</option>
                        <option value="18-30">18 - 30</option>
                        <option value="31-50">31 - 50</option>
                        <option value="50+">50 +</option>
                    </select>

                    <select 
                        value={filter.score}
                        onChange={(e) => setFilter({...filter, score: e.target.value})}
                        className="bg-gray-800/50 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                        <option value="all">Any Score</option>
                        <option value="high">High Score (80+)</option>
                        <option value="mid">Mid Score (50-79)</option>
                        <option value="low">Low Score (&lt;50)</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-panel overflow-hidden border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/30 border-b border-gray-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">User Profile</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Age</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Stress</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                                        <div className="processing-orb w-10 h-10 mx-auto mb-4"></div>
                                        Fetching records...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500 text-sm">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{u.name}</p>
                                                <p className="text-gray-500 text-xs">ID: {u.id.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                                <Mail size={12} className="text-gray-500" /> {u.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                                <Hash size={12} className="text-gray-500" /> {u.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium text-white">{u.age}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-sm font-bold ${u.score >= 80 ? 'text-green-500' : u.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {u.score}
                                            </span>
                                            <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${u.score >= 80 ? 'bg-green-500' : u.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${u.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                            u.stress.toLowerCase().includes('low') ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                            u.stress.toLowerCase().includes('high') ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                        }`}>
                                            {u.stress}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { setEditingUser(u); setEditData(u); }}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="px-6 py-4 bg-gray-800/10 border-t border-gray-800 flex items-center justify-between">
                    <p className="text-gray-500 text-xs font-medium">
                        Showing <span className="text-gray-300">{filteredUsers.length}</span> of <span className="text-gray-300">{users.length}</span> total users
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 cursor-not-allowed"><ChevronLeft size={18} /></button>
                        <button className="w-8 h-8 rounded bg-blue-600 text-white text-xs font-bold">1</button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg p-8 relative">
                        <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>
                        
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit2 size={20} className="text-blue-500" /> Edit User Health Record
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Modify core profile data for {editingUser.email}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                    <input 
                                        type="text" 
                                        value={editData.name} 
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                        className="w-full bg-[#0a0f1e] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Age</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                        <input 
                                            type="number" 
                                            value={editData.age} 
                                            onChange={(e) => setEditData({...editData, age: e.target.value})}
                                            className="w-full bg-[#0a0f1e] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                        <input 
                                            type="text" 
                                            value={editData.phone} 
                                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                            className="w-full bg-[#0a0f1e] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setEditingUser(null)} className="btn btn-outline flex-1 py-3 text-sm">Cancel</button>
                            <button onClick={handleEditSave} className="btn btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
