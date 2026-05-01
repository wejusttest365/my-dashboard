import React, { useEffect, useState } from "react";
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';

const statsKey = 'mediaToolMetrics';

function loadDashboardStats() {
    const defaults = { convertedImages: 0, compressedImages: 0, totalSavedBytes: 0 };
    try {
        return Object.assign(defaults, JSON.parse(localStorage.getItem(statsKey)) || {});
    } catch {
        return defaults;
    }
}

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
}

function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(loadDashboardStats());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ GOOGLE + LOCAL STORAGE USER HANDLE
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const name = params.get("name");
        const email = params.get("email");

        if (name && email) {
            const userData = { name, email };

            localStorage.setItem("user", JSON.stringify(userData));

            // 🔥 HARD FIX: reload page after saving
            window.location.href = "/dashboard";
        }
    }, []);

    // ✅ SAFE REDIRECT (NO INSTANT BUG)
    useEffect(() => {
        const stored = localStorage.getItem("user");

        if (!stored) {
            navigate('/login');
        }
    }, [navigate]);

    // ✅ FETCH METRICS
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const res = await fetch(`${BASE_URL}/metrics/${user.email}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.metrics);
                } else {
                    setStats(loadDashboardStats());
                }
            } catch (err) {
                console.error('Error fetching metrics:', err);
                setStats(loadDashboardStats());
            }
        };

        if (user?.email) {
            fetchStats();
        }

        const refreshStats = () => {
            if (user?.email) {
                fetchStats();
            }
        };

        window.addEventListener('focus', refreshStats);
        return () => window.removeEventListener('focus', refreshStats);

    }, [user]);

    // ✅ LOGOUT
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // ✅ LOADING STATE (IMPORTANT)
    if (loading) {
        return <h2>Loading...</h2>;
    }

    const metrics = [
        { label: 'Converted Images', value: stats.convertedImages.toLocaleString(), change: `${stats.convertedImages > 0 ? '+' + Math.min(99, Math.round((stats.convertedImages / 10) || 1)) + '% this month' : '+0% this month'}`, icon: '🔄', accent: '#6366f1' },
        { label: 'Compressed Images', value: stats.compressedImages.toLocaleString(), change: `${stats.compressedImages > 0 ? 'Saved ' + bytesToSize(stats.totalSavedBytes) : 'Space saved'}`, icon: '🗜️', accent: '#10b981' },
        { label: 'Storage Saved', value: bytesToSize(stats.totalSavedBytes), change: `${stats.convertedImages + stats.compressedImages} tasks completed`, icon: '💾', accent: '#f59e0b' },
        { label: 'Success Rate', value: '99.8%', change: 'All conversions', icon: '✅', accent: '#ef4444' },
    ];

    return (
        <div className="app-container">
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="main-content">
                <div className="header">
                    <div>
                        <h1>Welcome {user?.name} 👋</h1>
                        <p>Convert, compress, and edit your media files instantly.</p>
                    </div>
                </div>

                <section className="metrics-grid">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="metric-card">
                            <div className="metric-header">
                                <span className="metric-icon">{metric.icon}</span>
                                <p className="metric-label">{metric.label}</p>
                            </div>
                            <h2 className="metric-value">{metric.value}</h2>
                            <p className="metric-change">{metric.change}</p>
                        </div>
                    ))}
                </section>

                <div className="content-grid">
                    <section className="chart-container">
                        <h2>Conversion Activity</h2>
                    </section>

                    <section className="activity-container">
                        <h2>Advertisement</h2>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;