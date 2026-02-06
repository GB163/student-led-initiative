import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions
} from 'react-native';
import { 
  Heart, 
  Users, 
  Target, 
  Award, 
  Lightbulb, 
  BookOpen, 
  Sparkles, 
  Quote, 
  Film, 
  RefreshCw,
  Play,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOCKET_URL } from '../shared/constants/config';

const { width } = Dimensions.get('window');

// Type definitions
interface StoryStatistics {
  fundsRaised: string;
  studentsInvolved: string;
  familiesHelped: string;
}

interface MissionVisionItem {
  text: string;
  features: string[];
}

interface MissionVision {
  mission: MissionVisionItem;
  vision: MissionVisionItem;
}

interface Milestone {
  id: number;
  year: string;
  title: string;
  description: string;
}

interface Value {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface StoryText {
  paragraph1: string;
  paragraph2: string;
}

interface StoryData {
  statistics: StoryStatistics;
  missionVision: MissionVision;
  milestones: Milestone[];
  values: Value[];
  storyText: StoryText;
}

interface StoryMedia {
  _id: string;
  title: string;
  description?: string;
  media: string;
  mediaType: 'image' | 'video';
}

const getMediaUrl = (mediaPath: string) => {
  return `${SOCKET_URL}/${mediaPath}`;
};

const StoryPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('mission');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [storyMedia, setStoryMedia] = useState<StoryMedia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStoryData = async () => {
    try {
      setError(null);
      const response = await fetch(`${SOCKET_URL}/api/story`);
      const data = await response.json();
      setStoryData(data);
    } catch (err) {
      console.error('Error fetching story:', err);
      setError('Failed to load story');
    }
  };

