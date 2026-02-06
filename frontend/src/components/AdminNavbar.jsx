import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./AdminNavbar.css";
import { useUser } from '../shared/contexts/UserContext';
import NotificationBell from "../components/NotificationBell";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  UserPlus, 
  Heart,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  Hospital,
  BookOpen
} from "lucide-react";

const AdminNavbar = () => {
  const { signOut } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  const toggleMenu = () => setMenuOpen(prev => !prev);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      {/* Logo Section - Left Side */}
      <div className="navbar-left">
        <Link to="/admin-dashboard" className="navbar-logo">
          <LayoutDashboard size={28} />
          <span>Admin Panel</span>
        </Link>
      </div>

      {/* Main Navigation Links - Center */}
      <div className="navbar-center">
        <Link 
          to="/admin-dashboard" 
          className={`nav-link ${isActive("/admin-dashboard") ? "active" : ""}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <Link 
          to="/admin/users" 
          className={`nav-link ${isActive("/admin/users") ? "active" : ""}`}
        >
          <Users size={20} />
          <span>Users</span>
        </Link>

        <Link 
          to="/admin/donations" 
          className={`nav-link ${isActive("/admin/donations") ? "active" : ""}`}
        >
          <DollarSign size={20} />
          <span>Donations</span>
        </Link>

        <Link 
          to="/admin/join-requests" 
          className={`nav-link ${isActive("/admin/join-requests") ? "active" : ""}`}
        >
          <UserPlus size={20} />
          <span>Join Requests</span>
        </Link>

        <Link 
          to="/admin/medical-requests" 
          className={`nav-link ${isActive("/admin/medical-requests") ? "active" : ""}`}
        >
          <Heart size={20} />
          <span>Medical Requests</span>
        </Link>
      </div>
      
      {/* Hamburger Menu - Right Side */}
      <div className="navbar-right">
        {/* Notification Bell */}
        <NotificationBell userRole="admin" />

        <div className="hamburger-icon" onClick={toggleMenu}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>

        {/* Dropdown Menu */}
        <div className={`dropdown-menu ${menuOpen ? "open" : ""}`}>
          <Link 
            to="/admin/events" 
            className={`dropdown-link ${isActive("/admin/events") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Calendar size={20} />
            <span>Events</span>
          </Link>

          <Link 
            to="/admin/updates" 
            className={`dropdown-link ${isActive("/admin/updates") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Bell size={20} />
            <span>Updates</span>
          </Link>

          {/* Story Link */}
          <Link
            to="/admin/story"
            className={`dropdown-link ${isActive("/admin/story") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <BookOpen size={20} />
            <span>Story</span>
          </Link>

          {/* Hospitals Link */}
          <Link
            to="/admin/hospitals"
            className={`dropdown-link ${isActive("/admin/hospitals") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Hospital size={20} />
            <span>Hospitals</span>
          </Link>

          <div className="dropdown-divider"></div>

          <button 
            onClick={handleLogout}
            className="dropdown-link logout-btn"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;