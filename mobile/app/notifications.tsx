import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../shared/contexts/NotificationContext';
import { useUser } from '../shared/contexts/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Heart,
  Users,
  BookOpen,
  ClipboardList,
  MessageCircle,
  Info,
  ArrowLeft,
  Trash2,
  Check,
  Bell,
} from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event?: any) => {
    // Stop event propagation if called from a touch event
    if (event) {
      event.stopPropagation();
    }

    // Prevent duplicate deletion requests
    if (deletingIds.has(notificationId)) {
      console.log('Already deleting notification:', notificationId);
      return;
    }

    // Add to deleting set
    setDeletingIds(prev => new Set(prev).add(notificationId));

    try {
      await deleteNotification(notificationId);
      console.log('✅ Notification deleted successfully:', notificationId);
    } catch (error: any) {
      console.log('Delete notification error:', error.response?.status);
      // Only show error if it's not a 404 (404 means already deleted, which is fine)
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to delete notification');
      }
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const deleteAllRead = async () => {
    if (isDeletingAll) {
      console.log('Already deleting all read notifications');
      return;
    }

    const readNotifications = notifications.filter((n: any) => n.read);
    
    if (readNotifications.length === 0) {
      Alert.alert('Info', 'No read notifications to delete');
      return;
    }

    Alert.alert(
      'Delete Read Notifications',
      `Are you sure you want to delete ${readNotifications.length} read notification${readNotifications.length > 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAll(true);
            
            let successCount = 0;
            let failCount = 0;

            for (const notif of readNotifications) {
              // Skip if already being deleted
              if (deletingIds.has(notif._id)) {
                continue;
              }

              try {
                await deleteNotification(notif._id);
                successCount++;
                console.log('✅ Deleted notification:', notif._id);
              } catch (error: any) {
                console.log('❌ Error deleting notification:', notif._id, error.response?.status);
                // Count as success if 404 (already deleted)
                if (error.response?.status === 404) {
                  successCount++;
                } else {
                  failCount++;
                }
              }

              // Small delay to prevent rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            setIsDeletingAll(false);

            if (failCount > 0) {
              Alert.alert(
                'Partially Completed',
                `Deleted ${successCount} notifications. ${failCount} failed.`
              );
            } else {
              console.log(`✅ All ${successCount} read notifications deleted`);
            }
          },
        },
      ]
    );
  };

  // Get notification type configuration with icons and colors
  const getTypeConfig = (type: string) => {
    switch (type) {
      // Medical Support notifications
      case 'medical':
      case 'medical_applied':
      case 'medical_verified':
      case 'medical_approved':
      case 'medical_rejected':
      case 'medical_completed':
        return {
          Icon: ClipboardList,
          color: '#3B82F6',
          bg: '#EFF6FF',
          gradient: ['#EFF6FF', '#DBEAFE'] as const,
          label: 'Medical Support',
        };
      
      // Join Us / Volunteer notifications
      case 'volunteer':
      case 'join_applied':
      case 'join_approved':
      case 'join_rejected':
        return {
          Icon: Users,
          color: '#34C759',
          bg: '#ECFDF5',
          gradient: ['#ECFDF5', '#D1FAE5'] as const,
          label: 'Volunteer',
        };
      
      // Event notifications
      case 'event':
      case 'event_created':
      case 'event_updated':
      case 'event_reminder':
        return {
          Icon: Calendar,
          color: '#8B5CF6',
          bg: '#F5F3FF',
          gradient: ['#F5F3FF', '#EDE9FE'] as const,
          label: 'Event',
        };
      
      // Story / About Us notifications
      case 'story':
      case 'story_posted':
      case 'about':
        return {
          Icon: BookOpen,
          color: '#F59E0B',
          bg: '#FEF3C7',
          gradient: ['#FEF3C7', '#FDE68A'] as const,
          label: 'Story',
        };
      
      // Contact / Support notifications
      case 'contact':
      case 'support':
      case 'contact_replied':
        return {
          Icon: MessageCircle,
          color: '#10B981',
          bg: '#D1FAE5',
          gradient: ['#D1FAE5', '#A7F3D0'] as const,
          label: 'Contact',
        };
      
      // Donation notifications
      case 'donation':
      case 'donation_received':
        return {
          Icon: Heart,
          color: '#EC4899',
          bg: '#FDF2F8',
          gradient: ['#FDF2F8', '#FCE7F3'] as const,
          label: 'Donation',
        };
      
      // Success notifications
      case 'success':
        return {
          Icon: CheckCircle2,
          color: '#10B981',
          bg: '#ECFDF5',
          gradient: ['#ECFDF5', '#D1FAE5'] as const,
          label: 'Success',
        };
      
      // Error notifications
      case 'error':
        return {
          Icon: XCircle,
          color: '#EF4444',
          bg: '#FEF2F2',
          gradient: ['#FEF2F2', '#FEE2E2'] as const,
          label: 'Error',
        };
      
      // Warning notifications
      case 'warning':
        return {
          Icon: AlertTriangle,
          color: '#F59E0B',
          bg: '#FFFBEB',
          gradient: ['#FFFBEB', '#FEF3C7'] as const,
          label: 'Warning',
        };
      
      default:
        return {
          Icon: Info,
          color: '#6B7280',
          bg: '#F3F4F6',
          gradient: ['#F3F4F6', '#E5E7EB'] as const,
          label: 'Info',
        };
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return notifDate.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notif: any) => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const readCount = notifications.filter((n: any) => n.read).length;

  const renderNotification = ({ item }: { item: any }) => {
    const typeConfig = getTypeConfig(item.type);
    const { Icon } = typeConfig;
    const isUnread = !item.read;
    const isDeleting = deletingIds.has(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread && styles.unreadCard,
          isDeleting && styles.deletingCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <LinearGradient
          colors={typeConfig.gradient}
          style={styles.iconContainer}
        >
          <Icon size={24} color={typeConfig.color} strokeWidth={2.5} />
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={styles.notificationHeader}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, isUnread && styles.unreadText]}>
                {item.title}
              </Text>
              {isUnread && <View style={styles.unreadBadge} />}
            </View>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <View style={styles.notificationFooter}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
              <Text style={[styles.typeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={(e) => handleDeleteNotification(item._id, e)}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Trash2 size={18} color="#EF4444" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFB'] as const}
        style={styles.headerGradient}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#1A1F36" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
              activeOpacity={0.7}
            >
              <Check size={20} color="#007AFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'read' && styles.filterTabActive]}
          onPress={() => setFilter('read')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'read' && styles.filterTextActive]}>
            Read ({readCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear Read Button */}
      {readCount > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            onPress={deleteAllRead}
            style={[styles.clearButton, isDeletingAll && styles.clearButtonDisabled]}
            activeOpacity={0.7}
            disabled={isDeletingAll}
          >
            {isDeletingAll ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
            )}
            <Text style={styles.clearButtonText}>
              {isDeletingAll ? 'Deleting...' : 'Clear Read Notifications'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Bell size={64} color="#9CA3AF" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyText}>
            {filter === 'unread' && 'You have no unread notifications'}
            {filter === 'read' && 'You have no read notifications'}
            {filter === 'all' && "You don't have any notifications yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Header
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Action Bar
  actionBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  clearButtonDisabled: {
    opacity: 0.6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },

  // List
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BFDBFE',
  },
  deletingCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
    flex: 1,
    letterSpacing: -0.3,
  },
  unreadText: {
    fontWeight: '800',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },

  // Empty State
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
});