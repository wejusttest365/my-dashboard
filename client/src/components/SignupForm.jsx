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
        } else if (name === 'password' && value.trim().length < 6) {
            error = 'Password must be at least 6 characters.'
        }
        return error
    }

    const BASE_URL = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post(`${BASE_URL}/signup`, {
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
            });

            setIsError(false);
            setMessage("Signup successful ✅");

        } catch (err) {

            setIsError(true);

            const msg = err.response?.data?.message;

            if (msg && msg.includes("exists")) {
                setMessage("Account already exists. Please login 👉");
            } else {
                setMessage("Something went wrong ❌");
            }
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="form-card">
            <div className="form-header">
                <h2>Hello!</h2>
                <p>Sign Up to Get Started</p>
            </div>

            {message && (
                <div className={` mt-2 alert ${isError ? "alert-danger" : "alert-success"}`}>
                    {message}
                </div>

            )}

            <form onSubmit={handleSubmit}>
                <label className="d-block mt-3">
                    {/* <span className="input-label">Full Name</span> */}
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

                <label className="d-block">
                    {/* <span className="input-label">Email Address</span> */}
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

                <label className="d-block">
                    {/* <span className="input-label">Password</span> */}
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
                </label >

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

                <button className="cta-button" type="submit">Register</button>
                <p className="form-footnote text-center">Already have an account? <Link to="/login">Login</Link></p>
            </form >

            <div className="form-success">{successMessage}</div>
        </div >
    )
}

export default SignupForm