import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Trash2, Check, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../shared/contexts/UserContext';
import { API_BASE_URL } from '../shared/constants/config';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, medical, event, etc.
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    fetchAllNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notificationData = response.data.notifications || response.data;
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `${API_BASE_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const readNotifications = notifications.filter(n => n.read);
      
      await Promise.all(
        readNotifications.map(notif =>
          axios.delete(`${API_BASE_URL}/api/notifications/${notif._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      setNotifications(prev => prev.filter(notif => !notif.read));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      // Medical Support
      case 'medical':
      case 'medical_applied':
      case 'medical_verified':
      case 'medical_approved':
      case 'medical_rejected':
      case 'medical_completed':
        return { icon: '🏥', color: '#3B82F6', bg: '#EFF6FF', label: 'Medical' };
      
      // Join Us / Volunteer
      case 'volunteer':
      case 'join_applied':
      case 'join_approved':
      case 'join_rejected':
        return { icon: '👥', color: '#10B981', bg: '#ECFDF5', label: 'Volunteer' };
      
      // Events
      case 'event':
      case 'event_created':
      case 'event_updated':
      case 'event_reminder':
        return { icon: '📅', color: '#8B5CF6', bg: '#F5F3FF', label: 'Event' };
      
      // Story
      case 'story':
      case 'story_posted':
        return { icon: '📖', color: '#F59E0B', bg: '#FEF3C7', label: 'Story' };
      
      // Contact
      case 'contact':
      case 'support':
      case 'contact_replied':
        return { icon: '💬', color: '#10B981', bg: '#D1FAE5', label: 'Contact' };
      
      // Donation
      case 'donation':
      case 'donation_received':
        return { icon: '❤️', color: '#EC4899', bg: '#FDF2F8', label: 'Donation' };
      
      // Success
      case 'success':
        return { icon: '✓', color: '#10B981', bg: '#ECFDF5', label: 'Success' };
      
      // Error
      case 'error':
        return { icon: '✕', color: '#EF4444', bg: '#FEF2F2', label: 'Error' };
      
      // Warning
      case 'warning':
        return { icon: '⚠', color: '#F59E0B', bg: '#FFFBEB', label: 'Warning' };
      
      // System/Admin
      case 'system':
      case 'admin':
        return { icon: '⚙️', color: '#6B7280', bg: '#F3F4F6', label: 'System' };
      
      default:
        return { icon: 'ℹ', color: '#6B7280', bg: '#F3F4F6', label: 'Info' };
    }
  };

  // Get unique notification types for filter
  const notificationTypes = [...new Set(notifications.map(n => {
    const style = getTypeStyle(n.type);
    return style.label;
  }))];

  // Apply filters
  const filteredNotifications = notifications.filter(notif => {
    // Read/Unread filter
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    
    // Type filter
    if (typeFilter !== 'all') {
      const typeStyle = getTypeStyle(notif.type);
      if (typeStyle.label !== typeFilter) return false;
    }
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.length - unreadCount;

  // Get role-based styling
  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return '#EF4444';
      case 'staff': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const roleColor = getRoleColor();

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="header-left">
            <button 
              className="back-button" 
              onClick={() => navigate(-1)}
              aria-label="Go back"
              style={{ borderColor: roleColor }}
            >
              <ArrowLeft size={20} color={roleColor} />
            </button>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span 
                className="unread-badge"
                style={{ backgroundColor: roleColor }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                className="action-button" 
                onClick={markAllAsRead}
                style={{ color: roleColor, borderColor: roleColor }}
              >
                <Check size={16} />
                Mark all as read
              </button>
            )}
            {readCount > 0 && (
              <button 
                className="action-button delete-button" 
                onClick={deleteAllRead}
              >
                <Trash2 size={16} />
                Clear read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              style={filter === 'all' ? { backgroundColor: roleColor, borderColor: roleColor } : {}}
            >
              All ({notifications.length})
            </button>
            <button
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
              style={filter === 'unread' ? { backgroundColor: roleColor, borderColor: roleColor } : {}}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
              style={filter === 'read' ? { backgroundColor: roleColor, borderColor: roleColor } : {}}
            >
              Read ({readCount})
            </button>
          </div>

          {/* Type Filter */}
          {notificationTypes.length > 1 && (
            <div className="type-filter">
              <Filter size={16} />
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ borderColor: roleColor }}
              >
                <option value="all">All Types</option>
                {notificationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div 
              className="spinner"
              style={{ borderTopColor: roleColor }}
            ></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} strokeWidth={1} opacity={0.3} color={roleColor} />
            <h3>No notifications</h3>
            <p>
              {filter === 'unread' && 'You have no unread notifications'}
              {filter === 'read' && 'You have no read notifications'}
              {filter === 'all' && typeFilter !== 'all' && `No ${typeFilter} notifications`}
              {filter === 'all' && typeFilter === 'all' && 'You don\'t have any notifications yet'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => {
              const typeStyle = getTypeStyle(notification.type);
              const isUnread = !notification.read;

              return (
                <div
                  key={notification._id}
                  className={`notification-card ${isUnread ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={isUnread ? { borderLeftColor: roleColor } : {}}
                >
                  <div
                    className="notification-icon"
                    style={{
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.color,
                    }}
                  >
                    {typeStyle.icon}
                  </div>
                  <div className="notification-body">
                    <div className="notification-header-row">
                      <h3 className="notification-title">
                        {notification.title}
                        {isUnread && (
                          <span 
                            className="unread-indicator"
                            style={{ backgroundColor: roleColor }}
                          ></span>
                        )}
                      </h3>
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-footer">
                      <span 
                        className="notification-type"
                        style={{ 
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.color 
                        }}
                      >
                        {typeStyle.label}
                      </span>
                      <span className="notification-date">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    aria-label="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffInSeconds = Math.floor((now - notifDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return notifDate.toLocaleDateString();
};

export default NotificationsPage;