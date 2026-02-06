import { Platform } from 'react-native';

console.log('🔥 CONFIG FILE LOADED');

const isWeb = Platform.OS === 'web';

const getEnvApiUrl = () => {
  if (isWeb) {
    // Check all possible env variable names for web/Vercel
    return process.env.REACT_APP_API_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           process.env.EXPO_PUBLIC_API_URL;
  }
  return process.env.EXPO_PUBLIC_API_URL;
};

const getEnvSocketUrl = () => {
  if (isWeb) {
    return process.env.REACT_APP_SOCKET_URL || 
           process.env.NEXT_PUBLIC_SOCKET_URL || 
           process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  return process.env.EXPO_PUBLIC_SOCKET_URL;
};

// ✅ UPDATED TO USE DEPLOYED BACKEND
const DEFAULT_API_URL = 'https://studentledinitiative.onrender.com';
const DEFAULT_SOCKET_URL = 'https://studentledinitiative.onrender.com';

export const API_BASE_URL = getEnvApiUrl() || DEFAULT_API_URL;
export const SOCKET_URL = getEnvSocketUrl() || DEFAULT_SOCKET_URL;

console.log('🔥 CONFIG VALUES:', { 
  API_BASE_URL, 
  SOCKET_URL, 
  platform: Platform.OS,
  isWeb,
  envVars: {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
  }
});

export const getAPIUrl = () => API_BASE_URL;
export const getSocketUrl = () => SOCKET_URL;

export const logConfig = () => {
  console.log('=== API Configuration ===');
  console.log('Platform:', Platform.OS);
  console.log('Is Web:', isWeb);
  console.log('API URL:', API_BASE_URL);
  console.log('Socket URL:', SOCKET_URL);
  console.log('========================');
};