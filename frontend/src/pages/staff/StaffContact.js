import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from '../../shared/contexts/UserContext';
import { useNavigate } from "react-router-dom";
import { SOCKET_URL, API_BASE_URL } from "../../shared/constants/config";
import "./Contact.css";

const StaffContact = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [reply, setReply] = useState("");
  const [callRequests, setCallRequests] = useState([]);
  const [myActiveCall, setMyActiveCall] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [agentStatus, setAgentStatus] = useState("available");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const chatEndRef = useRef(null);
  const hasRegistered = useRef(false);

  // Initialize socket with proper authentication
  useEffect(() => {
    const token = localStorage.getItem('token') || user?.token;
    
    if (!token) {
      setFetchError("Please log in to use real-time features");
      return;
    }
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token
      },
      query: {
        userId: user?.id,
        role: user?.role || 'staff'
      }
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setFetchError(null);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin', { replace: true });
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      hasRegistered.current = false;
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id, user?.token, navigate]);

  // Register staff only when user.id is available
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) {
      return;
    }
    
    if (!hasRegistered.current) {
      socket.emit("registerRole", {
        role: user.role || 'staff',
        userId: user.id,
        device: 'web'
      }, (response) => {
        if (response?.success) {
          hasRegistered.current = true;
        }
      });
    }
  }, [socket, isConnected, user]);

  // Fetch chats
  useEffect(() => {
    const fetchExistingChats = async () => {
      try {
        const token = localStorage.getItem('token') || user?.token;
        const res = await fetch(`${API_BASE_URL}/api/contact`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();

        if (Array.isArray(data)) {
          const formattedChats = data
            .filter(msg => msg.socketId && msg.text)
            .map(msg => ({
              socketId: msg.socketId,
              text: msg.text,
              role: msg.role,
              staffName: msg.staffName,
              userName: msg.userName,
              createdAt: msg.createdAt
            }));
          
          setChats(formattedChats);
          
          const uniqueUsers = {};
          formattedChats.forEach(msg => {
            if (msg.role === "user" && !uniqueUsers[msg.socketId]) {
              uniqueUsers[msg.socketId] = {
                socketId: msg.socketId,
                name: msg.userName || `User ${msg.socketId.substring(0, 8)}`,
                unread: 0
              };
            }
          });
          setUsers(Object.values(uniqueUsers));
        }
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
    };
    
    fetchExistingChats();
  }, [user?.token]);

  // Fetch call requests only when user.id is available
  useEffect(() => {
    const fetchCallRequests = async () => {
      if (!user?.id) {
        return;
      }

      try {
        const url = `${API_BASE_URL}/api/call-requests/staff-queue/${user.id}`;
        const token = localStorage.getItem('token') || user.token;
        
        if (!token) {
          setFetchError("Not authenticated. Please log in again.");
          navigate('/signin', { replace: true });
          return;
        }
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/signin', { replace: true });
          return;
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          setFetchError(`HTTP ${res.status}: ${errorText}`);
          return;
        }
        
        const data = await res.json();

        if (Array.isArray(data)) {
          setCallRequests(data);
          setFetchError(null);
        } else {
          setCallRequests([]);
        }
      } catch (err) {
        console.error('Failed to fetch call requests:', err);
        setFetchError(err.message);
        setCallRequests([]);
      }
    };
    
    fetchCallRequests();
    
    const interval = setInterval(fetchCallRequests, 30000);
    return () => clearInterval(interval);
  }, [user?.id, user?.token, navigate]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !user?.id) return;

    const userId = user.id;

    const handleUserMessage = (msg) => {
      setChats((prev) => [...prev, msg]);
      setUsers((prev) => {
        const existing = prev.find((u) => u.socketId === msg.socketId);
        if (existing) {
          return prev.map((u) =>
            u.socketId === msg.socketId ? { ...u, unread: u.unread + 1 } : u
          );
        }
        return [...prev, { 
          socketId: msg.socketId, 
          name: msg.userName || `User ${msg.socketId.substring(0, 8)}`, 
          unread: 1 
        }];
      });
    };

    const handleStaffReply = (msg) => {
      setChats((prev) => {
        const exists = prev.some(c => 
          c.socketId === msg.socketId && 
          c.text === msg.text && 
          c.role === "staff"
        );
        if (exists) return prev;
        return [...prev, { ...msg, staffName: user?.name || "Staff" }];
      });
    };

    const handleNewCallRequest = (req) => {
      setCallRequests((prev) => {
        const exists = prev.find(r => r._id === req._id);
        if (exists) return prev;
        
        if (req.status === "pending" || req.assignedTo === userId) {
          return [req, ...prev];
        }
        
        return prev;
      });
    };

    const handleCallRequestRemoved = ({ callId }) => {
      setCallRequests((prev) => prev.filter(r => r._id !== callId));
    };

    const handleCallAccepted = (call) => {
      setMyActiveCall(call);
      setAgentStatus("busy");
      alert(`✅ Call accepted! ${call.name} at ${call.phone}`);
    };

    const handleAcceptError = ({ message }) => {
      alert(`❌ ${message}`);
    };

    const handleCallStarted = () => {
      setCallStartTime(new Date());
    };

    const handleCallEnded = () => {
      setMyActiveCall(null);
      setCallStartTime(null);
      setAgentStatus("available");
      alert("✅ Call ended. Awaiting feedback...");
    };

    const handleCallUpdated = (updatedCall) => {
      setCallRequests((prev) => {
        if (updatedCall.assignedTo && updatedCall.assignedTo !== userId) {
          return prev.filter((c) => c._id !== updatedCall._id);
        }
        
        const exists = prev.find(c => c._id === updatedCall._id);
        if (exists) {
          return prev.map((c) => 
            c._id === updatedCall._id ? updatedCall : c
          );
        } else if (updatedCall.status === "pending" || updatedCall.assignedTo === userId) {
          return [updatedCall, ...prev];
        }
        
        return prev;
      });

      if (myActiveCall?._id === updatedCall._id && updatedCall.status === "completed") {
        setMyActiveCall(null);
        setCallStartTime(null);
        setAgentStatus("available");
        alert("✅ Feedback submitted!");
      }
    };

    socket.on("newUserMessage", handleUserMessage);
    socket.on("staffReply", handleStaffReply);
    socket.on("newCallRequest", handleNewCallRequest);
    socket.on("callRequestRemoved", handleCallRequestRemoved);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("acceptError", handleAcceptError);
    socket.on("callStarted", handleCallStarted);
    socket.on("callEnded", handleCallEnded);
    socket.on("callUpdated", handleCallUpdated);

    return () => {
      socket.off("newUserMessage", handleUserMessage);
      socket.off("staffReply", handleStaffReply);
      socket.off("newCallRequest", handleNewCallRequest);
      socket.off("callRequestRemoved", handleCallRequestRemoved);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("acceptError", handleAcceptError);
      socket.off("callStarted", handleCallStarted);
      socket.off("callEnded", handleCallEnded);
      socket.off("callUpdated", handleCallUpdated);
    };
  }, [socket, user, myActiveCall]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeUser]);

  const selectUser = (u) => {
    setActiveUser(u);
    setUsers((prev) =>
      prev.map((usr) => (usr.socketId === u.socketId ? { ...usr, unread: 0 } : usr))
    );
  };

  const sendReply = () => {
    if (!reply || !activeUser || !socket) return;

    socket.emit("staffMessage", {
      socketId: activeUser.socketId,
      text: reply,
      staffName: user?.name || "Staff",
    });

    setChats((prev) => [
      ...prev,
      {
        socketId: activeUser.socketId,
        role: "staff",
        text: reply,
        staffName: user?.name || "Staff",
      },
    ]);
    setReply("");
  };

  const acceptCall = (call) => {
    const userId = user?.id;
    if (!userId) {
      alert("❌ User information not available");
      return;
    }

    if (!socket) {
      alert("❌ Not connected to server");
      return;
    }

    socket.emit("acceptCallRequest", {
      callId: call._id,
      staffId: userId,
      staffName: user.name,
    });

    setCallRequests((prev) => prev.filter(r => r._id !== call._id));
  };

  const startCall = () => {
    if (!myActiveCall || !socket) return;
    socket.emit("startCall", { callId: myActiveCall._id });
    setCallStartTime(new Date());
  };

  const endCall = () => {
    if (!myActiveCall || !socket) return;
    const userId = user?.id;
    socket.emit("endCall", { 
      callId: myActiveCall._id,
      staffId: userId
    });
  };

  const releaseCall = () => {
    if (!myActiveCall || !socket) return;
    const userId = user?.id;
    if (window.confirm("Release this call back to queue?")) {
      socket.emit("rejectCallRequest", {
        callId: myActiveCall._id,
        staffId: userId,
      });
      setMyActiveCall(null);
      setCallStartTime(null);
      setAgentStatus("available");
    }
  };

  const downloadExcel = async () => {
    try {
      const token = localStorage.getItem('token') || user?.token;
      const response = await fetch(`${API_BASE_URL}/api/call-requests/download/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call_requests_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert("✅ Excel downloaded!");
    } catch (err) {
      console.error('Download failed:', err);
      alert("❌ Download failed");
    }
  };

  const getCallDuration = () => {
    if (!callStartTime) return "00:00";
    const now = new Date();
    const diff = Math.floor((now - callStartTime) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!callStartTime) return;
    const interval = setInterval(() => {
      setCallStartTime(new Date(callStartTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartTime]);

  const userId = user?.id;
  
  const pendingRequests = callRequests.filter(r => 
    r.status === "pending" && !r.assignedTo
  );
  
  const myAssignedCall = callRequests.find(r => 
    r.assignedTo === userId && 
    ["assigned", "in-progress", "awaiting-feedback"].includes(r.status)
  );

  // Show loading state if user is not loaded
  if (!user) {
    return (
      <div className="contact-page" style={{ padding: '50px', textAlign: 'center' }}>
        <h2>⏳ Loading user information...</h2>
        <p>Please wait while we authenticate you.</p>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="hero-left">
          <h1>Staff Help Center</h1>
          <div style={{ fontSize: '12px', marginTop: '10px', color: isConnected ? '#4caf50' : '#f44336' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {fetchError && (
            <div style={{ fontSize: '12px', marginTop: '5px', color: '#f44336' }}>
              ⚠️ {fetchError}
            </div>
          )}
        </div>
        <div className="hero-right">
          <div className="meta">
            <span className={`dot ${agentStatus === "available" ? "online" : "busy"}`} />
            <span>Status: {agentStatus === "available" ? "Available" : "Busy"}</span>
          </div>
        </div>
      </section>

      <section className="contact-grid">
        {/* CHAT CARD */}
        <div className="card chat-card">
          <div className="card-header">
            <div className="title">💬 Chat ({users.length} users, {chats.length} messages)</div>
            <div className="badge">Live</div>
          </div>

          <div className="user-selector">
            <label>Select User:</label>
            <select
              value={activeUser?.socketId || ""}
              onChange={(e) =>
                selectUser(users.find((u) => u.socketId === e.target.value))
              }
            >
              <option value="">-- Select User --</option>
              {users.map((u) => (
                <option key={u.socketId} value={u.socketId}>
                  {u.name} {u.unread > 0 ? `(${u.unread})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="chat-window">
            {!activeUser && <div className="empty-chat">Select a user to start chatting</div>}
            {activeUser && chats.filter((c) => c.socketId === activeUser.socketId).length === 0 && (
              <div className="empty-chat">No messages yet with this user</div>
            )}
            {activeUser &&
              chats
                .filter((c) => c.socketId === activeUser.socketId)
                .map((c, i) => (
                  <div key={i} className={`bubble ${c.role === "staff" ? "me" : "user"}`}>
                    {c.role === "staff" && <strong>{c.staffName || "Staff"}: </strong>}
                    {c.text}
                  </div>
                ))}
            <div ref={chatEndRef} />
          </div>

          {activeUser && (
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                sendReply();
              }}
            >
              <input
                type="text"
                placeholder="Type your message…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={!isConnected}
              />
              <button type="submit" className="send-btn wide" disabled={!isConnected || !reply.trim()}>
                Send
              </button>
            </form>
          )}
        </div>

        {/* CALL CARD */}
        <div className="card call-card">
          <div className="card-header">
            <div className="title">📞 Call Queue ({callRequests.length} total, {pendingRequests.length} pending)</div>
            <button 
              onClick={downloadExcel}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📥 Download
            </button>
          </div>

          {(myActiveCall || myAssignedCall) && (
            <div style={{
              background: '#e3f2fd',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '2px solid #2196f3'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🎯 Your Active Call</h3>
              {(() => {
                const call = myActiveCall || myAssignedCall;
                return (
                  <>
                    <div><strong>Name:</strong> {call.name}</div>
                    <div><strong>Phone:</strong> 
                      <a href={`tel:${call.phone}`} style={{ 
                        marginLeft: '10px', 
                        color: '#2196f3',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        📞 {call.phone}
                      </a>
                    </div>
                    <div><strong>Language:</strong> {call.language}</div>
                    <div><strong>Preferred Time:</strong> {call.bestTime}</div>
                    <div><strong>Notes:</strong> {call.notes || "N/A"}</div>
                    <div><strong>Status:</strong> {call.status}</div>
                    
                    {callStartTime && (
                      <div style={{ marginTop: '10px', fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                        ⏱️ Duration: {getCallDuration()}
                      </div>
                    )}

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      {!callStartTime ? (
                        <>
                          <button onClick={startCall} style={{ flex: 1, padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ▶️ Start Call
                          </button>
                          <button onClick={releaseCall} style={{ padding: '10px 15px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            🔄 Release
                          </button>
                        </>
                      ) : (
                        <button onClick={endCall} style={{ flex: 1, padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          ⏹️ End Call
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="call-list">
            {callRequests.length === 0 && (
              <div className="empty" style={{ padding: '20px', textAlign: 'center', background: '#fff3cd', borderRadius: '8px' }}>
                ⚠️ No call requests found
              </div>
            )}
            
            {pendingRequests.length === 0 && callRequests.length > 0 && !myActiveCall && !myAssignedCall && (
              <div className="empty">All requests are assigned or completed</div>
            )}
            
            {pendingRequests.map((req) => (
              <div key={req._id} className="call-item" style={{
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '10px',
                border: '1px solid #dee2e6'
              }}>
                <div className="call-name" style={{ fontWeight: 'bold', fontSize: '16px' }}>{req.name}</div>
                <div className="call-phone">📞 {req.phone}</div>
                <div className="call-reason" style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>
                  {req.notes || "No notes provided"}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                  Language: {req.language} | Time: {req.bestTime}
                </div>
                
                {agentStatus === "available" && (
                  <button
                    onClick={() => acceptCall(req)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    disabled={!isConnected}
                  >
                    ✅ Accept Call
                  </button>
                )}
                
                {agentStatus === "busy" && (
                  <div style={{ 
                    padding: '8px', 
                    background: '#ffc107', 
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>
                    ⏸️ You&apos;re busy with another call
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StaffContact;