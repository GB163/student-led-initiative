import React, { useState, useEffect } from "react";
import { GraduationCap, Briefcase } from "lucide-react";
import { colleges as collegesList } from "../../data/colleges";
import axios from "axios";

// ✅ FIXED: Remove /api from here, add it in the request URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://studentledinitiative.onrender.com';

console.log('🔧 Web JoinUs - API URL:', API_BASE_URL);

export default function JoinUs() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [nonTechOption, setNonTechOption] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [roll, setRoll] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sortedColleges = [...collegesList].sort((a, b) =>
      a.localeCompare(b)
    );
    setColleges(["Select your college", ...sortedColleges, "Other (Not Listed)"]);
  }, []);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (role === "Student") {
      if (!department || !name || !college || !roll || !email) {
        alert("Please fill all the student details, including email");
        return;
      }
      if (!nonTechOption) {
        alert("Please select your role in the department");
        return;
      }
      if (college === "Select your college") {
        alert("Please select a valid college");
        return;
      }
    } else if (role === "Job") {
      if (!name || !jobRole || !email) {
        alert("Please enter your name, email and select a role");
        return;
      }
    }

    // Email validation
    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const formData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: role === "Student" ? department : "N/A",
        college: role === "Student" ? college : "N/A",
        rollNumber: role === "Student" ? roll.trim() : "N/A",
        specificRole: role === "Student" ? nonTechOption : jobRole,
      };

      // ✅ FIXED: Now includes /api/ prefix
      const fullUrl = `${API_BASE_URL}/api/join-requests`;
      
      console.log('📤 Submitting join request:', formData);
      console.log('🔗 Full API URL:', fullUrl);

      const response = await axios.post(fullUrl, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // ✅ 60 seconds for Render spin-up
      });

      console.log('✅ Response:', response.data);

      setLoading(false);

      // Success alert
      alert(
        `Success! 🎉\n\n${response.data.message || 'Your application has been submitted successfully. Check your email for confirmation!'}`
      );

      // Reset form
      setName('');
      setEmail('');
      setDepartment('');
      setCollege('');
      setRoll('');
      setJobRole('');
      setNonTechOption('');
      setStep(1);
      
    } catch (error) {
      console.error('❌ Full error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error request:', error.request);
      
      setLoading(false);

      let errorMessage = 'Failed to submit application. Please try again.';

      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        console.error('❌ Server error:', error.response.status, error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = '⏱️ Request timeout.\n\nThe server might be starting up (Render free tier takes 30-60 seconds to wake up).\n\nPlease wait a moment and try again.';
      } else if (error.request) {
        // Request made but no response
        errorMessage = '❌ Cannot connect to server.\n\nPlease check:\n• Your internet connection\n• The server might be starting up (wait 30-60 seconds)\n• Try again in a moment';
        console.error('❌ No response received');
      } else {
        errorMessage = error.message || errorMessage;
      }

      alert(`Error\n\n${errorMessage}`);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a5f 0%, #2d5986 50%, #1e3a5f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(249, 115, 22, 0.12) 0%, transparent 40%)",
        pointerEvents: "none"
      }} />

      <div style={{
        position: "relative",
        background: "white",
        borderRadius: "16px",
        maxWidth: "600px",
        width: "100%",
        padding: "40px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        <button
          onClick={() => window.history.back()}
          disabled={loading}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.9)",
            border: "2px solid rgba(0, 0, 0, 0.1)",
            fontSize: "28px",
            color: "#666",
            cursor: loading ? "not-allowed" : "pointer",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.3s",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 100,
            opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = "rgba(255, 255, 255, 1)";
              e.target.style.transform = "rotate(90deg) scale(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.9)";
            e.target.style.transform = "rotate(0deg) scale(1)";
          }}
        >
          ×
        </button>

        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            disabled={loading}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "rgba(255, 255, 255, 0.9)",
              border: "2px solid rgba(0, 0, 0, 0.1)",
              fontSize: "20px",
              color: "#666",
              cursor: loading ? "not-allowed" : "pointer",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "all 0.3s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 100,
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "rgba(255, 255, 255, 1)";
                e.target.style.transform = "translateX(-4px)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.9)";
              e.target.style.transform = "translateX(0)";
            }}
          >
            ←
          </button>
        )}

        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px"
            }}>
              ❤️
            </div>

            <h1 style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1a1a1a",
              margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Join Our Mission
            </h1>

            <div style={{
              height: "3px",
              width: "100%",
              background: "linear-gradient(90deg, transparent, #667eea, transparent)",
              margin: "20px 0 8px 0"
            }} />

            <p style={{
              color: "white",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              margin: "0 0 30px 0"
            }}>
              Choose your category to continue
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "30px"
            }}>
              <div
                onClick={() => handleRoleSelect("Student")}
                style={{
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "30px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "white"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "8px",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <GraduationCap size={32} color="white" />
                </div>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#1a1a1a",
                  margin: "0 0 8px 0"
                }}>
                  I&apos;m a Student
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "#666",
                  margin: "0 0 20px 0"
                }}>
                  Currently enrolled in a college or university
                </p>
                <button style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}>
                  Select
                </button>
              </div>

              <div
                onClick={() => handleRoleSelect("Job")}
                style={{
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "30px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "white"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "8px",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Briefcase size={32} color="white" />
                </div>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#1a1a1a",
                  margin: "0 0 8px 0"
                }}>
                  I&apos;m a Working Professional
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "#666",
                  margin: "0 0 20px 0"
                }}>
                  Working professional or other donor
                </p>
                <button style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}>
                  Select
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1a1a1a",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              {role === "Student" ? "Student Details" : "Professional Details"}
            </h2>

            {role === "Student" && (
              <>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <option value="">Select Department *</option>
                  <option value="Technical">Technical</option>
                  <option value="Non-Technical">Non-Technical</option>
                </select>

                {department && (
                  <select
                    value={nonTechOption}
                    onChange={(e) => setNonTechOption(e.target.value)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      marginBottom: "16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "15px",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <option value="">
                      {department === "Technical"
                        ? "Select Technical Role *"
                        : "Select Non-Technical Role *"}
                    </option>
                    {department === "Technical" ? (
                      <>
                        <option value="Web Developer">Web Developer</option>
                        <option value="App Developer">App Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Data Handler">Data Handler</option>
                        <option value="Tech Support">Tech Support</option>
                      </>
                    ) : (
                      <>
                        <option value="Event Management">Event Management</option>
                        <option value="Social Media Handle">Social Media Handle</option>
                        <option value="Content Creator">Content Creator</option>
                      </>
                    )}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Your Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    opacity: loading ? 0.6 : 1
                  }}
                />
                <input
                  type="email"
                  placeholder="Your Email Address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    opacity: loading ? 0.6 : 1
                  }}
                />

                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {colleges.map((c, idx) => (
                    <option key={idx} value={c} disabled={idx === 0}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="College Roll Number *"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    opacity: loading ? 0.6 : 1
                  }}
                />
              </>
            )}

            {role === "Job" && (
              <>
                <input
                  type="text"
                  placeholder="Your Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    opacity: loading ? 0.6 : 1
                  }}
                />
                <input
                  type="email"
                  placeholder="Your Email Address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    opacity: loading ? 0.6 : 1
                  }}
                />
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginBottom: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <option value="">Select Your Role *</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Event Volunteer">Event Volunteer</option>
                  <option value="Fundraiser">Fundraiser</option>
                  <option value="Sponsor Outreach">Sponsor Outreach</option>
                  <option value="Medical Outreach">Medical Outreach</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Creative Support">Creative Support</option>
                  <option value="Community Outreach">Community Outreach</option>
                </select>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "8px",
                background: loading 
                  ? "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 20px rgba(239, 68, 68, 0.35)",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 12px 30px rgba(239, 68, 68, 0.45)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.35)";
              }}
            >
              {loading ? "⏳ SUBMITTING..." : "♥ SUBMIT APPLICATION"}
            </button>

            {loading && (
              <p style={{
                textAlign: "center",
                marginTop: "12px",
                fontSize: "13px",
                color: "#666",
                fontStyle: "italic"
              }}>
                ⚠️ First request may take 30-60 seconds as the server wakes up...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}