import { useState } from 'react'
import { Link } from 'react-router-dom';
import React from "react";
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function SignupForm() {
    const [formData, setFormData] = useState({
        fullName: '',
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
        } else if (name === 'password' && value.trim().length < 6) {
            error = 'Password must be at least 6 characters.'
        }
        return error
    }

    const BASE_URL = process.env.REACT_APP_API_URL;

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
                `${BASE_URL}/signup`,
                {
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password
                }
            );

            setSuccessMessage(res.data.message);

            setTimeout(() => navigate('/login'), 1000);

        } catch (err) {
            console.log(err);
            setSuccessMessage(
                err.response?.data?.message || "Something went wrong"
            );
        }
    }
};

    return (
        <div className="form-card">
            <div className="form-header">
                <h2>Hello!</h2>
                <p>Sign Up to Get Started</p>
            </div>

            <form onSubmit={handleSubmit}>
                <label className="input-group">
                    <span className="input-label">Full Name</span>
                    <div className="input-field">
                        <span className="input-icon">👤</span>
                        <input
                            name="fullName"
                            type="text"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            autoComplete="name"
                            required
                        />
                    </div>
                    <p className="error-message">{errors.fullName}</p>
                </label>

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
                            autoComplete="new-password"
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

                <button className="cta-button" type="submit">Register</button>
                <p className="form-footnote">Already have an account? <Link to="/login">Login</Link></p>
            </form>

            <div className="form-success">{successMessage}</div>
        </div>
    )
}

export default SignupForm