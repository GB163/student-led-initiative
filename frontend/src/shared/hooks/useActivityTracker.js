import { useEffect, useRef, useCallback } from 'react';
import { socketEvents } from '../services/socketService.js';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_THROTTLE = 10000; // 10 seconds

export const useActivityTracker = (userId) => {
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);

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
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    // Throttled activity tracker
    const trackActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > ACTIVITY_THROTTLE) {
        sendHeartbeat();
        lastActivityRef.current = now;
      }
    };

    // Add event listeners (web-only)
    if (typeof window !== 'undefined') {
      window.addEventListener('click', trackActivity);
      window.addEventListener('keypress', trackActivity);
      window.addEventListener('scroll', trackActivity);
    }

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', trackActivity);
        window.removeEventListener('keypress', trackActivity);
        window.removeEventListener('scroll', trackActivity);
      }
    };
  }, [userId, sendHeartbeat]);
};

export default useActivityTracker;