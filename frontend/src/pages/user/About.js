import React, { useEffect, useState } from "react";
import { X, Users, Calendar, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../../shared/contexts/UserContext';
import DonateModal from "../../components/DonateModal";
import { apiClient } from '../../shared/services/api.js'; // ✅ ADD THIS IMPORT
import "./About.css";

const API_URL = process.env.REACT_APP_API_URL;

function About() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [aboutContent, setAboutContent] = useState("");
  const [updates, setUpdates] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalDonations: 0,
  });
  
  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showDonationsModal, setShowDonationsModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  
  // Data states
  const [usersData, setUsersData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [donationsData, setDonationsData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Fetch about content
    apiClient.get('/about')
      .then(res => {
        console.log('About content response:', res.data);
        setAboutContent(res.data.content || "");
      })
      .catch(err => console.error("Failed to fetch about content:", err));

    // Fetch stats
    apiClient.get('/about/stats')
      .then(res => {
        console.log('Stats response:', res.data);
        setStats({
          totalUsers: res.data.totalUsers || 0,
          totalEvents: res.data.totalEvents || 0,
          totalDonations: res.data.totalDonations || 0,
        });
      })
      .catch(err => console.error("Failed to fetch stats:", err));

    // Fetch updates
    apiClient.get('/about/updates')
      .then(res => {
        console.log('Updates response:', res.data);
        const updatesData = Array.isArray(res.data) ? res.data : (res.data?.updates || []);
        setUpdates(updatesData);
      })
      .catch(err => {
        console.error("Failed to fetch updates:", err);
        setUpdates([]);
      });
  }, []);

  const fetchUsersDetails = async () => {
    setModalLoading(true);
    try {
      const response = await apiClient.get('/user/all');
      const userData = Array.isArray(response.data) ? response.data : (response.data?.users || []);
      console.log('Users data:', userData);
      setUsersData(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsersData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchEventsDetails = async () => {
    setModalLoading(true);
    try {
      const response = await apiClient.get('/events');
      const eventData = Array.isArray(response.data) ? response.data : (response.data?.events || []);
      console.log('Events data:', eventData);
      setEventsData(eventData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEventsData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchDonationsDetails = async () => {
    setModalLoading(true);
    try {
      const response = await apiClient.get('/donations');
      const donationData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.donations || []);
      console.log('Donations data:', donationData);
      setDonationsData(donationData);
    } catch (error) {
      console.error("Error fetching donations:", error);
      setDonationsData([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Protected action handler
  const handleProtectedAction = (action) => {
    if (!user) {
      navigate('/signin');
    } else {
      action();
    }
  };

  const handleUsersClick = () => {
    handleProtectedAction(() => {
      setShowUsersModal(true);
      fetchUsersDetails();
    });
  };

  const handleEventsClick = () => {
    handleProtectedAction(() => {
      setShowEventsModal(true);
      fetchEventsDetails();
    });
  };

  const handleDonationsClick = () => {
    handleProtectedAction(() => {
      setShowDonationsModal(true);
      fetchDonationsDetails();
    });
  };

  const handleDonateClick = () => {
    handleProtectedAction(() => {
      setShowDonateModal(true);
    });
  };

  const handleVolunteerClick = () => {
    handleProtectedAction(() => {
      navigate('/join-us');
    });
  };

  const handleFeedbackClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/signin');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-overlay">
          <h1>Transforming Lives Through Compassion</h1>
          <p>Empowering communities, one child at a time</p>
          <a 
            href={user ? "https://docs.google.com/forms/d/e/1FAIpQLSeeqZ_LpDmol0BS20klQ6UOP6Kiip-PJf3YEAT_tiHF2La7lw/viewform?usp=dialog" : "#"}
            target={user ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="feedback-btn"
            onClick={handleFeedbackClick}
          >
            Share Your Feedback
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="stats-wrapper">
          <div 
            className={`stat-item ${user ? 'clickable' : ''}`}
            onClick={handleUsersClick}
            style={{ cursor: user ? 'pointer' : 'default' }}
          >
            <div className="stat-icon">👥</div>
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            {user && <span className="click-hint">Click for details</span>}
          </div>
          <div 
            className={`stat-item ${user ? 'clickable' : ''}`}
            onClick={handleEventsClick}
            style={{ cursor: user ? 'pointer' : 'default' }}
          >
            <div className="stat-icon">🎫</div>
            <h3>{stats.totalEvents.toLocaleString()}</h3>
            <p>Events Hosted</p>
            {user && <span className="click-hint">Click for details</span>}
          </div>
          <div 
            className={`stat-item ${user ? 'clickable' : ''}`}
            onClick={handleDonationsClick}
            style={{ cursor: user ? 'pointer' : 'default' }}
          >
            <div className="stat-icon">💰</div>
            <h3>{stats.totalDonations.toLocaleString()}</h3>
            <p>Total Donations</p>
            {user && <span className="click-hint">Click for details</span>}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="mission-content">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p className="mission-description">
              {aboutContent || "We are dedicated to providing comprehensive medical support and care to underprivileged children and families. Through community support and transparent processes, we ensure every child receives the healthcare they deserve."}
            </p>
            
            <div className="mission-values">
              <div className="value-item">
                <div className="value-icon">🤝</div>
                <h4>Transparency</h4>
                <p>Every donation and application is tracked with full accountability</p>
              </div>
              <div className="value-item">
                <div className="value-icon">💙</div>
                <h4>Compassion</h4>
                <p>Treating every family with dignity and care</p>
              </div>
              <div className="value-item">
                <div className="value-icon">⚡</div>
                <h4>Efficiency</h4>
                <p>Quick response and streamlined approval process</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help Section */}
      <section className="about-impact">
        <h2>How We&apos;re Making an Impact</h2>
        <p className="section-subtitle">Real stories of hope and healing</p>
        
        <div className="impact-grid">
          {Array.isArray(updates) && updates.length > 0 ? updates.map((update, index) => (
            <div key={index} className="impact-card">
              {update.image && (
                <div className="impact-image-wrapper">
                  {update.mediaType === 'video' ? (
                    <video
                      src={`${API_URL}/${update.image}`}
                      controls
                      autoPlay
                      muted
                      loop
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                    />
                  ) : (
                    <img 
                      src={`${API_URL}/${update.image}`} 
                      alt={update.message || "Update"}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                    />
                  )}
                </div>
              )}
              <div className="impact-content">
                <p>{update.message}</p>
              </div>
            </div>
          )) : (
            <div className="no-updates">
              <div className="no-updates-icon">📸</div>
              <p>Our journey is just beginning. Check back soon for inspiring stories!</p>
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="about-process">
        <h2>Our Process</h2>
        <p className="section-subtitle">Simple, transparent, and effective</p>
        
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <h3>Application</h3>
            <p>Families submit medical support applications with required documents</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">2</div>
            <h3>Verification</h3>
            <p>Staff verifies all documents and medical information</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">3</div>
            <h3>Approval</h3>
            <p>Admin reviews and approves eligible cases for support</p>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <div className="step-number">4</div>
            <h3>Support</h3>
            <p>Medical cards issued and families receive care they need</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h2>Join Us in Making a Difference</h2>
          <p>Your support can change a child&apos;s life forever</p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={handleDonateClick}>
              Donate Now
            </button>
            <button className="btn-secondary" onClick={handleVolunteerClick}>
              Volunteer With Us
            </button>
          </div>
        </div>
      </section>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={24} /> All Registered Users
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setShowUsersModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="modal-loading">Loading...</div>
              ) : !Array.isArray(usersData) || usersData.length === 0 ? (
                <div className="modal-empty">No users found</div>
              ) : (
                <div className="modal-list">
                  {usersData.map((user) => (
                    <div key={user._id} className="modal-list-item user-item">
                      <div className="user-info">
                        <h4>{user.name}</h4>
                        <p><Mail size={14} /> {user.email}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                      </div>
                      <div className="user-meta">
                        <span className={`user-badge ${user.role}`}>
                          {user.role}
                        </span>
                        <p className="user-date">
                          <Calendar size={14} /> {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && (
        <div className="modal-overlay" onClick={() => setShowEventsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎫 All Events</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEventsModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="modal-loading">Loading...</div>
              ) : !Array.isArray(eventsData) || eventsData.length === 0 ? (
                <div className="modal-empty">No events found</div>
              ) : (
                <div className="modal-list">
                  {eventsData.map((event) => (
                    <div key={event._id} className="modal-list-item event-item">
                      {event.image && (
                        <div className="event-image">
                          <img src={`${API_URL}/${event.image}`} alt={event.title} />
                        </div>
                      )}
                      <div className="event-info">
                        <h4>{event.title}</h4>
                        <p>{event.description}</p>
                        <p className="event-date">
                          <Calendar size={14} /> {formatDate(event.date)}
                        </p>
                        {event.location && <p><strong>Location:</strong> {event.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Donations Modal */}
      {showDonationsModal && (
        <div className="modal-overlay" onClick={() => setShowDonationsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 All Donations</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowDonationsModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="modal-loading">Loading...</div>
              ) : !Array.isArray(donationsData) || donationsData.length === 0 ? (
                <div className="modal-empty">No donations found</div>
              ) : (
                <div className="modal-list">
                  {donationsData.map((donation) => (
                    <div key={donation._id} className="modal-list-item donation-item">
                      <div className="donation-info">
                        <h4>{donation.name}</h4>
                        {donation.email && <p><Mail size={14} /> {donation.email}</p>}
                        {donation.collegeName && <p><strong>College:</strong> {donation.collegeName}</p>}
                        <p className="donation-date">
                          <Calendar size={14} /> {formatDate(donation.createdAt)}
                        </p>
                      </div>
                      <div className="donation-amount">
                        <span className="amount">₹{donation.amount?.toLocaleString()}</span>
                        {donation.role && (
                          <span className={`donation-badge ${donation.role}`}>
                            {donation.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <DonateModal closeModal={() => setShowDonateModal(false)} />
      )}
    </div>
  );
}

export default About;