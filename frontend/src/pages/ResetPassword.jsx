// pages/ResetPassword.js - FIXED VERSION
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../shared/constants/config.js'; // ⭐ IMPORT CONFIG
import "./Auth.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  // ⭐ FIX: Use imported API_BASE_URL instead of process.env
  const API_URL = API_BASE_URL;

  useEffect(() => {
    if (!token) {
      window.alert("❌ Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (password.length > 128) {
      return "Password is too long (maximum 128 characters)";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting password reset...');
      console.log('🎫 Token:', token);
      console.log('🌐 API URL:', API_URL);

      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get("content-type");
      console.log('📡 Content-Type:', contentType);

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again.");
      }

      // Only parse JSON if response has content
      const responseText = await response.text();
      console.log('📡 Response text:', responseText);

      if (!responseText) {
        throw new Error("Server returned empty response. Please try again.");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error("Invalid response from server. Please try again.");
      }

      console.log('📦 Parsed data:', data);

      // Check response.ok AFTER parsing
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (data.success) {
        setSuccess(true);
        window.alert("✅ " + data.message);
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password");
        window.alert("❌ " + (data.message || "Failed to reset password"));
      }
    } catch (err) {
      console.error("❌ Reset password error:", err);
      
      let errorMessage = "Network error. Please try again.";
      
      if (err.name === 'AbortError') {
        errorMessage = "Request timeout. Please check your internet connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      window.alert("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <img src="/blood_cancer_logo.png" alt="Logo" className="auth-logo" />
            <h1 className="auth-title">Student-Led-Initiative</h1>
            <p className="auth-tagline">Supporting patients in their time of need</p>
          </div>

          <div className="success-container">
            <span className="success-icon">✅</span>
            <p className="success-message">
              Password reset successful! Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* Logo + Name */}
        <div className="auth-header">
          <img src="/blood_cancer_logo.png" alt="Logo" className="auth-logo" />
          <h1 className="auth-title">Student-Led-Initiative</h1>
          <p className="auth-tagline">Supporting patients in their time of need</p>
        </div>

        {/* Lock Icon */}
        <div className="icon-container">
          <span className="lock-icon">🔐</span>
        </div>

        <h2 className="auth-heading">Create New Password</h2>
        <p className="auth-subtitle">
          Enter your new password below. Make sure it's strong and secure.
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password input */}
          <div className="input-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        {/* Back to Sign In */}
        <div className="back-to-signin">
          <a href="/signin" className="back-link">← Back to Sign In</a>
        </div>

        {/* Password Requirements */}
        <div className="requirements-section">
          <p className="requirements-title">Password Requirements:</p>
          <ul className="requirements-list">
            <li>At least 6 characters long</li>
            <li>Mix of uppercase & lowercase letters (recommended)</li>
            <li>Include numbers & special characters (recommended)</li>
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

export default ResetPassword;