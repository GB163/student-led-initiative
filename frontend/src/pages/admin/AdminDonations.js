import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { 
  DollarSign, 
  Search, 
  Calendar, 
  Mail, 
  User, 
  CreditCard,
  TrendingUp,
  Users,
  IndianRupee,
  X
} from "lucide-react";
import "./AdminDonations.css";
// ✅ FIXED: Import getSocketUrl function instead of SOCKET_URL constant
import { API_BASE_URL, getSocketUrl } from "../../shared/constants/config";

// ✅ FIXED: Use getSocketUrl() to get the socket URL
const socket = io(getSocketUrl());

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ total: 0, count: 0, avgDonation: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const res = await axios.get(`${API_BASE_URL}/api/donations`);
      
      // Validate that response data is an array
      let donationsData = [];
      if (Array.isArray(res.data)) {
        donationsData = res.data;
      } else if (res.data && Array.isArray(res.data.donations)) {
        // If API returns { donations: [...] }
        donationsData = res.data.donations;
      } else {
        console.error("Unexpected API response structure:", res.data);
        setError("Invalid data format received from server");
        setLoading(false);
        return;
      }
      
      setDonations(donationsData);
      
      // Calculate stats
      const total = donationsData.reduce((sum, d) => sum + (d.amount || 0), 0);
      const count = donationsData.length;
      const avgDonation = count > 0 ? Math.round(total / count) : 0;
      
      setStats({ total, count, avgDonation });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching donations:", err);
      setError("Failed to fetch donations.");
      setDonations([]); // Ensure donations is always an array
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();

    socket.on("newDonation", (donation) => {
      if (donation && donation.amount) {
        setDonations((prev) => [donation, ...prev]);
        setStats(prevStats => ({
          total: prevStats.total + donation.amount,
          count: prevStats.count + 1,
          avgDonation: Math.round((prevStats.total + donation.amount) / (prevStats.count + 1))
        }));
      }
    });

    return () => socket.off("newDonation");
  }, []);

  // Safely filter donations with additional validation
  const filteredDonations = Array.isArray(donations) 
    ? donations.filter((donation) => {
        if (!donation) return false;
        
        const searchLower = searchQuery.toLowerCase();
        const name = (donation.name || "").toLowerCase();
        const email = (donation.email || "").toLowerCase();
        const collegeName = (donation.collegeName || "").toLowerCase();
        
        return name.includes(searchLower) ||
               email.includes(searchLower) ||
               collegeName.includes(searchLower);
      })
    : [];

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType("");
  };

  const getModalContent = () => {
    const safeDonations = Array.isArray(donations) ? donations : [];
    
    switch (modalType) {
      case "total": {
        const amounts = safeDonations.map(d => d.amount || 0);
        return {
          title: "Total Donations Breakdown",
          data: [
            { label: "Total Amount", value: `₹${stats.total.toLocaleString('en-IN')}` },
            { label: "Number of Donations", value: stats.count },
            { label: "Average Donation", value: `₹${stats.avgDonation.toLocaleString('en-IN')}` },
            { label: "Highest Donation", value: amounts.length > 0 ? `₹${Math.max(...amounts).toLocaleString('en-IN')}` : '₹0' },
            { label: "Lowest Donation", value: amounts.length > 0 ? `₹${Math.min(...amounts).toLocaleString('en-IN')}` : '₹0' }
          ]
        };
      }
      case "donors": {
        const roleBreakdown = safeDonations.reduce((acc, d) => {
          const role = d.role || 'other';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        return {
          title: "Donor Statistics",
          data: [
            { label: "Total Donors", value: stats.count },
            { label: "Students", value: roleBreakdown.student || 0 },
            { label: "Staff", value: roleBreakdown.staff || 0 },
            { label: "Alumni", value: roleBreakdown.alumni || 0 },
            { label: "Others", value: roleBreakdown.other || 0 }
          ]
        };
      }
      case "average": {
        const uniqueMonths = safeDonations.length > 0 
          ? new Set(safeDonations.map(d => d.createdAt ? new Date(d.createdAt).getMonth() : 0)).size
          : 1;
        const monthlyAvg = safeDonations.length > 0 
          ? Math.round(safeDonations.reduce((sum, d) => sum + (d.amount || 0), 0) / Math.max(1, uniqueMonths))
          : 0;
        return {
          title: "Average Donation Analysis",
          data: [
            { label: "Overall Average", value: `₹${stats.avgDonation.toLocaleString('en-IN')}` },
            { label: "Monthly Average", value: `₹${monthlyAvg.toLocaleString('en-IN')}` },
            { label: "Total Donations", value: stats.count },
            { label: "Total Amount", value: `₹${stats.total.toLocaleString('en-IN')}` },
            { label: "Median Range", value: safeDonations.length > 0 ? `₹${Math.round(stats.total / stats.count * 0.8).toLocaleString('en-IN')} - ₹${Math.round(stats.total / stats.count * 1.2).toLocaleString('en-IN')}` : '₹0' }
          ]
        };
      }
      default:
        return { title: "", data: [] };
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <DollarSign />
            </div>
            <div className="header-text">
              <h1>Donation Management</h1>
              <p>Track and monitor all donations</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total clickable" onClick={() => openModal("total")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Total Donations</p>
                <p>₹{stats.total.toLocaleString('en-IN')}</p>
              </div>
              <div className="stat-icon blue">
                <IndianRupee />
              </div>
            </div>
          </div>

          <div className="stat-card active clickable" onClick={() => openModal("donors")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Total Donors</p>
                <p>{stats.count}</p>
              </div>
              <div className="stat-icon green">
                <Users />
              </div>
            </div>
          </div>

          <div className="stat-card blocked clickable" onClick={() => openModal("average")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Avg. Donation</p>
                <p>₹{stats.avgDonation.toLocaleString('en-IN')}</p>
              </div>
              <div className="stat-icon orange">
                <TrendingUp />
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{getModalContent().title}</h2>
                <button className="modal-close" onClick={closeModal}>
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {getModalContent().data.map((item, index) => (
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
              placeholder="Search by name, email, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Donations Table */}
        <div className="table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-text">Loading donations...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">
                <DollarSign />
              </div>
              <h3>Error Loading Donations</h3>
              <p>{error}</p>
              <button 
                onClick={fetchDonations}
                className="retry-button"
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <DollarSign />
              </div>
              <h3>No donations found</h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : donations.length === 0 
                    ? 'No donations have been made yet' 
                    : 'Try adjusting your search criteria'
                }
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="donations-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Contact Info</th>
                    <th>Amount</th>
                    <th>Role</th>
                    <th>Payment ID</th>
                    <th>Order ID</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((donation) => (
                    <tr key={donation._id}>
                      <td>
                        <div className="donor-cell">
                          <div className="donor-avatar">
                            {(donation.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="donor-info">
                            <h4>{donation.name || 'Unknown'}</h4>
                            <p>
                              <User />
                              {donation.role || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          {donation.email && (
                            <div className="contact-item">
                              <Mail />
                              <span>{donation.email}</span>
                            </div>
                          )}
                          {donation.collegeName && (
                            <div className="contact-item college">
                              <span>{donation.collegeName}</span>
                            </div>
                          )}
                          {!donation.email && !donation.collegeName && (
                            <span className="no-data">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount-value">
                            ₹{(donation.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${donation.role || 'other'}`}>
                          {donation.role || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="payment-id">
                          <CreditCard />
                          <span>{donation.paymentId || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="order-id">
                          {donation.orderId || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar />
                          {donation.createdAt ? (
                            <>
                              {new Date(donation.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                              <span className="time">
                                {new Date(donation.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </>
                          ) : (
                            'N/A'
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
      </div>
    </div>
  );
};

export default AdminDonations;