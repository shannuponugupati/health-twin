import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    Users, 
    Activity, 
    Heart, 
    Moon, 
    Zap,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Pie, Scatter, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="glass-panel p-6 border-l-4" style={{ borderColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(trend)}% from last month</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-gray-800/50 text-${color}`}>
                <Icon size={24} style={{ color }} />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        avgHealthScore: 0,
        avgSleep: 0,
        avgStress: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Users
                const usersSnap = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnap.size;

                // Fetch Lifestyle Data
                const lifestyleSnap = await getDocs(collection(db, 'lifestyleData'));
                let totalSleep = 0;
                let totalStress = 0;
                const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0 };
                const stressDist = { 'Low': 0, 'Moderate': 0, 'High': 0 };

                lifestyleSnap.forEach(doc => {
                    const data = doc.data();
                    totalSleep += parseFloat(data.sleep_hours || 0);
                    
                    const stressVal = data.stress_level?.toLowerCase() || 'moderate';
                    if (stressVal.includes('low')) stressDist['Low']++;
                    else if (stressVal.includes('high')) stressDist['High']++;
                    else stressDist['Moderate']++;

                    const age = parseInt(data.age || 0);
                    if (age <= 25) ageGroups['18-25']++;
                    else if (age <= 35) ageGroups['26-35']++;
                    else if (age <= 45) ageGroups['36-45']++;
                    else if (age <= 60) ageGroups['46-60']++;
                    else ageGroups['60+']++;
                });

                // Fetch Predictions
                const predSnap = await getDocs(collection(db, 'predictions'));
                let totalScore = 0;
                const scores = [];
                const sleepVsScore = [];

                predSnap.forEach(doc => {
                    const data = doc.data();
                    const score = parseFloat(data.health_score || 0);
                    totalScore += score;
                    
                    // Match with lifestyle data for scatter plot
                    const lData = lifestyleSnap.docs.find(d => d.id === doc.id)?.data();
                    if (lData) {
                        sleepVsScore.push({ x: parseFloat(lData.sleep_hours || 0), y: score });
                    }
                });

                setStats({
                    totalUsers,
                    activeUsers: Math.round(totalUsers * 0.8), // Mocking active users as 80% for now
                    avgHealthScore: totalUsers ? Math.round(totalScore / totalUsers) : 0,
                    avgSleep: totalUsers ? (totalSleep / totalUsers).toFixed(1) : 0,
                    avgStress: 'Moderate'
                });

                setChartData({
                    ageDist: {
                        labels: Object.keys(ageGroups),
                        datasets: [{
                            label: 'Users',
                            data: Object.values(ageGroups),
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: '#3b82f6',
                            borderWidth: 1
                        }]
                    },
                    stressDist: {
                        labels: Object.keys(stressDist),
                        datasets: [{
                            data: Object.values(stressDist),
                            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    sleepVsScore: {
                        datasets: [{
                            label: 'Sleep vs Score',
                            data: sleepVsScore,
                            backgroundColor: '#a855f7'
                        }]
                    }
                });

            } catch (err) {
                console.error('Dashboard Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="processing-orb" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                    <p className="text-gray-400">Real-time platform performance and health statistics.</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-sm">Last synchronized:</p>
                    <p className="text-white text-sm font-medium">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} trend={12} color="#3b82f6" />
                <StatCard title="Active Users" value={stats.activeUsers} icon={Activity} trend={8} color="#10b981" />
                <StatCard title="Avg Health Score" value={stats.avgHealthScore} icon={Heart} trend={4} color="#ef4444" />
                <StatCard title="Avg Sleep Hrs" value={stats.avgSleep} icon={Moon} trend={-2} color="#a855f7" />
                <StatCard title="Avg Stress" value={stats.avgStress} icon={Zap} color="#f59e0b" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Age Distribution */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">User Age Distribution</h3>
                    <div className="h-64">
                        {chartData && (
                            <Bar 
                                data={chartData.ageDist} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
                                        x: { grid: { display: false }, ticks: { color: '#6b7280' } }
                                    }
                                }} 
                            />
                        )}
                    </div>
                </div>

                {/* Stress Distribution */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Stress Level Distribution</h3>
                    <div className="h-64 flex justify-center">
                        {chartData && (
                            <Pie 
                                data={chartData.stressDist}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { 
                                        legend: { 
                                            position: 'right',
                                            labels: { color: '#9ca3af', usePointStyle: true, padding: 20 }
                                        } 
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Sleep vs Score */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Correlation: Sleep vs Health Score</h3>
                    <div className="h-64">
                        {chartData && (
                            <Scatter 
                                data={chartData.sleepVsScore}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: { title: { display: true, text: 'Sleep Hours', color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
                                        y: { title: { display: true, text: 'Health Score', color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Exercise Frequency (Line Chart Placeholder for now) */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Exercise Frequency Analysis</h3>
                    <div className="h-64">
                        <Line 
                            data={{
                                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                                datasets: [{
                                    label: 'Exercise Vol.',
                                    data: [12, 19, 3, 5, 2, 3, 10],
                                    borderColor: '#10b981',
                                    tension: 0.4,
                                    fill: true,
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
                                    x: { grid: { display: false }, ticks: { color: '#6b7280' } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
