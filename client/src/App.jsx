import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import ImageConverter from './components/ImageConverter'
import ImageCompressor from './components/ImageCompressor'
import ImageResize from './components/ImageResize'
import ImageCrop from './components/ImageCrop'
import PDFMerger from './components/PDFMerger'
import React from 'react'
import './style.css'

function App() {
    return (
        <Router>
            <div id="app">
                <Routes>
                    <Route path="/" element={
                        <div className="page-shell">
                            <aside className="brand-panel" aria-label="Brand section">
                                <div className="brand-visual">
                                    <div className="brand-ring ring-1"></div>
                                    <div className="brand-ring ring-2"></div>
                                    <div className="brand-ring ring-3"></div>
                                </div>
                                <div className="brand-copy">
                                    <p className="brand-eyebrow">STAX FOOD</p>
                                    <h1>A modern meal signup experience</h1>
                                    <p className="brand-note">Sign up to start ordering fresh, fast, and delicious meals.</p>
                                </div>
                            </aside>
                            <main className="form-panel" aria-label="Signup form">
                                <SignupForm />
                            </main>
                        </div>
                    } />
                    <Route path="/login" element={
                        <div className="page-shell">
                            <aside className="brand-panel" aria-label="Brand section">
                                <div className="brand-visual">
                                    <div className="brand-ring ring-1"></div>
                                    <div className="brand-ring ring-2"></div>
                                    <div className="brand-ring ring-3"></div>
                                </div>
                                <div className="brand-copy">
                                    <p className="brand-eyebrow">STAX FOOD</p>
                                    <h1>A modern meal login experience</h1>
                                    <p className="brand-note">Login to start ordering fresh, fast, and delicious meals.</p>
                                </div>
                            </aside>
                            <main className="form-panel" aria-label="Login form">
                                <LoginForm />
                            </main>
                        </div>
                    } />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/converter" element={<ImageConverter />} />
                    <Route path="/compress" element={<ImageCompressor />} />
                    <Route path="/resize" element={<ImageResize />} />
                    <Route path="/crop" element={<ImageCrop />} />
                    <Route path="/merge" element={<PDFMerger />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App