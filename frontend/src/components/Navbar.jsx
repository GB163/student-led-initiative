import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from '../shared/contexts/UserContext';
import "./Navbar.css";
import { Home, Info, Calendar, Heart, User, LogOut, BookOpen, Mail } from "lucide-react";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut } = useUser();
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleSignOut = () => {
    signOut();
    navigate("/signin");
  };

  if (!user || user.role !== "user") return null;

  const profilePicUrl = user.profilePic || "/default-avatar.png";

  return (
    <nav className="navbar">
      {/* Logo Section - Left Side */}
      <div className="navbar-left">
        <div className="navbar-logo">🎗️ Student-Led-Initiative</div>
      </div>

      {/* Main Navigation Links - Center */}
      <div className="navbar-center">
        <Link to="/home" className="nav-link">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/about" className="nav-link">
          <Info size={20} />
          <span>About</span>
        </Link>
        <Link to="/story" className="nav-link">
          <BookOpen size={20} />
          <span>Our Story</span>
        </Link>
        <Link to="/events" className="nav-link">
          <Calendar size={20} />
          <span>Events</span>
        </Link>
        <Link to="/apply" className="nav-link">
          <Heart size={20} />
          <span>Apply Medical Support</span>
        </Link>
      </div>

      {/* Profile Dropdown - Right Side */}
      <div className="navbar-right">
        <NotificationBell userRole={user.role} />

        <img
          key={user.profilePic} // ✅ ADDED: Forces re-render when URL changes
          src={profilePicUrl}
          alt="Profile"
          className="navbar-profile-pic"
          onClick={toggleDropdown}
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />

        {/* Dropdown Menu */}
        <div className={`dropdown-menu ${dropdownOpen ? "open" : ""}`}>
          <Link to="/profile" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
            <User size={20} />
            <span>Profile</span>
          </Link>

          <Link to="/contact" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
            <Mail size={20} />
            <span>Contact</span>
          </Link>

          <div className="dropdown-divider"></div>

          <button onClick={handleSignOut} className="dropdown-link logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;