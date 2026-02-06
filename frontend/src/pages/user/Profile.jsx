import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import { useUser } from '../../shared/contexts/UserContext';
import { userAPI } from '../../shared/services/api.js';
import { User, Mail, Camera, Check, X, Loader, Phone, MapPin, Edit2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

function UserProfile() {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [editing, setEditing] = useState(false); // ✅ NEW: Toggle edit mode
  const [editedProfile, setEditedProfile] = useState({ // ✅ NEW: Separate edited data
    name: '',
    phone: '',
    address: ''
  });

  // Load user data on mount
  useEffect(() => {
    if (!user) return;
    
    console.log('📋 Loading profile for user:', user.id || user._id);
    
    const profileData = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    };
    
    setProfile(profileData);
    setEditedProfile({
      name: profileData.name,
      phone: profileData.phone,
      address: profileData.address
    });
    
    setImageError(false);
  }, [user]);

  // ✅ Listen for tokenExpired event from api.js
  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.error('🚨 Token expired event received:', event.detail);
      setMessage('❌ Session expired. Redirecting to login...');
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/signin', { replace: true });
      }, 1500);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [navigate]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Image size should be less than 5MB");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setMessage("❌ Please upload a valid image file");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setImageError(false);
      setMessage("");
      
      // Auto-upload image when selected
      uploadImageNow(file);
    }
  };

  // Upload image immediately
  const uploadImageNow = async (file) => {
    // ✅ Pre-flight check: Verify token exists BEFORE attempting upload
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      setMessage('❌ Please log in to upload profile picture');
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/signin', { replace: true });
      }, 1500);
      return;
    }

    if (!user) {
      setMessage("❌ User not found. Please log in.");
      return;
    }

    // Get user ID - handle both formats
    const userId = user.id || user._id;
    
    console.log('🔍 Upload - User object:', {
      hasId: !!user.id,
      has_id: !!user._id,
      userId: userId,
      userEmail: user.email
    });
    
    if (!userId) {
      console.error('❌ No valid user ID found');
      setMessage("❌ Invalid user data. Please log in again.");
      setTimeout(() => {
        localStorage.clear();
        navigate('/signin');
      }, 2000);
      return;
    }

    setUploadingImage(true);
    
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      console.log('📸 Uploading profile picture for user:', userId);
      
      const res = await userAPI.uploadProfilePicture(userId, formData);
      
      console.log('✅ Upload response:', res);
      
      const serverData = res.user || res.data || res;
      
      if (serverData && (serverData.id || serverData._id)) {
        // Update context with new profile pic
        const updatedUser = {
          ...user,
          profilePic: serverData.profilePic,
        };

        console.log('💾 Updating user context with new profile pic');
        updateUser(updatedUser);
        
        // Update profile state
        setProfile(prev => ({
          ...prev,
          profilePic: serverData.profilePic
        }));
        
        // Clear preview
        setPreview(null);
        setImage(null);
        setImageError(false);
        
        setMessage("✅ Profile picture updated successfully!");
      }
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        url: err.config?.url
      });
      
      // Handle 401 - Session expired
      if (err.response?.status === 401 || err.message.includes('Not authorized') || err.message.includes('401')) {
        setMessage("❌ Session expired. Redirecting to login...");
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/signin');
        }, 2000);
        return;
      }
      
      setMessage("❌ Failed to upload image. Please try again.");
      setPreview(null);
      setImage(null);
      
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setUploadingImage(false);
    }
  };

  // ✅ NEW: Enter edit mode
  const handleEditClick = () => {
    setEditedProfile({
      name: profile.name,
      phone: profile.phone,
      address: profile.address
    });
    setEditing(true);
  };

  // Update profile (text fields only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Pre-flight check: Verify token exists BEFORE attempting update
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      setMessage('❌ Please log in to update profile');
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/signin', { replace: true });
      }, 1500);
      return;
    }

    if (!user) {
      setMessage("❌ User not found. Please log in.");
      return;
    }

    // Get user ID - handle both formats
    const userId = user.id || user._id;
    
    console.log('🔍 Update - User object:', {
      hasId: !!user.id,
      has_id: !!user._id,
      userId: userId,
      userEmail: user.email
    });
    
    if (!userId) {
      console.error('❌ No valid user ID found');
      setMessage("❌ Invalid user data. Please log in again.");
      setTimeout(() => {
        localStorage.clear();
        navigate('/signin');
      }, 2000);
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Updating profile for user:', userId);
      console.log('📝 Update data:', {
        name: editedProfile.name,
        phone: editedProfile.phone,
        address: editedProfile.address
      });
      
      const res = await userAPI.updateProfile(userId, {
        name: editedProfile.name,
        phone: editedProfile.phone,
        address: editedProfile.address
      });
      
      console.log('✅ Update response:', res);
      
      const serverData = res.user || res.data || res;
      
      if (serverData && (serverData.id || serverData._id)) {
        // Update local profile
        setProfile({
          name: serverData.name,
          email: serverData.email,
          phone: serverData.phone,
          address: serverData.address
        });

        // Update context
        const updatedUser = {
          ...user,
          name: serverData.name,
          phone: serverData.phone,
          address: serverData.address,
        };

        console.log('💾 Updating user context with new data');
        updateUser(updatedUser);
        
        // Exit edit mode
        setEditing(false);
        
        setMessage("✅ Profile updated successfully!");
      }
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Update error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        url: err.config?.url
      });
      
      // Handle 401 - Session expired
      if (err.response?.status === 401 || err.message.includes('Not authorized') || err.message.includes('401')) {
        setMessage("❌ Session expired. Redirecting to login...");
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/signin');
        }, 2000);
        return;
      }
      
      setMessage("❌ Failed to update profile. Please try again.");
      
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const removePreview = () => {
    setPreview(null);
    setImage(null);
  };

  // ✅ NEW: Cancel editing
  const handleCancel = () => {
    setEditing(false);
    setEditedProfile({
      name: profile.name,
      phone: profile.phone,
      address: profile.address
    });
    setPreview(null);
    setImage(null);
    setImageError(false);
    setMessage("");
  };

  if (!user) {
    return (
      <div className="profile-error">
        <User size={48} />
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  // Display image: preview OR user.profilePic
  const displayImageUrl = preview || user.profilePic;

  return (
    <div className="user-profile-page">
      <div className="profile-hero">
        <div className="hero-content">
          <h1>User Profile</h1>
          <p>Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="profile-container">
        {message && (
          <div className={`alert ${message.startsWith("✅") ? "alert-success" : "alert-error"}`}>
            {message.startsWith("✅") ? <Check size={20} /> : <X size={20} />}
            <span>{message}</span>
          </div>
        )}

        <div className="profile-card">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="picture-wrapper">
              <div className="profile-pic-container">
                {displayImageUrl && !imageError ? (
                  <img 
                    src={displayImageUrl} 
                    alt="Profile" 
                    className="profile-pic"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="profile-pic-placeholder">
                    <User size={64} />
                  </div>
                )}
                
                {uploadingImage && (
                  <div className="uploading-overlay">
                    <Loader size={24} className="spinner" />
                  </div>
                )}
                
                <label htmlFor="profile-pic-upload" className="camera-button" title="Upload profile picture">
                  <Camera size={20} />
                  <input
                    id="profile-pic-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {preview && (
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={removePreview}
                  title="Remove preview"
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>
            <div className="picture-info">
              <h3>{profile.name || "User"}</h3>
              <p className="role-badge">User</p>
              <p className="upload-hint">
                Click the camera icon to upload a new picture (Max 5MB)
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Personal Information</h3>
              {!editing && (
                <button
                  type="button"
                  className="btn-edit"
                  onClick={handleEditClick}
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              // ✅ EDIT MODE
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={18} />
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="input-disabled"
                    title="Email cannot be changed"
                  />
                  <p className="helper-text">Email cannot be changed</p>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={18} />
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <MapPin size={18} />
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={editedProfile.address}
                    onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="spinner" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // ✅ READ-ONLY MODE
              <div className="info-display">
                <div className="info-item">
                  <span className="info-label">
                    <Mail size={18} />
                    Email Address
                  </span>
                  <p className="info-value">{profile.email || "Not provided"}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <Phone size={18} />
                    Phone Number
                  </span>
                  <p className="info-value">{profile.phone || "Not provided"}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <MapPin size={18} />
                    Address
                  </span>
                  <p className="info-value">{profile.address || "Not provided"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;