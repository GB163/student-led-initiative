import React, { useEffect, useRef, useState, useMemo } from "react";
import { socketEvents, initializeSocket } from "../../shared/services/socketService";
import { getCurrentUser, debugAuthStorage } from "../../shared/utils/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Phone, MessageSquare, CheckCircle, Clock, TrendingUp, X } from "lucide-react";

const API_BASE_URL = 'https://studentledinitiative.onrender.com';

const StaffDashboard = () => {
  const [chats, setChats] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [reply, setReply] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const chatEndRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize socket connection on mount
  useEffect(() => {
    const initSocket = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        console.log("🔌 Initializing socket connection...");
        
        // Debug auth storage
        debugAuthStorage();
        
        await initializeSocket();
        
        // Get user info using the auth utility
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.id) {
          console.error("❌ No user ID found");
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        const staffId = currentUser.id;
        console.log("📡 Registering staff member:", staffId);
        console.log("   Role:", currentUser.role);
        console.log("   Name:", currentUser.name);
        
        // Verify this is actually a staff member
        if (currentUser.role !== 'staff' && currentUser.role !== 'admin') {
          console.error("❌ User is not staff or admin:", currentUser.role);
          setError("Access denied. Staff access required.");
          setLoading(false);
          return;
        }

        // Register as staff member
        await socketEvents.registerStaff(staffId);
        
        setSocketConnected(true);
        console.log("✅ Socket initialized and staff registered");

        // Setup event listeners
        setupSocketListeners();

      } catch (err) {
        console.error("❌ Socket initialization failed:", err);
        setError("Failed to connect to real-time service");
        setSocketConnected(false);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socketEvents.off('newUserMessage');
      socketEvents.off('newCallRequest');
      socketEvents.off('callUpdated');
      socketEvents.off('staffReply');
    };
  }, []);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Listen for new user messages
    socketEvents.onNewUserMessage((msg) => {
      console.log("📨 New user message:", msg);
      setChats((prev) => [...prev, {
        socketId: msg.socketId || msg.userId || msg._id,
        role: "user",
        text: msg.text || msg.content || msg.message,
        timestamp: msg.timestamp || new Date().toISOString()
      }]);
    });

    // Listen for new call requests
    socketEvents.onNewCallRequest((req) => {
      console.log("📞 New call request:", req);
      setCallRequests((prev) => [...prev, req]);
    });

    // Listen for call updates
    socketEvents.onCallUpdated((data) => {
      console.log("🔄 Call updated:", data);
      setCallRequests((prev) => 
        prev.map(req => req._id === data._id ? { ...req, ...data } : req)
      );
    });

    // Listen for staff replies (in case of multi-staff setup)
    socketEvents.onStaffReply((msg) => {
      console.log("💬 Staff reply received:", msg);
      setChats((prev) => [...prev, {
        socketId: msg.socketId || msg.userId,
        role: "staff",
        text: msg.text || msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      }]);
    });
  };

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
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
        console.log("🔄 Fetching dashboard data...");
        const res = await fetch(`${API_BASE_URL}/api/staff/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized - Please login again');
          }
          throw new Error(`Failed: ${res.status}`);
        }

        const response = await res.json();
        console.log("✅ Dashboard data received:", response);

        if (response.success && response.data) {
          const { callRequests: calls, messages } = response.data;
          
          setCallRequests(calls || []);
          
          // Transform messages to match chat format
          const transformedMessages = (messages || []).map(msg => ({
            socketId: msg.userId || msg.socketId || msg._id,
            role: msg.staffId ? "staff" : "user",
            text: msg.content || msg.subject || msg.text || "",
            timestamp: msg.createdAt || msg.timestamp
          }));
          
          setChats(transformedMessages);
          console.log("📊 Call Requests:", calls?.length || 0);
          console.log("💬 Messages:", transformedMessages.length);
        }
      } catch (err) {
        console.error("❌ Failed to fetch dashboard data:", err);
        setError(`Failed to load dashboard data: ${err.message}`);
        
        if (err.message.includes('Unauthorized')) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // Send reply using socket service
  const sendReply = async () => {
    if (!reply.trim() || !activeUser) return;
    
    try {
      const message = {
        socketId: activeUser,
        text: reply.trim(),
        timestamp: new Date().toISOString()
      };

      console.log("📤 Sending staff message:", message);
      
      // Send via socket service
      await socketEvents.staffMessage(message);
      
      // Add to local state immediately for better UX
      setChats((prev) => [...prev, {
        ...message,
        role: "staff"
      }]);
      
      setReply("");
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCalls = callRequests.length;
    const pendingCalls = callRequests.filter(r => r.status === "pending").length;
    const completedCalls = callRequests.filter(r => r.status === "completed").length;
    const rejectedCalls = callRequests.filter(r => r.status === "rejected").length;
    const totalChats = chats.length;
    const userMessages = chats.filter(c => c.role === "user").length;
    const staffReplies = chats.filter(c => c.role === "staff").length;

    return {
      totalCalls,
      pendingCalls,
      completedCalls,
      rejectedCalls,
      totalChats,
      userMessages,
      staffReplies,
    };
  }, [callRequests, chats]);

  const callStatusData = useMemo(() => [
    { name: "Pending", value: stats.pendingCalls, color: "#f59e0b" },
    { name: "Completed", value: stats.completedCalls, color: "#10b981" },
    { name: "Rejected", value: stats.rejectedCalls, color: "#ef4444" },
  ], [stats]);

  const chatData = useMemo(() => [
    { name: "User", value: stats.userMessages },
    { name: "Staff", value: stats.staffReplies },
  ], [stats]);

  const getCardDetails = (cardType) => {
    switch(cardType) {
      case 'totalCalls':
        return {
          title: "Total Call Requests",
          items: callRequests.map((req, i) => ({
            id: i,
            label: req.patientName || `Request ${i + 1}`,
            status: req.status,
            info: req.reason || req.phoneNumber,
            time: req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'
          }))
        };
      case 'pendingCalls':
        return {
          title: "Pending Call Requests",
          items: callRequests.filter(r => r.status === 'pending').map((req, i) => ({
            id: i,
            label: req.patientName || `Request ${i + 1}`,
            info: req.reason || `Phone: ${req.phoneNumber}`,
            time: req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'
          }))
        };
      case 'completedCalls':
        return {
          title: "Completed Calls",
          items: callRequests.filter(r => r.status === 'completed').map((req, i) => ({
            id: i,
            label: req.patientName || `Call ${i + 1}`,
            info: `Successfully completed`,
            time: req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'
          }))
        };
      case 'chatMessages':
        return {
          title: "Chat Messages Breakdown",
          items: [
            { id: 1, label: "Total Messages", info: stats.totalChats },
            { id: 2, label: "User Messages", info: stats.userMessages },
            { id: 3, label: "Staff Replies", info: stats.staffReplies },
            { id: 4, label: "Response Rate", info: `${stats.totalChats > 0 ? ((stats.staffReplies / stats.totalChats) * 100).toFixed(1) : 0}%` }
          ]
        };
      case 'callStatus':
        return {
          title: "Call Request Status Details",
          items: [
            { 
              id: 1, 
              label: "Pending Calls", 
              info: `${stats.pendingCalls} requests awaiting response`,
              count: stats.pendingCalls,
              percentage: `${stats.totalCalls > 0 ? ((stats.pendingCalls / stats.totalCalls) * 100).toFixed(1) : 0}%`,
              color: "#f59e0b"
            },
            { 
              id: 2, 
              label: "Completed Calls", 
              info: `${stats.completedCalls} successfully completed`,
              count: stats.completedCalls,
              percentage: `${stats.totalCalls > 0 ? ((stats.completedCalls / stats.totalCalls) * 100).toFixed(1) : 0}%`,
              color: "#10b981"
            },
            { 
              id: 3, 
              label: "Rejected Calls", 
              info: `${stats.rejectedCalls} rejected or cancelled`,
              count: stats.rejectedCalls,
              percentage: `${stats.totalCalls > 0 ? ((stats.rejectedCalls / stats.totalCalls) * 100).toFixed(1) : 0}%`,
              color: "#ef4444"
            },
          ]
        };
      case 'chatActivity':
        return {
          title: "Chat Activity Analysis",
          items: [
            { 
              id: 1, 
              label: "User Messages", 
              info: `${stats.userMessages} messages from users`,
              count: stats.userMessages,
              percentage: `${stats.totalChats > 0 ? ((stats.userMessages / stats.totalChats) * 100).toFixed(1) : 0}%`
            },
            { 
              id: 2, 
              label: "Staff Replies", 
              info: `${stats.staffReplies} replies from staff`,
              count: stats.staffReplies,
              percentage: `${stats.totalChats > 0 ? ((stats.staffReplies / stats.totalChats) * 100).toFixed(1) : 0}%`
            },
            { 
              id: 3, 
              label: "Average Response Time", 
              info: "Estimated based on chat patterns",
              count: "2.5 min"
            },
            { 
              id: 4, 
              label: "Active Conversations", 
              info: "Unique user sessions",
              count: new Set(chats.map(c => c.socketId)).size
            },
          ]
        };
      default:
        return { title: "", items: [] };
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "1.5rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>⏳</div>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "white",
            margin: 0,
            textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
          }}>Staff Dashboard</h1>
          <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.5rem 0 0 0" }}>
            Manage your calls and chats in real-time
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          color: "white",
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Socket Status</div>
          <div style={{ fontSize: "1.25rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              background: socketConnected ? "#10b981" : "#ef4444" 
            }} />
            {socketConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fee2e2",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          border: "1px solid #fecaca",
        }}>{error}</div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem",
      }}>
        <StatCard
          icon={<Phone size={24} />}
          title="Total Calls"
          value={stats.totalCalls}
          color="#3b82f6"
          subtitle={`${stats.pendingCalls} pending`}
          onClick={() => setSelectedCard('totalCalls')}
        />
        <StatCard
          icon={<Clock size={24} />}
          title="Pending Calls"
          value={stats.pendingCalls}
          color="#f59e0b"
          subtitle="Awaiting response"
          onClick={() => setSelectedCard('pendingCalls')}
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          title="Completed"
          value={stats.completedCalls}
          color="#10b981"
          subtitle="This session"
          onClick={() => setSelectedCard('completedCalls')}
        />
        <StatCard
          icon={<MessageSquare size={24} />}
          title="Chat Messages"
          value={stats.totalChats}
          color="#8b5cf6"
          subtitle={`${stats.userMessages} from users`}
          onClick={() => setSelectedCard('chatMessages')}
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem",
      }}>
        <ChartCard title="Call Request Status" onClick={() => setSelectedCard('callStatus')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={callStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {callStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Chat Activity" onClick={() => setSelectedCard('chatActivity')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chatData}>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{
                  background: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "500px",
      }}>
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
          background: "linear-gradient(to right, #667eea, #764ba2)",
          color: "white",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <MessageSquare size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>Live Chat</h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", opacity: 0.9 }}>
                {chats.length} messages • {activeUser ? "Chatting" : "Select a user"}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          padding: "1.5rem",
          overflowY: "auto",
          background: "#f9fafb",
        }}>
          {chats.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "#9ca3af",
            }}>
              <MessageSquare size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p style={{ fontSize: "1.125rem", fontWeight: "500" }}>No chats yet</p>
              <p style={{ fontSize: "0.875rem" }}>Messages will appear here when users start chatting</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {chats.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setActiveUser(c.socketId)}
                  style={{
                    maxWidth: "70%",
                    alignSelf: c.role === "staff" ? "flex-end" : "flex-start",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <div style={{
                    background: c.role === "staff" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "white",
                    color: c.role === "staff" ? "white" : "#1f2937",
                    padding: "0.875rem 1.25rem",
                    borderRadius: c.role === "staff" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: activeUser === c.socketId ? "2px solid #3b82f6" : "none",
                  }}>
                    <div style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                      fontWeight: "500",
                    }}>
                      {c.role === "staff" ? "You" : `User ${c.socketId?.slice(0, 8)}`}
                    </div>
                    <div style={{ fontSize: "0.9375rem" }}>{c.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div style={{
          padding: "1.5rem",
          borderTop: "1px solid #e5e7eb",
          background: "white",
          display: "flex",
          gap: "1rem",
        }}>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendReply()}
            placeholder={activeUser ? "Type your reply..." : "Select a user to reply"}
            disabled={!activeUser || !socketConnected}
            style={{
              flex: 1,
              padding: "0.875rem 1.25rem",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "0.9375rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
          <button
            onClick={sendReply}
            disabled={!activeUser || !reply.trim() || !socketConnected}
            style={{
              padding: "0.875rem 2rem",
              background: (activeUser && reply.trim() && socketConnected) ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "0.9375rem",
              fontWeight: "600",
              cursor: (activeUser && reply.trim() && socketConnected) ? "pointer" : "not-allowed",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: (activeUser && reply.trim() && socketConnected) ? "0 4px 12px rgba(102, 126, 234, 0.4)" : "none",
            }}
            onMouseEnter={(e) => {
              if (activeUser && reply.trim() && socketConnected) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = (activeUser && reply.trim() && socketConnected) ? "0 4px 12px rgba(102, 126, 234, 0.4)" : "none";
            }}
          >
            Send Message
          </button>
        </div>
      </div>

      {selectedCard && (
        <DetailModal
          details={getCardDetails(selectedCard)}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, color, subtitle, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: "white",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    }}>
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{
        background: `${color}20`,
        color: color,
        padding: "0.875rem",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#6b7280", fontSize: "0.875rem", fontWeight: "500" }}>{title}</div>
        <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginTop: "0.25rem" }}>{value}</div>
        <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>{subtitle}</div>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: "white",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      cursor: "pointer",
      transition: "transform 0.3s, box-shadow 0.3s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    }}
  >
    <h3 style={{
      margin: "0 0 1.5rem 0",
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#1f2937",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }}>
      <TrendingUp size={20} style={{ color: "#667eea" }} />
      {title}
    </h3>
    {children}
  </div>
);

const DetailModal = ({ details, onClose }) => (
  <div 
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "2rem",
    }}
    onClick={onClose}
  >
    <div 
      style={{
        background: "white",
        borderRadius: "20px",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "80vh",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
      }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>{details.title}</h2>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
        >
          <X size={24} />
        </button>
      </div>
      
      <div style={{
        padding: "1.5rem",
        maxHeight: "calc(80vh - 100px)",
        overflowY: "auto",
      }}>
        {details.items.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            color: "#9ca3af",
          }}>
            <p style={{ fontSize: "1.125rem", fontWeight: "500" }}>No data available</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {details.items.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: "#f9fafb",
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "1rem",
                      marginBottom: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}>
                      {item.color && (
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: item.color,
                        }} />
                      )}
                      {item.label}
                    </div>
                    {item.info && (
                      <div style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}>
                        {item.info}
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}>
                    {item.count !== undefined && (
                      <div style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#1f2937",
                      }}>
                        {item.count}
                      </div>
                    )}
                    {item.percentage && (
                      <div style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        background: "#f3f4f6",
                        color: "#4b5563",
                      }}>
                        {item.percentage}
                      </div>
                    )}
                    {item.status && (
                      <span style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        background: item.status === 'completed' ? '#d1fae5' : 
                                   item.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: item.status === 'completed' ? '#065f46' : 
                               item.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {item.status}
                      </span>
                    )}
                    {item.time && (
                      <div style={{
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                      }}>
                        {item.time}
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
    <style>{`
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>
  </div>
);

export default StaffDashboard;