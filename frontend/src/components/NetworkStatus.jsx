import React, { useState, useEffect, useCallback } from 'react';
import OfflineGame from './OfflineGame';
import { API_BASE_URL } from '../shared/constants/config.js';

// ✨ CUSTOMIZATION OPTIONS - Configure network checking behavior
const NETWORK_CONFIG = {
  // ⏱️ Timing Settings
  AUTO_RETRY_INTERVAL: 10000,      // Auto-check every X ms (10000 = 10 seconds)
  CONNECTION_TIMEOUT: 5000,        // How long to wait for response (5000 = 5 seconds)
  
  // 🔍 Health Check Endpoint
  HEALTH_ENDPOINT: '/api/health',  // Change if your health endpoint is different
  
  // 🎯 Production Settings (optional - uncomment to use)
  // Use different settings in production vs development
  // AUTO_RETRY_INTERVAL: process.env.NODE_ENV === 'production' ? 30000 : 10000,
  // CONNECTION_TIMEOUT: process.env.NODE_ENV === 'production' ? 10000 : 5000,
};

const NetworkStatus = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check server connectivity
  const checkServerConnection = useCallback(async () => {
    setIsChecking(true);
    
    try {
      console.log('🔍 Checking server connection...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_CONFIG.CONNECTION_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}${NETWORK_CONFIG.HEALTH_ENDPOINT}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Server is online');
        setIsOnline(true);
        setRetryCount(0);
        return true;
      } else {
        console.warn('⚠️ Server responded with error:', response.status);
        setIsOnline(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Server connection failed:', error.message);
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Manual retry
  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    await checkServerConnection();
  }, [checkServerConnection]);

  // Auto-check on mount
  useEffect(() => {
    checkServerConnection();
  }, [checkServerConnection]);

  // Auto-retry when offline
  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-retrying connection...');
        checkServerConnection();
      }, NETWORK_CONFIG.AUTO_RETRY_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [isOnline, checkServerConnection]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser is online');
      checkServerConnection();
    };

    const handleOffline = () => {
      console.log('📵 Browser is offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerConnection]);

  // Show game when offline
  if (!isOnline) {
    return (
      <OfflineGame 
        onRetry={handleRetry} 
        isChecking={isChecking}
        retryCount={retryCount}
      />
    );
  }

  // Show normal app when online
  return <>{children}</>;
};

export default NetworkStatus;