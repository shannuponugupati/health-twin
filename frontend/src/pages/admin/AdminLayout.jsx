import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../App';
import { 
    LayoutDashboard, 
    Users, 
    BarChart3, 
    Settings, 
    ClipboardList, 
    LogOut,
    Menu,
    X,
    UserCircle,
    Bell
} from 'lucide-react';

const AdminLayout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'System Controls', path: '/admin/settings', icon: Settings },
        { name: 'Logs', path: '/admin/logs', icon: ClipboardList },
    ];

    return (
        <div className="min-h-screen bg-[#030712] flex overflow-hidden">
            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1e] border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}
            >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧬</span>
                        <span className="font-bold text-white text-lg tracking-tight">Admin Portal</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                                    active 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                }`}
                            >
                                <Icon size={18} className={active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-40">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex-1 px-4 hidden md:block">
                        <h2 className="text-gray-400 text-sm font-medium">
                            {navItems.find(i => i.path === location.pathname)?.name || 'Admin'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800">
                            <Bell size={18} />
                        </button>
                        <div className="h-8 w-[1px] bg-gray-800 mx-2"></div>
                        <div className="flex items-center gap-3 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                            <UserCircle size={20} className="text-blue-400" />
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-bold text-white leading-none">Admin</p>
                                <p className="text-[10px] text-gray-400 mt-1">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
