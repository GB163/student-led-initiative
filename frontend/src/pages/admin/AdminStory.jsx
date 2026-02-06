import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Check, AlertCircle, BookOpen, Target, Award, TrendingUp, Heart, Users, Lightbulb, Sparkles, RefreshCw, Film, Upload, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../shared/constants/config';

const AdminStory = () => {
  const [activeTab, setActiveTab] = useState('statistics');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Gallery Media State
  const [storyMedia, setStoryMedia] = useState([]);
  const [editingMedia, setEditingMedia] = useState(null);
  const [newMedia, setNewMedia] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    file: null
  });

  // Statistics State
  const [statistics, setStatistics] = useState({
    fundsRaised: '0+',
    studentsInvolved: '0+',
    familiesHelped: '0+'
  });

  // Mission & Vision State
  const [missionVision, setMissionVision] = useState({
    mission: {
      text: 'To provide financial and emotional support to blood cancer patients and their families while raising awareness and funding critical research that will lead to better treatments and cures.',
      features: ['Patient Support Programs', 'Research Funding', 'Community Awareness']
    },
    vision: {
      text: 'A world where every blood cancer patient has access to the support they need and where research advances lead to effective treatments and ultimately, a cure for all blood cancers.',
      features: ['Comprehensive Support Network', 'Breakthrough Research', 'Hope for Every Patient']
    }
  });

  // Milestones State
  const [milestones, setMilestones] = useState([
    { id: 1, year: '2023', title: 'Foundation', description: 'Student-Led Initiative was founded with a mission to support blood cancer patients' },
    { id: 2, year: '2024', title: 'First Campaign', description: 'Launched our first successful fundraising campaign for pediatric blood cancer research' },
    { id: 3, year: '2025', title: 'Growing Impact', description: 'Expanding our reach to support more families and fund critical research' }
  ]);

  // Values State
  const [values, setValues] = useState([
    { id: 1, icon: 'Heart', title: 'Compassion', description: 'We put patients and families at the heart of everything we do', color: '#ef4444' },
    { id: 2, icon: 'Users', title: 'Community', description: 'Building strong connections between students, donors, and families in need', color: '#3b82f6' },
    { id: 3, icon: 'Lightbulb', title: 'Innovation', description: 'Using creative approaches to raise awareness and funds for blood cancer research', color: '#f59e0b' },
    { id: 4, icon: 'Award', title: 'Transparency', description: 'Maintaining clear communication about how donations make a difference', color: '#8b5cf6' }
  ]);

  // Story Text State
  const [storyText, setStoryText] = useState({
    paragraph1: 'Student-Led Initiative began when a group of passionate students witnessed the challenges faced by blood cancer patients and their families. We realized that even small contributions could make a significant difference in their lives.',
    paragraph2: 'What started as a small fundraiser has grown into a dedicated movement of students committed to supporting patients, raising awareness, and funding research. Every donation, every volunteer hour, and every shared story brings us closer to our goal of making a real difference in the fight against blood cancer.'
  });

  // Fetch story data on component mount
  useEffect(() => {
    fetchStoryData();
    fetchStoryMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStoryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/story`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        const data = response.data;
        if (data.statistics) setStatistics(data.statistics);
        if (data.missionVision) setMissionVision(data.missionVision);
        if (data.milestones) setMilestones(data.milestones);
        if (data.values) setValues(data.values);
        if (data.storyText) setStoryText(data.storyText);
      }
    } catch (error) {
      console.error('Error fetching story data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoryMedia = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/story/media`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStoryMedia(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching story media:', error);
      setStoryMedia([]);
    }
  };

  // Handle Save Functions
  const handleSaveMissionVision = async () => {
    try {
      setSaving(true);
     await axios.put(`${API_BASE_URL}/api/story/mission-vision`,
        { missionVision },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showSuccessMessage();
    } catch (error) {
      console.error('Error saving mission & vision:', error);
      alert('Failed to save mission & vision');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMilestones = async () => {
    try {
      setSaving(true);
     
await axios.put(`${API_BASE_URL}/api/story/milestones`,
        { milestones },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showSuccessMessage();
    } catch (error) {
      console.error('Error saving milestones:', error);
      alert('Failed to save milestones');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveValues = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_BASE_URL}/api/story/values`,
        { values },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showSuccessMessage();
    } catch (error) {
      console.error('Error saving values:', error);
      alert('Failed to save values');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStory = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_BASE_URL}/api/story/story-text`,
        { storyText },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showSuccessMessage();
    } catch (error) {
      console.error('Error saving story text:', error);
      alert('Failed to save story text');
    } finally {
      setSaving(false);
    }
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Gallery Media Functions
  const handleMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert('Please select an image or video file');
        return;
      }
      
      setNewMedia({
        ...newMedia,
        file: file,
        mediaType: isVideo ? 'video' : 'image'
      });
    }
  };

  const handleUploadMedia = async () => {
    if (!newMedia.file || !newMedia.title) {
      alert('Please provide a title and select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('media', newMedia.file);
      formData.append('title', newMedia.title);
      formData.append('description', newMedia.description);
      formData.append('mediaType', newMedia.mediaType);

      await axios.post(`${API_BASE_URL}/api/story/media`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setNewMedia({
        title: '',
        description: '',
        mediaType: 'image',
        file: null
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Refresh media list
      await fetchStoryMedia();
      showSuccessMessage();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/story/media/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      await fetchStoryMedia();
      showSuccessMessage();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const handleUpdateMedia = async (mediaId) => {
    const media = storyMedia.find(m => m._id === mediaId);
    if (!media) return;

    try {
      setSaving(true);
     await axios.put(`${API_BASE_URL}/api/story/media/${mediaId}`, {
        title: media.title,
        description: media.description
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setEditingMedia(null);
      showSuccessMessage();
    } catch (error) {
      console.error('Error updating media:', error);
      alert('Failed to update media');
    } finally {
      setSaving(false);
    }
  };

  const updateMediaField = (mediaId, field, value) => {
    setStoryMedia(storyMedia.map(m => 
      m._id === mediaId ? { ...m, [field]: value } : m
    ));
  };

  // Milestone Functions
  const addMilestone = () => {
    const newMilestone = {
      id: Date.now(),
      year: '',
      title: '',
      description: ''
    };
    setMilestones([...milestones, newMilestone]);
    setEditingMilestone(newMilestone.id);
  };

  const updateMilestone = (id, field, value) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteMilestone = (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  // Value Functions
  const addValue = () => {
    const newValue = {
      id: Date.now(),
      icon: 'Sparkles',
      title: '',
      description: '',
      color: '#3b82f6'
    };
    setValues([...values, newValue]);
    setEditingValue(newValue.id);
  };

  const updateValue = (id, field, value) => {
    setValues(values.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const deleteValue = (id) => {
    if (window.confirm('Are you sure you want to delete this value?')) {
      setValues(values.filter(v => v.id !== id));
    }
  };

  // Feature Functions
  const addFeature = (type) => {
    setMissionVision({
      ...missionVision,
      [type]: {
        ...missionVision[type],
        features: [...missionVision[type].features, '']
      }
    });
  };

  const updateFeature = (type, index, value) => {
    const newFeatures = [...missionVision[type].features];
    newFeatures[index] = value;
    setMissionVision({
      ...missionVision,
      [type]: {
        ...missionVision[type],
        features: newFeatures
      }
    });
  };

  const deleteFeature = (type, index) => {
    setMissionVision({
      ...missionVision,
      [type]: {
        ...missionVision[type],
        features: missionVision[type].features.filter((_, i) => i !== index)
      }
    });
  };

  const iconComponents = {
    Heart: Heart,
    Users: Users,
    Lightbulb: Lightbulb,
    Award: Award,
    Sparkles: Sparkles
  };

  const tabs = [
    { id: 'statistics', label: 'Statistics', icon: TrendingUp },
    { id: 'mission', label: 'Mission & Vision', icon: Target },
    { id: 'milestones', label: 'Journey', icon: BookOpen },
    { id: 'gallery', label: 'Gallery', icon: Film },
    { id: 'values', label: 'Values', icon: Award },
    { id: 'story', label: 'Story Text', icon: Edit2 }
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading story data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Success Message */}
      {showSuccess && (
        <div style={styles.successBanner}>
          <Check size={20} />
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBadge}>
              <BookOpen size={24} color="#667eea" />
            </div>
            <div>
              <h1 style={styles.headerTitle}>Story Page Manager</h1>
              <p style={styles.headerSubtitle}>Manage mission, values, milestones, and statistics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsWrapper}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        <div style={styles.contentWrapper}>
          
          {/* Statistics Tab - READ ONLY */}
          {activeTab === 'statistics' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Hero Statistics</h2>
                  <p style={styles.sectionDescription}>These statistics are automatically calculated from your database</p>
                </div>
                <button 
                  style={styles.refreshButton} 
                  onClick={fetchStoryData}
                  disabled={loading}
                >
                  <RefreshCw size={18} />
                  <span>{loading ? 'Refreshing...' : 'Refresh Statistics'}</span>
                </button>
              </div>

              <div style={styles.card}>
                <div style={styles.cardBody}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Funds Raised</label>
                      <input
                        type="text"
                        style={{...styles.input, ...styles.readOnlyInput}}
                        value={statistics.fundsRaised}
                        readOnly
                        disabled
                      />
                      <p style={styles.helperText}>Auto-calculated from total donations</p>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Students Involved</label>
                      <input
                        type="text"
                        style={{...styles.input, ...styles.readOnlyInput}}
                        value={statistics.studentsInvolved}
                        readOnly
                        disabled
                      />
                      <p style={styles.helperText}>Auto-calculated from staff members</p>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Families Helped</label>
                      <input
                        type="text"
                        style={{...styles.input, ...styles.readOnlyInput}}
                        value={statistics.familiesHelped}
                        readOnly
                        disabled
                      />
                      <p style={styles.helperText}>Auto-calculated from unique donors</p>
                    </div>
                  </div>

                  <div style={styles.infoBox}>
                    <AlertCircle size={18} color="#10b981" />
                    <span>These statistics are automatically updated based on real data from your database. Click &quot;Refresh Statistics&quot; to get the latest numbers.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mission & Vision Tab */}
          {activeTab === 'mission' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Mission & Vision</h2>
                  <p style={styles.sectionDescription}>Define your organization&apos;s mission and vision</p>
                </div>
              </div>

              <div style={styles.gridTwo}>
                {/* Mission Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <Target size={20} color="#3b82f6" />
                    <h3 style={styles.cardTitle}>Mission Statement</h3>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Mission Text</label>
                      <textarea
                        style={styles.textarea}
                        value={missionVision.mission.text}
                        onChange={(e) => setMissionVision({
                          ...missionVision,
                          mission: { ...missionVision.mission, text: e.target.value }
                        })}
                        rows={5}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <div style={styles.labelRow}>
                        <label style={styles.label}>Key Features</label>
                        <button style={styles.addButton} onClick={() => addFeature('mission')}>
                          <Plus size={14} />
                          <span>Add Feature</span>
                        </button>
                      </div>
                      {missionVision.mission.features.map((feature, index) => (
                        <div key={index} style={styles.featureRow}>
                          <input
                            type="text"
                            style={styles.input}
                            value={feature}
                            onChange={(e) => updateFeature('mission', index, e.target.value)}
                            placeholder="Enter feature"
                          />
                          <button
                            style={styles.deleteIconButton}
                            onClick={() => deleteFeature('mission', index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vision Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <Heart size={20} color="#ef4444" />
                    <h3 style={styles.cardTitle}>Vision Statement</h3>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Vision Text</label>
                      <textarea
                        style={styles.textarea}
                        value={missionVision.vision.text}
                        onChange={(e) => setMissionVision({
                          ...missionVision,
                          vision: { ...missionVision.vision, text: e.target.value }
                        })}
                        rows={5}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <div style={styles.labelRow}>
                        <label style={styles.label}>Key Features</label>
                        <button style={styles.addButton} onClick={() => addFeature('vision')}>
                          <Plus size={14} />
                          <span>Add Feature</span>
                        </button>
                      </div>
                      {missionVision.vision.features.map((feature, index) => (
                        <div key={index} style={styles.featureRow}>
                          <input
                            type="text"
                            style={styles.input}
                            value={feature}
                            onChange={(e) => updateFeature('vision', index, e.target.value)}
                            placeholder="Enter feature"
                          />
                          <button
                            style={styles.deleteIconButton}
                            onClick={() => deleteFeature('vision', index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.sectionFooter}>
                <button style={styles.saveButton} onClick={handleSaveMissionVision} disabled={saving}>
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save Mission & Vision'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Journey Timeline</h2>
                  <p style={styles.sectionDescription}>Manage your organization&apos;s milestones and history</p>
                </div>
                <button style={styles.addButton} onClick={addMilestone}>
                  <Plus size={18} />
                  <span>Add Milestone</span>
                </button>
              </div>

              <div style={styles.timelineList}>
                {milestones.map((milestone) => (
                  <div key={milestone.id} style={styles.timelineCard}>
                    {editingMilestone === milestone.id ? (
                      <>
                        <div style={styles.cardBody}>
                          <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Year</label>
                              <input
                                type="text"
                                style={styles.input}
                                value={milestone.year}
                                onChange={(e) => updateMilestone(milestone.id, 'year', e.target.value)}
                                placeholder="e.g., 2024"
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Title</label>
                              <input
                                type="text"
                                style={styles.input}
                                value={milestone.title}
                                onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                placeholder="Enter milestone title"
                              />
                            </div>
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea
                              style={styles.textarea}
                              value={milestone.description}
                              onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                              placeholder="Enter milestone description"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div style={styles.cardFooter}>
                          <button
                            style={styles.saveSmallButton}
                            onClick={() => setEditingMilestone(null)}
                          >
                            <Check size={16} />
                            <span>Done</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={styles.cardBody}>
                          <div style={styles.milestoneHeader}>
                            <span style={styles.yearBadge}>{milestone.year}</span>
                            <div style={styles.actionButtons}>
                              <button
                                style={styles.iconButton}
                                onClick={() => setEditingMilestone(milestone.id)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                style={styles.iconButtonDanger}
                                onClick={() => deleteMilestone(milestone.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h4 style={styles.milestoneTitle}>{milestone.title}</h4>
                          <p style={styles.milestoneDescription}>{milestone.description}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.sectionFooter}>
                <button style={styles.saveButton} onClick={handleSaveMilestones} disabled={saving}>
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save Journey'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Gallery Management</h2>
                  <p style={styles.sectionDescription}>Upload and manage photos and videos for your story gallery</p>
                </div>
              </div>

              {/* Upload Form */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <Upload size={20} color="#667eea" />
                  <h3 style={styles.cardTitle}>Upload New Media</h3>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Title *</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={newMedia.title}
                        onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                        placeholder="Enter media title"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Media File * (Image or Video)</label>
                      <input
                        type="file"
                        style={styles.fileInput}
                        onChange={handleMediaFileChange}
                        accept="image/*,video/*"
                      />
                      {newMedia.file && (
                        <p style={styles.helperText}>
                          Selected: {newMedia.file.name} ({newMedia.mediaType})
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      value={newMedia.description}
                      onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                      placeholder="Enter media description"
                      rows={3}
                    />
                  </div>
                </div>
                <div style={styles.cardFooter}>
                  <button 
                    style={styles.saveButton} 
                    onClick={handleUploadMedia}
                    disabled={uploading || !newMedia.title || !newMedia.file}
                  >
                    <Upload size={18} />
                    <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
                  </button>
                </div>
              </div>

              {/* Media List */}
              <div style={styles.mediaList}>
                <h3 style={styles.subsectionTitle}>Uploaded Media ({storyMedia.length})</h3>
                
                {storyMedia.length > 0 ? (
                  <div style={styles.mediaGrid}>
                    {storyMedia.map((media) => (
                      <div key={media._id} style={styles.mediaCard}>
                        {editingMedia === media._id ? (
                          <>
                            <div style={styles.mediaPreview}>
                              {media.mediaType === 'video' ? (
                                <video
                                  src={`${API_BASE_URL}/${media.media}`}
                                  style={styles.mediaPreviewItem}
                                  controls
                                />
                              ) : (
                                <img
                                  src={`${API_BASE_URL}/${media.media}`}
                                  alt={media.title}
                                  style={styles.mediaPreviewItem}
                                />
                              )}
                              <span style={styles.mediaTypeBadge}>
                                {media.mediaType === 'video' ? '🎬 Video' : '📸 Photo'}
                              </span>
                            </div>
                            <div style={styles.cardBody}>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Title</label>
                                <input
                                  type="text"
                                  style={styles.input}
                                  value={media.title}
                                  onChange={(e) => updateMediaField(media._id, 'title', e.target.value)}
                                />
                              </div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Description</label>
                                <textarea
                                  style={styles.textarea}
                                  value={media.description}
                                  onChange={(e) => updateMediaField(media._id, 'description', e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div style={styles.cardFooter}>
                              <button
                                style={styles.saveSmallButton}
                                onClick={() => handleUpdateMedia(media._id)}
                                disabled={saving}
                              >
                                <Check size={16} />
                                <span>{saving ? 'Saving...' : 'Save'}</span>
                              </button>
                              <button
                                style={styles.cancelButton}
                                onClick={() => {
                                  setEditingMedia(null);
                                  fetchStoryMedia();
                                }}
                              >
                                <X size={16} />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={styles.mediaPreview}>
                              {media.mediaType === 'video' ? (
                                <video
                                  src={`${API_BASE_URL}/${media.media}`}
                                  style={styles.mediaPreviewItem}
                                  controls
                                />
                              ) : (
                                <img
                                  src={`${API_BASE_URL}/${media.media}`}
                                  alt={media.title}
                                  style={styles.mediaPreviewItem}
                                />
                              )}
                              <span style={styles.mediaTypeBadge}>
                                {media.mediaType === 'video' ? '🎬 Video' : '📸 Photo'}
                              </span>
                            </div>
                            <div style={styles.cardBody}>
                              <h4 style={styles.mediaTitle}>{media.title}</h4>
                              <p style={styles.mediaDescription}>{media.description}</p>
                              <div style={styles.actionButtons}>
                                <button
                                  style={styles.iconButton}
                                  onClick={() => setEditingMedia(media._id)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  style={styles.iconButtonDanger}
                                  onClick={() => handleDeleteMedia(media._id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <Film size={48} color="#d1d5db" />
                    <h4 style={styles.emptyTitle}>No Media Yet</h4>
                    <p style={styles.emptyText}>Upload your first photo or video to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Values Tab */}
          {activeTab === 'values' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Core Values</h2>
                  <p style={styles.sectionDescription}>Define the principles that guide your organization</p>
                </div>
                <button style={styles.addButton} onClick={addValue}>
                  <Plus size={18} />
                  <span>Add Value</span>
                </button>
              </div>

              <div style={styles.valuesGrid}>
                {values.map((value) => {
                  const IconComponent = iconComponents[value.icon] || Sparkles;
                  return (
                    <div key={value.id} style={styles.valueCard}>
                      {editingValue === value.id ? (
                        <>
                          <div style={styles.cardBody}>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Icon</label>
                              <select
                                style={styles.select}
                                value={value.icon}
                                onChange={(e) => updateValue(value.id, 'icon', e.target.value)}
                              >
                                <option value="Heart">Heart</option>
                                <option value="Users">Users</option>
                                <option value="Lightbulb">Lightbulb</option>
                                <option value="Award">Award</option>
                                <option value="Sparkles">Sparkles</option>
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Title</label>
                              <input
                                type="text"
                                style={styles.input}
                                value={value.title}
                                onChange={(e) => updateValue(value.id, 'title', e.target.value)}
                                placeholder="Enter value title"
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Description</label>
                              <textarea
                                style={styles.textarea}
                                value={value.description}
                                onChange={(e) => updateValue(value.id, 'description', e.target.value)}
                                placeholder="Enter value description"
                                rows={3}
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Color</label>
                              <input
                                type="color"
                                style={styles.colorInput}
                                value={value.color}
                                onChange={(e) => updateValue(value.id, 'color', e.target.value)}
                              />
                            </div>
                          </div>
                          <div style={styles.cardFooter}>
                            <button
                              style={styles.saveSmallButton}
                              onClick={() => setEditingValue(null)}
                            >
                              <Check size={16} />
                              <span>Done</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={styles.cardBody}>
                            <div style={styles.valueIconWrapper}>
                              <div style={{...styles.valueIcon, background: `${value.color}15`, color: value.color}}>
                                <IconComponent size={28} />
                              </div>
                              <div style={styles.actionButtons}>
                                <button
                                  style={styles.iconButton}
                                  onClick={() => setEditingValue(value.id)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  style={styles.iconButtonDanger}
                                  onClick={() => deleteValue(value.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <h4 style={styles.valueTitle}>{value.title}</h4>
                            <p style={styles.valueDescription}>{value.description}</p>
                            <div style={{...styles.colorBar, background: value.color}}></div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={styles.sectionFooter}>
                <button style={styles.saveButton} onClick={handleSaveValues} disabled={saving}>
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save Values'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Story Text Tab */}
          {activeTab === 'story' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Story Text</h2>
                  <p style={styles.sectionDescription}>Edit the &ldquo;How We Started&rdquo; story content</p>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>First Paragraph</label>
                    <textarea
                      style={styles.textarea}
                      value={storyText.paragraph1}
                      onChange={(e) => setStoryText({ ...storyText, paragraph1: e.target.value })}
                      rows={4}
                      placeholder="Enter the first paragraph of your story"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Second Paragraph</label>
                    <textarea
                      style={styles.textarea}
                      value={storyText.paragraph2}
                      onChange={(e) => setStoryText({ ...storyText, paragraph2: e.target.value })}
                      rows={4}
                      placeholder="Enter the second paragraph of your story"
                    />
                  </div>

                  <div style={styles.infoBox}>
                    <AlertCircle size={18} color="#3b82f6" />
                    <span>This text appears in the Journey section under &ldquo;How We Started&rdquo;</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <button style={styles.saveButton} onClick={handleSaveStory} disabled={saving}>
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Story Text'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500'
  },
  successBanner: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    zIndex: 1000,
    fontWeight: '600',
    animation: 'slideIn 0.3s ease-out'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '32px 0'
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  iconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 4px 0'
  },
  headerSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0
  },
  tabsContainer: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  tabsWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    gap: '8px',
    overflowX: 'auto'
  },
  tab: {
    padding: '16px 24px',
    border: 'none',
    background: 'transparent',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea',
    background: 'linear-gradient(to bottom, transparent, rgba(102, 126, 234, 0.05))'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 32px'
  },
  contentWrapper: {
    maxWidth: '100%'
  },
  section: {
    animation: 'fadeIn 0.4s ease-out'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  sectionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '32px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(to bottom, #fafafa, white)'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  cardBody: {
    padding: '32px'
  },
  cardFooter: {
    padding: '20px 32px',
    borderTop: '1px solid #e5e7eb',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '24px'
  },
  formGroup: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    letterSpacing: '0.01em'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  },
  readOnlyInput: {
    background: '#f9fafb',
    cursor: 'not-allowed',
    color: '#6b7280'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'all 0.2s',
    outline: 'none',
    lineHeight: '1.6',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  colorInput: {
    width: '80px',
    height: '48px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    padding: '4px',
    boxSizing: 'border-box'
  },
  helperText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '6px',
    fontStyle: 'italic'
  },
  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#10b981',
    border: '2px solid #10b981',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveSmallButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonDanger: {
    width: '36px',
    height: '36px',
    border: 'none',
    background: '#fee2e2',
    color: '#ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteIconButton: {
    padding: '10px',
    border: 'none',
    background: '#fee2e2',
    color: '#ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  featureRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#1e40af',
    marginTop: '24px'
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  timelineCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  milestoneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  yearBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  milestoneTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  milestoneDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6'
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  valueCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    position: 'relative'
  },
  valueIconWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  valueIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  valueTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  valueDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6'
  },
  colorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px'
  },
  fileInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px dashed #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: '#fafafa',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  subsectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 20px 0'
  },
  mediaList: {
    marginTop: '48px'
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  mediaCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  mediaPreview: {
    position: 'relative',
    width: '100%',
    height: '250px',
    background: '#f3f4f6',
    overflow: 'hidden'
  },
  mediaPreviewItem: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '6px 14px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)'
  },
  mediaTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  mediaDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  cancelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    background: 'white',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '16px 0 8px 0'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  }
};

export default AdminStory;