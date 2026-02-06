// pages/ForgotPassword.js - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../shared/constants/config.js'; // ⭐ IMPORT CONFIG
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ⭐ FIX: Use imported API_BASE_URL instead of process.env
  const API_URL = API_BASE_URL;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setMessage('');
    setError('');
    
    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Sending password reset request...');
      console.log('🌐 API URL:', API_URL);
      console.log('📬 Email:', email);

      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email,
          platform: 'web'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get("content-type");
      console.log('📡 Content-Type:', contentType);

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again later.");
      }

      // Read response text first, then parse
      const responseText = await response.text();
      console.log('📡 Response text:', responseText);

      if (!responseText) {
        throw new Error("Server returned empty response. Please try again later.");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('📄 Response text:', responseText);
        throw new Error("Invalid response from server. Please try again later.");
      }

      console.log('📦 Parsed data:', data);

      // Handle both success and error responses properly
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403 && data.adminBlocked) {
          throw new Error("Password reset is disabled for admin accounts. Please contact IT support.");
        }
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      // Success response
      if (data.success) {
        setMessage(data.message || 'Password reset link has been sent to your email!');
        setEmail(''); // Clear the input
        
        // Show success alert
        window.alert('✅ Password reset email sent! Please check your inbox (and spam folder).');
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      window.alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* Logo + Name */}
        <div className="auth-header">
          <img src="/blood_cancer_logo.png" alt="Logo" className="auth-logo" />
          <h1 className="auth-title">Student-Led-Initiative</h1>
          <p className="auth-tagline">Supporting patients in their time of need</p>
        </div>

        {/* Key Icon */}
        <div className="icon-container">
          <span className="lock-icon">🔑</span>
        </div>

        <h2 className="auth-heading">Forgot Password?</h2>
        <p className="auth-subtitle">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Success Message */}
        {message && (
          <div className="success-container">
            <span className="success-icon">✅</span>
            <p className="success-message">{message}</p>
            <p className="success-note">
              Please check your email inbox (and spam folder) for the reset link.
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Email Input */}
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to Sign In */}
          <div className="back-to-signin">
            <Link to="/signin" className="back-link">← Back to Sign In</Link>
          </div>
        </form>

        {/* Additional Links */}
        <div className="additional-links">
          <p className="additional-links-text">
            Don't have an account? <Link to="/signup" className="signup-link">Create an account</Link>
          </p>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <p className="info-title">What happens next?</p>
          <ul className="info-list">
            <li>📧 Check your email for a reset link</li>
            <li>⏰ Link expires in 1 hour for security</li>
            <li>🔒 Create a new secure password</li>
            <li>✅ Sign in with your new password</li>
          </ul>
        </div>

        {/* Trust indicators */}
        <div className="trust-indicators">
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span className="trust-text">Secure & Encrypted</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✓</span>
            <span className="trust-text">HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;