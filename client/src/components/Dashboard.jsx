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
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user?.email) {
            navigate('/login');
        }
    }, [navigate, user]);

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

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

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
                        <h1>Media Toolbox</h1>
                        <p>Convert, compress, and edit your images, documents, and media files instantly.</p>
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
                        <div className="chart-header">
                            <h2>Conversion Activity</h2>
                            <p className="chart-subtitle">Files processed over the last 30 days</p>
                        </div>
                        <div className="chart-placeholder">
                            <div className="bar-chart">
                                <div className="bar" style={{ height: '40%' }}></div>
                                <div className="bar" style={{ height: '55%' }}></div>
                                <div className="bar" style={{ height: '70%' }}></div>
                                <div className="bar" style={{ height: '50%' }}></div>
                                <div className="bar" style={{ height: '80%' }}></div>
                                <div className="bar" style={{ height: '65%' }}></div>
                                <div className="bar" style={{ height: '75%' }}></div>
                            </div>
                        </div>
                    </section>

                    <section className="activity-container">
                        <div className="activity-header">
                            <h2>Advertisement</h2>
                            <p className="activity-subtitle">Sponsored Content</p>
                        </div>
                        <div className="ad-placeholder">
                            <div className="ad-content">
                                <div className="ad-text">
                                    <p>Google Ad Placeholder</p>
                                    <small>Your ad could be here</small>
                                </div>
                                <div className="ad-badge">AD</div>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="tools-section">
                    <div className="tools-header">
                        <h2>Popular Tools</h2>
                        <a href="#" className="explore-link">Explore all →</a>
                    </div>
                    <div className="tools-grid">
                        <div className="tool-card">
                            <span className="tool-icon">🗜️</span>
                            <h3>Image Compressor</h3>
                            <p>Reduce image size while maintaining quality.</p>
                        </div>
                        <div className="tool-card">
                            <span className="tool-icon">🔄</span>
                            <h3>Format Converter</h3>
                            <p>Convert between PNG, JPG, WebP, and more.</p>
                        </div>
                        <div className="tool-card">
                            <span className="tool-icon">📐</span>
                            <h3>Image Resizer</h3>
                            <p>Scale images to any dimension instantly.</p>
                        </div>
                        <div className="tool-card">
                            <span className="tool-icon">📄</span>
                            <h3>PDF Merger</h3>
                            <p>Combine multiple PDF files into one.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Dashboard