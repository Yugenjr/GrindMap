import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    // Clear general error when user modifies fields
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { token, user, id } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user || { id, email: formData.email }));
      localStorage.setItem('userId', id);
      localStorage.setItem('userEmail', formData.email);
      
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back to GrindMap</h2>
          <p>Sign in to track your coding progress</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              <span className="success-icon">✓</span>
              {successMessage}
            </div>
          )}

          {/* General Error Message */}
          {errors.general && (
            <div className="error-message general-error">
              <span className="error-icon">⚠</span>
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
              {formData.email && !errors.email && (
                <span className="input-check">✓</span>
              )}
            </div>
            {errors.email && (
              <span className="error-message field-error">{errors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                disabled={loading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span className="error-message field-error">{errors.password}</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" disabled={loading} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer - Sign Up Link */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="signup-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="background-decoration"></div>
    </div>
  );
};

export default Login;