  const fetchStoryMedia = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/story/media`);
      const mediaData = await response.json();
      if (mediaData.success && mediaData.data) {
        setStoryMedia(mediaData.data);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStoryData(), fetchStoryMedia()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStoryData(), fetchStoryMedia()]);
    setRefreshing(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const getIconComponent = (iconName: string, color: string) => {
    const icons: { [key: string]: any } = {
      Heart: Heart,
      Users: Users,
      Lightbulb: Lightbulb,
      Award: Award,
      Sparkles: Sparkles
    };
    const IconComponent = icons[iconName] || Sparkles;
    return <IconComponent size={32} color={color} />;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !storyData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>😔 {error || 'Unable to load story'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStoryData}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Story</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#fff" />
            <Text style={styles.heroBadgeText}>Our Journey</Text>
          </View>
          <Text style={styles.heroTitle}>
            Making a Difference,{'\n'}
            <Text style={styles.heroTitleGradient}>One Life at a Time</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            We're a student-led initiative dedicated to supporting blood cancer patients and funding research.
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{storyData.statistics.fundsRaised}</Text>
              <Text style={styles.statLabel}>Funds Raised</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{storyData.statistics.studentsInvolved}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{storyData.statistics.familiesHelped}</Text>
              <Text style={styles.statLabel}>Families</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Horizontal Tab Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeSection === 'mission' && styles.tabActive]}
            onPress={() => handleSectionChange('mission')}
          >
            <Text style={[styles.tabText, activeSection === 'mission' && styles.tabTextActive]}>
              Mission
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSection === 'journey' && styles.tabActive]}
            onPress={() => handleSectionChange('journey')}
          >
            <Text style={[styles.tabText, activeSection === 'journey' && styles.tabTextActive]}>
              Journey
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSection === 'gallery' && styles.tabActive]}
            onPress={() => handleSectionChange('gallery')}
          >
            <ImageIcon size={16} color={activeSection === 'gallery' ? '#667eea' : '#6b7280'} />
            <Text style={[styles.tabText, activeSection === 'gallery' && styles.tabTextActive]}>
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSection === 'values' && styles.tabActive]}
            onPress={() => handleSectionChange('values')}
          >
            <Text style={[styles.tabText, activeSection === 'values' && styles.tabTextActive]}>
              Values
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />}
      >
        {activeSection === 'mission' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <Target size={28} color="#3b82f6" />
              </View>
              <Text style={styles.sectionTitle}>Our Mission & Vision</Text>
              <Text style={styles.sectionSubtitle}>Supporting blood cancer patients and funding research</Text>
            </View>

            <View style={styles.missionCard}>
              <View style={styles.quoteIconContainer}>
                <Quote size={32} color="#3b82f6" />
              </View>
              <Text style={styles.missionCardTitle}>Our Mission</Text>
              <Text style={styles.missionCardText}>{storyData.missionVision.mission.text}</Text>
              <View style={styles.missionFeatures}>
                {storyData.missionVision.mission.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.missionCard}>
              <View style={styles.quoteIconContainer}>
                <Heart size={32} color="#ef4444" />
              </View>
              <Text style={styles.missionCardTitle}>Our Vision</Text>
              <Text style={styles.missionCardText}>{storyData.missionVision.vision.text}</Text>
              <View style={styles.missionFeatures}>
                {storyData.missionVision.vision.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeSection === 'journey' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <BookOpen size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.sectionTitle}>Our Journey</Text>
              <Text style={styles.sectionSubtitle}>From a small idea to a growing movement</Text>
            </View>

            <View style={styles.timelineContainer}>
              {storyData.milestones.map((milestone: Milestone, index: number) => (
                <View key={milestone.id} style={styles.timelineItem}>
                  <View style={styles.timelineMarker}>
                    <View style={styles.timelineDot} />
                    {index < storyData.milestones.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineYear}>
                      <Text style={styles.timelineYearText}>{milestone.year}</Text>
                    </View>
                    <Text style={styles.timelineTitle}>{milestone.title}</Text>
                    <Text style={styles.timelineDescription}>{milestone.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.storyBox}>
              <Text style={styles.storyBoxTitle}>How We Started</Text>
              <Text style={styles.storyBoxText}>{storyData.storyText.paragraph1}</Text>
              <Text style={styles.storyBoxText}>{storyData.storyText.paragraph2}</Text>
            </View>
          </View>
        )}

        {activeSection === 'gallery' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <Film size={28} color="#ec4899" />
              </View>
              <Text style={styles.sectionTitle}>Our Story in Media</Text>
              <Text style={styles.sectionSubtitle}>Witness the impact through moments that matter</Text>
            </View>

            {storyMedia.length > 0 ? (
              storyMedia.map((media: StoryMedia) => (
                <View key={media._id} style={styles.galleryCard}>
                  <View style={styles.galleryMediaWrapper}>
                    {media.mediaType === 'video' ? (
                      <TouchableOpacity 
                        style={styles.videoPlaceholder} 
                        onPress={() => Linking.openURL(getMediaUrl(media.media))}
                      >
                        <View style={styles.playButtonContainer}>
                          <View style={styles.playButton}>
                            <Play size={40} color="#fff" fill="#fff" />
                          </View>
                          <Text style={styles.videoPlaceholderText}>Tap to Play Video</Text>
                          <Text style={styles.videoPlaceholderSubtext}>Opens in browser</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <Image source={{ uri: getMediaUrl(media.media) }} style={styles.galleryMedia} resizeMode="cover" />
                    )}
                    <View style={styles.mediaBadge}>
                      <Text style={styles.mediaBadgeText}>{media.mediaType === 'video' ? '🎬 Video' : '📸 Photo'}</Text>
                    </View>
                  </View>
                  <View style={styles.galleryContent}>
                    <Text style={styles.galleryTitle}>{media.title}</Text>
                    {media.description && <Text style={styles.galleryDescription}>{media.description}</Text>}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyGallery}>
                <Film size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No Media Yet</Text>
                <Text style={styles.emptyText}>Our gallery is coming soon with inspiring stories</Text>
              </View>
            )}
          </View>
        )}

        {activeSection === 'values' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <Sparkles size={28} color="#f59e0b" />
              </View>
              <Text style={styles.sectionTitle}>Our Core Values</Text>
              <Text style={styles.sectionSubtitle}>The principles that guide our work</Text>
            </View>

            {storyData.values.map((value: Value) => (
              <View key={value.id} style={styles.valueCard}>
                <View style={[styles.valueIcon, { backgroundColor: `${value.color}15` }]}>
                  {getIconComponent(value.icon, value.color)}
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
                <View style={[styles.valueAccent, { backgroundColor: value.color }]} />
              </View>
            ))}

            <View style={styles.cultureSection}>
              <Text style={styles.cultureTitle}>What Drives Us</Text>
              
              <View style={styles.cultureCard}>
                <Text style={styles.cultureEmoji}>💪</Text>
                <Text style={styles.cultureCardTitle}>Student Power</Text>
                <Text style={styles.cultureCardText}>Harnessing student energy and creativity to make a difference</Text>
              </View>

              <View style={styles.cultureCard}>
                <Text style={styles.cultureEmoji}>❤️</Text>
                <Text style={styles.cultureCardTitle}>Empathy</Text>
                <Text style={styles.cultureCardText}>Understanding the needs of patients and families</Text>
              </View>

              <View style={styles.cultureCard}>
                <Text style={styles.cultureEmoji}>🌟</Text>
                <Text style={styles.cultureCardTitle}>Hope</Text>
                <Text style={styles.cultureCardText}>Believing in a future where blood cancer can be defeated</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#667eea' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280', fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 8 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  
  // Reduced hero section
  heroSection: { backgroundColor: '#667eea', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  heroContent: { alignItems: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, marginBottom: 16, gap: 6 },
  heroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12, lineHeight: 36 },
  heroTitleGradient: { color: '#fde68a' },
  heroSubtitle: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 20, opacity: 0.95, paddingHorizontal: 10, lineHeight: 20, fontWeight: '400' },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#fff', opacity: 0.9, fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  
  // New horizontal tabs navigation
  tabsContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f9fafb', gap: 6 },
  tabActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#667eea' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#667eea' },
  
  mainContent: { flex: 1, backgroundColor: '#f8fafc' },
  section: { padding: 20, paddingBottom: 40 },
  sectionHeader: { alignItems: 'center', marginBottom: 32 },
  iconBadge: { padding: 14, backgroundColor: '#eff6ff', borderRadius: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  missionCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  quoteIconContainer: { position: 'absolute', top: 20, right: 20, opacity: 0.08 },
  missionCardTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 },
  missionCardText: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 20, fontWeight: '400' },
  missionFeatures: { gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  featureIconText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  featureText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1, lineHeight: 18 },
  timelineContainer: { marginBottom: 28 },
  timelineItem: { flexDirection: 'row', marginBottom: 28, gap: 16 },
  timelineMarker: { alignItems: 'center', position: 'relative' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#667eea', borderWidth: 3, borderColor: '#eff6ff' },
  timelineLine: { position: 'absolute', top: 20, width: 2, height: 50, backgroundColor: '#e5e7eb' },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineYear: { backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 8 },
  timelineYearText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  timelineDescription: { fontSize: 13, color: '#6b7280', lineHeight: 20, fontWeight: '400' },
  storyBox: { backgroundColor: '#fef3c7', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#fbbf24' },
  storyBoxTitle: { fontSize: 20, fontWeight: '800', color: '#92400e', marginBottom: 12 },
  storyBoxText: { fontSize: 14, color: '#78350f', lineHeight: 22, marginBottom: 12, fontWeight: '400' },
  galleryCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  galleryMediaWrapper: { height: 240, backgroundColor: '#000', position: 'relative' },
  galleryMedia: { width: '100%', height: '100%' },
  videoPlaceholder: { width: '100%', height: '100%', backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  playButtonContainer: { alignItems: 'center' },
  playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(102, 126, 234, 0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  videoPlaceholderText: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  videoPlaceholderSubtext: { color: '#999', fontSize: 12, fontWeight: '500' },
  mediaBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  mediaBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  galleryContent: { padding: 18 },
  galleryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  galleryDescription: { fontSize: 13, color: '#6b7280', lineHeight: 20, fontWeight: '400' },
  emptyGallery: { alignItems: 'center', padding: 50, backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  valueCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  valueIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  valueTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  valueDescription: { fontSize: 13, color: '#6b7280', lineHeight: 20, fontWeight: '400' },
  valueAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },
  cultureSection: { marginTop: 28 },
  cultureTitle: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 24 },
  cultureCard: { backgroundColor: '#f9fafb', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 14 },
  cultureEmoji: { fontSize: 36, marginBottom: 10, textAlign: 'center' },
  cultureCardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  cultureCardText: { fontSize: 13, color: '#6b7280', lineHeight: 20, textAlign: 'center', fontWeight: '400' },
  footer: { height: 30 }
});

export default function Story() {
  return <StoryPage />;
}