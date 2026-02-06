import { useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { socketEvents } from '../services/socketService.js';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_THROTTLE = 10000; // 10 seconds

export const useActivityTracker = (userId) => {
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const sendHeartbeat = useCallback(() => {
    if (userId) {
      socketEvents.sendActivityHeartbeat(userId);
      console.log('💓 Heartbeat sent for user:', userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    heartbeatIntervalRef.current = setInterval(() => {
      // Only send heartbeat if app is active (for mobile)
      if (Platform.OS === 'web' || appState.current === 'active') {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);

    // Throttled activity tracker
    const trackActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > ACTIVITY_THROTTLE) {
        sendHeartbeat();
        lastActivityRef.current = now;
      }
    };

    // Web-only event listeners
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('click', trackActivity);
      window.addEventListener('keypress', trackActivity);
      window.addEventListener('scroll', trackActivity);
    }

    // Mobile-only: Listen to app state changes
    let subscription;
    if (Platform.OS !== 'web') {
      subscription = AppState.addEventListener('change', (nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          // App came to foreground - send heartbeat
          console.log('📱 App came to foreground - sending heartbeat');
          sendHeartbeat();
        }
        appState.current = nextAppState;
      });
    }

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('click', trackActivity);
        window.removeEventListener('keypress', trackActivity);
        window.removeEventListener('scroll', trackActivity);
      }

      if (subscription) {
        subscription.remove();
      }
    };
  }, [userId, sendHeartbeat]);
};

export default useActivityTracker;