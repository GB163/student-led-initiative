import React, { useState } from "react";
import axios from "axios";
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  X,
  Film
} from "lucide-react";
import "./AdminEvent.css";
import { API_BASE_URL } from "../../shared/constants/config";

const AdminEvent = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setMessage("Please select an image or video file");
        setMessageType("error");
        return;
      }

      // Validate file size (max 100MB for videos, 5MB for images)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage(`File size should be less than ${isVideo ? '100MB' : '5MB'}`);
        setMessageType("error");
        return;
      }

      setMedia(file);
      setMediaType(isVideo ? 'video' : 'image');
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaType(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !date) {
      setMessage("Please fill all required fields.");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("location", location);
    formData.append("time", time);
    if (media) {
      formData.append("media", media);
      formData.append("mediaType", mediaType);
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Event created successfully!");
      setMessageType("success");
      
      // Reset form
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setTime("");
      setMedia(null);
      setMediaType(null);
      setPreview(null);
      setLoading(false);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to create event. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <div className="admin-event-dashboard">
      <div className="event-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <Calendar />
            </div>
            <div className="header-text">
              <h1>Create New Event</h1>
              <p>Add upcoming events and activities for the community</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`alert-message ${messageType}`}>
            <div className="alert-icon">
              {messageType === "success" ? <CheckCircle /> : <AlertCircle />}
            </div>
            <span>{message}</span>
            <button className="alert-close" onClick={() => setMessage("")}>
              <X />
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="form-card">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            
            {/* Event Title */}
            <div className="form-group">
              <label className="form-label">
                <FileText />
                Event Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter event title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Event Description */}
            <div className="form-group">
              <label className="form-label">
                <FileText />
                Description <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Describe the event in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="6"
              ></textarea>
              <span className="char-count">{description.length} characters</span>
            </div>

            {/* Event Date & Time Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Clock />
                  Event Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock />
                  Event Time
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g., 10:00 AM"
                />
              </div>
            </div>

            {/* Event Location */}
            <div className="form-group">
              <label className="form-label">
                <FileText />
                Location
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter event location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Event Media Upload (Image or Video) */}
            <div className="form-group">
              <label className="form-label">
                <Film />
                Event Media (Image or Video)
              </label>
              
              {preview ? (
                <div className="image-preview-container">
                  {mediaType === 'video' ? (
                    <video src={preview} controls className="image-preview" />
                  ) : (
                    <img src={preview} alt="Preview" className="image-preview" />
                  )}
                  <div className="media-type-badge">
                    {mediaType === 'video' ? '🎬 Video' : '📸 Image'}
                  </div>
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={removeMedia}
                  >
                    <X />
                    Remove {mediaType === 'video' ? 'Video' : 'Image'}
                  </button>
                </div>
              ) : (
                <div className="upload-area">
                  <input
                    type="file"
                    id="media-upload"
                    className="file-input"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                  />
                  <label htmlFor="media-upload" className="upload-label">
                    <Upload />
                    <span className="upload-text">Click to upload image or video</span>
                    <span className="upload-hint">Images: PNG, JPG, GIF (max 5MB) | Videos: MP4, MOV, AVI (max 100MB)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setDate("");
                  setLocation("");
                  setTime("");
                  setMedia(null);
                  setMediaType(null);
                  setPreview(null);
                  setMessage("");
                }}
                disabled={loading}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>📋 Event Creation Guidelines</h3>
          <ul>
            <li>Use clear and descriptive titles for better engagement</li>
            <li>Provide detailed information about the event</li>
            <li>Set accurate date, time, and location for the event</li>
            <li>Upload high-quality media (Images: 1200x630px | Videos: 1920x1080p)</li>
            <li>Videos should be engaging and highlight key event moments</li>
            <li>Review all information before submitting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminEvent;