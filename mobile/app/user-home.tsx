import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../shared/contexts/UserContext';
import { useNotifications } from '../shared/contexts/NotificationContext';
import { useActivityTracker } from '../shared/hooks/useActivityTracker';
import { useRouter } from 'expo-router';
import { logConfig, API_BASE_URL } from '../shared/constants/config';
import { userAPI } from '../shared/services/api';
import { Heart, Users, Calendar, BookOpen, MessageCircle, LogOut, User, Bell } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserHomeScreen() {
  const { user, signOut, updateUser } = useUser();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [isReturningUser, setIsReturningUser] = useState(true); // Default to true to avoid flicker
  useActivityTracker(user?.id);

  // ✅ Check if user is returning or new
  useEffect(() => {
    checkUserVisitStatus();
  }, [user?.id]);

  const checkUserVisitStatus = async () => {
    try {
      if (!user?.id) return;
      
      const storageKey = `user_visited_${user.id}`;
      const hasVisited = await AsyncStorage.getItem(storageKey);
      
      if (hasVisited === null) {
        // First time user
        setIsReturningUser(false);
        await AsyncStorage.setItem(storageKey, 'true');
        console.log('👋 New user detected');
      } else {
        // Returning user
        setIsReturningUser(true);
        console.log('👋 Returning user detected');
      }
    } catch (error) {
      console.error('Error checking user visit status:', error);
      setIsReturningUser(true); // Default to returning user on error
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    logConfig();
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  // Refetch profile every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        console.log('🔄 Screen focused - Refetching profile');
        fetchProfile();
      }
    }, [user?.id])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching profile for user:', user?.id);
      
      const response = await userAPI.getProfile(user?.id || '');
      const profileData = response.data.user || response.data;
      
      console.log('✅ Profile fetched:', profileData.name);
      console.log('📸 Profile pic URL:', profileData.profilePic);
      
      setProfile(profileData);
      setImageRefreshKey(prev => prev + 1);
      
      if (updateUser) {
        updateUser(profileData);
      }
    } catch (error) {
      console.error('❌ Failed to fetch profile on home screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await signOut();
    router.replace('/');
  };

  const handleProfilePress = () => {
    setShowDropdown(false);
    router.push('/profile');
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const quickActions = [
    {
      id: 'medical',
      title: 'Medical Support',
      description: 'Apply for assistance',
      Icon: Heart,
      color: '#FF6B6B',
      bgColor: '#FFE5E5',
      route: '/medical-support',
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Upcoming events',
      Icon: Calendar,
      color: '#4ECDC4',
      bgColor: '#E0F7F6',
      route: '/events',
    },
    {
      id: 'story',
      title: 'Our Story',
      description: 'Learn our journey',
      Icon: BookOpen,
      color: '#9B59B6',
      bgColor: '#F0E6F6',
      route: '/story',
    },
    {
      id: 'about',
      title: 'About Us',
      description: 'Mission & impact',
      Icon: Heart,
      color: '#E74C3C',
      bgColor: '#FDEAEA',
      route: '/About',
    },
  ];

  const getRoleConfig = (): { color: string; label: string; gradient: [string, string] } => {
    const currentUser = profile || user;
    switch (currentUser?.role?.toLowerCase()) {
      case 'admin':
        return { color: '#FF3B30', label: 'Administrator', gradient: ['#FF3B30', '#FF6B6B'] as [string, string] };
      case 'staff':
        return { color: '#FF9500', label: 'Staff Member', gradient: ['#FF9500', '#FFCC00'] as [string, string] };
      default:
        return { color: '#34C759', label: 'Member', gradient: ['#34C759', '#5AC777'] as [string, string] };
    }
  };

  const roleConfig = getRoleConfig();
  const currentProfile = profile || user;
  const displayName = currentProfile?.name || user?.name || 'User';
  
  const getProfileImageUri = () => {
    const profilePic = currentProfile?.profilePic;
    
    if (!profilePic) {
      console.log('📭 No profile picture');
      return null;
    }

    if (profilePic.includes('?t=')) {
      console.log('📸 Using profile pic with cache bust:', profilePic);
      return profilePic;
    }

    if (profilePic.startsWith('http')) {
      const bustUrl = `${profilePic}?t=${Date.now()}`;
      console.log('📸 Full URL with cache bust:', bustUrl);
      return bustUrl;
    }

    const fullUrl = `${API_BASE_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}?t=${Date.now()}`;
    console.log('📸 Relative URL with cache bust:', fullUrl);
    return fullUrl;
  };

  const profileImageUri = getProfileImageUri();

  // ✅ Dynamic greeting based on user status
  const greetingText = isReturningUser ? 'Welcome back,' : 'Welcome,';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Enhanced Navbar with Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFB']}
        style={styles.navbarGradient}
      >
        <View style={styles.navbar}>
          <View style={styles.navbarContent}>
            <View>
              <Text style={styles.navbarTitle}>Student-Led Initiative</Text>
              <View style={styles.navbarSubtitle}>
                <View style={[styles.statusDot, { backgroundColor: roleConfig.color }]} />
                <Text style={styles.navbarSubtitleText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.navbarRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={20} color="#1A1F36" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.7}
              >
                {profileImageUri ? (
                  <Image
                    key={`navbar-${imageRefreshKey}`}
                    source={{ uri: profileImageUri }}
                    style={styles.navbarProfileImage}
                    onError={(e) => {
                      console.log('❌ Navbar image load error:', e.nativeEvent.error);
                      console.log('Failed URI:', profileImageUri);
                    }}
                    onLoad={() => console.log('✅ Navbar image loaded successfully')}
                  />
                ) : (
                  <LinearGradient
                    colors={roleConfig.gradient}
                    style={styles.navbarProfilePlaceholder}
                  >
                    <Text style={styles.navbarProfileText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                <View style={[styles.profileStatusDot, { backgroundColor: roleConfig.color }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Dropdown Menu */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        >
          <Animated.View style={[styles.dropdownMenu, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#F8FAFB', '#FFFFFF']}
              style={styles.dropdownHeader}
            >
              {profileImageUri ? (
                <Image
                  key={`dropdown-${imageRefreshKey}`}
                  source={{ uri: profileImageUri }}
                  style={styles.dropdownProfileImage}
                  onError={(e) => {
                    console.log('❌ Dropdown image load error:', e.nativeEvent.error);
                  }}
                />
              ) : (
                <LinearGradient
                  colors={roleConfig.gradient}
                  style={styles.dropdownProfilePlaceholder}
                >
                  <Text style={styles.dropdownProfileText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.dropdownHeaderText}>
                <Text style={styles.dropdownName}>{displayName}</Text>
                <Text style={styles.dropdownEmail}>{currentProfile?.email || user?.email}</Text>
                <View style={styles.dropdownRoleBadge}>
                  <LinearGradient
                    colors={roleConfig.gradient}
                    style={styles.roleBadgeGradient}
                  >
                    <Text style={styles.roleBadgeText}>{roleConfig.label}</Text>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleProfilePress}
            >
              <View style={[styles.dropdownIconContainer, { backgroundColor: '#E5F1FF' }]}>
                <User size={18} color="#007AFF" />
              </View>
              <Text style={styles.dropdownItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
                router.push('/contact-support');
              }}
            >
              <View style={[styles.dropdownIconContainer, { backgroundColor: '#FFF4E5' }]}>
                <MessageCircle size={18} color="#FF9500" />
              </View>
              <Text style={styles.dropdownItemText}>Contact Support</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemDanger]}
              onPress={handleLogout}
            >
              <View style={[styles.dropdownIconContainer, { backgroundColor: '#FFE5E5' }]}>
                <LogOut size={18} color="#FF3B30" />
              </View>
              <Text style={[styles.dropdownItemText, styles.dropdownItemTextDanger]}>
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Header with Dynamic Greeting */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFB']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greetingText}</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <LinearGradient
              colors={roleConfig.gradient}
              style={styles.enhancedRoleBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleDotContainer}>
                <View style={styles.roleDot} />
                <View style={styles.roleDotPulse} />
              </View>
              <Text style={styles.roleText}>{roleConfig.label}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Enhanced Featured Action Cards */}
        <View style={styles.featuredSection}>
          <TouchableOpacity
            style={styles.featuredCardWrapper}
            onPress={() => {
              animatePress();
              router.push('/DonateModal' as any);
            }}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#FF3B5C', '#FF6B7D']}
              style={styles.featuredCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featuredCardContent}>
                <View style={styles.featuredIconContainer}>
                  <Heart size={26} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View style={styles.featuredTextContainer}>
                  <Text style={styles.featuredTitle}>Make a Donation</Text>
                  <Text style={styles.featuredSubtitle}>Support our mission</Text>
                </View>
              </View>
              <View style={styles.featuredArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.cardShine} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featuredCardWrapper}
            onPress={() => {
              animatePress();
              router.push('/join-us');
            }}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#34C759', '#5AC777']}
              style={styles.featuredCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featuredCardContent}>
                <View style={styles.featuredIconContainer}>
                  <Users size={26} color="#FFFFFF" />
                </View>
                <View style={styles.featuredTextContainer}>
                  <Text style={styles.featuredTitle}>Join as Volunteer</Text>
                  <Text style={styles.featuredSubtitle}>Be part of change</Text>
                </View>
              </View>
              <View style={styles.featuredArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.cardShine} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Enhanced Quick Access Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <View style={styles.gridContainer}>
            {quickActions.map((action) => {
              const { Icon } = action;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionCardInner}>
                    <LinearGradient
                      colors={[action.bgColor, action.bgColor + '80']}
                      style={styles.iconWrapper}
                    >
                      <Icon size={28} color={action.color} strokeWidth={2.5} />
                    </LinearGradient>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDesc}>{action.description}</Text>
                    <View style={[styles.actionIndicator, { backgroundColor: action.color }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  navbarGradient: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  navbar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.5,
  },
  navbarSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  navbarSubtitleText: {
    fontSize: 12,
    color: '#8A92A0',
    fontWeight: '600',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  profileButton: {
    position: 'relative',
  },
  navbarProfileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  navbarProfilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  navbarProfileText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  profileStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 999,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dropdownProfileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dropdownProfilePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dropdownProfileText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  dropdownHeaderText: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  dropdownEmail: {
    fontSize: 12,
    color: '#8A92A0',
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownRoleBadge: {
    alignSelf: 'flex-start',
  },
  roleBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E8ECEF',
    marginVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F36',
    flex: 1,
  },
  dropdownItemDanger: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemTextDanger: {
    color: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
    marginBottom: 20,
  },
  headerContent: {
    gap: 16,
  },
  greeting: {
    fontSize: 15,
    color: '#8A92A0',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -1,
  },
  enhancedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  roleDotContainer: {
    position: 'relative',
    width: 10,
    height: 10,
    marginRight: 8,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  roleDotPulse: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featuredSection: {
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 32,
  },
  featuredCardWrapper: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredCard: {
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    transform: [{ translateX: 30 }, { translateY: -30 }],
  },
  featuredCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featuredIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredTextContainer: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  featuredArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionDivider: {
    width: 40,
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  actionCard: {
    width: '48%',
    marginBottom: 14,
  },
  actionCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  actionDesc: {
    fontSize: 12,
    color: '#8A92A0',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  actionIndicator: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
  },
  footer: {
    height: 20,
  },
});