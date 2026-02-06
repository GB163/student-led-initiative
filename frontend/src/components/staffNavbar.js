import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useUser } from '../shared/contexts/UserContext';
import { API_BASE_URL, SOCKET_URL } from '../shared/constants/config';
import DonateModal from "./DonateModal";
import NotificationBell from "./NotificationBell";
import "./StaffNavbar.css";
import { LayoutDashboard, MessageSquare, Calendar, CheckCircle, Heart, User, LogOut } from "lucide-react";

const socket = io(SOCKET_URL);

function StaffNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount, setNotifCount] = useState({ chat: 0, call: 0 });
  const [showDonateModal, setShowDonateModal] = useState(false);

  const { user, signOut } = useUser();
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleSignOut = () => {
    signOut();
    navigate("/signin");
  };

  // ✅ FIXED: Fetch notification counts with proper auth headers
  const fetchNotificationCounts = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      // ✅ Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - user may need to login again');
        return;
      }

      // ✅ Create headers with Authorization
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('🔐 Fetching notifications with auth for user:', user._id);

      // Get call requests for this staff's queue
      const callRes = await fetch(
        `${API_BASE_URL}/api/call-requests/my-queue/${user._id}`,
        { headers }
      );
      
      if (!callRes.ok) {
        console.error(`❌ Call requests fetch failed: ${callRes.status}`);
        if (callRes.status === 401) {
          console.error('🚨 Token expired or invalid - redirecting to login');
          signOut();
          navigate("/signin");
          return;
        }
      }
      
      const callData = await callRes.json();
      const pendingCallsCount = Array.isArray(callData) 
        ? callData.filter(req => req.status === "pending").length 
        : 0;

      // Get chat messages
      const chatRes = await fetch(
        `${API_BASE_URL}/api/contact`,
        { headers }
      );
      
      if (!chatRes.ok) {
        console.error(`❌ Chat fetch failed: ${chatRes.status}`);
      }
      
      const chatData = await chatRes.json();
      
      // Count unique users with messages
      const uniqueUsers = new Set();
      if (Array.isArray(chatData)) {
        chatData.forEach(msg => {
          if (msg.role === "user" && msg.socketId) {
            uniqueUsers.add(msg.socketId);
          }
        });
      }
      
      const chatCount = uniqueUsers.size;

      setNotifCount({ chat: chatCount, call: pendingCallsCount });
      
      console.log(`✅ Notification counts updated: ${chatCount} chats, ${pendingCallsCount} calls`);
      
    } catch (err) {
      console.error("❌ Failed to fetch notification counts:", err);
      
      // If error is network-related, don't logout
      if (err.message.includes('fetch')) {
        console.warn('⚠️ Network error - will retry later');
      }
    }
  }, [user?._id, signOut, navigate]);

  // Fetch counts on mount and periodically
  useEffect(() => {
    if (user?._id) {
      fetchNotificationCounts();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id, fetchNotificationCounts]);

  // Socket listeners - refresh counts on events
  useEffect(() => {
    if (!user) return;

    const handleNewUserMessage = () => {
      console.log("📬 New user message - refreshing counts");
      fetchNotificationCounts();
    };
    
    const handleNewCallRequest = () => {
      console.log("📞 New call request - refreshing counts");
      fetchNotificationCounts();
    };
    
    const handleCallRequestRemoved = () => {
      console.log("🗑️ Call removed - refreshing counts");
      fetchNotificationCounts();
    };
    
    const handleCallAccepted = () => {
      console.log("✅ Call accepted - refreshing counts");
      fetchNotificationCounts();
    };
    
    const handleCallUpdated = () => {
      console.log("🔄 Call updated - refreshing counts");
      fetchNotificationCounts();
    };

    socket.on("newUserMessage", handleNewUserMessage);
    socket.on("newCallRequest", handleNewCallRequest);
    socket.on("callRequestRemoved", handleCallRequestRemoved);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callUpdated", handleCallUpdated);

    return () => {
      socket.off("newUserMessage", handleNewUserMessage);
      socket.off("newCallRequest", handleNewCallRequest);
      socket.off("callRequestRemoved", handleCallRequestRemoved);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callUpdated", handleCallUpdated);
    };
  }, [user, fetchNotificationCounts]);

  // Reset counts when navigating to contact page
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === "/staff/contact") {
        setTimeout(fetchNotificationCounts, 500);
      }
    };
    
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [fetchNotificationCounts]);

  if (!user) return null;

  const profilePicUrl = user.profilePic || "/default-avatar.png";
  const totalNotifications = notifCount.chat + notifCount.call;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-heading">
          <div className="navbar-logo">
            <LayoutDashboard size={24} />
            Staff Panel
          </div>
        </div>

        <div className="navbar-links">
          <Link to="/staff/dashboard">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/staff/contact"
            onClick={() => {
              setTimeout(fetchNotificationCounts, 500);
            }}
          >
            <MessageSquare size={20} />
            <span>Messages & Calls</span>
            {totalNotifications > 0 && (
              <span className="notif-badge">{totalNotifications}</span>
            )}
          </Link>

          <Link to="/staff/events">
            <Calendar size={20} />
            <span>Events</span>
          </Link>

          <Link to="/staff/verification">
            <CheckCircle size={20} />
            <span>Verify Applications</span>
          </Link>

          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setShowDonateModal(true);
            }}
          >
            <Heart size={20} />
            <span>Donate</span>
          </Link>

          {/* Notification Bell */}
          <NotificationBell userRole="staff" />

          <div className="dropdown">
            <img
              key={user.profilePic} // ✅ Forces re-render when URL changes
              src={profilePicUrl}
              alt="Profile"
              className="navbar-profile-pic"
              onClick={toggleDropdown}
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className={`dropdown-content ${dropdownOpen ? "show" : ""}`}>
              <Link to="/apply" onClick={() => setDropdownOpen(false)}>
                <Heart size={20} />
                <span>Apply Medical Support</span>
              </Link>
              <Link to="/staff/profile" onClick={() => setDropdownOpen(false)}>
                <User size={20} />
                <span>Profile</span>
              </Link>
              <button onClick={handleSignOut}>
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showDonateModal && (
        <DonateModal closeModal={() => setShowDonateModal(false)} />
      )}
    </>
  );
}

export default StaffNavbar;