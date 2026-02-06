// ============================================
// COMPLETE API.JS FIX
// ============================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config.js';

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

console.log('🔧 API Client configured with base URL:', API_BASE_URL);

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  async (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    });

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token attached to request');
      } else {
        console.log('ℹ️ No token found');
      }
    } catch (e) {
      console.warn('⚠️ Failed to read token from storage:', e);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request setup error:', error.message);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('='.repeat(50));
    console.error('❌ API ERROR OCCURRED');
    console.error('='.repeat(50));
    
    let errorMessage = 'An error occurred';
    
    if (error.response) {
      console.error('📍 Type: Server Error Response');
      console.error('📍 Status:', error.response.status);
      console.error('📍 URL:', error.config?.url);
      console.error('📍 Data:', JSON.stringify(error.response.data));
      
      errorMessage = error.response.data?.message 
        || error.response.data?.error 
        || `Server error: ${error.response.status}`;
      
      if (error.response.status === 401) {
        console.warn('🔒 Unauthorized - Clearing token');
        try {
          await AsyncStorage.multiRemove(['token', 'user']);
        } catch (storageError) {
          console.error('Failed to clear storage:', storageError);
        }
      }
    } else if (error.request) {
      console.error('📍 Type: Network Error (No Response)');
      console.error('📍 Message:', error.message);
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      console.error('📍 Type: Request Setup Error');
      console.error('📍 Message:', error.message);
      errorMessage = error.message || 'Request failed';
    }
    
    console.error('📍 Error Message:', errorMessage);
    console.error('='.repeat(50));
    
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    
    return Promise.reject(enhancedError);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  signIn: async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/signin', { email, password });
      return response.data;
    } catch (error) {
      console.error('🔴 SignIn API Error:', error.message);
      throw error;
    }
  },
  signUp: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      console.error('🔴 SignUp API Error:', error.message);
      throw error;
    }
  },
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('🔴 ResetPassword API Error:', error.message);
      throw error;
    }
  },
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('🔴 ForgotPassword API Error:', error.message);
      throw error;
    }
  },
  validateToken: async (token) => {
    try {
      console.log('🔐 API: Validating token...');
      
      const response = await apiClient.get('/api/auth/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('✅ Token is valid');
      return response.data;
      
    } catch (error) {
      console.error('❌ Token validation error:', error.message);
      throw error;
    }
  },
};

