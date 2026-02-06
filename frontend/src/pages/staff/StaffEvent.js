import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../shared/constants/config";
import "./Events.css";

function StaffEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'past'

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/events`)
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch events:", err);
        setLoading(false);
      });
  }, []);

  // Filter events based on date
  const getFilteredEvents = () => {
    const now = new Date();
    
    if (filter === "upcoming") {
      return events.filter(event => new Date(event.date) >= now);
    } else if (filter === "past") {
      return events.filter(event => new Date(event.date) < now);
    }
    return events;
  };

  const filteredEvents = getFilteredEvents();

  // Check if event is upcoming
  const isUpcoming = (eventDate) => {
    return new Date(eventDate) >= new Date();
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-hero">
          <div className="hero-content">
            <h1>Staff Events Dashboard</h1>
            <p>Manage and view all events in one place</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Hero Section */}
      <section className="events-hero">
        <div className="hero-content">
          <h1>Staff Events Dashboard</h1>
          <p>Manage and view all upcoming and past events in one centralized dashboard</p>
        </div>
      </section>

      {/* Filter Section */}
      {events.length > 0 && (
        <div className="events-filters">
          <div className="filter-card">
            <button 
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Events ({events.length})
            </button>
            <button 
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming ({events.filter(e => isUpcoming(e.date)).length})
            </button>
            <button 
              className={`filter-btn ${filter === "past" ? "active" : ""}`}
              onClick={() => setFilter("past")}
            >
              Past Events ({events.filter(e => !isUpcoming(e.date)).length})
            </button>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="events-container">
        {filteredEvents.length > 0 ? (
          <>
            <div className="section-title">
              <h2>
                {filter === "upcoming" && "Upcoming Events"}
                {filter === "past" && "Past Events"}
                {filter === "all" && "All Events"}
              </h2>
              <p>{filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found</p>
            </div>
            
            <div className="events-grid">
              {filteredEvents.map(event => (
                <div key={event._id} className="event-card">
                  <div className="event-image-wrapper">
                    {event.image ? (
                      <img
                        src={`${API_BASE_URL}/${event.image}`}
                        alt={event.title}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem'
                      }}>
                        🎉
                      </div>
                    )}
                    <div className={`event-badge ${isUpcoming(event.date) ? "upcoming" : "past"}`}>
                      {isUpcoming(event.date) ? "Upcoming" : "Past Event"}
                    </div>
                  </div>

                  <div className="event-card-content">
                    <div className="event-date-badge">
                      <span className="event-icon">📅</span>
                      {formatDate(event.date)}
                    </div>

                    <h3>{event.title}</h3>
                    <p>{event.description}</p>

                    <div className="event-meta">
                      <div className="event-location">
                        <span className="event-icon">📍</span>
                        {event.location || "Location TBA"}
                      </div>
                      <div className="event-time">
                        <span className="event-icon">🕐</span>
                        {event.time || "Time TBA"}
                      </div>
                    </div>

                    <div className="event-cta">
                      <button 
                        className="event-btn"
                        style={{
                          background: isUpcoming(event.date) 
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "#94a3b8",
                          cursor: isUpcoming(event.date) ? "pointer" : "not-allowed",
                        }}
                        disabled={!isUpcoming(event.date)}
                      >
                        {isUpcoming(event.date) ? "View Details" : "Event Completed"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-events">
            <div className="no-events-icon">📅</div>
            <h3>No Events Found</h3>
            <p>
              {filter === "upcoming" && "No upcoming events at the moment. Check back soon!"}
              {filter === "past" && "No past events to display."}
              {filter === "all" && "No events have been scheduled yet. Stay tuned!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffEvents;