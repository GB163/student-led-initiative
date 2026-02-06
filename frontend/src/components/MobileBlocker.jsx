import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MobileBlocker = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Multi-layered mobile detection
    const checkMobile = () => {
      // Method 1: Check screen width (most reliable)
      const screenWidth = window.innerWidth;
      const isSmallScreen = screenWidth <= 1024; // Tablets and phones
      
      // Method 2: Check touch capability
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           navigator.msMaxTouchPoints > 0;
      
      // Method 3: Check User Agent (can be spoofed but still useful)
      const mobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Method 4: Check device orientation API (only on mobile)
      const hasOrientation = typeof window.orientation !== 'undefined';
      
      // Method 5: Check pointer coarseness (touchscreen vs mouse)
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      
      // Block if ANY of these conditions are true:
      // - Small screen (most important)
      // - Touch device with small/medium screen
      // - Mobile User Agent
      // - Has orientation API
      // - Coarse pointer (touchscreen)
      const mobile = isSmallScreen || 
                    (isTouchDevice && screenWidth <= 1366) ||
                    (mobileUA && screenWidth <= 1366) ||
                    (hasOrientation && screenWidth <= 1366) ||
                    (hasCoarsePointer && screenWidth <= 1366);
      
      setIsMobile(mobile);
    };

    // Check on mount
    checkMobile();
    
    // Re-check on resize or orientation change
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  if (isMobile) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.iconContainer}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={styles.title}>This site cannot be reached</h1>
          <p style={styles.domain}>studentledinitiative-frontend.vercel.app</p>
          <p style={styles.message}>
            This website is not accessible on mobile devices, tablets, or small screens.
          </p>
          <p style={styles.errorCode}>ERR_ACCESS_DENIED</p>
          <div style={styles.suggestions}>
            <p style={styles.suggestionTitle}>Try:</p>
            <ul style={styles.suggestionList}>
              <li>Accessing from a desktop or laptop computer with a screen width of at least 1024px</li>
              <li>Using a larger display</li>
              <li>Checking if you have the correct URL</li>
            </ul>
          </div>
          <p style={styles.footnote}>
            Note: Desktop mode on mobile browsers will not work as this restriction is based on screen size.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

MobileBlocker.propTypes = {
  children: PropTypes.node
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  content: {
    maxWidth: '500px',
    textAlign: 'left'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  icon: {
    width: '48px',
    height: '48px',
    color: '#ef4444'
  },
  title: {
    fontSize: '24px',
    fontWeight: '400',
    color: '#1f2937',
    marginBottom: '10px',
    margin: '0 0 10px 0'
  },
  domain: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
    fontFamily: 'monospace'
  },
  message: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
    marginBottom: '10px'
  },
  errorCode: {
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginBottom: '30px',
    letterSpacing: '0.5px'
  },
  suggestions: {
    marginTop: '30px',
    marginBottom: '20px'
  },
  suggestionTitle: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: '10px'
  },
  suggestionList: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.8',
    paddingLeft: '20px',
    margin: 0
  },
  footnote: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: '20px',
    lineHeight: '1.5'
  }
};

export default MobileBlocker;