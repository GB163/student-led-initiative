import React, { useEffect, useState } from "react";
import { apiClient } from '../../shared/services/api.js'; // ✅ FIXED: Changed from userAPI to apiClient
import "./Events.css";

const API_URL = process.env.REACT_APP_API_URL;

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'past'

  useEffect(() => {
    // ✅ FIX: Use apiClient instead of axios
    apiClient
      .get('/events')
      .then(res => {
        console.log('Events response:', res.data); // ✅ DEBUG LOG
        // Ensure the response is an array
        const eventsData = Array.isArray(res.data) ? res.data : [];
        setEvents(eventsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch events:", err);
        setEvents([]); // Set to empty array on error
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
            <h1>Our Events</h1>
            <p>Join us in making a difference through community engagement</p>
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
          <h1>Our Events</h1>
          <p>Join us in making a difference through community engagement and support</p>
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
              All Events
            </button>
            <button 
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button 
              className={`filter-btn ${filter === "past" ? "active" : ""}`}
              onClick={() => setFilter("past")}
            >
              Past Events
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
                    {event.image || event.media ? (
                      <>
                        {event.mediaType === 'video' || (event.media && (event.media.endsWith('.mp4') || event.media.endsWith('.mov') || event.media.endsWith('.avi') || event.media.endsWith('.webm'))) ? (
                          <video
                            src={`${API_URL}/${event.media || event.image}`}
                            controls
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <img
                            src={`${API_URL}/${event.media || event.image}`}
                            alt={event.title}
                          />
                        )}
                        {event.mediaType === 'video' && (
                          <div className="media-type-indicator">🎬 Video</div>
                        )}
                      </>
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
                        {event.location || "TBA"}
                      </div>
                      <div className="event-time">
                        <span className="event-icon">🕐</span>
                        {event.time || "TBA"}
                      </div>
                    </div>

                    {isUpcoming(event.date) && (
                      <div className="event-cta">
                        <button className="event-btn">
                          Register Now
                        </button>
                      </div>
                    )}
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

export default Events;