// ==================== USER PROFILE API ====================
export const userAPI = {
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/api/user/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Profile Error:', error.message);
      throw error;
    }
  },

  updateProfile: async (userId, data) => {
    try {
      const response = await apiClient.put(`/api/user/profile/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('🔴 Update Profile Error:', error.message);
      throw error;
    }
  },

  // ✅ FIXED: Complete upload with proper cache busting
  uploadProfilePicture: async (userId, formData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('\n' + '='.repeat(60));
      console.log('📸 API: UPLOADING PROFILE PICTURE');
      console.log('='.repeat(60));
      console.log('URL:', `${API_BASE_URL}/api/user/profile/${userId}/upload`);
      console.log('User ID:', userId);
      console.log('Token present:', !!token);
      
      // ✅ Log FormData contents (React Native specific way)
      console.log('📦 FormData being sent:');
      console.log('  - Has entries:', formData ? 'YES' : 'NO');
      
      // Try to inspect FormData (this might not work but worth trying)
      try {
        // @ts-ignore
        if (formData._parts) {
          // @ts-ignore
          console.log('  - Parts:', formData._parts.length);
          // @ts-ignore
          formData._parts.forEach((part, index) => {
            console.log(`  - Part ${index}:`, part[0], typeof part[1]);
            if (typeof part[1] === 'object' && part[1].uri) {
              console.log('    URI:', part[1].uri);
              console.log('    Name:', part[1].name);
              console.log('    Type:', part[1].type);
            }
          });
        }
      } catch (inspectError) {
        console.log('  - Could not inspect FormData internals');
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile/${userId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // DO NOT set Content-Type - let fetch handle it for FormData
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Raw API response:', JSON.stringify(data, null, 2));
      
      // ✅ CRITICAL: Extract profile pic URL and add cache bust
      let profilePicUrl = null;
      
      if (data.user?.profilePic) {
        profilePicUrl = data.user.profilePic;
      } else if (data.data?.profilePic) {
        profilePicUrl = data.data.profilePic;
      } else if (data.profilePic) {
        profilePicUrl = data.profilePic;
      }
      
      console.log('📷 Original profilePic URL:', profilePicUrl);
      
      if (profilePicUrl) {
        // Remove any existing query params
        const baseUrl = profilePicUrl.split('?')[0];
        
        // Add fresh timestamp for cache busting
        const cacheBustedUrl = `${baseUrl}?t=${Date.now()}`;
        
        console.log('✅ Cache-busted URL:', cacheBustedUrl);
        
        // Update the URL in the response data
        if (data.user) {
          data.user.profilePic = cacheBustedUrl;
        }
        if (data.data) {
          data.data.profilePic = cacheBustedUrl;
        }
        if (data.profilePic) {
          data.profilePic = cacheBustedUrl;
        }
      } else {
        console.warn('⚠️ No profilePic URL found in response!');
      }
      
      console.log('✅ Final response:', JSON.stringify(data, null, 2));
      console.log('='.repeat(60) + '\n');
      
      return data;
    } catch (error) {
      console.error('🔴 Upload Profile Picture Error:', error.message);
      throw error;
    }
  },

  deleteProfilePicture: async (userId) => {
    try {
      const response = await apiClient.delete(`/api/user/profile/${userId}/picture`);
      return response.data;
    } catch (error) {
      console.error('🔴 Delete Profile Picture Error:', error.message);
      throw error;
    }
  },

  deleteAccount: (userId) => apiClient.delete(`/api/user/${userId}`),
};

// ==================== STAFF PROFILE API ====================
export const staffAPI = {
  getProfile: async (staffId) => {
    try {
      const response = await apiClient.get(`/api/user/profile/${staffId}`);
      return response.data;
    } catch (error) {
      console.error('🔴 Get Staff Profile Error:', error.message);
      throw error;
    }
  },

  updateProfile: async (staffId, data) => {
    try {
      const response = await apiClient.put(`/api/user/profile/${staffId}`, data);
      return response.data;
    } catch (error) {
      console.error('🔴 Update Staff Profile Error:', error.message);
      throw error;
    }
  },

  uploadProfilePicture: async (staffId, formData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile/${staffId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Add cache busting
      let profilePicUrl = data.user?.profilePic || data.data?.profilePic || data.profilePic;
      
      if (profilePicUrl) {
        const baseUrl = profilePicUrl.split('?')[0];
        const cacheBustedUrl = `${baseUrl}?t=${Date.now()}`;
        
        if (data.user) data.user.profilePic = cacheBustedUrl;
        if (data.data) data.data.profilePic = cacheBustedUrl;
        if (data.profilePic) data.profilePic = cacheBustedUrl;
      }
      
      return data;
    } catch (error) {
      console.error('🔴 Upload Staff Profile Picture Error:', error.message);
      throw error;
    }
  },

  deleteProfilePicture: async (staffId) => {
    try {
      const response = await apiClient.delete(`/api/user/profile/${staffId}/picture`);
      return response.data;
    } catch (error) {
      console.error('🔴 Delete Staff Profile Picture Error:', error.message);
      throw error;
    }
  },
};

// ==================== OTHER APIs ====================
export const callRequestAPI = {
  create: (data) => apiClient.post('/api/call-requests', data),
  getAll: () => apiClient.get('/api/call-requests'),
  getById: (id) => apiClient.get(`/api/call-requests/${id}`),
  update: (id, data) => apiClient.put(`/api/call-requests/${id}`, data),
  delete: (id) => apiClient.delete(`/api/call-requests/${id}`),
  getUserRequests: () => apiClient.get('/api/call-requests/user/my-requests'),
};

export const contactAPI = {
  create: (data) => apiClient.post('/api/contact', data),
  getAll: () => apiClient.get('/api/contact'),
  getById: (id) => apiClient.get(`/api/contact/${id}`),
  reply: (id, message) => apiClient.post(`/api/contact/${id}/reply`, { message }),
};

export const eventAPI = {
  getAll: () => apiClient.get('/api/events'),
  getById: (id) => apiClient.get(`/api/events/${id}`),
  create: (data) => apiClient.post('/api/events', data),
  update: (id, data) => apiClient.put(`/api/events/${id}`, data),
  delete: (id) => apiClient.delete(`/api/events/${id}`),
  register: (eventId) => apiClient.post(`/api/events/${eventId}/register`),
  getUpcoming: () => apiClient.get('/api/events?upcoming=true'),
};

export const donationAPI = {
  createOrder: (amount, currency = 'INR') =>
    apiClient.post('/api/donations/create-order', { amount, currency }),
  verifyPayment: (data) =>
    apiClient.post('/api/donations/verify-payment', data),
  getHistory: () => apiClient.get('/api/donations/history'),
  getDonationStats: () => apiClient.get('/api/donations/stats'),
};

export const medicalAPI = {
  getPrograms: () => apiClient.get('/api/medical/programs'),
  getProgramById: (id) => apiClient.get(`/api/medical/programs/${id}`),
  
  applyForSupport: async (formData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(`${API_BASE_URL}/api/medical/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Application failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('❌ Medical application submission failed:', error.message);
      throw error;
    }
  },
  
  getMyApplications: () => apiClient.get('/api/medical/my-application'),
  getApplicationById: (id) => apiClient.get(`/api/medical/${id}`),
  updateApplication: (id, data) => apiClient.put(`/api/medical/${id}`, data),
  getStats: () => apiClient.get('/api/medical/stats'),
};

