import React, { useState } from "react";
import axios from "axios";
import "./AdminUpdates.css";

// ✅ FIXED: Import from centralized config instead of hardcoding
import { API_BASE_URL } from "../../shared/constants/config";

function AdminUpdates() {
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      return;
    }

    // Determine media type
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    
    // Validate file size
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    
    if (file.size > maxSize) {
      alert(`File size too large! Max ${type === 'video' ? '100MB' : '10MB'} allowed.`);
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const formData = new FormData();
    formData.append("message", message);
    if (mediaFile) formData.append("media", mediaFile);

    try {
      // ✅ FIXED: Using centralized API_BASE_URL
      await axios.post(`${API_BASE_URL}/api/updates`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatus("success");
      setMessage("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-updates-container">
      <div className="admin-updates-wrapper">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-icon-wrapper">
              <span className="admin-icon">📢</span>
            </div>
            <div>
              <h1 className="admin-title">Add New Update</h1>
              <p className="admin-subtitle">Share inspiring stories and impact updates with your community (images or videos)</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="admin-card">
          <form onSubmit={handleSubmit} className="admin-form">
            {/* Message Input */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Update Message</span>
                <span className="required">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your update, story, or impact message..."
                required
                className="form-textarea"
                rows="6"
              />
              <p className="helper-text">
                Write a compelling message about the impact, success stories, or updates you want to share.
              </p>
            </div>

            {/* Media Upload */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Upload Image or Video</span>
                <span className="optional">(Optional)</span>
              </label>
              
              {!mediaPreview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    <div className="upload-content">
                      <span className="upload-icon">🎬</span>
                      <p className="upload-text">Click to upload or drag and drop</p>
                      <p className="upload-subtext">Images: PNG, JPG, GIF up to 10MB | Videos: MP4, WebM up to 100MB</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="preview-container">
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="preview-media"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="preview-image" />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="remove-button"
                  >
                    ✕ Remove {mediaType === 'video' ? 'Video' : 'Image'}
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className={`submit-button ${(isSubmitting || !message.trim()) ? 'disabled' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner">⏳</span>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Publish Update
                  </>
                )}
              </button>
            </div>

            {/* Status Messages */}
            {status === "success" && (
              <div className="alert success-alert">
                <span className="alert-icon">✓</span>
                <div>
                  <strong>Success!</strong>
                  <p className="alert-text">Your update has been published successfully.</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="alert error-alert">
                <span className="alert-icon">⚠</span>
                <div>
                  <strong>Error</strong>
                  <p className="alert-text">Failed to publish update. Please try again.</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Info Cards */}
        <div className="info-grid">
          <div className="info-card">
            <span className="info-icon">💡</span>
            <h3 className="info-title">Best Practices</h3>
            <p className="info-text">Include clear, compelling messages with high-quality images or videos to engage your audience effectively.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">📊</span>
            <h3 className="info-title">Impact Tracking</h3>
            <p className="info-text">Your updates appear on the About page, showcasing your organization&apos;s impact and stories.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🎯</span>
            <h3 className="info-title">Video Support</h3>
            <p className="info-text">You can now upload videos to tell your story more effectively. Videos can be up to 100MB.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUpdates;