import React, { useState, useEffect } from 'react';
import './StaffVerification.css';
import { API_BASE_URL } from '../../shared/constants/config';

const StaffVerification = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch all applications
  useEffect(() => {
    fetchApplications();
  }, []);

  // Filter applications when search or filter changes
  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }

      // ✅ FIXED: Use correct endpoint from your backend
      console.log('🔍 Fetching applications from:', `${API_BASE_URL}/api/medical/pending`);

      const response = await fetch(`${API_BASE_URL}/api/medical/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Applications fetched:', data);

      // Handle different response formats
      const apps = data.applications || data.data || data || [];
      setApplications(apps);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.applicantName?.toLowerCase().includes(query) ||
        app.patientName?.toLowerCase().includes(query) ||
        app.hospital?.toLowerCase().includes(query) ||
        app.email?.toLowerCase().includes(query) ||
        app.diagnosis?.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleVerify = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(`✅ Verifying application: ${id}`);

      // ✅ FIXED: Use correct endpoint from your backend
      const response = await fetch(`${API_BASE_URL}/api/medical/verify/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to verify application');
      }

      const result = await response.json();
      console.log('✅ Verification successful:', result);

      // Update local state - change to 'verified'
      setApplications(prev =>
        prev.map(app => app._id === id ? { ...app, status: 'verified' } : app)
      );

      alert('✅ Application verified successfully!');
    } catch (error) {
      console.error('❌ Error verifying application:', error);
      alert(`Failed to verify: ${error.message}`);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Ask for rejection reason
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return; // User cancelled

      console.log(`❌ Rejecting application: ${id}`);

      // ✅ FIXED: Use correct endpoint from your backend
      const response = await fetch(`${API_BASE_URL}/api/medical/admin/medical/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject application');
      }

      const result = await response.json();
      console.log('✅ Rejection successful:', result);

      // Update local state - change to 'rejected'
      setApplications(prev =>
        prev.map(app => app._id === id ? { ...app, status: 'rejected' } : app)
      );

      alert('✅ Application rejected successfully!');
    } catch (error) {
      console.error('❌ Error rejecting application:', error);
      alert(`Failed to reject: ${error.message}`);
    }
  };

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      verified: applications.filter(app => app.status === 'verified').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="verification-page">
        <div className="verification-hero">
          <div className="hero-content">
            <h1>Staff Verification</h1>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-page">
        <div className="verification-hero">
          <div className="hero-content">
            <h1>Staff Verification</h1>
            <p style={{ color: '#fee2e2' }}>❌ Error: {error}</p>
            <button 
              className="btn-view" 
              onClick={fetchApplications}
              style={{ marginTop: '20px' }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-page">
      {/* Hero Section */}
      <div className="verification-hero">
        <div className="hero-content">
          <h1>Staff Verification Dashboard</h1>
          <p>Review and manage all medical assistance applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>

        <div className="stat-card verified">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.verified}</div>
            <div className="stat-label">Verified</div>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, patient, hospital, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setStatusFilter('verified')}
          >
            Verified ({stats.verified})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="verification-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Patient</th>
                <th>Hospital</th>
                <th>Diagnosis</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="no-data-content">
                      <div className="no-data-icon">📭</div>
                      <p>No applications found</p>
                      <span>
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'No applications submitted yet'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <div className="applicant-cell">
                        <div>
                          <div className="applicant-name">{app.applicantName}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {app.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="patient-name">{app.patientName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Age: {app.age || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="hospital-name">{app.hospital}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                        {app.diagnosis || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {new Date(app.createdAt || app.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status === 'pending' && '⏳'}
                        {app.status === 'verified' && '✅'}
                        {app.status === 'rejected' && '❌'}
                        {' '}{app.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowModal(true);
                          }}
                        >
                          👁️ View
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              className="btn-verify"
                              onClick={() => handleVerify(app._id)}
                            >
                              ✅ Verify
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleReject(app._id)}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span>📋</span>
                Application Details
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="applicant-info">
                <div className="info-row">
                  <strong>Applicant Name:</strong>
                  <span>{selectedApplication.applicantName}</span>
                </div>
                <div className="info-row">
                  <strong>Email:</strong>
                  <span>{selectedApplication.email}</span>
                </div>
                <div className="info-row">
                  <strong>Phone:</strong>
                  <span>{selectedApplication.phone}</span>
                </div>
                <div className="info-row">
                  <strong>Patient Name:</strong>
                  <span>{selectedApplication.patientName}</span>
                </div>
                <div className="info-row">
                  <strong>Age:</strong>
                  <span>{selectedApplication.age || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <strong>Hospital:</strong>
                  <span>{selectedApplication.hospital}</span>
                </div>
                <div className="info-row">
                  <strong>Diagnosis:</strong>
                  <span>{selectedApplication.diagnosis}</span>
                </div>
                <div className="info-row">
                  <strong>Total Cost:</strong>
                  <span>₹{selectedApplication.totalCost?.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedApplication.status}`}>
                    {selectedApplication.status}
                  </span>
                </div>
              </div>

              {/* Documents Section */}
              {selectedApplication.documents && Object.keys(selectedApplication.documents).length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                    📎 Uploaded Documents
                  </h4>
                  <div className="documents-grid">
                    {Object.entries(selectedApplication.documents).map(([key, url]) => {
                      if (!url) return null;
                      const docName = key.replace(/([A-Z])/g, ' $1').trim();
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          <span>📄</span>
                          <span>{docName}</span>
                          <span className="download-icon">⬇️</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffVerification;