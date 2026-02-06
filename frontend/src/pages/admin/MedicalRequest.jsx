import React, { useEffect, useState } from "react";
import { 
  Heart, 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Calendar,
  X,
  Eye,
  Download
} from "lucide-react";
import "./MedicalRequest.css";
import { API_BASE_URL } from "../../shared/constants/config"

const MedicalRequest = () => {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  
  const API_URL = API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/medical`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch applications");
        const data = await res.json();
        setApplications(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchApplications();
  }, [API_URL, token]);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this application?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/medical/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, status: "approved" } : app
          )
        );
        alert("Application approved successfully!");
      } else {
        alert("Failed to approve application");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving application");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this application?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/medical/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, status: "rejected" } : app
          )
        );
        alert("Application rejected");
      } else {
        alert("Failed to reject application");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting application");
    }
  };

  const openStatsModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeStatsModal = () => {
    setModalOpen(false);
    setModalType("");
  };

  const getStatsModalContent = () => {
    const pending = applications.filter(app => app.status === "pending").length;
    const verified = applications.filter(app => app.status === "verified").length;
    const approved = applications.filter(app => app.status === "approved").length;
    const rejected = applications.filter(app => app.status === "rejected").length;
    
    switch (modalType) {
      case "total": {
        return {
          title: "Total Requests Overview",
          data: [
            { label: "Total Requests", value: applications.length },
            { label: "Pending", value: pending },
            { label: "Verified", value: verified },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected }
          ]
        };
      }
      case "pending": {
        const avgCost = pending > 0 ? Math.round(applications.filter(app => app.status === "pending").reduce((sum, app) => sum + (app.totalCost || 0), 0) / pending) : 0;
        return {
          title: "Pending Requests Analysis",
          data: [
            { label: "Total Pending", value: pending },
            { label: "Awaiting Review", value: pending },
            { label: "Average Cost", value: `₹${avgCost.toLocaleString('en-IN')}` },
            { label: "Pending Rate", value: `${applications.length > 0 ? Math.round((pending / applications.length) * 100) : 0}%` },
            { label: "Needs Action", value: pending }
          ]
        };
      }
      case "verified": {
        return {
          title: "Verified Requests Details",
          data: [
            { label: "Total Verified", value: verified },
            { label: "Ready for Approval", value: verified },
            { label: "Verification Rate", value: `${applications.length > 0 ? Math.round((verified / applications.length) * 100) : 0}%` },
            { label: "Awaiting Decision", value: verified },
            { label: "Processing Time", value: "2-3 days" }
          ]
        };
      }
      case "approved": {
        const approvedCost = applications.filter(app => app.status === "approved").reduce((sum, app) => sum + (app.totalCost || 0), 0);
        return {
          title: "Approved Requests Summary",
          data: [
            { label: "Total Approved", value: approved },
            { label: "Total Amount", value: `₹${approvedCost.toLocaleString('en-IN')}` },
            { label: "Success Rate", value: `${applications.length > 0 ? Math.round((approved / applications.length) * 100) : 0}%` },
            { label: "Average Support", value: approved > 0 ? `₹${Math.round(approvedCost / approved).toLocaleString('en-IN')}` : "₹0" },
            { label: "Lives Helped", value: approved }
          ]
        };
      }
      default:
        return { title: "", data: [] };
    }
  };

  const filteredApps = applications.filter(
    (app) =>
      app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.staffName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === "pending").length,
    verified: applications.filter(app => app.status === "verified").length,
    approved: applications.filter(app => app.status === "approved").length,
  };

  return (
    <div className="medical-request-dashboard">
      <div className="medical-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <Heart />
            </div>
            <div className="header-text">
              <h1>Medical Support Requests</h1>
              <p>Review and manage medical assistance applications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total-card clickable" onClick={() => openStatsModal("total")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Total Requests</p>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon blue">
                <FileText />
              </div>
            </div>
          </div>

          <div className="stat-card pending-card clickable" onClick={() => openStatsModal("pending")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Pending</p>
                <p>{stats.pending}</p>
              </div>
              <div className="stat-icon yellow">
                <Clock />
              </div>
            </div>
          </div>

          <div className="stat-card verified-card clickable" onClick={() => openStatsModal("verified")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Verified</p>
                <p>{stats.verified}</p>
              </div>
              <div className="stat-icon cyan">
                <Eye />
              </div>
            </div>
          </div>

          <div className="stat-card approved-card clickable" onClick={() => openStatsModal("approved")}>
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
        </div>

        {/* Stats Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeStatsModal}>
            <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{getStatsModalContent().title}</h2>
                <button className="modal-close" onClick={closeStatsModal}>
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {getStatsModalContent().data.map((item, index) => (
                  <div key={index} className="modal-data-row">
                    <span className="modal-label">{item.label}</span>
                    <span className="modal-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-wrapper">
            <div className="search-icon">
              <Search />
            </div>
            <input
              type="text"
              placeholder="Search by patient, hospital, or applicant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-text">Loading applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Heart />
              </div>
              <h3>No applications found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="medical-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Patient Details</th>
                    <th>Hospital</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div className="applicant-cell">
                          <div className="applicant-avatar">
                            {(app.applicantName || app.staffName || "N").charAt(0).toUpperCase()}
                          </div>
                          <div className="applicant-info">
                            <h4>{app.applicantName || app.staffName || "N/A"}</h4>
                            <p>
                              <User />
                              Applicant
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="patient-cell">
                          <h4>{app.patientName}</h4>
                          <p className="patient-detail">{app.disease || "Medical Support"}</p>
                        </div>
                      </td>
                      <td>
                        <div className="hospital-cell">
                          <Building2 />
                          <span>{app.hospital}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cost-cell">
                          <span className="cost-value">
                            ₹{app.totalCost?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${app.status?.toLowerCase() || 'pending'}`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar />
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="action-btn view"
                            title="View Documents"
                          >
                            <Eye />
                          </button>
                          {app.status === "verified" && (
                            <>
                              <button
                                onClick={() => handleApprove(app._id)}
                                className="action-btn approve"
                              >
                                <CheckCircle />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(app._id)}
                                className="action-btn reject"
                              >
                                <XCircle />
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === "approved" && (
                            <span className="status-text approved">✓ Approved</span>
                          )}
                          {app.status === "rejected" && (
                            <span className="status-text rejected">✗ Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Documents Modal */}
        {selectedApp && (
          <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
            <div className="modal modal-right" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedApp(null)}
                className="modal-close-corner"
                aria-label="Close"
              >
                <X />
              </button>
              
              <div className="modal-header-docs">
                <h2>Application Documents</h2>
              </div>
              
              <div className="modal-body-docs">
                <div className="document-header">
                  <div className="doc-avatar">
                    <Heart />
                  </div>
                  <div>
                    <h3>{selectedApp.patientName}</h3>
                    <p>{selectedApp.hospital}</p>
                  </div>
                </div>

                <div className="document-details">
                  <div className="detail-row">
                    <span className="detail-label">Total Cost</span>
                    <span className="detail-value">₹{selectedApp.totalCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${selectedApp.status?.toLowerCase()}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                </div>

                <div className="documents-section">
                  <h4>Uploaded Documents</h4>
                  <div className="docs-list">
                    {selectedApp.declaration && (
                      <a href={`${API_URL}${selectedApp.declaration}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Declaration</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.applicantId && (
                      <a href={`${API_URL}${selectedApp.applicantId}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Applicant ID</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.staffId && (
                      <a href={`${API_URL}${selectedApp.staffId}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Staff ID</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.incomeProof && (
                      <a href={`${API_URL}${selectedApp.incomeProof}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Income Proof</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.photo && (
                      <a href={`${API_URL}${selectedApp.photo}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Photo</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.hospitalBill && (
                      <a href={`${API_URL}${selectedApp.hospitalBill}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Hospital Bill</span>
                        <Download className="download-icon" />
                      </a>
                    )}
                    {selectedApp.reports && selectedApp.reports.map((r, i) => (
                      <a key={i} href={`${API_URL}${r}`} target="_blank" rel="noreferrer" className="doc-link">
                        <FileText />
                        <span>Medical Report {i + 1}</span>
                        <Download className="download-icon" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRequest;