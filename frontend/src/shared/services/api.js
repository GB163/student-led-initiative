import axios from 'axios';
import { API_BASE_URL } from '../constants/config.js';

// Axios instance
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  let token = null;
  try {
    token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('token')
      : null;
  } catch (e) {
    console.warn('Failed to read token from localStorage:', e);
  }

  // Try sessionStorage as backup
  if (!token) {
    try {
      token = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('token')
        : null;
    } catch (e) {
      console.warn('Failed to read token from sessionStorage:', e);
    }
  }

  // Check if token exists AND is not empty
  if (token && token.trim()) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token added to request:', config.url);
  } else {
    console.warn('⚠️ No valid token found in storage for:', config.url);
  }
  return config;
});

// Enhanced error handling with 401 recovery
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An error occurred';
    
    if (error.response) {
      errorMessage = error.response.data?.message 
        || error.response.data?.error 
        || `Server error: ${error.response.status}`;
      
      if (error.response.status === 401) {
        console.error('🚨 401 Unauthorized');
        console.error('Request URL:', error.config?.url);
        console.error('Error message:', errorMessage);
        
        // Clear invalid token from BOTH storages
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('user');
          console.log('📍 Invalid tokens cleared from storage');
        } catch (e) {
          console.warn('Failed to clear token from storage:', e);
        }
        
        // Emit event for components to handle logout
        window.dispatchEvent(new CustomEvent('tokenExpired', { detail: { error: errorMessage } }));
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      errorMessage = error.message || 'Request failed';
    }
    
    console.error('📍 Error Message:', errorMessage);
    
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    
    return Promise.reject(enhancedError);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  signIn: async (email, password) => {
    try {
      console.log('🔐 Step 1: Sending login request...');
      
      const response = await apiClient.post('/auth/signin', { email, password });
      
      console.log('✅ Step 2: Backend response received:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        tokenLength: response.data.token ? response.data.token.length : 0,
        userEmail: response.data.user?.email
      });
      
      // ✅ CRITICAL: Store token from backend response
      if (response.data.token) {
        try {
          console.log('🔐 Step 3: Storing token in localStorage...');
          
          localStorage.setItem('token', response.data.token);
          console.log('✅ Token stored in localStorage');
          
          // Also store in sessionStorage as backup
          sessionStorage.setItem('token', response.data.token);
          console.log('✅ Token stored in sessionStorage');
          
          // Verify it was actually stored
          const storedToken = localStorage.getItem('token');
          if (storedToken === response.data.token) {
            console.log('✅ Step 4: Verification - Token correctly stored and retrieved!');
          } else {
            console.error('❌ Verification failed: Token mismatch!');
            throw new Error('Token storage verification failed');
          }
          
        } catch (storageError) {
          console.error('❌ Failed to store token:', storageError);
          console.error('   Possible causes:');
          console.error('   1. You are in PRIVATE/INCOGNITO mode');
          console.error('   2. Storage is disabled in browser');
          console.error('   3. Storage quota exceeded');
          console.error('   4. Browser permissions denied');
          throw new Error('Failed to store authentication token. Check browser storage permissions.');
        }
      } else {
        console.warn('⚠️ No token in backend response!');
        console.warn('   Backend returned:', JSON.stringify(response.data, null, 2));
        throw new Error('No token in login response from server');
      }
      
      // Return the response data
      return response.data;
      
    } catch (error) {
      console.error('🔴 SignIn API Error:', error.message);
      throw error;
    }
  },

  signUp: async (userData) => {
    try {
      console.log('📝 Sending signup request...');
      
      const response = await apiClient.post('/auth/signup', userData);
      
      console.log('✅ Signup response received:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
      });
      
      // Store token on successful signup
      if (response.data.token) {
        try {
          localStorage.setItem('token', response.data.token);
          sessionStorage.setItem('token', response.data.token);
          console.log('✅ Token stored from signup');
        } catch (e) {
          console.warn('Failed to store token from signup:', e);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('🔴 SignUp API Error:', error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('user');
      console.log('✅ Logged out and cleared storage');
      return true;
    } catch (error) {
      console.error('🔴 Logout Error:', error.message);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('🔴 ResetPassword API Error:', error.message);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('🔴 ForgotPassword API Error:', error.message);
      throw error;
    }
  },

  validateToken: async (token) => {
    try {
      console.log('🔐 Web API: Validating token...');
      
      const response = await apiClient.get('/auth/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('✅ Web: Token is valid');
      return response.data;
      
    } catch (error) {
      console.error('❌ Web: Token validation error:', error.message);
      throw error;
    }
  },
};

// ============================================
// USER PROFILE API
// ============================================
export const userAPI = {
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/user/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Profile Error:', error.message);
      throw error;
    }
  },

  updateProfile: async (userId, data) => {
    try {
      const response = await apiClient.put(`/user/profile/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('🔴 Update Profile Error:', error.message);
      throw error;
    }
  },

  uploadProfilePicture: async (userId, formData) => {
    try {
      console.log('📸 Uploading profile picture for user:', userId);
      console.log('📦 FormData keys:', Array.from(formData.keys()));
      
      const response = await apiClient.post(
        `/user/profile/${userId}/upload`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ Upload successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('🔴 Upload Profile Picture Error:', error.message);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  deleteProfilePicture: async (userId) => {
    try {
      const response = await apiClient.delete(`/user/profile/${userId}/picture`);
      return response.data;
    } catch (error) {
      console.error('🔴 Delete Profile Picture Error:', error.message);
      throw error;
    }
  },
};

// ============================================
// STAFF PROFILE API
// ============================================
export const staffAPI = {
  getProfile: async (staffId) => {
    try {
      const response = await apiClient.get(`/user/profile/${staffId}`);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Staff Profile Error:', error.message);
      throw error;
    }
  },

  updateProfile: async (staffId, data) => {
    try {
      const response = await apiClient.put(`/user/profile/${staffId}`, data);
      return response.data;
    } catch (error) {
      console.error('🔴 Update Staff Profile Error:', error.message);
      throw error;
    }
  },

  uploadProfilePicture: async (staffId, formData) => {
    try {
      console.log('📸 Uploading staff profile picture for:', staffId);
      
      const response = await apiClient.post(
        `/user/profile/${staffId}/upload`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ Staff upload successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('🔴 Upload Staff Profile Picture Error:', error.message);
      throw error;
    }
  },

  deleteProfilePicture: async (staffId) => {
    try {
      const response = await apiClient.delete(`/user/profile/${staffId}/picture`);
      return response.data;
    } catch (error) {
      console.error('🔴 Delete Staff Profile Picture Error:', error.message);
      throw error;
    }
  },
};

// ============================================
// HOSPITAL API
// ============================================
export const hospitalAPI = {
  getAll: async () => {
    try {
      console.log('📋 Fetching all hospitals...');
      const response = await apiClient.get('/hospitals');
      console.log('✅ Hospitals fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Hospitals Error:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/hospitals/${id}`);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Hospital Error:', error.message);
      throw error;
    }
  },

  getByCity: async () => {
    try {
      const response = await apiClient.get('/hospitals/by-city');
      return response.data;
    } catch (error) {
      console.error('🔴 Get Hospitals By City Error:', error.message);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const response = await apiClient.get('/hospitals/count');
      return response.data;
    } catch (error) {
      console.error('🔴 Get Hospital Count Error:', error.message);
      throw error;
    }
  },

  create: async (hospitalData) => {
    try {
      console.log('➕ Creating hospital:', hospitalData);
      const response = await apiClient.post('/hospitals', hospitalData);
      console.log('✅ Hospital created:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔴 Create Hospital Error:', error.message);
      throw error;
    }
  },

  update: async (id, hospitalData) => {
    try {
      console.log('✏️ Updating hospital:', id);
      const response = await apiClient.put(`/hospitals/${id}`, hospitalData);
      console.log('✅ Hospital updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔴 Update Hospital Error:', error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log('🗑️ Deleting hospital:', id);
      const response = await apiClient.delete(`/hospitals/${id}`);
      console.log('✅ Hospital deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔴 Delete Hospital Error:', error.message);
      throw error;
    }
  },

  permanentDelete: async (id) => {
    try {
      console.log('🗑️ Permanently deleting hospital:', id);
      const response = await apiClient.delete(`/hospitals/${id}/permanent`);
      console.log('✅ Hospital permanently deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔴 Permanent Delete Hospital Error:', error.message);
      throw error;
    }
  }
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getAll: () => apiClient.get('/notifications'),
  markAsRead: (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
  delete: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
};

// ============================================
// OTHER APIs
// ============================================
export const callRequestAPI = {
  create: (data) => apiClient.post('/call-requests', data),
  getAll: () => apiClient.get('/call-requests'),
  getById: (id) => apiClient.get(`/call-requests/${id}`),
  update: (id, data) => apiClient.put(`/call-requests/${id}`, data),
};

export const contactAPI = {
  create: (data) => apiClient.post('/contact', data),
  getAll: () => apiClient.get('/contact'),
};

export const eventAPI = {
  getAll: () => apiClient.get('/events'),
  getById: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
};

export const donationAPI = {
  createOrder: (amount, currency = 'INR') =>
    apiClient.post('/donations/create-order', { amount, currency }),
  verifyPayment: (data) =>
    apiClient.post('/donations/verify-payment', data),
};

export const adminAPI = {
  getUsers: () => apiClient.get('/admin/users'),
  getJoinRequests: () => apiClient.get('/admin/join-requests'),
  updateJoinRequest: (id, status) =>
    apiClient.put(`/admin/join-requests/${id}`, { status }),
};

export default apiClient;