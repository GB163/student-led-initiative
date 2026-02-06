import React, { useState, useEffect } from 'react';
import { Heart, Users, Target, Award, Lightbulb, BookOpen, Sparkles, ArrowRight, Quote, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../shared/contexts/UserContext';
import DonateModal from '../../components/DonateModal';
import { apiClient } from '../../shared/services/api.js'; // ✅ FIXED: Changed from userAPI to apiClient

const API_URL = process.env.REACT_APP_API_URL;

const StoryPage = () => {
  const [activeSection, setActiveSection] = useState('mission');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser();

  const [storyData, setStoryData] = useState({
    statistics: {
      fundsRaised: '0+',
      studentsInvolved: '0+',
      familiesHelped: '0+'
    },
    missionVision: {
      mission: { text: '', features: [] },
      vision: { text: '', features: [] }
    },
    milestones: [],
    values: [],
    storyText: { paragraph1: '', paragraph2: '' }
  });

  const [storyMedia, setStoryMedia] = useState([]);

  useEffect(() => {
    fetchStoryData();
    fetchStoryMedia();
  }, []);

  const fetchStoryData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/story');
      console.log('Story data response:', response.data);
      
      if (response.data) {
        // Merge with default values to ensure all properties exist
        setStoryData(prevData => ({
          statistics: {
            ...prevData.statistics,
            ...(response.data.statistics || {})
          },
          missionVision: {
            mission: {
              text: response.data.missionVision?.mission?.text || '',
              features: response.data.missionVision?.mission?.features || []
            },
            vision: {
              text: response.data.missionVision?.vision?.text || '',
              features: response.data.missionVision?.vision?.features || []
            }
          },
          milestones: response.data.milestones || [],
          values: response.data.values || [],
          storyText: {
            paragraph1: response.data.storyText?.paragraph1 || '',
            paragraph2: response.data.storyText?.paragraph2 || ''
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching story data:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStoryMedia = async () => {
    try {
      const response = await apiClient.get('/story/media');
      console.log('Story media response:', response.data);
      setStoryMedia(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching story media:', error);
      setStoryMedia([]);
    }
  };

  const handleProtectedClick = (destination) => {
    if (!user) {
      navigate('/signin');
    } else {
      navigate(destination);
    }
  };

  const handleDonateClick = () => {
    if (!user) {
      navigate('/signin');
    } else {
      setShowDonateModal(true);
    }
  };

  const closeDonateModal = () => {
    setShowDonateModal(false);
  };

  const iconComponents = {
    Heart: <Heart size={32} />,
    Users: <Users size={32} />,
    Lightbulb: <Lightbulb size={32} />,
    Award: <Award size={32} />,
    Sparkles: <Sparkles size={32} />
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading our story...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {showDonateModal && <DonateModal closeModal={closeDonateModal} />}

      <div style={styles.heroSection}>
        <div style={styles.heroOverlay}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>
              <Sparkles size={16} />
              <span>Our Story</span>
            </div>
            <h1 style={styles.heroTitle}>
              Making a Difference,
              <br />
              <span style={styles.heroTitleGradient}>One Life at a Time</span>
            </h1>
            <p style={styles.heroSubtitle}>
              {`We're a student-led initiative dedicated to supporting blood cancer patients and funding research to find better treatments and cures.`}
            </p>
            <div style={styles.heroStats}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{storyData.statistics.fundsRaised}</div>
                <div style={styles.statLabel}>Funds Raised</div>
              </div>
              <div style={styles.statDivider}></div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{storyData.statistics.studentsInvolved}</div>
                <div style={styles.statLabel}>Students Involved</div>
              </div>
              <div style={styles.statDivider}></div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{storyData.statistics.familiesHelped}</div>
                <div style={styles.statLabel}>Families Helped</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.navContainer}>
        <div style={styles.navTabs}>
          {['mission', 'journey', 'gallery', 'values'].map((section) => (
            <button
              key={section}
              style={{
                ...styles.navTab,
                ...(activeSection === section ? styles.navTabActive : {})
              }}
              onClick={() => setActiveSection(section)}
            >
              {section === 'gallery' && <Film size={16} style={{ marginRight: '6px' }} />}
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        {activeSection === 'mission' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconBadge}>
                <Target size={32} color="#3b82f6" />
              </div>
              <h2 style={styles.sectionTitle}>Our Mission & Vision</h2>
              <p style={styles.sectionSubtitle}>
                Supporting blood cancer patients and funding research for better treatments
              </p>
            </div>

            <div style={styles.missionGrid}>
              <div style={styles.missionCard}>
                <div style={styles.quoteIcon}>
                  <Quote size={40} color="#3b82f6" />
                </div>
                <h3 style={styles.missionCardTitle}>Our Mission</h3>
                <p style={styles.missionCardText}>
                  {storyData.missionVision.mission.text}
                </p>
                <div style={styles.missionFeatures}>
                  {storyData.missionVision.mission.features.map((feature, index) => (
                    <div key={index} style={styles.featureItem}>
                      <div style={styles.featureIcon}>✓</div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.missionCard}>
                <div style={styles.quoteIcon}>
                  <Heart size={40} color="#ef4444" />
                </div>
                <h3 style={styles.missionCardTitle}>Our Vision</h3>
                <p style={styles.missionCardText}>
                  {storyData.missionVision.vision.text}
                </p>
                <div style={styles.missionFeatures}>
                  {storyData.missionVision.vision.features.map((feature, index) => (
                    <div key={index} style={styles.featureItem}>
                      <div style={styles.featureIcon}>✓</div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'journey' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconBadge}>
                <BookOpen size={32} color="#8b5cf6" />
              </div>
              <h2 style={styles.sectionTitle}>Our Journey</h2>
              <p style={styles.sectionSubtitle}>
                From a small idea to a growing movement
              </p>
            </div>

            <div style={styles.timelineContainer}>
              {storyData.milestones.map((milestone, index) => (
                <div key={milestone.id || index} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}>
                    <div style={styles.timelineDot}></div>
                    {index < storyData.milestones.length - 1 && <div style={styles.timelineLine}></div>}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineYear}>{milestone.year}</div>
                    <h3 style={styles.timelineTitle}>{milestone.title}</h3>
                    <p style={styles.timelineDescription}>{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.storyBox}>
              <h3 style={styles.storyBoxTitle}>How We Started</h3>
              <p style={styles.storyBoxText}>
                {storyData.storyText.paragraph1}
              </p>
              <p style={styles.storyBoxText}>
                {storyData.storyText.paragraph2}
              </p>
              <button 
                style={styles.ctaButton}
                onClick={() => handleProtectedClick('/join-us')}
              >
                <span>Join Our Movement</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {activeSection === 'gallery' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconBadge}>
                <Film size={32} color="#ec4899" />
              </div>
              <h2 style={styles.sectionTitle}>Our Story in Pictures & Videos</h2>
              <p style={styles.sectionSubtitle}>
                Witness the impact through moments that matter
              </p>
            </div>

            {storyMedia.length > 0 ? (
              <div style={styles.galleryGrid}>
                {storyMedia.map((media) => (
                  <div key={media._id} style={styles.galleryCard}>
                    <div style={styles.galleryMediaWrapper}>
                      {media.mediaType === 'video' ? (
                        <video
                          src={`${API_URL}/${media.media}`}
                          controls
                          style={styles.galleryMedia}
                        />
                      ) : (
                        <img
                          src={`${API_URL}/${media.media}`}
                          alt={media.title}
                          style={styles.galleryMedia}
                        />
                      )}
                      <span style={styles.mediaBadge}>
                        {media.mediaType === 'video' ? '🎬 Video' : '📸 Photo'}
                      </span>
                    </div>
                    <div style={styles.galleryContent}>
                      <h3 style={styles.galleryTitle}>{media.title}</h3>
                      <p style={styles.galleryDescription}>{media.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyGallery}>
                <Film size={64} color="#d1d5db" />
                <h3 style={styles.emptyTitle}>No Media Yet</h3>
                <p style={styles.emptyText}>
                  Our gallery is coming soon with inspiring stories and moments
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'values' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconBadge}>
                <Sparkles size={32} color="#f59e0b" />
              </div>
              <h2 style={styles.sectionTitle}>Our Core Values</h2>
              <p style={styles.sectionSubtitle}>
                The principles that guide our work
              </p>
            </div>

            <div style={styles.valuesGrid}>
              {storyData.values.map((value, index) => (
                <div key={value.id || index} style={styles.valueCard}>
                  <div style={{...styles.valueIcon, background: `${value.color}15`, color: value.color}}>
                    {iconComponents[value.icon] || <Sparkles size={32} />}
                  </div>
                  <h3 style={styles.valueTitle}>{value.title}</h3>
                  <p style={styles.valueDescription}>{value.description}</p>
                  <div style={{...styles.valueAccent, background: value.color}}></div>
                </div>
              ))}
            </div>

            <div style={styles.cultureSection}>
              <h3 style={styles.cultureTitle}>What Drives Us</h3>
              <div style={styles.cultureGrid}>
                <div style={styles.cultureCard}>
                  <div style={styles.cultureEmoji}>💪</div>
                  <h4 style={styles.cultureCardTitle}>Student Power</h4>
                  <p style={styles.cultureCardText}>
                    Harnessing the energy and creativity of students to make a real difference
                  </p>
                </div>
                <div style={styles.cultureCard}>
                  <div style={styles.cultureEmoji}>❤️</div>
                  <h4 style={styles.cultureCardTitle}>Empathy</h4>
                  <p style={styles.cultureCardText}>
                    Understanding and responding to the needs of patients and families
                  </p>
                </div>
                <div style={styles.cultureCard}>
                  <div style={styles.cultureEmoji}>🌟</div>
                  <h4 style={styles.cultureCardTitle}>Hope</h4>
                  <p style={styles.cultureCardText}>
                    Believing in a future where blood cancer can be defeated
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Join Us in Making a Difference</h2>
        <p style={styles.ctaText}>
          Whether through donations, volunteering, or spreading awareness, 
          every action counts in the fight against blood cancer
        </p>
        <div style={styles.ctaButtons}>
          <button 
            style={styles.ctaPrimaryButton}
            onClick={handleDonateClick}
          >
            Donate Now
          </button>
          <button 
            style={styles.ctaSecondaryButton}
            onClick={() => handleProtectedClick('/join-us')}
          >
            Get Involved
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
  heroSection: {
    position: 'relative',
    height: '600px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    overflow: 'hidden'
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 50%, rgba(139, 92, 246, 0.9) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroContent: {
    maxWidth: '1000px',
    padding: '0 24px',
    textAlign: 'center',
    color: 'white'
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    padding: '10px 20px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 'bold',
    margin: '0 0 24px 0',
    lineHeight: '1.2',
    letterSpacing: '-0.02em'
  },
  heroTitleGradient: {
    background: 'linear-gradient(135deg, #fff 0%, #fde68a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  heroSubtitle: {
    fontSize: '20px',
    margin: '0 auto 48px',
    maxWidth: '700px',
    lineHeight: '1.6',
    opacity: 0.95
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '48px',
    flexWrap: 'wrap'
  },
  statItem: {
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '42px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    fontWeight: '500'
  },
  statDivider: {
    width: '1px',
    height: '60px',
    background: 'rgba(255, 255, 255, 0.3)'
  },
  navContainer: {
    position: 'sticky',
    top: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  navTabs: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    overflowX: 'auto'
  },
  navTab: {
    padding: '12px 32px',
    border: 'none',
    background: 'transparent',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center'
  },
  navTabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  mainContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '80px 24px'
  },
  section: {
    animation: 'fadeIn 0.6s ease-out'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '64px'
  },
  iconBadge: {
    display: 'inline-flex',
    padding: '16px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
    borderRadius: '20px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
  },
  sectionTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 16px 0',
    letterSpacing: '-0.02em'
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  missionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '32px'
  },
  missionCard: {
    background: 'white',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f3f4f6',
    position: 'relative',
    overflow: 'hidden'
  },
  quoteIcon: {
    marginBottom: '24px',
    opacity: 0.1,
    position: 'absolute',
    top: '24px',
    right: '24px'
  },
  missionCardTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 20px 0'
  },
  missionCardText: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.8',
    margin: '0 0 32px 0'
  },
  missionFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    color: '#374151',
    fontWeight: '500'
  },
  featureIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  timelineContainer: {
    maxWidth: '800px',
    margin: '0 auto 64px'
  },
  timelineItem: {
    display: 'flex',
    gap: '32px',
    marginBottom: '48px',
    position: 'relative'
  },
  timelineMarker: {
    position: 'relative',
    flexShrink: 0
  },
  timelineDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.1)',
    position: 'relative',
    zIndex: 1
  },
  timelineLine: {
    position: 'absolute',
    left: '11px',
    top: '24px',
    width: '2px',
    height: 'calc(100% + 24px)',
    background: 'linear-gradient(180deg, #667eea 0%, #e5e7eb 100%)'
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '24px'
  },
  timelineYear: {
    display: 'inline-block',
    padding: '6px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  timelineTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  timelineDescription: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6'
  },
  storyBox: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    padding: '64px',
    borderRadius: '24px',
    border: '2px solid #fbbf24'
  },
  storyBoxTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#92400e',
    margin: '0 0 24px 0'
  },
  storyBoxText: {
    fontSize: '16px',
    color: '#78350f',
    lineHeight: '1.8',
    margin: '0 0 20px 0'
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
    transition: 'all 0.2s',
    marginTop: '24px'
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '32px'
  },
  galleryCard: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s'
  },
  galleryMediaWrapper: {
    position: 'relative',
    width: '100%',
    height: '280px',
    background: '#f3f4f6',
    overflow: 'hidden'
  },
  galleryMedia: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mediaBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)'
  },
  galleryContent: {
    padding: '24px'
  },
  galleryTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 12px 0'
  },
  galleryDescription: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: 0
  },
  emptyGallery: {
    textAlign: 'center',
    padding: '80px 24px',
    background: 'white',
    borderRadius: '20px',
    border: '2px dashed #e5e7eb'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '24px 0 12px 0'
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
    marginBottom: '64px'
  },
  valueCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden'
  },
  valueIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  valueTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 12px 0'
  },
  valueDescription: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.7',
    margin: 0
  },
  valueAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px'
  },
  cultureSection: {
    textAlign: 'center'
  },
  cultureTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 48px 0'
  },
  cultureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px'
  },
  cultureCard: {
    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
    padding: '40px',
    borderRadius: '20px',
    border: '2px solid #f3f4f6'
  },
  cultureEmoji: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  cultureCardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 12px 0'
  },
  cultureCardText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.7',
    margin: 0
  },
  ctaSection: {
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    padding: '80px 24px',
    textAlign: 'center',
    color: 'white'
  },
  ctaTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    letterSpacing: '-0.02em'
  },
  ctaText: {
    fontSize: '18px',
    margin: '0 0 40px 0',
    opacity: 0.9,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  ctaPrimaryButton: {
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.2s'
  },
  ctaSecondaryButton: {
    padding: '18px 40px',
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default StoryPage;