export const aboutAPI = {
  getAboutInfo: () => apiClient.get('/api/about'),
  updateAbout: (data) => apiClient.put('/api/about', data),
  getTeamMembers: () => apiClient.get('/api/about/team'),
};

export const hospitalAPI = {
  getAll: () => apiClient.get('/api/hospitals'),
  getById: (id) => apiClient.get(`/api/hospitals/${id}`),
  create: (data) => apiClient.post('/api/hospitals', data),
  update: (id, data) => apiClient.put(`/api/hospitals/${id}`, data),
  delete: (id) => apiClient.delete(`/api/hospitals/${id}`),
  getNearby: (latitude, longitude, radius) =>
    apiClient.get(`/api/hospitals/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),
};

export const storyAPI = {
  getAll: () => apiClient.get('/api/story'),
  getById: (id) => apiClient.get(`/api/story/${id}`),
  create: (data) => apiClient.post('/api/story', data),
  update: (id, data) => apiClient.put(`/api/story/${id}`, data),
  delete: (id) => apiClient.delete(`/api/story/${id}`),
  like: (id) => apiClient.post(`/api/story/${id}/like`),
  comment: (id, comment) => apiClient.post(`/api/story/${id}/comment`, { comment }),
};

export const joinRequestAPI = {
  create: (data) => apiClient.post('/api/join-requests', data),
  getAll: () => apiClient.get('/api/join-requests'),
  getById: (id) => apiClient.get(`/api/join-requests/${id}`),
  update: (id, status) => apiClient.put(`/api/join-requests/${id}`, { status }),
  delete: (id) => apiClient.delete(`/api/join-requests/${id}`),
};

export const notificationAPI = {
  getAll: () => apiClient.get('/api/notifications'),
  markAsRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/api/notifications/mark-all-read'),
  delete: (id) => apiClient.delete(`/api/notifications/${id}`),
};

export const healthAPI = {
  check: () => apiClient.get('/api/health'),
};

export const testAPIConnection = async () => {
  console.log('🧪 Testing API Connection...');
  console.log('🔧 Base URL:', API_BASE_URL);
  
  try {
    const response = await apiClient.get('/api/health');
    console.log('✅ API Connection Test: SUCCESS');
    console.log('📊 Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API Connection Test: FAILED');
    return false;
  }
};

export default apiClient;