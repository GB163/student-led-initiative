// pages/SignUp.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from '../shared/services/api'; // ✅ Use API service
import "./Auth.css";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (pwd.length < 6) return "Weak";
    if (pwd.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/)) return "Strong";
    return "Medium";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 'Strong') return '#4CAF50';
    if (passwordStrength === 'Medium') return '#FF9800';
    return '#F44336';
  };

  const getPasswordStrengthWidth = () => {
    if (passwordStrength === 'Strong') return '100%';
    if (passwordStrength === 'Medium') return '60%';
    return '30%';
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(getPasswordStrength(pwd));
  };

  // ✅ FIXED: Better error handling and using authAPI
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordStrength === 'Weak') {
      setError("Please use a stronger password (at least 6 characters).");
      return;
    }

    setLoading(true);

    try {
      console.log('🔵 Attempting signup for:', email);
      
      // ✅ Use authAPI instead of fetch
      const data = await authAPI.signUp({
        name,
        email,
        password,
        role: "user",
      });

      console.log('✅ Signup successful:', data);
      
      alert("✅ Registration successful. Please sign in.");
      navigate("/signin");
      
    } catch (err) {
      console.error("Sign up error:", err);
      
      // ✅ Extract proper error message
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Handle specific error messages
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else if (errorMessage.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage.includes('Password')) {
        setError('Password must be at least 6 characters long.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(errorMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* Logo + App Name */}
        <div className="auth-header">
          <img src="/blood_cancer_logo.png" alt="Logo" className="auth-logo" />
          <h1 className="auth-title">Student-Led-Initiative</h1>
          <p className="auth-tagline">Supporting patients in their time of need</p>
        </div>

        <h2 className="auth-heading">Create Account</h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(""); // Clear error when typing
              }}
              required
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear error when typing
              }}
              required
            />
          </div>

          <div className="input-group">
            <label>Create Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  handlePasswordChange(e);
                  setError(""); // Clear error when typing
                }}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            {password && (
              <div className="password-strength-container">
                <div className="strength-bar">
                  <div 
                    className="strength-bar-fill" 
                    style={{ 
                      width: getPasswordStrengthWidth(),
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <p className="password-strength-text" style={{ color: getPasswordStrengthColor() }}>
                  {passwordStrength}
                </p>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(""); // Clear error when typing
                }}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Sign in link */}
        <p className="auth-footer-text">
          Already have an account? <a href="/signin" className="auth-link">Sign In</a>
        </p>

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

export default SignUp;