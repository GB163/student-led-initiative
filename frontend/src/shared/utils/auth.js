// src/shared/utils/auth.js

/**
 * Decode JWT token without verification (client-side)
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

/**
 * Get current user information from token or localStorage
 */
export const getCurrentUser = () => {
  // Try to get from localStorage first
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && (user._id || user.id)) {
        console.log('✅ User from localStorage:', user);
        return {
          id: user._id || user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          ...user
        };
      }
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
    }
  }

  // Try to decode from token
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = decodeToken(token);
    if (decoded) {
      console.log('✅ User from token:', decoded);
      return {
        id: decoded.userId || decoded.id || decoded._id || decoded.sub,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
        ...decoded
      };
    }
  }

  // Fallback: Try individual storage keys
  const fallbackId = localStorage.getItem('userId') || 
                     localStorage.getItem('staffId') || 
                     localStorage.getItem('user_id');
  
  if (fallbackId) {
    console.log('✅ User ID from fallback:', fallbackId);
    return {
      id: fallbackId,
      role: localStorage.getItem('role') || 'staff'
    };
  }

  console.warn('⚠️ No user information found');
  return null;
};

/**
 * Get user ID (convenience function)
 */
export const getUserId = () => {
  const user = getCurrentUser();
  return user?.id || null;
};

/**
 * Get user role (convenience function)
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Logout user (clear all auth data)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('staffId');
  localStorage.removeItem('adminId');
  localStorage.removeItem('role');
  console.log('✅ User logged out');
};

/**
 * Set user data after login
 */
export const setUserData = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    
    // Also set individual keys for backward compatibility
    if (user._id || user.id) {
      const userId = user._id || user.id;
      localStorage.setItem('userId', userId);
      
      if (user.role === 'staff') {
        localStorage.setItem('staffId', userId);
      } else if (user.role === 'admin') {
        localStorage.setItem('adminId', userId);
      }
    }
    
    if (user.role) {
      localStorage.setItem('role', user.role);
    }
    
    console.log('✅ User data saved to localStorage');
  }
};

/**
 * Debug: Log all auth-related localStorage items
 */
export const debugAuthStorage = () => {
  console.log('🔍 Auth Storage Debug:');
  console.log('  token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
  console.log('  user:', localStorage.getItem('user'));
  console.log('  userId:', localStorage.getItem('userId'));
  console.log('  staffId:', localStorage.getItem('staffId'));
  console.log('  adminId:', localStorage.getItem('adminId'));
  console.log('  role:', localStorage.getItem('role'));
  
  const user = getCurrentUser();
  console.log('  getCurrentUser():', user);
};

export default {
  decodeToken,
  getCurrentUser,
  getUserId,
  getUserRole,
  isAuthenticated,
  hasRole,
  logout,
  setUserData,
  debugAuthStorage
};