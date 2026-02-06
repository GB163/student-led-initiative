import React, { useEffect, useState } from "react";
import { Users, Search, Trash2, Ban, CheckCircle, Calendar, Mail, Shield, X, Eye, UserCheck, UserX } from "lucide-react";
import io from "socket.io-client";
import "./AdminUsers.css";

// ✅ FIXED: Import both API_BASE_URL and getSocketUrl from centralized config
import { API_BASE_URL, getSocketUrl } from '../../shared/constants/config';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  // ✅ Format "Last Active" in real-time with Online/Offline status
  const formatLastActive = (lastActiveAt) => {
    if (!lastActiveAt) return { text: "Offline", status: "offline" };
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now - lastActive;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 2) return { text: "Online", status: "online" };
    if (diffMinutes < 60) return { text: `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`, status: "away" };
    if (diffHours < 24) return { text: `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`, status: "away" };
    if (diffDays < 7) return { text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`, status: "offline" };
    return { text: "Offline", status: "offline" };
  };

  useEffect(() => {
    // ✅ FIXED: Use getSocketUrl() instead of undefined SOCKET_URL
    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to Socket URL:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin socket connected for real-time user tracking');
    });

    newSocket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error (this is okay, will retry):', error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('userActivityUpdate', ({ userId, lastActiveAt }) => {
      console.log('💓 User activity update received:', userId);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, lastActiveAt: new Date(lastActiveAt) }
            : user
        )
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prevUsers => [...prevUsers]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('📡 Fetching users from:', `${API_BASE_URL}/api/admin/users`);
        
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Fetched users:', data.length, 'users');
        
        const usersWithDates = data.map(user => ({
          ...user,
          lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : null
        }));
        
        setUsers(usersWithDates);
        
        const blocked = usersWithDates.filter(u => u.blocked).length;
        const active = usersWithDates.filter(u => !u.blocked).length;
        setStats({ total: usersWithDates.length, active, blocked });
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        setUsers([]);
        setStats({ total: 0, active: 0, blocked: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setUsers(users.filter((user) => user._id !== id));
        const newTotal = users.length - 1;
        setStats(prev => ({ ...prev, total: newTotal }));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleBlock = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setUsers(users.map(user => 
          user._id === id ? { ...user, blocked: true } : user
        ));
        setStats(prev => ({ ...prev, active: prev.active - 1, blocked: prev.blocked + 1 }));
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleUnblock = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/unblock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setUsers(users.map(user => 
          user._id === id ? { ...user, blocked: false } : user
        ));
        setStats(prev => ({ ...prev, active: prev.active + 1, blocked: prev.blocked - 1 }));
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      ["user", "staff"].includes(user.role) &&
      (user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType("");
  };

  const getModalContent = () => {
    const activeUsers = users.filter(u => !u.blocked);
    const blockedUsers = users.filter(u => u.blocked);
    
    switch (modalType) {
      case "total": {
        const roleBreakdown = users.reduce((acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1;
          return acc;
        }, {});
        
        return {
          title: "Total Users Overview",
          data: [
            { label: "Total Users", value: stats.total },
            { label: "Active Users", value: stats.active },
            { label: "Blocked Users", value: stats.blocked },
            { label: "Staff Members", value: roleBreakdown.staff || 0 },
            { label: "Regular Users", value: roleBreakdown.user || 0 }
          ]
        };
      }
      case "active": {
        const recentActive = activeUsers
          .filter(u => u.lastActiveAt && formatLastActive(u.lastActiveAt) !== 'Never')
          .length;
        
        return {
          title: "Active Users Statistics",
          data: [
            { label: "Total Active", value: stats.active },
            { label: "Recently Active", value: recentActive },
            { label: "Inactive", value: stats.active - recentActive },
            { label: "Active Rate", value: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%` },
            { label: "Staff Active", value: activeUsers.filter(u => u.role === 'staff').length }
          ]
        };
      }
      case "blocked": {
        const recentBlocked = blockedUsers
          .filter(u => {
            const date = new Date(u.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date > thirtyDaysAgo;
          })
          .length;
        
        return {
          title: "Blocked Users Analysis",
          data: [
            { label: "Total Blocked", value: stats.blocked },
            { label: "Recently Blocked", value: recentBlocked },
            { label: "Blocked Rate", value: `${stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%` },
            { label: "Staff Blocked", value: blockedUsers.filter(u => u.role === 'staff').length },
            { label: "Users Blocked", value: blockedUsers.filter(u => u.role === 'user').length }
          ]
        };
      }
      default:
        return { title: "", data: [] };
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <Users />
            </div>
            <div className="header-text">
              <h1>User Management</h1>
              <p>Manage and monitor all platform users</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card total clickable" onClick={() => openModal("total")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Total Users</p>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon blue">
                <Users />
              </div>
            </div>
          </div>

          <div className="stat-card active clickable" onClick={() => openModal("active")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Active Users</p>
                <p>{stats.active}</p>
              </div>
              <div className="stat-icon green">
                <UserCheck />
              </div>
            </div>
          </div>

          <div className="stat-card blocked clickable" onClick={() => openModal("blocked")}>
            <div className="stat-card-content">
              <div className="stat-info">
                <p>Blocked Users</p>
                <p>{stats.blocked}</p>
              </div>
              <div className="stat-icon red">
                <UserX />
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{getModalContent().title}</h2>
                <button className="modal-close" onClick={closeModal}>
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {getModalContent().data.map((item, index) => (
                  <div key={index} className="modal-data-row">
                    <span className="modal-label">{item.label}</span>
                    <span className="modal-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="search-section">
          <div className="search-wrapper">
            <div className="search-icon">
              <Search />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-text">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Users />
              </div>
              <h3>No users found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <h4>{user.name}</h4>
                            <p>
                              <Mail />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="role-cell">
                          <Shield className={`role-icon ${user.role}`} />
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        {user.blocked ? (
                          <span className="status-badge blocked">
                            <Ban />
                            Blocked
                          </span>
                        ) : (
                          <span className="status-badge active">
                            <CheckCircle />
                            Active
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`last-active-time ${formatLastActive(user.lastActiveAt).status}`}>
                          {formatLastActive(user.lastActiveAt).text}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="action-btn view"
                            title="View Details"
                          >
                            <Eye />
                          </button>
                          {user.blocked ? (
                            <button
                              onClick={() => handleUnblock(user._id)}
                              className="action-btn unblock"
                            >
                              <CheckCircle />
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user._id)}
                              className="action-btn block"
                            >
                              <Ban />
                              Block
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="action-btn delete"
                            title="Delete User"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
            <div className="modal modal-right" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedUser(null)}
                className="modal-close-corner"
                aria-label="Close"
              >
                <X />
              </button>
              
              <div className="modal-header">
                <h2>User Details</h2>
              </div>
              
              <div className="modal-body">
                <div className="modal-user-section">
                  <div className="modal-avatar">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="modal-user-info">
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>

                <div className="modal-details">
                  <div className="detail-row">
                    <span className="detail-label">Role</span>
                    <span className={`role-badge ${selectedUser.role} detail-value`}>
                      {selectedUser.role}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    {selectedUser.blocked ? (
                      <span className="status-badge blocked detail-value">
                        Blocked
                      </span>
                    ) : (
                      <span className="status-badge active detail-value">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Joined Date</span>
                    <span className="detail-value">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Last Active</span>
                    <span className={`detail-value ${formatLastActive(selectedUser.lastActiveAt).status}`}>
                      {formatLastActive(selectedUser.lastActiveAt).text}
                    </span>
                  </div>
                </div>

                <div className="modal-footer">
                  {selectedUser.blocked ? (
                    <button
                      onClick={() => {
                        handleUnblock(selectedUser._id);
                        setSelectedUser(null);
                      }}
                      className="modal-action-btn unblock"
                    >
                      <CheckCircle />
                      Unblock User
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleBlock(selectedUser._id);
                        setSelectedUser(null);
                      }}
                      className="modal-action-btn block"
                    >
                      <Ban />
                      Block User
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDelete(selectedUser._id);
                      setSelectedUser(null);
                    }}
                    className="modal-action-btn delete"
                  >
                    <Trash2 />
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;