import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Briefcase,
  Building2,
  GraduationCap,
  Filter,
  AlertCircle
} from "lucide-react";
import "./AdminJoinRequests.css";
// ✅ FIXED: Import getSocketUrl function instead of SOCKET_URL constant
import { API_BASE_URL, getSocketUrl } from "../../shared/constants/config";

function AdminJoinRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, approved, rejected
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchRequests();

    // ✅ FIXED: Use getSocketUrl() to get the socket URL
    const socket = io(getSocketUrl());
    socket.on("newJoinRequest", (req) => {
      setRequests((prev) => {
        const updated = [req, ...prev];
        updateStats(updated);
        return updated;
      });
    });
    socket.on("updateJoinRequest", (updatedReq) => {
      setRequests((prev) => {
        const updated = prev.map((r) => (r._id === updatedReq._id ? updatedReq : r));
        updateStats(updated);
        return updated;
      });
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests`);
      const data = await res.json();
      const requestsData = Array.isArray(data) ? data : data.data || [];
      setRequests(requestsData);
      updateStats(requestsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch join requests:", err);
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const total = data.length;
    const pending = data.filter(r => r.status === "pending").length;
    const approved = data.filter(r => r.status === "approved").length;
    const rejected = data.filter(r => r.status === "rejected").length;
    setStats({ total, pending, approved, rejected });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/${id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Request approved and email sent!", type: "success" });
        fetchRequests();
      } else {
        setToast({ message: "Error: " + data.message, type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Server error", type: "error" });
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/${id}/reject`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Request rejected and email sent!", type: "error" });
        fetchRequests();
      } else {
        setToast({ message: "Error: " + data.message, type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Server error", type: "error" });
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.college.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || req.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <UserPlus />
            </div>
            <div className="header-text">
              <h1>Join Requests</h1>
              <p>Review and manage membership applications</p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle /> : <AlertCircle />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div 
            className={`stat-card total ${filterStatus === 'all' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Total Requests</p>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon blue">
                <UserPlus />
              </div>
            </div>
          </div>

          <div 
            className={`stat-card pending ${filterStatus === 'pending' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Pending</p>
                <p>{stats.pending}</p>
              </div>
              <div className="stat-icon orange">
                <Clock />
              </div>
            </div>
          </div>

          <div 
            className={`stat-card active ${filterStatus === 'approved' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Approved</p>
                <p>{stats.approved}</p>
              </div>
              <div className="stat-icon green">
                <CheckCircle />
              </div>
            </div>
          </div>

          <div 
            className={`stat-card blocked ${filterStatus === 'rejected' ? 'active-filter' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Rejected</p>
                <p>{stats.rejected}</p>
              </div>
              <div className="stat-icon red">
                <XCircle />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-section">
          <div className="search-section">
            <div className="search-wrapper">
              <div className="search-icon">
                <Search />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or college..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-icon">
              <Filter />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">Loading join requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <UserPlus />
            </div>
            <h3>No join requests found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((req) => (
              <div key={req._id} className={`request-card ${req.status}`}>
                <div className="request-header">
                  <div className="request-avatar">
                    {req.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-title">
                    <h3>{req.name}</h3>
                    <span className={`status-badge ${req.status}`}>
                      {req.status === "pending" && <Clock />}
                      {req.status === "approved" && <CheckCircle />}
                      {req.status === "rejected" && <XCircle />}
                      {req.status}
                    </span>
                  </div>
                </div>

                <div className="request-details">
                  <div className="detail-item">
                    <Mail />
                    <span>{req.email}</span>
                  </div>
                  <div className="detail-item">
                    <Briefcase />
                    <span className="capitalize">{req.role}</span>
                  </div>
                  <div className="detail-item">
                    <GraduationCap />
                    <span>{req.department}</span>
                  </div>
                  <div className="detail-item">
                    <Building2 />
                    <span>{req.college}</span>
                  </div>
                </div>

                {req.status === "pending" && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleApprove(req._id)}
                      className="action-btn approve"
                    >
                      <CheckCircle />
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      className="action-btn reject"
                    >
                      <XCircle />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminJoinRequests;