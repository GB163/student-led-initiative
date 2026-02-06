import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from '../shared/constants/config';
import { Heart, Users, TrendingUp, Award, X, Calendar, Building2, MapPin, Phone, Mail } from "lucide-react";

export default function HeroSection({ openDonateModal, onJoinUsClick }) {
  const [stats, setStats] = useState({
    childrenHelped: "0",
    fundsRaised: "₹0",
    successRate: "0%",
    partnerHospitals: "0"
  });
  const [loading, setLoading] = useState(true);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [showDonorsModal, setShowDonorsModal] = useState(false);
  const [showHospitalsModal, setShowHospitalsModal] = useState(false);
  const [childrenData, setChildrenData] = useState([]);
  const [donorsData, setDonorsData] = useState([]);
  const [hospitalsByCity, setHospitalsByCity] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch donation stats
        const donationRes = await fetch(`${API_BASE_URL}/api/donations/stats`);
        const donationData = donationRes.ok ? await donationRes.json() : {};

        // Fetch medical stats (includes approval rate now)
        const medicalRes = await fetch(`${API_BASE_URL}/api/medical/stats`);
        const medicalData = medicalRes.ok ? await medicalRes.json() : {};

        // Fetch hospital count
        const hospitalRes = await fetch(`${API_BASE_URL}/api/hospitals/count`);
        const hospitalData = hospitalRes.ok ? await hospitalRes.json() : {};

        console.log('📊 Medical Stats:', medicalData); // Debug log

        setStats({
          childrenHelped: medicalData.childrenHelped || "0",
          fundsRaised: `${formatNumber(donationData.totalAmount || 0)}`,
          successRate: medicalData.successRate || "0%",
          partnerHospitals: hospitalData.count || "0"
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    if (num >= 1000000) {
      return "₹" + (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return "₹" + (num / 1000).toFixed(1) + "K";
    }
    return "₹" + num.toLocaleString();
  };

  const fetchChildrenDetails = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/medical/public/approved`);
      
      if (response.ok) {
        const data = await response.json();
        setChildrenData(Array.isArray(data) ? data : []);
      } else {
        console.log("Could not fetch medical records:", response.status);
        setChildrenData([]);
      }
    } catch (error) {
      console.error("Error fetching children details:", error);
      setChildrenData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchDonorsDetails = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/donations`);
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object with data property
        setDonorsData(Array.isArray(data) ? data : data.donations || []);
      } else {
        setDonorsData([]);
      }
    } catch (error) {
      console.error("Error fetching donors details:", error);
      setDonorsData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchHospitalsDetails = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hospitals/by-city`);
      if (response.ok) {
        const result = await response.json();
        setHospitalsByCity(result.data || []);
      } else {
        setHospitalsByCity([]);
      }
    } catch (error) {
      console.error("Error fetching hospitals details:", error);
      setHospitalsByCity([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleChildrenClick = () => {
    setShowChildrenModal(true);
    fetchChildrenDetails();
  };

  const handleDonorsClick = () => {
    setShowDonorsModal(true);
    fetchDonorsDetails();
  };

  const handleHospitalsClick = () => {
    setShowHospitalsModal(true);
    fetchHospitalsDetails();
  };

  const handleJoinUsClick = () => {
    if (onJoinUsClick) onJoinUsClick();
  };

  const handleDonateClick = () => {
    if (openDonateModal) openDonateModal();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
            animation: "pulse 8s ease-in-out infinite",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "8%",
            width: "150px",
            height: "150px",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
            background: "rgba(255, 255, 255, 0.1)",
            animation: "float 8s ease-in-out infinite 2s",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1200px",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              padding: "10px 24px",
              borderRadius: "50px",
              marginBottom: "32px",
              animation: "fadeInUp 0.8s ease 0.2s backwards",
            }}
          >
            <Heart size={18} color="white" fill="white" />
            <span
              style={{
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              Making a Difference Together
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: "900",
              color: "white",
              margin: "0 0 24px 0",
              lineHeight: "1.1",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              animation: "fadeInUp 0.8s ease 0.4s backwards",
            }}
          >
            Support Childhood
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Cancer Warriors
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(18px, 2.5vw, 24px)",
              color: "rgba(255, 255, 255, 0.95)",
              maxWidth: "700px",
              margin: "0 auto 48px",
              lineHeight: "1.6",
              fontWeight: "400",
              animation: "fadeInUp 0.8s ease 0.6s backwards",
            }}
          >
            Together we can make a difference in the lives of children fighting
            cancer. Every contribution brings hope and healing.
          </p>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "60px",
              animation: "fadeInUp 0.8s ease 0.8s backwards",
            }}
          >
            <button
              onClick={handleJoinUsClick}
              style={{
                padding: "18px 40px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#667eea",
                background: "white",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Users size={22} />
              Join Our Mission
            </button>

            <button
              onClick={handleDonateClick}
              style={{
                padding: "18px 40px",
                fontSize: "18px",
                fontWeight: "700",
                color: "white",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Heart size={22} fill="white" />
              Donate Now
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "30px",
              maxWidth: "900px",
              margin: "0 auto",
              animation: "fadeInUp 0.8s ease 1s backwards",
            }}
          >
            {[
              {
                icon: <Users size={32} />,
                number: stats.childrenHelped,
                label: "Children Helped",
                highlight: true,
                color: "rgba(34, 197, 94, 0.2)",
                clickable: true,
                onClick: handleChildrenClick,
              },
              {
                icon: <Heart size={32} />,
                number: stats.fundsRaised,
                label: "Funds Raised",
                highlight: false,
                clickable: true,
                onClick: handleDonorsClick,
              },
              {
                icon: <TrendingUp size={32} />,
                number: stats.successRate,
                label: "Success Rate",
                highlight: false,
                clickable: false,
              },
              {
                icon: <Award size={32} />,
                number: stats.partnerHospitals,
                label: "Partner Hospitals",
                highlight: false,
                clickable: true,
                onClick: handleHospitalsClick,
              },
            ].map((stat, index) => (
              <div
                key={index}
                onClick={stat.clickable ? stat.onClick : undefined}
                style={{
                  background:
                    stat.highlight && !loading
                      ? stat.color || "rgba(34, 197, 94, 0.2)"
                      : "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "30px 20px",
                  border: stat.highlight
                    ? "2px solid rgba(34, 197, 94, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  cursor: stat.clickable ? "pointer" : "default",
                  transform: stat.clickable ? "scale(1)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (stat.clickable) {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (stat.clickable) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div style={{ color: "white", marginBottom: "12px" }}>
                  {stat.icon}
                </div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: "white",
                    marginBottom: "8px",
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: "500",
                  }}
                >
                  {stat.label}
                </div>
                {stat.clickable && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.7)",
                      marginTop: "8px",
                      fontStyle: "italic",
                    }}
                  >
                    Click for details
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Children Helped Modal */}
      {showChildrenModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowChildrenModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
                Children We&apos;ve Helped
              </h2>
              <button
                onClick={() => setShowChildrenModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <X size={20} color="white" />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  Loading...
                </div>
              ) : childrenData.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  No children helped yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {childrenData.map((child) => (
                    <div
                      key={child._id}
                      style={{
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111" }}>
                            {child.patientName}
                          </h3>
                          <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
                            <strong>Diagnosis:</strong> {child.diagnosis}
                          </p>
                          <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
                            <strong>Hospital:</strong> {child.hospital}
                          </p>
                          <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                            <strong>Age:</strong> {child.age} years
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#667eea", marginBottom: "4px" }}>
                            ₹{child.totalCost?.toLocaleString() || 'N/A'}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                            <Calendar size={12} />
                            {formatDate(child.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "#dcfce7",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#166534",
                          display: "inline-block",
                        }}
                      >
                        ✓ Approved
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Donors Modal */}
      {showDonorsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowDonorsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
                Our Generous Donors
              </h2>
              <button
                onClick={() => setShowDonorsModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <X size={20} color="white" />
              </button>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  Loading...
                </div>
              ) : donorsData.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  No donations yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {donorsData.map((donor) => (
                    <div
                      key={donor._id}
                      style={{
                        padding: "20px",
                        background: "#fef2f2",
                        borderRadius: "12px",
                        border: "1px solid #fecaca",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111" }}>
                            {donor.name}
                          </h3>
                          {donor.email && (
                            <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
                              {donor.email}
                            </p>
                          )}
                          {donor.collegeName && (
                            <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
                              <strong>College:</strong> {donor.collegeName}
                            </p>
                          )}
                          <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
                            <Calendar size={12} />
                            {formatDate(donor.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626" }}>
                            ₹{donor.amount?.toLocaleString()}
                          </div>
                          {donor.role && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "4px 12px",
                                background: donor.role === 'staff' ? '#dbeafe' : '#f3e8ff',
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: donor.role === 'staff' ? '#1e40af' : '#6b21a8',
                              }}
                            >
                              {donor.role === 'staff' ? 'Staff' : 'User'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hospitals Modal */}
      {showHospitalsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowHospitalsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                color: "white",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
                Our Partner Hospitals
              </h2>
              <button
                onClick={() => setShowHospitalsModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <X size={20} color="white" />
              </button>
            </div>

            <div style={{ padding: "32px", overflowY: "auto", flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  Loading...
                </div>
              ) : hospitalsByCity.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  <Building2 size={48} color="#9ca3af" style={{ margin: "0 auto 16px" }} />
                  <p>No hospitals added yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {hospitalsByCity.map((cityGroup) => (
                    <div
                      key={cityGroup._id}
                      style={{
                        background: "#f9fafb",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "20px",
                          paddingBottom: "16px",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        <MapPin size={20} color="#10b981" />
                        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#111", flex: 1 }}>
                          {cityGroup._id}
                        </h3>
                        <span
                          style={{
                            background: "white",
                            color: "#10b981",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            border: "1px solid #d1fae5",
                          }}
                        >
                          {cityGroup.count} {cityGroup.count === 1 ? 'hospital' : 'hospitals'}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {cityGroup.hospitals.map((hospital) => (
                          <div
                            key={hospital.id}
                            style={{
                              background: "white",
                              borderRadius: "12px",
                              padding: "20px",
                              border: "1px solid #e5e7eb",
                              transition: "all 0.2s",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                              <Building2 size={18} color="#3b82f6" />
                              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#111" }}>
                                {hospital.name}
                              </h4>
                            </div>

                            <p style={{ margin: "0 0 12px 30px", fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
                              {hospital.address}
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "30px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#6b7280" }}>
                                <Phone size={14} />
                                <span>{hospital.phone}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#6b7280" }}>
                                <Mail size={14} />
                                <span>{hospital.email}</span>
                              </div>
                            </div>

                            {hospital.specialties && hospital.specialties.length > 0 && (
                              <div style={{ marginTop: "16px", paddingLeft: "30px" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {hospital.specialties.map((specialty, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
                                        color: "#1e40af",
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        border: "1px solid #bfdbfe",
                                      }}
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </>
  );
}

HeroSection.propTypes = {
  openDonateModal: PropTypes.func.isRequired,
  onJoinUsClick: PropTypes.func.isRequired,
};