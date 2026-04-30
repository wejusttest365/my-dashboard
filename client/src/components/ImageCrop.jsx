import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function ImageCrop() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const dragStateRef = useRef(null);
    const historyKey = 'imageCropHistory';
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState('');
    const [error, setError] = useState('');
    const [outputUrl, setOutputUrl] = useState('');
    const [outputName, setOutputName] = useState('');
    const [origWidth, setOrigWidth] = useState(0);
    const [origHeight, setOrigHeight] = useState(0);
    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [cropWidth, setCropWidth] = useState(0);
    const [cropHeight, setCropHeight] = useState(0);
    const [outputWidth, setOutputWidth] = useState(0);
    const [outputHeight, setOutputHeight] = useState(0);
    const [previewScale, setPreviewScale] = useState(1);
    const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(historyKey)) || [];
        } catch {
            return [];
        }
    });
    const [isCropping, setIsCropping] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [keepExportSize, setKeepExportSize] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user?.email) {
            navigate('/login');
        }
    }, [navigate, user]);

    useEffect(() => {
        localStorage.setItem(historyKey, JSON.stringify(recent));
    }, [recent]);

    useEffect(() => {
        if (!file) return;
        if (keepExportSize) {
            setOutputWidth(cropWidth);
            setOutputHeight(cropHeight);
        }
    }, [cropWidth, cropHeight, keepExportSize, file]);

    useEffect(() => {
        const onMouseMove = (event) => {
            if (!dragStateRef.current || !file) return;
            const { mode, startX, startY, startCropX, startCropY, startCropWidth, startCropHeight } = dragStateRef.current;
            const dx = (event.clientX - startX) / previewScale;
            const dy = (event.clientY - startY) / previewScale;

            if (mode === 'move') {
                setCropX(Math.round(clamp(startCropX + dx, 0, origWidth - startCropWidth)));
                setCropY(Math.round(clamp(startCropY + dy, 0, origHeight - startCropHeight)));
            } else {
                let nextWidth = clamp(Math.max(50, startCropWidth + dx), 50, origWidth - startCropX);
                let nextHeight = keepExportSize
                    ? Math.round((nextWidth * startCropHeight) / startCropWidth)
                    : clamp(Math.max(50, startCropHeight + dy), 50, origHeight - startCropY);

                if (nextWidth + startCropX > origWidth) {
                    nextWidth = origWidth - startCropX;
                    if (keepExportSize) nextHeight = Math.round((nextWidth * startCropHeight) / startCropWidth);
                }
                if (nextHeight + startCropY > origHeight) {
                    nextHeight = origHeight - startCropY;
                    if (keepExportSize) nextWidth = Math.round((nextHeight * startCropWidth) / startCropHeight);
                }

                setCropWidth(Math.round(nextWidth));
                setCropHeight(Math.round(nextHeight));
            }
        };

        const onMouseUp = () => {
            dragStateRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [file, previewScale, origWidth, origHeight, keepExportSize]);

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

            const maxWidth = 560;
            const maxHeight = 420;
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

            setFile(selectedFile);
            setFileData(result);
            setOrigWidth(img.width);
            setOrigHeight(img.height);
            setCropX(0);
            setCropY(0);
            setCropWidth(img.width);
            setCropHeight(img.height);
            setOutputWidth(img.width);
            setOutputHeight(img.height);
            setPreviewScale(scale);
            setPreviewSize({ width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
            setError('');
            setOutputUrl('');
            setOutputName('');
        };

        reader.onerror = () => setError('Unable to load the selected file.');
        reader.readAsDataURL(selectedFile);
    };

    const startDrag = (event, mode) => {
        if (!file) return;
        event.preventDefault();
        event.stopPropagation();
        dragStateRef.current = {
            mode,
            startX: event.clientX,
            startY: event.clientY,
            startCropX: cropX,
            startCropY: cropY,
            startCropWidth: cropWidth,
            startCropHeight: cropHeight,
        };
        setIsDragging(true);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        loadFile(event.dataTransfer.files[0]);
    };

    const handleBrowse = () => {
        inputRef.current?.click();
    };

    const cropImage = async () => {
        if (!file || !fileData) {
            setError('Choose an image first.');
            return;
        }
        if (!cropWidth || !cropHeight) {
            setError('Crop width and height must be set.');
            return;
        }
        if (cropX < 0 || cropY < 0 || cropX + cropWidth > origWidth || cropY + cropHeight > origHeight) {
            setError('Crop area must stay inside the image bounds.');
            return;
        }
        if (!outputWidth || !outputHeight) {
            setError('Output width and height must be set.');
            return;
        }

        setError('');
        setIsCropping(true);

        try {
            const image = new Image();
            image.src = fileData;
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

            const outputType = file.type;
            const resultUrl = canvas.toDataURL(outputType, 0.92);
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const newName = `${nameWithoutExt}-crop-${outputWidth}x${outputHeight}.${ACCEPTED_TYPES[file.type]}`;
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
            setError('Crop failed. Try another image.');
        } finally {
            setIsCropping(false);
        }
    };

    const downloadCropped = () => {
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

    const removeRecentItem = (id) => {
        setRecent((prev) => prev.filter((item) => item.id !== id));
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
                        <h1>Image Crop</h1>
                        <p>Crop images exactly where you need them and export custom sizes.</p>
                    </div>
                    <div className="header-actions">
                        <button className="history-link-btn" type="button" onClick={() => setShowHistory((show) => !show)}>
                            {showHistory ? 'Hide History' : 'Show History'}
                        </button>
                        <div className="breadcrumb">Home &gt; Image Tools &gt; Crop</div>
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
                                hidden
                                onChange={(e) => loadFile(e.target.files[0])}
                            />
                            <div className="upload-content">
                                <span className="upload-icon">✂️</span>
                                <h3>{file ? file.name : 'Drag & Drop here or click to browse'}</h3>
                                <p>Supports JPG, JPEG, PNG, WEBP up to 50MB.</p>
                                <button className="browse-btn" type="button" onClick={handleBrowse}>Choose Image</button>
                            </div>
                        </div>

                        <div className="cropper-panel">
                            <p className="section-title">Interactive Cropper</p>
                            <div className="crop-preview-wrapper">
                                {file ? (
                                    <div className="crop-preview" style={{ width: previewSize.width, height: previewSize.height }}>
                                        <img src={fileData} alt="Preview" />
                                        <div
                                            className="crop-box"
                                            style={{
                                                left: Math.round(cropX * previewScale),
                                                top: Math.round(cropY * previewScale),
                                                width: Math.round(cropWidth * previewScale),
                                                height: Math.round(cropHeight * previewScale),
                                            }}
                                            onMouseDown={(e) => startDrag(e, 'move')}
                                        >
                                            <div className="crop-box-label">Drag</div>
                                            <div className="crop-handle" onMouseDown={(e) => startDrag(e, 'resize')} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cropper-empty">Upload an image to start cropping.</div>
                                )}
                            </div>

                            <div className="format-row resize-row">
                                <label>
                                    X Position
                                    <input type="number" value={cropX} min="0" max={Math.max(0, origWidth - cropWidth)} onChange={(e) => setCropX(clamp(Number(e.target.value), 0, Math.max(0, origWidth - cropWidth)))} />
                                </label>
                                <label>
                                    Y Position
                                    <input type="number" value={cropY} min="0" max={Math.max(0, origHeight - cropHeight)} onChange={(e) => setCropY(clamp(Number(e.target.value), 0, Math.max(0, origHeight - cropHeight)))} />
                                </label>
                            </div>
                            <div className="format-row resize-row">
                                <label>
                                    Crop Width
                                    <input type="number" value={cropWidth} min="50" max={Math.max(50, origWidth - cropX)} onChange={(e) => setCropWidth(clamp(Number(e.target.value), 50, Math.max(50, origWidth - cropX)))} />
                                </label>
                                <label>
                                    Crop Height
                                    <input type="number" value={cropHeight} min="50" max={Math.max(50, origHeight - cropY)} onChange={(e) => setCropHeight(clamp(Number(e.target.value), 50, Math.max(50, origHeight - cropY)))} />
                                </label>
                            </div>
                            <div className="format-row resize-row">
                                <label>
                                    Output Width
                                    <input type="number" value={outputWidth} min="1" onChange={(e) => setOutputWidth(Math.max(1, Number(e.target.value)))} />
                                </label>
                                <label>
                                    Output Height
                                    <input type="number" value={outputHeight} min="1" onChange={(e) => setOutputHeight(Math.max(1, Number(e.target.value)))} />
                                </label>
                            </div>
                            <label className="ratio-toggle">
                                <input type="checkbox" checked={keepExportSize} onChange={(e) => setKeepExportSize(e.target.checked)} />
                                Keep output aspect ratio
                            </label>
                        </div>

                        <button className="convert-btn" onClick={cropImage} disabled={isCropping || !file}>
                            {isCropping ? 'Cropping...' : 'Crop & Export'}
                        </button>

                        {error && <p className="form-error">{error}</p>}
                        {outputUrl && (
                            <div className="result-card">
                                <h3>Cropped image ready</h3>
                                <div className="result-preview">
                                    <img src={outputUrl} alt={outputName} />
                                </div>
                                <p>{outputName}</p>
                                <button className="download-btn" onClick={downloadCropped}>Download Cropped Image</button>
                            </div>
                        )}
                    </section>

                    <aside className="right-panel">
                        <div className="guide-card">
                            <h3>Crop like a pro</h3>
                            <ul>
                                <li>Drag the crop frame to reposition the selection.</li>
                                <li>Use the numeric controls for pixel-perfect precision.</li>
                                <li>Export at a custom size for web, socials, or print.</li>
                            </ul>
                            <div className="stats-box">
                                <p>Crop Summary</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: file ? `${Math.round((cropWidth * cropHeight) / Math.max(1, origWidth * origHeight) * 100)}%` : '0%' }} />
                                </div>
                                <small>{file ? `${cropWidth} x ${cropHeight} → ${outputWidth} x ${outputHeight}` : 'Upload an image to start'}</small>
                            </div>
                        </div>
                        <div className="bulk-card">
                            <h3>Drag & drop flow</h3>
                            <p>Place your crop window visually, then fine-tune the dimensions for a polished result.</p>
                        </div>
                    </aside>
                </div>

                {showHistory && (
                    <section className="recent-section">
                        <div className="recent-header">
                            <h2>Crop History</h2>
                            <div className="recent-actions">
                                <button className="history-btn" type="button" onClick={() => setShowHistory(false)}>
                                    Hide History
                                </button>
                                <button className="clear-btn" onClick={clearHistory}>Clear All</button>
                            </div>
                        </div>
                        {recent.length === 0 ? (
                            <p className="empty-history">No cropped images yet. Crop one to see history here.</p>
                        ) : (
                            <div className="recent-grid">
                                {recent.map((item) => (
                                    <div key={item.id} className="recent-card">
                                        <img className="recent-card-thumb" src={item.url} alt={item.name} />
                                        <div className="recent-card-header">
                                            <span>{item.type}</span>
                                            <span>{item.size}</span>
                                        </div>
                                        <p>{item.name}</p>
                                        <div className="recent-card-actions">
                                            <button className="download-btn small" onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = item.url;
                                                a.download = item.name;
                                                a.click();
                                            }}>
                                                Download
                                            </button>
                                            <button className="clear-btn" onClick={() => removeRecentItem(item.id)}>
                                                Remove
                                            </button>
                                        </div>
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

export default ImageCrop;
