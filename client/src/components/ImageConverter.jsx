import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const ACCEPTED_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

const MAX_SIZE = 50 * 1024 * 1024;

const formatOptions = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'webp', label: 'WEBP' },
];

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / 1024 ** i).toFixed(2))} ${sizes[i]}`;
}

function ImageConverter() {
    const historyKey = 'imageConverterHistory';
    const metricsKey = 'mediaToolMetrics';
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState('');
    const [outputName, setOutputName] = useState('');
    const [fromFormat, setFromFormat] = useState('png');
    const [toFormat, setToFormat] = useState('webp');
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(historyKey)) || [];
        } catch {
            return [];
        }
    });
    const [isConverting, setIsConverting] = useState(false);
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

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            setError('No file selected.');
            return false;
        }
        if (!ACCEPTED_TYPES[selectedFile.type]) {
            setError('Unsupported file type. Use PNG, JPG, or WEBP.');
            return false;
        }
        if (selectedFile.size > MAX_SIZE) {
            setError('File is too large. Maximum size is 50MB.');
            return false;
        }
        return true;
    };

    const setSelectedFiles = (selectedList) => {
        const selectedArray = Array.from(selectedList || []);
        if (!selectedArray.length) return;

        const validFiles = selectedArray.filter(validateFile);
        if (!validFiles.length) return;

        setFiles(validFiles);
        setError('');

        const firstFormat = ACCEPTED_TYPES[validFiles[0].type];
        setFromFormat(firstFormat);
        if (!toFormat || toFormat === firstFormat) {
            setToFormat(firstFormat === 'webp' ? 'png' : 'webp');
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setSelectedFiles(event.dataTransfer.files);
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
                await fetch(`http://localhost:5000/metrics/${user.email}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patch)
                });
            } catch (err) {
                console.error('Error updating metrics on server:', err);
            }
        }
    };

    const convertImage = async () => {
        if (!files.length) {
            setError('Choose at least one image first.');
            return;
        }

        const allSameOutput = files.every((fileItem) => ACCEPTED_TYPES[fileItem.type] === toFormat);
        if (allSameOutput) {
            setError('Select a different output format for your files.');
            return;
        }

        setError('');
        setIsConverting(true);

        try {
            const convertedItems = [];

            for (const selectedFile of files) {
                const originalDataUrl = await readAsDataURL(selectedFile);
                const image = new Image();
                image.src = originalDataUrl;

                await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                });

                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);

                const mimeType = toFormat === 'jpg' ? 'image/jpeg' : `image/${toFormat}`;
                const dataUrl = canvas.toDataURL(mimeType, 0.92);
                const blob = dataURLToBlob(dataUrl);

                if (!blob) {
                    throw new Error('Conversion failed.');
                }

                const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
                const newName = `${nameWithoutExt}.${toFormat}`;

                convertedItems.push({
                    id: Date.now() + Math.random(),
                    name: newName,
                    type: toFormat.toUpperCase(),
                    size: bytesToSize(blob.size),
                    url: dataUrl,
                });
            }

            const latestItem = convertedItems[convertedItems.length - 1];
            setOutputUrl(latestItem.url);
            setOutputName(latestItem.name);
            await updateMetrics({ convertedImages: convertedItems.length });
            setRecent((prev) => [...convertedItems, ...prev].slice(0, 4));
        } catch (err) {
            console.error(err);
            setError('Conversion failed. Try another file.');
        } finally {
            setIsConverting(false);
        }
    };

    const downloadConverted = () => {
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
                        <h1>Image Converter</h1>
                        <p>Convert JPG, PNG, WEBP in seconds with neural-powered precision.</p>
                    </div>
                    <div className="header-actions">
                        <button className="history-link-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                            {showHistory ? 'Hide History' : 'Show History'}
                        </button>
                        <div className="breadcrumb">Home &gt; Image Tools &gt; Converter</div>
                    </div>
                </div>

                <div className="converter-grid">
                    <section className="converter-panel">
                        <div className="history-toolbar">
                            <button className="history-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                                {showHistory ? 'Hide History' : 'Show History'}
                            </button>
                        </div>
                        <div className="upload-card" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                hidden
                                onChange={(e) => setSelectedFiles(e.target.files)}
                            />
                            <div className="upload-content">
                                <span className="upload-icon">📁</span>
                                <h3>
                                    {files.length > 1
                                        ? `${files.length} files selected`
                                        : files.length === 1
                                            ? files[0].name
                                            : 'Drag & Drop here or click to browse'}
                                </h3>
                                {files.length > 1 && (
                                    <p>{files.map((f) => f.name).join(', ')}</p>
                                )}
                                {!files.length && <p>Supports JPG, JPEG, PNG, WEBP up to 50MB.</p>}
                                <button className="browse-btn" type="button" onClick={handleBrowse}>Choose Files</button>
                            </div>
                        </div>

                        <div className="format-row">
                            <label>
                                Convert From
                                <select value={fromFormat} onChange={(e) => setFromFormat(e.target.value)}>
                                    {formatOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Convert To
                                <select value={toFormat} onChange={(e) => setToFormat(e.target.value)}>
                                    {formatOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <button className="convert-btn" onClick={convertImage} disabled={isConverting}>
                            {isConverting ? 'Converting...' : 'Convert Now'}
                        </button>

                        {error && <p className="form-error">{error}</p>}
                        {outputUrl && (
                            <div className="result-card">
                                <h3>Converted file ready</h3>
                                <p>{outputName}</p>
                                <button className="download-btn" onClick={downloadConverted}>Download</button>
                            </div>
                        )}
                    </section>

                    <aside className="right-panel">
                        <div className="guide-card">
                            <h3>Conversion Guide</h3>
                            <ul>
                                <li>JPG → PNG for transparency needs.</li>
                                <li>PNG → WEBP for superior web speed.</li>
                                <li>WEBP → JPG for legacy compatibility.</li>
                            </ul>
                            <div className="stats-box">
                                <p>Processing Stats</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: '58%' }} />
                                </div>
                                <small>58/100 free daily tasks</small>
                            </div>
                        </div>
                        <div className="bulk-card">
                            <h3>Bulk Convert</h3>
                            <p>Processing 50+ images? Try our desktop app for instant local conversion.</p>
                            <button className="download-btn">Download App</button>
                        </div>
                    </aside>
                </div>

                {showHistory && (
                    <section id="recent-history" className="recent-section">
                        <div className="recent-header">
                            <h2>Your Recent Conversions</h2>
                            <div className="recent-actions">
                                <button className="history-btn" type="button" onClick={() => setShowHistory(false)}>
                                    Hide History
                                </button>
                                <button className="clear-btn" onClick={clearHistory}>Clear All</button>
                            </div>
                        </div>
                        {recent.length === 0 ? (
                            <p className="empty-history">No recent conversions yet. Convert files to populate history.</p>
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

export default ImageConverter;
