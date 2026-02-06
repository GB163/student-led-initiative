// pages/SignIn.js
import React, { useState } from "react";
import { useUser } from '../shared/contexts/UserContext';
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [error, setError] = useState(""); // ✅ Added error state
  const { signIn } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const adminEmail = "studentledinitiative2@gmail.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // ✅ Clear previous errors
    setLoading(true);

    try {
      const success = await signIn(email, password, selectedRole);

      if (!success) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const storedUser = JSON.parse(sessionStorage.getItem("user"));
      if (!storedUser) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const userRole = storedUser.role;

      if (selectedRole === "admin") {
        if (email.toLowerCase() !== adminEmail.toLowerCase()) {
          setError("Only official admin email can log in as Admin.");
          setLoading(false);
          return;
        }
        if (userRole !== "admin") {
          setError("This account is not registered as Admin.");
          setLoading(false);
          return;
        }
        setLoading(false);
        return navigate("/admin-dashboard");
      }

      if (selectedRole === "staff") {
        if (userRole === "staff") {
          setLoading(false);
          return navigate("/staff/dashboard");
        }
        setError("You are not approved as Staff yet.");
        setLoading(false);
        return;
      }

      if (selectedRole === "user") {
        if (userRole === "user") {
          setLoading(false);
          return navigate("/home");
        }
        if (userRole === "staff") {
          setError("You are Staff now. Please log in as Staff.");
          setLoading(false);
          return;
        }
        if (userRole === "admin") {
          setError("Admin cannot log in as User.");
          setLoading(false);
          return;
        }
      }

      setError("Please select a valid role.");
      setLoading(false);
    } catch (err) {
      console.error("SignIn error:", err);
      
      // ✅ FIXED: Extract proper error message
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      
      // Handle specific error messages
      if (errorMessage.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (errorMessage.includes('blocked')) {
        setError('Your account has been blocked. Please contact support.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your internet connection.');
      } else if (errorMessage.includes('role')) {
        setError(errorMessage);
      } else {
        setError('Sign in failed. Please try again.');
      }
      
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

        <h2 className="auth-heading">Sign In</h2>

        <form onSubmit={handleSubmit}>
          {/* ✅ Error Message Display */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          )}

          {/* Role selector */}
          <div className="input-group">
            <label>Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setError(""); // Clear error when changing role
              }}
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Email input */}
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

          {/* Password input */}
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
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
          </div>

          {/* Forgot password */}
          <div className="forgot-password-wrapper">
            <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Sign up link */}
        <p className="auth-footer-text">
          Don&apos;t have an account? <a href="/signup" className="auth-link">Sign Up</a>
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

export default SignIn;