import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

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

function ImageResize() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const historyKey = 'imageResizeHistory';
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState('');
    const [outputName, setOutputName] = useState('');
    const [origWidth, setOrigWidth] = useState(0);
    const [origHeight, setOrigHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [keepRatio, setKeepRatio] = useState(true);
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(historyKey)) || [];
        } catch {
            return [];
        }
    });
    const [isResizing, setIsResizing] = useState(false);
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

    const loadFile = async (selectedFile) => {
        if (!selectedFile) return;
        if (!validateFile(selectedFile)) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result;
            const img = new Image();
            img.src = result;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            setFile(selectedFile);
            setFileData(result);
            setOrigWidth(img.width);
            setOrigHeight(img.height);
            setWidth(img.width);
            setHeight(img.height);
            setOutputUrl('');
            setOutputName('');
            setError('');
        };
        reader.onerror = () => setError('Unable to read the selected file.');
        reader.readAsDataURL(selectedFile);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        loadFile(event.dataTransfer.files[0]);
    };

    const handleBrowse = () => {
        inputRef.current?.click();
    };

    const resizeImage = async () => {
        if (!file || !fileData) {
            setError('Choose an image first.');
            return;
        }
        if (!width || !height) {
            setError('Width and height must be set.');
            return;
        }
        setError('');
        setIsResizing(true);

        try {
            const image = new Image();
            image.src = fileData;
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);
            const outputType = file.type;
            const resultUrl = canvas.toDataURL(outputType, 0.92);
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const newName = `${nameWithoutExt}-${width}x${height}.${ACCEPTED_TYPES[file.type]}`;
            setOutputUrl(resultUrl);
            setOutputName(newName);
            const resultBlob = await (await fetch(resultUrl)).blob();
            const resultSize = resultBlob.size;
            setRecent((prev) => [
                {
                    id: Date.now() + Math.random(),
                    name: newName,
                    type: ACCEPTED_TYPES[file.type].toUpperCase(),
                    size: bytesToSize(resultSize),
                    url: resultUrl,
                },
                ...prev,
            ].slice(0, 4));
        } catch (err) {
            console.error(err);
            setError('Failed to resize the image. Try another file.');
        } finally {
            setIsResizing(false);
        }
    };

    const downloadResized = () => {
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

    const updateWidth = (value) => {
        const next = Number(value) || 0;
        setWidth(next);
        if (keepRatio && origWidth) {
            setHeight(Math.round((next / origWidth) * origHeight));
        }
    };

    const updateHeight = (value) => {
        const next = Number(value) || 0;
        setHeight(next);
        if (keepRatio && origHeight) {
            setWidth(Math.round((next / origHeight) * origWidth));
        }
    };

    return (
        <div className="app-container">
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="converter-page">
                <div className="converter-header">
                    <div>
                        <h1>Image Resize</h1>
                        <p>Resize images to exact dimensions while preserving quality.</p>
                    </div>
                    <div className="header-actions">
                        {/* <button className="history-link-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                            {showHistory ? 'Hide History' : 'Show History'}
                        </button> */}
                        <div className="breadcrumb">Home &gt; Image Tools &gt; Resize</div>
                    </div>
                </div>

                <div className="converter-grid">
                    <section className="converter-panel">
                        {/* <div className="history-toolbar">
                            <button className="history-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                                {showHistory ? 'Hide History' : 'Show History'}
                            </button>
                        </div> */}
                        <div className="upload-card" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                hidden
                                onChange={(e) => loadFile(e.target.files[0])}
                            />
                            <div className="upload-content">
                                <span className="upload-icon">📐</span>
                                <h3>{file ? file.name : 'Drag & Drop here or click to browse'}</h3>
                                <p>Supports JPG, JPEG, PNG, WEBP up to 50MB.</p>
                                <button className="browse-btn" type="button" onClick={handleBrowse}>Choose Image</button>
                            </div>
                        </div>

                        <div className="format-row resize-row">
                            <label>
                                Width
                                <input type="number" value={width} min="1" onChange={(e) => updateWidth(e.target.value)} />
                            </label>
                            <label>
                                Height
                                <input type="number" value={height} min="1" onChange={(e) => updateHeight(e.target.value)} />
                            </label>
                        </div>
                        <label className="ratio-toggle">
                            <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
                            Keep aspect ratio
                        </label>

                        <button className="convert-btn" onClick={resizeImage} disabled={isResizing}>
                            {isResizing ? 'Resizing...' : 'Resize Image'}
                        </button>

                        {error && <p className="form-error">{error}</p>}
                        {outputUrl && (
                            <div className="result-card">
                                <h3>Resized image ready</h3>
                                <p>{outputName}</p>
                                <button className="download-btn" onClick={downloadResized}>Download</button>
                            </div>
                        )}
                    </section>

                    <aside className="right-panel">
                        <div className="guide-card">
                            <h3>Resize Guide</h3>
                            <ul>
                                <li>Use exact dimensions for social or print assets.</li>
                                <li>Keep aspect ratio to avoid distortion.</li>
                                <li>Lower size values for faster delivery.</li>
                            </ul>
                            <div className="stats-box">
                                <p>Original size</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: file ? '40%' : '10%' }} />
                                </div>
                                <small>{file ? `${origWidth} x ${origHeight}` : 'Upload an image to preview'}</small>
                            </div>
                        </div>
                        <div className="bulk-card">
                            <h3>Tip</h3>
                            <p>Resize larger images to reduce file size for web and mobile use.</p>
                        </div>
                    </aside>
                </div>

                {showHistory && (
                    <section className="recent-section">
                        <div className="recent-header">
                            <h2>Resize History</h2>
                            <div className="recent-actions">
                                <button className="history-btn" type="button" onClick={() => setShowHistory(false)}>
                                    Hide History
                                </button>
                                <button className="clear-btn" onClick={clearHistory}>Clear All</button>
                            </div>
                        </div>
                        {recent.length === 0 ? (
                            <p className="empty-history">No recent resized images yet. Resize one to see history here.</p>
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

export default ImageResize;
