// src/constants/config.js

// ✅ SAFE: Check if import.meta.env exists (Vite) or use process.env (fallback)
const getEnvVariable = (key, defaultValue) => {
  // Try Vite env variables first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // Fallback to process.env (for other bundlers)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // Last resort: return default
  return defaultValue;
};

// ✅ API Base URL
export const API_BASE_URL = getEnvVariable('VITE_API_URL', 'https://studentledinitiative.onrender.com');

// ✅ Socket URL
export const SOCKET_URL = getEnvVariable('VITE_SOCKET_URL', 'https://studentledinitiative.onrender.com');

// ✅ ADDED: getSocketUrl function export
export const getSocketUrl = () => {
  return SOCKET_URL;
};

// ✅ Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = getEnvVariable('VITE_CLOUDINARY_CLOUD_NAME', '');
export const CLOUDINARY_UPLOAD_PRESET = getEnvVariable('VITE_CLOUDINARY_UPLOAD_PRESET', '');
export const CLOUDINARY_API_KEY = getEnvVariable('VITE_CLOUDINARY_API_KEY', '');

// ✅ PayU Configuration (if needed for frontend)
export const PAYU_KEY = getEnvVariable('VITE_PAYU_KEY', '');

// ✅ App Configuration
export const APP_NAME = 'Student Led Initiative';
export const APP_VERSION = '1.0.0';

// ✅ File Upload Configuration
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// ✅ API Endpoints (optional - for better organization)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/profile',
    UPLOAD_PICTURE: '/api/user/profile/upload',
    DELETE_PICTURE: '/api/user/profile/picture',
  },
  STAFF: {
    PROFILE: '/api/staff/profile',
    UPDATE: '/api/staff/profile',
  },
  DONATIONS: {
    CREATE: '/api/donations',
    LIST: '/api/donations',
  },
  EVENTS: {
    LIST: '/api/events',
    CREATE: '/api/events',
  },
};