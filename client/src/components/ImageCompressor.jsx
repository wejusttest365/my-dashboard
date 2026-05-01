import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { NavLink } from 'react-router-dom';
const ACCEPTED_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

const MAX_SIZE = 50 * 1024 * 1024;

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
}

function ImageCompressor() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const historyKey = 'imageCompressorHistory';
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState('');
    const [outputName, setOutputName] = useState('');
    const [quality, setQuality] = useState(0.75);
    const metricsKey = 'mediaToolMetrics';
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(historyKey)) || [];
        } catch {
            return [];
        }
    });
    const [isCompressing, setIsCompressing] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user?.email) {
            navigate('/login');
        }
    }, [navigate, user]);

    useEffect(() => {
        localStorage.setItem(historyKey, JSON.stringify(recent));
    }, [recent]);

    const validateFile = (candidate) => {
        if (!candidate) {
            setError('No file selected.');
            return false;
        }
        if (!ACCEPTED_TYPES[candidate.type]) {
            setError('Unsupported file type. Use PNG, JPG, or WEBP.');
            return false;
        }
        if (candidate.size > MAX_SIZE) {
            setError('File is too large. Maximum size is 50MB.');
            return false;
        }
        return true;
    };

    const setSelectedFile = (selectedFile) => {
        if (!selectedFile) return;
        if (!validateFile(selectedFile)) return;
        setFile(selectedFile);
        setError('');
        setOutputUrl('');
        setOutputName('');
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setSelectedFile(event.dataTransfer.files[0]);
    };

    const handleBrowse = () => {
        inputRef.current?.click();
    };

    const readAsDataURL = (selectedFile) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
        });

    const dataURLToBlob = (dataUrl) => {
        const [header, base64] = dataUrl.split(',');
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            array[i] = binary.charCodeAt(i);
        }
        const mime = header.match(/:(.*?);/)[1];
        return new Blob([array], { type: mime });
    };

    const updateMetrics = async (patch) => {
        const defaults = { convertedImages: 0, compressedImages: 0, totalSavedBytes: 0 };
        const current = (() => {
            try {
                return Object.assign(defaults, JSON.parse(localStorage.getItem(metricsKey)) || {});
            } catch {
                return defaults;
            }
        })();
        const next = {
            ...current,
            convertedImages: current.convertedImages + (patch.convertedImages || 0),
            compressedImages: current.compressedImages + (patch.compressedImages || 0),
            totalSavedBytes: current.totalSavedBytes + (patch.totalSavedBytes || 0),
        };
        localStorage.setItem(metricsKey, JSON.stringify(next));

        // Send to backend
        if (user?.email) {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
                await fetch(`${BASE_URL}/metrics/${user.email}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patch)
                });
            } catch (err) {
                console.error('Error updating metrics on server:', err);
            }
        }
    };

    const compressImage = async () => {
        if (!file) {
            setError('Choose an image first.');
            return;
        }

        setError('');
        setIsCompressing(true);

        try {
            const dataUrl = await readAsDataURL(file);
            const image = new Image();
            image.src = dataUrl;

            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            const outputType = file.type === 'image/png' ? 'image/webp' : file.type;
            const compressedDataUrl = canvas.toDataURL(outputType, quality);
            const blob = dataURLToBlob(compressedDataUrl);

            if (!blob) {
                throw new Error('Compression failed.');
            }

            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const extension = outputType === 'image/webp' ? 'webp' : file.type === 'image/jpeg' ? 'jpg' : 'png';
            const newName = `${nameWithoutExt}-compressed.${extension}`;
            const savedBytes = Math.max(0, file.size - blob.size);

            setOutputUrl(compressedDataUrl);
            setOutputName(newName);
            setRecent((prev) => [
                {
                    id: Date.now() + Math.random(),
                    name: newName,
                    type: extension.toUpperCase(),
                    size: bytesToSize(blob.size),
                    url: compressedDataUrl,
                },
                ...prev,
            ].slice(0, 4));
            await updateMetrics({ compressedImages: 1, totalSavedBytes: savedBytes });
        } catch (err) {
            console.error(err);
            setError('Compression failed. Try another image.');
        } finally {
            setIsCompressing(false);
        }
    };

    const downloadCompressed = () => {
        if (!outputUrl || !outputName) return;
        const a = document.createElement('a');
        a.href = outputUrl;
        a.download = outputName;
        a.click();
    };

    const clearHistory = () => {
        localStorage.removeItem(historyKey);
        setRecent([]);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="app-container">
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="converter-page">
                <div className="converter-header">
                    <div>
                        <h1>Image Compressor</h1>
                        <p>Reduce file size while keeping sharp quality and fast downloads.</p>
                    </div>
                    <div className="header-actions">
                        {/* <button className="history-link-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                            {showHistory ? 'Hide History' : 'Show History'}
                        </button> */}
                        <div className="breadcrumb">Home &gt; Image Tools &gt; Compressor</div>
                    </div>
                </div>

                <div className="converter-grid">
                    <section className="converter-panel">
                        <div className="upload-card" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                hidden
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                            <div className="upload-content">
                                <span className="upload-icon">🗜️</span>
                                <h3>{file ? file.name : 'Drag & Drop or click to choose an image'}</h3>
                                <p>Supports JPG, JPEG, PNG, WEBP up to 50MB.</p>
                                <button className="browse-btn" type="button" onClick={handleBrowse}>Choose Image</button>
                            </div>
                        </div>

                        <div className="format-row">
                            <label>
                                Compression Quality
                                <input
                                    type="range"
                                    min="0.3"
                                    max="1"
                                    step="0.05"
                                    value={quality}
                                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                                />
                                <span>{Math.round(quality * 100)}%</span>
                            </label>
                        </div>

                        <button className="convert-btn" onClick={compressImage} disabled={isCompressing}>
                            {isCompressing ? 'Compressing...' : 'Compress Image'}
                        </button>

                        {error && <p className="form-error">{error}</p>}
                        {outputUrl && (
                            <div className="result-card">
                                <h3>Compressed image ready</h3>
                                <p>{outputName}</p>
                                <button className="download-btn" onClick={downloadCompressed}>Download</button>
                            </div>
                        )}
                    </section>

                    <aside className="right-panel">
                        <div className="guide-card">
                            <h3>Compression Tips</h3>
                            <ul>
                                <li>Lower quality values to reduce file size.</li>
                                <li>WebP gives better compression for PNG images.</li>
                                <li>Use higher quality for print-ready assets.</li>
                            </ul>
                            <div className="stats-box">
                                <p>Compression Stats</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${Math.round((1 - quality) * 100)}%` }} />
                                </div>
                                <small>{Math.round((1 - quality) * 100)}% space saved estimate</small>
                            </div>
                        </div>
                        <div className="bulk-card">
                            <h3>Fast Results</h3>
                            <p>Compress single images here quickly, or use the converter for batch exports.</p>
                            <button className="download-btn">Learn More</button>
                        </div>
                    </aside>
                </div>

                {showHistory && (
                    <section className="recent-section">
                        <div className="recent-header">
                            <h2>Compression History</h2>
                            <div className="recent-actions">
                                <button className="history-btn" type="button" onClick={() => setShowHistory(false)}>
                                    Hide History
                                </button>
                                <button className="clear-btn" onClick={clearHistory}>Clear All</button>
                            </div>
                        </div>
                        {recent.length === 0 ? (
                            <p className="empty-history">No compressed images yet. Compress one to see history here.</p>
                        ) : (
                            <div className="recent-grid">
                                {recent.map((item) => (
                                    <div key={item.id} className="recent-card">
                                        <div className="recent-card-header">
                                            <span>{item.type}</span>
                                            <span>{item.size}</span>
                                        </div>
                                        <p>{item.name}</p>
                                        <button className="download-btn small" onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = item.url;
                                            a.download = item.name;
                                            a.click();
                                        }}>
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default ImageCompressor;
