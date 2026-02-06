import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bell } from 'lucide-react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { apiClient } from 'shared/services/api';
import { socketEvents } from 'shared/services/socketService';
import { API_BASE_URL } from 'shared/constants/config';
import './NotificationBell.css';

const NotificationBell = ({ userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  console.log('🔔 NotificationBell rendered');

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Listen for tokenExpired event
  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.error('🚨 [NotificationBell] Token expired:', event.detail);
      if (isMounted.current) {
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
        navigate('/signin', { replace: true });
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [navigate]);

  // ✅ Listen for real-time socket notifications
  useEffect(() => {
    console.log('👂 Setting up socket listeners');

    try {
      socketEvents.onNewNotification((notif) => {
        console.log('✨ New notification received:', notif);
        if (isMounted.current) {
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });

      socketEvents.onNotificationUpdate((notif) => {
        console.log('🔄 Notification updated:', notif);
        if (isMounted.current) {
          setNotifications(prev =>
            prev.map(n => n._id === notif._id ? notif : n)
          );
        }
      });
    } catch (e) {
      console.warn('⚠️ Socket listener setup error:', e.message);
    }

    return () => {
      try {
        socketEvents.off('newNotification', null);
        socketEvents.off('notificationUpdate', null);
      } catch (e) {
        console.warn('⚠️ Socket cleanup error:', e.message);
      }
    };
  }, []);

  // ✅ Fetch notifications with proper error handling
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.log('ℹ️ No token, skipping fetch');
      if (isMounted.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching notifications...');
      const response = await apiClient.get('/notifications');

      if (!isMounted.current) return;

      console.log('✅ Notifications fetched:', response.data);

      if (response.data.notifications && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount || response.data.notifications.filter(n => !n.read).length);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      if (!isMounted.current) return;

      console.error('❌ Error fetching notifications:');
      console.error('   Message:', error.message);
      console.error('   Status:', error.response?.status);

      if (error.response?.status === 401) {
        console.error('🚨 401 Unauthorized - clearing token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
        navigate('/signin', { replace: true });
      } else if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint not found (404)');
      } else if (error.message === 'Network error. Please check your internet connection.' || 
                 error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error');
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [navigate]);

  // ✅ Mark as read
  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }

    try {
      console.log('📝 Marking as read:', notificationId);
      await apiClient.patch(`/notifications/${notificationId}/read`);

      if (isMounted.current) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error.message);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/signin', { replace: true });
      }
    }
  };

  // ✅ Mark all as read
  const markAllAsRead = async (e) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }

    try {
      console.log('📝 Marking all as read...');
      await apiClient.patch('/notifications/read-all');

      if (isMounted.current) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error.message);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/signin', { replace: true });
      }
    }
  };

  const handleNotificationClick = async (e, notification) => {
    e.stopPropagation();
    
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  // ✅ Memoize getTypeStyle to prevent recalculation
  const getTypeStyle = useMemo(() => (type) => {
    switch (type) {
      case 'medical':
      case 'medical_applied':
      case 'medical_verified':
      case 'medical_approved':
      case 'medical_rejected':
      case 'medical_completed':
        return { icon: '🏥', color: '#3B82F6', bg: '#EFF6FF' };
      
      case 'volunteer':
      case 'join_applied':
      case 'join_approved':
      case 'join_rejected':
        return { icon: '👥', color: '#10B981', bg: '#ECFDF5' };
      
      case 'event':
      case 'event_created':
      case 'event_updated':
      case 'event_reminder':
        return { icon: '📅', color: '#8B5CF6', bg: '#F5F3FF' };
      
      case 'story':
      case 'story_posted':
      case 'about':
        return { icon: '📖', color: '#F59E0B', bg: '#FEF3C7' };
      
      case 'contact':
      case 'support':
      case 'contact_replied':
        return { icon: '💬', color: '#10B981', bg: '#D1FAE5' };
      
      case 'donation':
      case 'donation_received':
        return { icon: '❤️', color: '#EC4899', bg: '#FDF2F8' };
      
      case 'success':
        return { icon: '✓', color: '#10B981', bg: '#ECFDF5' };
      
      case 'error':
        return { icon: '✕', color: '#EF4444', bg: '#FEF2F2' };
      
      case 'warning':
        return { icon: '⚠', color: '#F59E0B', bg: '#FFFBEB' };
      
      case 'system':
      case 'admin':
        return { icon: '⚙️', color: '#6B7280', bg: '#F3F4F6' };
      
      default:
        return { icon: 'ℹ', color: '#6B7280', bg: '#F3F4F6' };
    }
  }, []);

  // ✅ Memoize getRoleStyling to prevent recalculation
  const roleStyle = useMemo(() => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
        return { color: '#EF4444', name: 'Admin' };
      case 'staff':
        return { color: '#F59E0B', name: 'Staff' };
      default:
        return { color: '#3B82F6', name: 'User' };
    }
  }, [userRole]);

  const handleBellClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ✅ Fetch notifications and set up polling - ONLY ONCE
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.log('ℹ️ No token, notifications disabled');
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    console.log('🔔 Starting notification polling');
    
    // Fetch immediately
    fetchNotifications();
    
    // Then poll every 30 seconds
    intervalRef.current = setInterval(() => {
      console.log('⏰ Polling notifications...');
      fetchNotifications();
    }, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('⏹️ Polling stopped');
      }
    };
  }, [fetchNotifications]); // ✅ Only depends on fetchNotifications (which is memoized)

  const formatTimeAgo = useCallback((date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return notifDate.toLocaleDateString();
  }, []);

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button
        className="notification-bell-button"
        onClick={handleBellClick}
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        style={{ borderColor: unreadCount > 0 ? roleStyle.color : 'transparent' }}
      >
        <Bell size={20} color={unreadCount > 0 ? roleStyle.color : '#6B7280'} />
        {unreadCount > 0 && (
          <span 
            className="notification-badge"
            style={{ backgroundColor: roleStyle.color }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div 
          className="notification-dropdown" 
          style={{
            display: 'flex',
            opacity: 1,
            visibility: 'visible'
          }}
        >
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>
              <span 
                className="role-badge" 
                style={{ 
                  backgroundColor: roleStyle.color + '20', 
                  color: roleStyle.color 
                }}
              >
                {roleStyle.name}
              </span>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="mark-all-read"
                type="button"
                style={{ color: roleStyle.color }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <div className="notification-loading">
              <div 
                className="spinner" 
                style={{ borderTopColor: roleStyle.color }}
              ></div>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="notification-error">
              <p style={{ color: '#EF4444' }}>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={48} strokeWidth={1} color={roleStyle.color} opacity={0.3} />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 5).map((notification) => {
                const typeStyle = getTypeStyle(notification.type);
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification._id}
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={(e) => handleNotificationClick(e, notification)}
                  >
                    <div
                      className="notification-icon"
                      style={{ 
                        backgroundColor: typeStyle.bg, 
                        color: typeStyle.color 
                      }}
                    >
                      {typeStyle.icon}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {isUnread && (
                          <span 
                            className="unread-dot"
                            style={{ backgroundColor: roleStyle.color }}
                          ></span>
                        )}
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="notification-footer">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                navigate('/notifications');
              }}
              style={{ color: roleStyle.color }}
              type="button"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  userRole: PropTypes.string.isRequired,
};

export default NotificationBell;