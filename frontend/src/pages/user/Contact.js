import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL, API_BASE_URL } from "../../shared/constants/config";
import "./Contact.css";

export default function Contact() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState("");
  const [hasRegistered, setHasRegistered] = useState(false);
  const chatEndRef = useRef(null);

  const quickTopics = [
    "Payment Issues",
    "Technical Support",
    "Account Help",
    "Medical Support",
    "Other Queries",
  ];

  const [callForm, setCallForm] = useState({
    phone: "",
    language: "English",
    bestTime: "As soon as possible",
    notes: "",
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: "",
    suggestion: "",
  });
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [callSuccess, setCallSuccess] = useState("");
  const [callDone, setCallDone] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [callRequestId, setCallRequestId] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setHasRegistered(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load previous messages when socket connects
  useEffect(() => {
    if (!socket || !isConnected) return;

    const loadPreviousMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/contact`);
        const data = await res.json();

        if (Array.isArray(data)) {
          const myMessages = data
            .filter(msg => msg.socketId === socket.id)
            .map(msg => ({
              id: msg._id || Date.now() + Math.random(),
              role: msg.role,
              text: msg.text,
              staffName: msg.staffName,
              userName: msg.userName
            }));
          
          setMessages(myMessages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadPreviousMessages();
  }, [socket, isConnected]);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("callDone") === "true") setCallDone(true);
    if (sessionStorage.getItem("feedbackSubmitted") === "true") setFeedbackSubmitted(true);

    const storedId = sessionStorage.getItem("callRequestId");
    if (storedId) {
      setCallRequestId(storedId);
    }

    const storedName = sessionStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
      setHasRegistered(true);
    }
  }, []);

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("callDone", callDone);
    sessionStorage.setItem("feedbackSubmitted", feedbackSubmitted);
    if (callRequestId) sessionStorage.setItem("callRequestId", callRequestId);
    else sessionStorage.removeItem("callRequestId");
    if (userName) sessionStorage.setItem("userName", userName);
  }, [callDone, feedbackSubmitted, callRequestId, userName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Receive staff messages
  useEffect(() => {
    if (!socket) return;

    const handleStaffReply = (msg) => {
      if (msg.socketId === socket.id) {
        setMessages((prev) => {
          const exists = prev.some(m => 
            m.text === msg.text && 
            m.role === "staff" && 
            Math.abs((m.timestamp || 0) - Date.now()) < 1000
          );
          
          if (exists) return prev;
          
          return [...prev, { 
            ...msg, 
            role: "staff", 
            id: Date.now() + Math.random(),
            timestamp: Date.now()
          }];
        });
      }
    };

    socket.on("staffReply", handleStaffReply);
    return () => socket.off("staffReply", handleStaffReply);
  }, [socket]);

  // Handle call events
  useEffect(() => {
    if (!socket) return;

    const handleCallDeleted = ({ id }) => {
      const storedId = callRequestId || sessionStorage.getItem("callRequestId");
      
      if (id === storedId) {
        setCallRequestId(null);
        setCallDone(false);
        setCallSuccess("");
        setFeedbackSubmitted(false);
        setShowThankYou(false);
        setFeedbackForm({ rating: "", suggestion: "" });
        
        sessionStorage.removeItem("callDone");
        sessionStorage.removeItem("feedbackSubmitted");
        sessionStorage.removeItem("callRequestId");
      }
    };

    const handleCallUpdated = (updatedCall) => {
      const storedId = callRequestId || sessionStorage.getItem("callRequestId");
      
      if ((updatedCall.id === storedId || updatedCall._id === storedId) && updatedCall.status === "completed") {
        setShowThankYou(true);
        setFeedbackSubmitted(true);
        
        setTimeout(() => {
          setCallRequestId(null);
          setCallDone(false);
          setCallSuccess("");
          setFeedbackSubmitted(false);
          setShowThankYou(false);
          setFeedbackForm({ rating: "", suggestion: "" });
          
          sessionStorage.removeItem("callDone");
          sessionStorage.removeItem("feedbackSubmitted");
          sessionStorage.removeItem("callRequestId");
        }, 3000);
      }
    };

    socket.on("callDeleted", handleCallDeleted);
    socket.on("callUpdated", handleCallUpdated);
    
    return () => {
      socket.off("callDeleted", handleCallDeleted);
      socket.off("callUpdated", handleCallUpdated);
    };
  }, [socket, callRequestId]);

  // Register user with name
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!socket || !isConnected) {
      alert("Not connected to server");
      return;
    }

    socket.emit("registerUser", { name: userName, socketId: socket.id });
    setHasRegistered(true);
    sessionStorage.setItem("userName", userName);
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    if (!socket || !isConnected) {
      alert("Not connected to server. Please wait or refresh.");
      return;
    }

    if (!hasRegistered) {
      alert("Please enter your name first");
      return;
    }
    
    const userMsg = { 
      id: Date.now() + "-u", 
      role: "user", 
      text: text.trim(),
      userName: userName,
      timestamp: Date.now()
    };
    
    setMessages((m) => [...m, userMsg]);
    
    socket.emit("userMessage", { 
      text: text.trim(),
      userName: userName,
      socketId: socket.id
    });
    
    setInput("");
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleTopicClick = (topic) => sendMessage(topic);

  const handleCallChange = (e) => {
    setCallSuccess("");
    const { name, value } = e.target;
    setCallForm((f) => ({ ...f, [name]: value }));
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm((f) => ({ ...f, [name]: value }));
  };

  const submitCallRequest = async (e) => {
    e.preventDefault();

    if (!socket || !isConnected) {
      setCallSuccess("❌ Not connected. Please refresh.");
      return;
    }

    if (!hasRegistered) {
      alert("Please enter your name in the chat first");
      return;
    }

    setCallSubmitting(true);
    setCallSuccess("");
    setFeedbackSubmitted(false);

    try {
      socket.emit(
        "callRequest",
        { ...callForm, name: userName, status: "pending" },
        (response) => {
          if (response && response._id) {
            setCallRequestId(response._id);
            setCallSuccess("✅ Request submitted. You'll receive a callback shortly.");
            setCallForm({
              phone: "",
              language: "English",
              bestTime: "As soon as possible",
              notes: "",
            });
            setCallDone(true);
          } else if (response && response.error) {
            setCallSuccess("❌ " + response.error);
          } else {
            setCallSuccess("✅ Request submitted. You'll receive a callback shortly.");
            setCallDone(true);
          }
          setCallSubmitting(false);
        }
      );
    } catch (error) {
      setCallSuccess("❌ Something went wrong. Please try again.");
      setCallSubmitting(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.rating || !feedbackForm.suggestion.trim()) {
      alert("❌ Please fill in all feedback fields.");
      return;
    }

    if (!socket || !isConnected) {
      alert("❌ Not connected to server.");
      return;
    }

    setFeedbackSubmitting(true);

    try {
      socket.emit("feedbackSubmit", { ...feedbackForm, callId: callRequestId });

      setFeedbackForm({ rating: "", suggestion: "" });
      setCallDone(false);
      setFeedbackSubmitted(true);
      setShowThankYou(true);

      setTimeout(() => {
        setShowThankYou(false);
        setFeedbackSubmitted(false);
        setCallRequestId(null);
        setCallDone(false);
        setCallSuccess("");
        sessionStorage.removeItem("callRequestId");
      }, 3000);
    } catch (error) {
      alert("❌ Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="hero-left">
          <h1>Help Center</h1>
          <p>We&apos;re here to help—chat with us or request a quick callback.</p>
          <div style={{ fontSize: '12px', marginTop: '10px', color: isConnected ? '#4caf50' : '#f44336' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </section>

      <section className="contact-grid">
        <div className="card chat-card">
          <div className="card-header">
            <div className="title">💬 Chat with Staff</div>
            <div className="badge">Live</div>
          </div>

          {/* NAME REGISTRATION FORM */}
          {!hasRegistered && (
            <form 
              onSubmit={handleNameSubmit}
              style={{
                padding: '20px',
                background: '#f0f8ff',
                borderRadius: '8px',
                margin: '10px',
                textAlign: 'center'
              }}
            >
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                Please enter your name to start chatting
              </p>
              <input
                type="text"
                placeholder="Your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '300px',
                  marginBottom: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                disabled={!isConnected}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                disabled={!isConnected || !userName.trim()}
              >
                Start Chat
              </button>
            </form>
          )}

          {/* CHAT WINDOW */}
          {hasRegistered && (
            <>
              <div className="chat-window">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No messages yet. Start the conversation!
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.role === "user" ? "me" : "staff"}`}>
                    {m.role === "staff" && m.staffName && (
                      <strong style={{ display: 'block', marginBottom: '5px', color: '#0066cc' }}>
                        {m.staffName}:
                      </strong>
                    )}
                    <span className="bubble-text">{m.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="quick-topics">
                {quickTopics.map((t) => (
                  <button key={t} className="chip" onClick={() => handleTopicClick(t)}>
                    {t}
                  </button>
                ))}
              </div>

              <form className="chat-input" onSubmit={handleSend}>
                <input
                  placeholder="Type your message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!isConnected}
                />
                <button type="submit" className="send-btn wide" disabled={!isConnected || !input.trim()}>
                  Send
                </button>
              </form>
              <div className="transfer-note">
                A staff member will reply here in chat as soon as possible.
              </div>
            </>
          )}
        </div>

        <div className="card call-card">
          <div className="card-header">
            <div className="title">📞 Request a Call</div>
            <div className="badge outline">2–5 min</div>
          </div>

          {!feedbackSubmitted && !showThankYou && !callRequestId && (
            <form className="form" onSubmit={submitCallRequest}>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. 98765 43210"
                value={callForm.phone}
                onChange={handleCallChange}
                required
              />

              <label htmlFor="language">Preferred language</label>
              <select
                id="language"
                name="language"
                value={callForm.language}
                onChange={handleCallChange}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Kannada</option>
                <option>Telugu</option>
                <option>Tamil</option>
                <option>Marathi</option>
              </select>

              <label htmlFor="bestTime">Preferred time</label>
              <select
                id="bestTime"
                name="bestTime"
                value={callForm.bestTime}
                onChange={handleCallChange}
              >
                <option>As soon as possible</option>
                <option>Morning (9am–12pm)</option>
                <option>Afternoon (12pm–4pm)</option>
                <option>Evening (4pm–8pm)</option>
              </select>

              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Briefly describe your issue…"
                rows={3}
                value={callForm.notes}
                onChange={handleCallChange}
              />

              <button className="primary" disabled={callSubmitting || !isConnected || !hasRegistered}>
                {callSubmitting ? "Submitting…" : "Request a Callback"}
              </button>
            </form>
          )}

          {callSuccess && !feedbackSubmitted && !showThankYou && (
            <div className="status">{callSuccess}</div>
          )}

          {callDone && callRequestId && !feedbackSubmitted && !showThankYou && (
            <form className="form feedback-form" onSubmit={submitFeedback}>
              <h4>Feedback</h4>

              <label htmlFor="rating">Rating: How staff helped you</label>
              <select
                id="rating"
                name="rating"
                value={feedbackForm.rating}
                onChange={handleFeedbackChange}
                required
              >
                <option value="">-- Select rating --</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>

              <label htmlFor="suggestion">Suggestions for betterment</label>
              <textarea
                id="suggestion"
                name="suggestion"
                placeholder="Your suggestions…"
                rows={3}
                value={feedbackForm.suggestion}
                onChange={handleFeedbackChange}
                required
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="primary" 
                  disabled={feedbackSubmitting}
                  style={{ flex: 1 }}
                >
                  {feedbackSubmitting ? "Submitting…" : "Submit Feedback"}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setCallRequestId(null);
                    setCallDone(false);
                    setCallSuccess("");
                    setFeedbackForm({ rating: "", suggestion: "" });
                    sessionStorage.removeItem("callDone");
                    sessionStorage.removeItem("callRequestId");
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showThankYou && <div className="status">✅ Thank you for your feedback!</div>}
        </div>
      </section>
    </div>
  );
}