import { NavLink } from 'react-router-dom';
import { useState } from 'react';

function Sidebar({ user, onLogout }) {
    const [expandedSections, setExpandedSections] = useState({
        imageTools: true,
        documentTools: false,
        utilities: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="logo"><span>Web</span></div>
                <div className="logo-text">
                    <h3>Web Tool</h3>
                    <p>Ocean</p>
                </div>
            </div>

            <nav className="sidebar-menu">
                <div className="menu-section">
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                        <span className="icon">🏠</span>
                        <span>Dashboard</span>
                    </NavLink>
                </div>

                <div className="menu-section">
                    <p className="menu-groupLabel" onClick={() => toggleSection('imageTools')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>IMAGE TOOLS</span>
                        <span className="toggle-icon">{expandedSections.imageTools ? '−' : '+'}</span>
                    </p>
                    {expandedSections.imageTools && (
                        <>
                            <NavLink to="/converter" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                                <span className="icon">🔄</span>
                                <span>Converter</span>
                            </NavLink>
                            <NavLink to="/compress" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                                <span className="icon">🗜️</span>
                                <span>Compress</span>
                            </NavLink>
                            <NavLink to="/resize" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                                <span className="icon">📐</span>
                                <span>Resize</span>
                            </NavLink>
                            <NavLink to="/crop" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                                <span className="icon">✂️</span>
                                <span>Crop</span>
                            </NavLink>
                            <a href="#" className="menu-item">
                                <span className="icon">🎨</span>
                                <span>Filters</span>
                            </a>
                        </>
                    )}
                </div>

                <div className="menu-section">
                    <p className="menu-groupLabel" onClick={() => toggleSection('documentTools')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>DOCUMENT TOOLS</span>
                        <span className="toggle-icon">{expandedSections.documentTools ? '−' : '+'}</span>
                    </p>
                    {expandedSections.documentTools && (
                        <>
                            <NavLink to="/merge" className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                                <span className="icon">📄</span>
                                <span>PDF Merger</span>
                            </NavLink>
                            <a href="#" className="menu-item">
                                <span className="icon">📋</span>
                                <span>PDF Splitter</span>
                            </a>
                            <a href="#" className="menu-item">
                                <span className="icon">📝</span>
                                <span>OCR</span>
                            </a>
                            <a href="#" className="menu-item">
                                <span className="icon">🔒</span>
                                <span>Watermark</span>
                            </a>
                        </>
                    )}
                </div>

                <div className="menu-section">
                    <p className="menu-groupLabel" onClick={() => toggleSection('utilities')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>UTILITIES</span>
                        <span className="toggle-icon">{expandedSections.utilities ? '−' : '+'}</span>
                    </p>
                    {expandedSections.utilities && (
                        <>
                            <a href="#" className="menu-item">
                                <span className="icon">🎬</span>
                                <span>Video Tools</span>
                            </a>
                            <a href="#" className="menu-item">
                                <span className="icon">🎵</span>
                                <span>Audio Tools</span>
                            </a>
                            <a href="#" className="menu-item">
                                <span className="icon">🔐</span>
                                <span>Encryption</span>
                            </a>
                            <a href="#" className="menu-item">
                                <span className="icon">📊</span>
                                <span>JSON Tools</span>
                            </a>
                        </>
                    )}
                </div>
            </nav>

            <div className="sidebar-bottom">
                <div className="user-info">
                    <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
                    <div>
                        <p>{user?.name || 'User'}</p>
                        <small>{user?.email || 'No email'}</small>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
        </aside>
    );
}

export default Sidebar;
