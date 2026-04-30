import { useState } from 'react'
import React from "react";
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function LoginForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
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
                const res = await axios.post(
                    "http://localhost:5000/login",
                    {
                        email: formData.email,
                        password: formData.password
                    }
                );

                setSuccessMessage(res.data.message);

                // Store user data
                localStorage.setItem('user', JSON.stringify(res.data.user));

                setTimeout(() => navigate('/dashboard'), 1000);

            } catch (err) {
                console.log(err);
                setSuccessMessage(
                    err.response?.data?.message || "Login failed"
                );
            }
        }
    };

    return (
        <div className="form-card">
            <div className="form-header">
                <h2>Welcome Back!</h2>
                <p>Login to Your Account</p>
            </div>

            <form onSubmit={handleSubmit}>
                <label className="input-group">
                    <span className="input-label">Email Address</span>
                    <div className="input-field">
                        <span className="input-icon">✉️</span>
                        <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleInputChange}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <p className="error-message">{errors.email}</p>
                </label>

                <label className="input-group">
                    <span className="input-label">Password</span>
                    <div className="input-field">
                        <span className="input-icon">🔒</span>
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <p className="error-message">{errors.password}</p>
                </label>

                <div className="checkbox-row">
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
                <p className="form-footnote">Don't have an account? <a href="/">Sign Up</a></p>
            </form>

            <div className="form-success">{successMessage}</div>
        </div>
    )
}

export default LoginForm