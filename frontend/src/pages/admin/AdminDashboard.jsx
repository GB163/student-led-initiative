import React, { useEffect, useState, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../../shared/services/api";
import { socketEvents, initializeSocket } from "../../shared/services/socketService";
import { getCurrentUser, debugAuthStorage } from "../../shared/utils/auth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { Users, Calendar, DollarSign, UserPlus, Heart, TrendingUp, Award, X, Wifi, WifiOff } from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [donations, setDonations] = useState([]);
  const [userDonationsTrend, setUserDonationsTrend] = useState([]);
  const [staffDonationsTrend, setStaffDonationsTrend] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [staffJoinRequests, setStaffJoinRequests] = useState([]);
  const [medicalRequests, setMedicalRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [users, setUsers] = useState([]);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalType, setChartModalType] = useState("");
  const [selectedChartData, setSelectedChartData] = useState(null);

  const isInitialized = useRef(false);

  // ✅ Initialize socket connection for real-time updates
  useEffect(() => {
    const initSocket = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        console.log("🔌 Admin: Initializing socket connection...");
        
        // Debug auth storage
        debugAuthStorage();
        
        await initializeSocket();
        
        // Get user info using the auth utility
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.id) {
          console.error("❌ No admin ID found");
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        const adminId = currentUser.id;
        console.log("📡 Admin: Registering admin:", adminId);
        console.log("   Role:", currentUser.role);
        console.log("   Name:", currentUser.name);
        
        // Verify this is actually an admin
        if (currentUser.role !== 'admin') {
          console.error("❌ User is not admin:", currentUser.role);
          setError("Access denied. Admin access required.");
          setLoading(false);
          return;
        }

        await socketEvents.registerAdmin(adminId);
        setSocketConnected(true);
        console.log("✅ Admin socket initialized");

        // Setup real-time listeners
        setupSocketListeners();
      } catch (err) {
        console.error("❌ Admin socket initialization failed:", err);
        setError("Failed to connect to real-time service");
        setSocketConnected(false);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up admin socket listeners");
      socketEvents.off('newUserMessage');
      socketEvents.off('newCallRequest');
      socketEvents.off('notificationUpdate');
      socketEvents.off('newUserRegistered');
      socketEvents.off('newDonation');
      socketEvents.off('newStaffJoinRequest');
    };
  }, []);

  // ✅ Setup socket event listeners for real-time updates
  const setupSocketListeners = () => {
    // Listen for new user registrations
    socketEvents.on('newUserRegistered', (data) => {
      console.log("👤 New user registered:", data);
      setUsers((prev) => [...prev, data.user]);
      setTotalUsers((prev) => prev + 1);
    });

    // Listen for new donations
    socketEvents.on('newDonation', (data) => {
      console.log("💰 New donation received:", data);
      setDonations((prev) => {
        const updatedDonations = [...prev, data.donation];
        updateDonationTrends(updatedDonations);
        return updatedDonations;
      });
    });

    // Listen for new call requests
    socketEvents.onNewCallRequest((data) => {
      console.log("📞 New call request:", data);
      setMedicalRequests((prev) => [...prev, data]);
    });

    // Listen for new staff join requests
    socketEvents.on('newStaffJoinRequest', (data) => {
      console.log("👔 New staff join request:", data);
      setStaffJoinRequests((prev) => [...prev, data]);
    });

    // Listen for notification updates
    socketEvents.onNotificationUpdate((data) => {
      console.log("🔔 Notification update:", data);
    });
  };

  // ✅ Helper function to update donation trends
  const updateDonationTrends = (allDonations) => {
    const userDonations = allDonations.filter(d => d.role === "user");
    const staffDonations = allDonations.filter(d => d.role === "staff");

    const getTrend = (arr) => {
      const trend = {};
      arr.forEach(d => {
        const month = new Date(d.createdAt).toLocaleString("default", { month: "short" });
        trend[month] = (trend[month] || 0) + d.amount;
      });
      return Object.entries(trend).map(([month, amount]) => ({ month, amount }));
    };
    
    setUserDonationsTrend(getTrend(userDonations));
    setStaffDonationsTrend(getTrend(staffDonations));

    // Update top donors
    const donors = {};
    allDonations.forEach(d => {
      donors[d.name] = (donors[d.name] || 0) + d.amount;
    });
    setTopDonors(
      Object.entries(donors)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    );
  };

  // ✅ Fetch initial dashboard data using proper API client
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("⚠️ No token found. Please login first.");
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Fetching admin dashboard data...");

        // ✅ Use apiClient instead of plain axios
        const [usersRes, eventsRes, donationsRes, joinRes, medicalRes] = await Promise.allSettled([
          apiClient.get('/admin/users'),
          apiClient.get('/events/active'),
          apiClient.get('/admin/donations'),
          apiClient.get('/admin/join-requests'),
          apiClient.get('/admin/medical')
        ]);

        // Handle users
        if (usersRes.status === 'fulfilled') {
          const nonAdminUsers = (usersRes.value.data || []).filter(u => u.role !== "admin");
          setUsers(nonAdminUsers);
          setTotalUsers(nonAdminUsers.length);
          console.log("✅ Users loaded:", nonAdminUsers.length);
        } else {
          console.error("❌ Failed to load users:", usersRes.reason);
        }

        // Handle events
        if (eventsRes.status === 'fulfilled') {
          const events = eventsRes.value.data || [];
          setActiveEvents(Array.isArray(events) ? events.length : 0);
          console.log("✅ Events loaded:", Array.isArray(events) ? events.length : 0);
        } else {
          console.error("❌ Failed to load events:", eventsRes.reason);
        }

        // Handle donations
        if (donationsRes.status === 'fulfilled') {
          const allDonations = donationsRes.value.data || [];
          setDonations(allDonations);
          updateDonationTrends(allDonations);
          console.log("✅ Donations loaded:", allDonations.length);
        } else {
          console.error("❌ Failed to load donations:", donationsRes.reason);
        }

        // Handle join requests
        if (joinRes.status === 'fulfilled') {
          const joinData = Array.isArray(joinRes.value.data) 
            ? joinRes.value.data 
            : joinRes.value.data?.data || [];
          setStaffJoinRequests(joinData);
          console.log("✅ Join requests loaded:", joinData.length);
        } else {
          console.error("❌ Failed to load join requests:", joinRes.reason);
        }

        // Handle medical requests
        if (medicalRes.status === 'fulfilled') {
          const medicalData = medicalRes.value.data || [];
          setMedicalRequests(medicalData);
          console.log("✅ Medical requests loaded:", medicalData.length);
        } else {
          console.error("❌ Failed to load medical requests:", medicalRes.reason);
        }

        setLoading(false);
        console.log("✅ Admin dashboard data loaded successfully");

      } catch (err) {
        console.error("❌ Failed to fetch dashboard data:", err);
        
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          setError("⚠️ Unauthorized. Please login as admin.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else if (err.message.includes('403')) {
          setError("⛔ Forbidden. You do not have admin access.");
        } else {
          setError(`❌ Failed to fetch dashboard data: ${err.message}`);
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType("");
  };

  const openChartModal = (type, data) => {
    setChartModalType(type);
    setSelectedChartData(data);
    setChartModalOpen(true);
  };

  const closeChartModal = () => {
    setChartModalOpen(false);
    setChartModalType("");
    setSelectedChartData(null);
  };

  const getModalContent = () => {
    switch (modalType) {
      case "users": {
        const activeUsers = users.filter(u => !u.blocked).length;
        const blockedUsers = users.filter(u => u.blocked).length;
        const staffUsers = users.filter(u => u.role === "staff").length;
        const regularUsers = users.filter(u => u.role === "user").length;
        
        return {
          title: "Total Users Overview",
          data: [
            { label: "Total Users", value: totalUsers },
            { label: "Active Users", value: activeUsers },
            { label: "Blocked Users", value: blockedUsers },
            { label: "Staff Members", value: staffUsers },
            { label: "Regular Users", value: regularUsers }
          ]
        };
      }
      case "donations": {
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        const avgDonation = donations.length > 0 ? Math.round(totalDonations / donations.length) : 0;
        const highestDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;
        const donorsCount = new Set(donations.map(d => d.name)).size;
        
        return {
          title: "Donations Breakdown",
          data: [
            { label: "Total Amount", value: `₹${totalDonations.toLocaleString('en-IN')}` },
            { label: "Total Donations", value: donations.length },
            { label: "Unique Donors", value: donorsCount },
            { label: "Average Donation", value: `₹${avgDonation.toLocaleString('en-IN')}` },
            { label: "Highest Donation", value: `₹${highestDonation.toLocaleString('en-IN')}` }
          ]
        };
      }
      case "events": {
        return {
          title: "Active Events Statistics",
          data: [
            { label: "Active Events", value: activeEvents },
            { label: "Events This Month", value: activeEvents },
            { label: "Upcoming Events", value: activeEvents },
            { label: "Event Participation", value: `${activeEvents * 15}+` },
            { label: "Average Attendees", value: activeEvents > 0 ? "25-30" : "0" }
          ]
        };
      }
      case "staff": {
        const approvedStaff = staffJoinRequests.filter(r => r.status === "approved").length;
        const pendingStaff = staffJoinRequests.filter(r => r.status === "pending").length;
        const rejectedStaff = staffJoinRequests.filter(r => r.status === "rejected").length;
        
        return {
          title: "Staff Members Analysis",
          data: [
            { label: "Total Staff", value: approvedStaff },
            { label: "Pending Requests", value: pendingStaff },
            { label: "Rejected Requests", value: rejectedStaff },
            { label: "Total Requests", value: staffJoinRequests.length },
            { label: "Approval Rate", value: staffJoinRequests.length > 0 ? `${Math.round((approvedStaff / staffJoinRequests.length) * 100)}%` : "0%" }
          ]
        };
      }
      case "medical": {
        const pendingMedical = medicalRequests.filter(r => r.status === "pending").length;
        const verifiedMedical = medicalRequests.filter(r => r.status === "verified").length;
        const rejectedMedical = medicalRequests.filter(r => r.status === "rejected").length;
        
        return {
          title: "Medical Requests Overview",
          data: [
            { label: "Total Requests", value: medicalRequests.length },
            { label: "Pending", value: `${pendingMedical} requests` },
            { label: "Verified", value: `${verifiedMedical} requests` },
            { label: "Rejected", value: `${rejectedMedical} requests` }
          ]
        };
      }
      default:
        return { title: "", data: [] };
    }
  };

  const getChartModalContent = () => {
    switch (chartModalType) {
      case "userDonations": {
        const userDonations = donations.filter(d => d.role === "user");
        const totalAmount = userDonations.reduce((sum, d) => sum + d.amount, 0);
        const avgAmount = userDonations.length > 0 ? Math.round(totalAmount / userDonations.length) : 0;
        
        return {
          title: "User Donations - Detailed Analysis",
          summary: [
            { label: "Total Donations", value: userDonations.length },
            { label: "Total Amount", value: `₹${totalAmount.toLocaleString('en-IN')}` },
            { label: "Average Donation", value: `₹${avgAmount.toLocaleString('en-IN')}` },
            { label: "Unique Donors", value: new Set(userDonations.map(d => d.name)).size }
          ],
          monthlyData: selectedChartData,
          recentDonations: userDonations.slice(0, 10).map(d => ({
            name: d.name,
            amount: `₹${d.amount.toLocaleString('en-IN')}`,
            date: new Date(d.createdAt).toLocaleDateString('en-IN')
          }))
        };
      }
      case "staffDonations": {
        const staffDonations = donations.filter(d => d.role === "staff");
        const totalAmount = staffDonations.reduce((sum, d) => sum + d.amount, 0);
        const avgAmount = staffDonations.length > 0 ? Math.round(totalAmount / staffDonations.length) : 0;
        
        return {
          title: "Staff Donations - Detailed Analysis",
          summary: [
            { label: "Total Donations", value: staffDonations.length },
            { label: "Total Amount", value: `₹${totalAmount.toLocaleString('en-IN')}` },
            { label: "Average Donation", value: `₹${avgAmount.toLocaleString('en-IN')}` },
            { label: "Unique Donors", value: new Set(staffDonations.map(d => d.name)).size }
          ],
          monthlyData: selectedChartData,
          recentDonations: staffDonations.slice(0, 10).map(d => ({
            name: d.name,
            amount: `₹${d.amount.toLocaleString('en-IN')}`,
            date: new Date(d.createdAt).toLocaleDateString('en-IN')
          }))
        };
      }
      case "topDonors": {
        return {
          title: "Top Donors - Detailed Breakdown",
          summary: [
            { label: "Total Top Donors", value: topDonors.length },
            { label: "Combined Amount", value: `₹${topDonors.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN')}` },
            { label: "Highest Contribution", value: topDonors.length > 0 ? `₹${topDonors[0].amount.toLocaleString('en-IN')}` : '₹0' },
            { label: "Average Top Donor", value: topDonors.length > 0 ? `₹${Math.round(topDonors.reduce((sum, d) => sum + d.amount, 0) / topDonors.length).toLocaleString('en-IN')}` : '₹0' }
          ],
          topDonorsList: topDonors.map((d, idx) => ({
            rank: idx + 1,
            name: d.name,
            amount: `₹${d.amount.toLocaleString('en-IN')}`,
            percentage: topDonors.length > 0 ? `${((d.amount / topDonors.reduce((sum, donor) => sum + donor.amount, 0)) * 100).toFixed(1)}%` : '0%'
          }))
        };
      }
      case "medicalRequests": {
        const pending = medicalRequests.filter(r => r.status === "pending");
        const verified = medicalRequests.filter(r => r.status === "verified");
        const rejected = medicalRequests.filter(r => r.status === "rejected");
        
        return {
          title: "Medical Requests - Status Breakdown",
          summary: [
            { label: "Total Requests", value: medicalRequests.length },
            { label: "Pending", value: `${pending.length} requests` },
            { label: "Verified", value: `${verified.length} requests` },
            { label: "Rejected", value: `${rejected.length} requests` }
          ],
          recentRequests: medicalRequests.slice(0, 10).map(r => ({
            id: r._id || r.id,
            status: r.status,
            date: new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN')
          }))
        };
      }
      default:
        return { title: "", summary: [] };
    }
  };

  const medicalData = useMemo(() => [
    { name: "Pending", value: medicalRequests.filter(r => r.status === "pending").length },
    { name: "Verified", value: medicalRequests.filter(r => r.status === "verified").length },
    { name: "Rejected", value: medicalRequests.filter(r => r.status === "rejected").length },
  ], [medicalRequests]);

  const COLORS = ["#fbbf24", "#10b981", "#ef4444"];
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const approvedStaff = staffJoinRequests.filter(r => r.status === "approved").length;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="header-info">
          <div className="socket-status">
            {socketConnected ? (
              <>
                <Wifi size={20} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981' }}>Live</span>
              </>
            ) : (
              <>
                <WifiOff size={20} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>Offline</span>
              </>
            )}
          </div>
          <div className="header-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard 
          icon={<Users size={28} />} 
          title="Total Users" 
          value={totalUsers} 
          color="blue" 
          trend="+12%" 
          onClick={() => openModal("users")}
        />
        <StatCard 
          icon={<DollarSign size={28} />} 
          title="Total Donations" 
          value={`₹${totalDonations.toLocaleString()}`} 
          color="green" 
          trend="+8%" 
          onClick={() => openModal("donations")}
        />
        <StatCard 
          icon={<Calendar size={28} />} 
          title="Active Events" 
          value={activeEvents} 
          color="purple" 
          trend="+5%" 
          onClick={() => openModal("events")}
        />
        <StatCard 
          icon={<UserPlus size={28} />} 
          title="Staff Members" 
          value={approvedStaff} 
          color="orange" 
          trend="+3%" 
          onClick={() => openModal("staff")}
        />
        <StatCard 
          icon={<Heart size={28} />} 
          title="Medical Requests" 
          value={medicalRequests.length} 
          color="red" 
          trend="+15%" 
          onClick={() => openModal("medical")}
        />
      </div>

      {/* Stats Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close-left" onClick={closeModal}>
                <X />
              </button>
              <h2>{getModalContent().title}</h2>
            </div>
            <div className="modal-body">
              {getModalContent().data.map((item, index) => (
                <div key={index} className="modal-data-row">
                  <span className="modal-label">{item.label}:</span>
                  <span className="modal-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div onClick={() => openChartModal("userDonations", userDonationsTrend)} style={{ cursor: 'pointer' }}>
          <ChartCard title="User Donations Trend" icon={<TrendingUp size={20} />} data={userDonationsTrend} color="#3b82f6" />
        </div>
        <div onClick={() => openChartModal("staffDonations", staffDonationsTrend)} style={{ cursor: 'pointer' }}>
          <ChartCard title="Staff Donations Trend" icon={<TrendingUp size={20} />} data={staffDonationsTrend} color="#10b981" />
        </div>
      </div>

      <div className="charts-grid">
        <div onClick={() => openChartModal("topDonors", topDonors)} style={{ cursor: 'pointer' }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Top Donors</h3>
              <Award size={20} className="trend-icon" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDonors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div onClick={() => openChartModal("medicalRequests", medicalData)} style={{ cursor: 'pointer' }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Medical Requests Status</h3>
              <Heart size={20} className="trend-icon" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={medicalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {medicalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Details Modal */}
      {chartModalOpen && (
        <div className="modal-overlay" onClick={closeChartModal}>
          <div className="modal-content chart-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close-left" onClick={closeChartModal}>
                <X />
              </button>
              <h2>{getChartModalContent().title}</h2>
            </div>
            <div className="modal-body">
              {/* Summary Section */}
              <div className="chart-modal-summary">
                <h3 className="section-title">Summary</h3>
                <div className="summary-grid">
                  {getChartModalContent().summary?.map((item, index) => (
                    <div key={index} className="summary-card">
                      <span className="summary-label">{item.label}:</span>
                      <span className="summary-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Trend Section */}
              {getChartModalContent().monthlyData && getChartModalContent().monthlyData.length > 0 && (
                <div className="chart-modal-section">
                  <h3 className="section-title">Monthly Trend</h3>
                  <div className="trend-table">
                    <div className="trend-table-header">
                      <span>Month</span>
                      <span>Amount</span>
                    </div>
                    {getChartModalContent().monthlyData.map((item, index) => (
                      <div key={index} className="trend-table-row">
                        <span>{item.month}</span>
                        <span className="amount-value">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Donations Section */}
              {getChartModalContent().recentDonations && getChartModalContent().recentDonations.length > 0 && (
                <div className="chart-modal-section">
                  <h3 className="section-title">Recent Donations (Top 10)</h3>
                  <div className="donations-table">
                    <div className="donations-table-header">
                      <span>Donor Name</span>
                      <span>Amount</span>
                      <span>Date</span>
                    </div>
                    {getChartModalContent().recentDonations.map((donation, index) => (
                      <div key={index} className="donations-table-row">
                        <span>{donation.name}</span>
                        <span className="amount-value">{donation.amount}</span>
                        <span>{donation.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Donors List */}
              {getChartModalContent().topDonorsList && (
                <div className="chart-modal-section">
                  <h3 className="section-title">Donor Rankings</h3>
                  <div className="donors-ranking">
                    {getChartModalContent().topDonorsList.map((donor) => (
                      <div key={donor.rank} className="donor-rank-card">
                        <div className="rank-badge">#{donor.rank}</div>
                        <div className="donor-info">
                          <span className="donor-name">{donor.name}</span>
                          <span className="donor-amount">{donor.amount}</span>
                        </div>
                        <div className="donor-percentage">{donor.percentage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Medical Requests */}
              {getChartModalContent().recentRequests && getChartModalContent().recentRequests.length > 0 && (
                <div className="chart-modal-section">
                  <h3 className="section-title">Recent Requests</h3>
                  <div className="requests-table">
                    <div className="requests-table-header">
                      <span>Request ID</span>
                      <span>Status</span>
                      <span>Date</span>
                    </div>
                    {getChartModalContent().recentRequests.map((request, index) => (
                      <div key={index} className="requests-table-row">
                        <span className="request-id">{request.id.substring(0, 8)}...</span>
                        <span className={`status-badge status-${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                        <span>{request.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ======= STAT CARD =======
const StatCard = ({ icon, title, value, color, trend, onClick }) => (
  <div className={`stat-card stat-card-${color} stat-card-clickable`} onClick={onClick}>
    <div className="stat-icon-wrapper">{icon}</div>
    <div className="stat-content">
      <p className="stat-title">{title}</p>
      <h3 className="stat-value">{value}</h3>
      <span className="stat-trend">{trend} from last month</span>
    </div>
  </div>
);

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  trend: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ======= CHART CARD =======
const ChartCard = ({ title, icon, data, color }) => (
  <div className="chart-card">
    <div className="chart-header">
      <h3>{title}</h3>
      {icon}
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        />
        <Line type="monotone" dataKey="amount" stroke={color} strokeWidth={3} dot={{ fill: color, r: 5 }} activeDot={{ r: 7 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  data: PropTypes.array.isRequired,
  color: PropTypes.string.isRequired,
};

export default AdminDashboard;