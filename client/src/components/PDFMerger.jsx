import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import Sidebar from './Sidebar';

const PDFMerger = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [dropError, setDropError] = useState('');
    const fileInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user?.email) {
            navigate('/login');
        }
    }, [navigate, user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
        setFiles(prev => [...prev, ...pdfFiles]);
        setDropError('');
    };

    const handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(event.dataTransfer.files);
        const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');

        if (pdfFiles.length === 0) {
            setDropError('Only PDF files are supported. Please drop PDF documents.');
            return;
        }

        setFiles(prev => [...prev, ...pdfFiles]);
        setDropError('');
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveFile = (fromIndex, toIndex) => {
        const newFiles = [...files];
        const [moved] = newFiles.splice(fromIndex, 1);
        newFiles.splice(toIndex, 0, moved);
        setFiles(newFiles);
    };

    const mergePDFs = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }

        setIsMerging(true);
        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Error merging PDFs. Please try again.');
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="app-container">
            <Sidebar user={user} onLogout={handleLogout} />
            <main className="main-content">
                <div className="converter-header">
                    <div>
                        <h1>PDF Merger</h1>
                        <p>Upload multiple PDF files, reorder them, and merge into a single document.</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="primary-btn"
                            onClick={() => fileInputRef.current.click()}
                        >
                            📎 Upload PDFs
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div
                    className={`pdf-merger-content ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {files.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📄</div>
                            <h3>Drag & drop PDFs here</h3>
                            <p>or click "Upload PDFs" to select files from your device.</p>
                            {dropError && <p className="drop-error">{dropError}</p>}
                        </div>
                    ) : (
                        <>
                            <div className="files-list">
                                {files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <div className="file-info">
                                            <span className="file-icon">📄</span>
                                            <div>
                                                <p className="file-name">{file.name}</p>
                                                <small className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                                            </div>
                                        </div>
                                        <div className="file-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => moveFile(index, Math.max(0, index - 1))}
                                                disabled={index === 0}
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => moveFile(index, Math.min(files.length - 1, index + 1))}
                                                disabled={index === files.length - 1}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                className="action-btn remove"
                                                onClick={() => removeFile(index)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="merge-section">
                                <button
                                    className="merge-btn"
                                    onClick={mergePDFs}
                                    disabled={isMerging || files.length < 2}
                                >
                                    {isMerging ? '🔄 Merging...' : '🔗 Merge PDFs'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PDFMerger;