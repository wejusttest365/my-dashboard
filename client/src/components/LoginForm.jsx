import { useState } from 'react'
import React from "react";
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
const BASE_URL = import.meta.env.VITE_API_URL;
function LoginForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);


    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const navigate = useNavigate()

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const validateField = (name, value) => {
        let error = ''
        if (!value.trim()) {
            error = 'This field is required.'
        } else if (name === 'email' && !emailPattern.test(value.trim())) {
            error = 'Enter a valid email address.'
        }
        return error
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        const error = validateField(name, value)
        setErrors(prev => ({ ...prev, [name]: error }))
    }

    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');

        const newErrors = {};
        Object.keys(formData).forEach(key => {
            newErrors[key] = validateField(key, formData[key]);
        });

        setErrors(newErrors);

        if (Object.values(newErrors).every(error => !error)) {
            try {
                const res = await axios.post(`${BASE_URL}/login`, {
                    email: formData.email,
                    password: formData.password
                });

                setIsError(false);
                setMessage(res.data.message);

                localStorage.setItem('user', JSON.stringify(res.data.user));

                setTimeout(() => navigate('/dashboard'), 1000);

            } catch (err) {
                setIsError(true);

                const rawMsg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message ||
                    "";

                const msg = String(rawMsg);

                if (msg.toLowerCase().includes("invalid")) {
                    setMessage("Wrong email or password ❌");
                } else {
                    setMessage("Login failed. Try again ❌");
                }
            }
        }
    };
    return (
        <div className="form-card">
            <div className="form-header">
                <h2>Users Login!</h2>
                <p>Login to Your Account</p>
            </div>
            {message && (
                <div className={` mt-2 alert ${isError ? "alert-danger" : "alert-success"}`}>
                    {message}
                </div>

            )}

            <form onSubmit={handleSubmit}>
                <label className="d-block mt-3">
                    {/* <span className="input-label">Email Address</span> */}
                    <div className={`input-field ${errors.email ? 'invalid' : ''}`}>
                        <span className="input-icon">✉️</span>
                        <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleInputChange}
                            autoComplete="email"
                        //  required
                        />
                    </div>
                    <p className="error-message">{errors.email}</p>
                </label>

                <label className="d-block">
                    {/* <span className="input-label">Password</span> */}
                    <div className={`input-field ${errors.password ? 'invalid' : ''}`}>
                        <span className="input-icon">🔒</span>
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="current-password"
                        // required
                        />
                    </div>
                    <p className="error-message">{errors.password}</p>
                </label>

                <div className="checkbox-row mt-0">
                    <label className="show-password">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                    </label>
                </div>

                <button className="cta-button" type="submit">Login</button>
                <p className="form-footnote">Don't have an account? <Link to="/">Sign Up</Link></p>
            </form>

            <div className="form-success">{successMessage}</div>
        </div>
    )
}

export default LoginForm