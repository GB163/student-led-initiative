import io from 'socket.io-client';
import { getSocketUrl } from '../constants/config.js';

let socketInstance = null;
let connectionPromise = null;

export const initializeSocket = () => {
  if (socketInstance?.connected) {
    console.log('🔌 Socket already connected:', socketInstance.id);
    return Promise.resolve(socketInstance);
  }

  // Return existing connection promise if already connecting
  if (connectionPromise) {
    console.log('⏳ Socket connection already in progress...');
    return connectionPromise;
  }

  const socketUrl = getSocketUrl();
  console.log('🔌 Initializing socket connection to:', socketUrl);

  connectionPromise = new Promise((resolve, reject) => {
    try {
      socketInstance = io(socketUrl, {
        // ✅ TRANSPORTS: Polling for HTTP, WebSocket for WS
        transports: ['polling', 'websocket'],
        
        // ✅ RECONNECTION SETTINGS
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        
        // ✅ HTTPS/SECURE SETTINGS
        upgrade: true,              // Allow upgrading from polling to websocket
        secure: true,               // Force secure connection (HTTPS)
        rejectUnauthorized: false,  // Allow self-signed certificates
        
        // ✅ PERFORMANCE SETTINGS
        timeout: 20000,             // 20s timeout for HTTPS
        forceNew: false,            // Reuse connection
        autoConnect: true,          // Auto-connect on creation
        
        // ✅ POLLING SETTINGS (for when WebSocket fails)
        rememberUpgrade: true,      // Remember if WebSocket worked
        
        // ✅ QUERY PARAMETERS (optional, for backend tracking)
        query: {
          transport: 'websocket',
          platform: 'web',
          timestamp: new Date().toISOString()
        }
      });

      // ✅ CONNECTION SUCCESS
      socketInstance.on('connect', () => {
        console.log('✅ Socket connected successfully!');
        console.log('   Socket ID:', socketInstance.id);
        console.log('   URL:', socketUrl);
        console.log('   Transport:', socketInstance.io.engine.transport.name);
        connectionPromise = null;
        resolve(socketInstance);
      });

      // ✅ CONNECTION ERROR
      socketInstance.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        console.error('   Error type:', error.type);
        console.error('   Error data:', error.data);
        connectionPromise = null;
        reject(error);
      });

      // ✅ DISCONNECTION
      socketInstance.on('disconnect', (reason) => {
        console.warn('⚠️ Socket disconnected');
        console.warn('   Reason:', reason);
        console.warn('   Will auto-reconnect...');
      });

      // ✅ RECONNECTION ATTEMPT
      socketInstance.on('reconnect_attempt', () => {
        console.log('🔄 Attempting to reconnect...');
      });

      // ✅ RECONNECTION SUCCESS
      socketInstance.on('reconnect', () => {
        console.log('✅ Socket reconnected!');
        console.log('   New Socket ID:', socketInstance.id);
      });

      // ✅ RECONNECTION FAILED
      socketInstance.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed after max attempts');
        connectionPromise = null;
      });

      // ✅ TIMEOUT HANDLER
      const timeoutId = setTimeout(() => {
        if (!socketInstance?.connected) {
          console.error('⏱️ Socket connection timeout (20s)');
          connectionPromise = null;
          socketInstance?.disconnect();
          reject(new Error('Socket connection timeout'));
        }
      }, 20000);

      // Clear timeout when connected
      socketInstance.once('connect', () => {
        clearTimeout(timeoutId);
      });

    } catch (err) {
      console.error('❌ Error initializing socket:', err);
      connectionPromise = null;
      reject(err);
    }
  });

  return connectionPromise;
};

// ✅ GET SOCKET INSTANCE
export const getSocket = () => {
  if (!socketInstance) {
    initializeSocket();
  }
  return socketInstance;
};

// ✅ ENSURE SOCKET IS CONNECTED BEFORE USING
const ensureConnected = async () => {
  if (socketInstance?.connected) {
    return socketInstance;
  }
  return await initializeSocket();
};

// ✅ SOCKET EVENT EMITTERS & LISTENERS
export const socketEvents = {
  // ==================== USER & ROLE REGISTRATION ====================
  
  // Register user with role
  registerRole: async (role, userId) => {
    try {
      const socket = await ensureConnected();
      
      const data = {
        role: role,
        userId: userId,
        device: 'web',
        timestamp: new Date().toISOString()
      };

      console.log('📡 Emitting registerRole:', data);
      
      socket.emit('registerRole', data, (response) => {
        console.log('✅ registerRole response:', response);
      });
    } catch (error) {
      console.error('❌ Cannot register role:', error.message);
    }
  },

  // Register staff member
  registerStaff: async (staffId) => {
    try {
      const socket = await ensureConnected();

      const data = {
        staffId: staffId,
        userId: staffId,
        device: 'web',
        timestamp: new Date().toISOString()
      };

      console.log('📡 Emitting registerStaff:', data);
      
      socket.emit('registerStaff', data, (response) => {
        console.log('✅ registerStaff response:', response);
      });
    } catch (error) {
      console.error('❌ Cannot register staff:', error.message);
    }
  },

  // Register admin
  registerAdmin: async (adminId) => {
    try {
      const socket = await ensureConnected();

      const data = {
        adminId: adminId,
        userId: adminId,
        device: 'web',
        timestamp: new Date().toISOString()
      };

      console.log('📡 Emitting registerAdmin:', data);
      
      socket.emit('registerAdmin', data, (response) => {
        console.log('✅ registerAdmin response:', response);
      });
    } catch (error) {
      console.error('❌ Cannot register admin:', error.message);
    }
  },

  // ==================== ACTIVITY TRACKING ====================

  // Send activity heartbeat (keep-alive)
  sendActivityHeartbeat: async (userId) => {
    try {
      const socket = await ensureConnected();
      console.log('💓 Sending activity heartbeat for user:', userId);
      socket.emit('activityHeartbeat', { userId, timestamp: Date.now() });
    } catch (error) {
      console.warn('⚠️ Cannot send heartbeat:', error.message);
    }
  },

  // Request list of online users
  requestOnlineUsers: async () => {
    try {
      const socket = await ensureConnected();
      console.log('📡 Requesting online users list');
      socket.emit('requestOnlineUsers');
    } catch (error) {
      console.error('❌ Cannot request online users:', error.message);
    }
  },

  // ==================== NOTIFICATION LISTENERS ====================

  // ✅ Listen for real-time notifications
  onNotification: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('notification');
        
        console.log('👂 Listening for notification events');
        socket.on('notification', (data) => {
          console.log('🔔 Notification received:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up notification listener:', error);
    }
  },

  // ✅ Listen for new notifications
  onNewNotification: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('newNotification');
        
        console.log('👂 Listening for newNotification events');
        socket.on('newNotification', (data) => {
          console.log('✨ New notification:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up newNotification listener:', error);
    }
  },

  // ✅ Listen for notification updates
  onNotificationUpdate: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('notificationUpdate');
        
        console.log('👂 Listening for notificationUpdate events');
        socket.on('notificationUpdate', (data) => {
          console.log('🔄 Notification updated:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up notificationUpdate listener:', error);
    }
  },

  // ✅ Listen for notification list
  onNotificationsList: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('notificationsList');
        
        console.log('👂 Listening for notificationsList events');
        socket.on('notificationsList', (data) => {
          console.log('📋 Notifications list:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up notificationsList listener:', error);
    }
  },

  // ==================== CALL REQUEST LISTENERS ====================

  // Listen for new call requests
  onNewCallRequest: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('newCallRequest');
        
        console.log('👂 Listening for newCallRequest events');
        socket.on('newCallRequest', (data) => {
          console.log('📞 New call request received:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up call request listener:', error);
    }
  },

  // Listen for call updates
  onCallUpdated: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('callUpdated');
        
        console.log('👂 Listening for callUpdated events');
        socket.on('callUpdated', (data) => {
          console.log('📞 Call updated:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up callUpdated listener:', error);
    }
  },

  // ==================== CALL REQUEST EMITTERS ====================

  // Emit call request
  callRequest: async (data, callback) => {
    try {
      const socket = await ensureConnected();
      console.log('📞 Emitting call request:', data);
      socket.emit('callRequest', data, callback);
    } catch (error) {
      console.error('❌ Cannot send call request:', error.message);
    }
  },

  // Accept call request
  acceptCallRequest: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('✅ Accepting call request:', data);
      socket.emit('acceptCallRequest', data);
    } catch (error) {
      console.error('❌ Cannot accept call request:', error.message);
    }
  },

  // Start call
  startCall: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('📞 Starting call:', data);
      socket.emit('startCall', data);
    } catch (error) {
      console.error('❌ Cannot start call:', error.message);
    }
  },

  // End call
  endCall: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('🔴 Ending call:', data);
      socket.emit('endCall', data);
    } catch (error) {
      console.error('❌ Cannot end call:', error.message);
    }
  },

  // Reject call request
  rejectCallRequest: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('❌ Rejecting call request:', data);
      socket.emit('rejectCallRequest', data);
    } catch (error) {
      console.error('❌ Cannot reject call request:', error.message);
    }
  },

  // Submit feedback
  feedbackSubmit: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('⭐ Submitting feedback:', data);
      socket.emit('feedbackSubmit', data);
    } catch (error) {
      console.error('❌ Cannot submit feedback:', error.message);
    }
  },

  // Delete call
  deleteCall: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('🗑️ Deleting call:', data);
      socket.emit('deleteCall', data);
    } catch (error) {
      console.error('❌ Cannot delete call:', error.message);
    }
  },

  // ==================== MESSAGE LISTENERS ====================

  // Listen for new user messages
  onNewUserMessage: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('newUserMessage');
        
        console.log('👂 Listening for newUserMessage events');
        socket.on('newUserMessage', (data) => {
          console.log('💬 New user message:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
    }
  },

  // Listen for staff replies
  onStaffReply: (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        // Remove existing listener first to prevent duplicates
        socket.off('staffReply');
        
        console.log('👂 Listening for staffReply events');
        socket.on('staffReply', (data) => {
          console.log('💬 Staff reply received:', data);
          if (callback) callback(data);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up staffReply listener:', error);
    }
  },

  // ==================== MESSAGE EMITTERS ====================

  // Send user message
  userMessage: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('💬 Sending user message:', data);
      socket.emit('userMessage', data, (response) => {
        console.log('✅ Message sent:', response);
      });
    } catch (error) {
      console.error('❌ Cannot send user message:', error.message);
    }
  },

  // Send staff message
  staffMessage: async (data) => {
    try {
      const socket = await ensureConnected();
      console.log('💬 Sending staff message:', data);
      socket.emit('staffMessage', data, (response) => {
        console.log('✅ Message delivered:', response);
      });
    } catch (error) {
      console.error('❌ Cannot send staff message:', error.message);
    }
  },

  // ==================== GENERIC EVENT LISTENERS ====================

  // Listen for any event
  on: (event, callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        console.log(`👂 Listening for ${event} events`);
        socket.on(event, callback);
      }
    } catch (error) {
      console.error(`❌ Error setting up ${event} listener:`, error);
    }
  },

  // Remove event listener
  off: (event, callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        if (callback) {
          socket.off(event, callback);
          console.log(`🔇 Removed specific listener for: ${event}`);
        } else {
          socket.off(event);
          console.log(`🔇 Removed all listeners for: ${event}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error removing ${event} listener:`, error);
    }
  },

  // Remove all listeners for an event
  offAll: (event) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.removeAllListeners(event);
        console.log(`🔇 Removed all listeners for: ${event}`);
      }
    } catch (error) {
      console.error(`❌ Error removing all ${event} listeners:`, error);
    }
  },

  // ==================== CONNECTION MANAGEMENT ====================

  // Disconnect socket
  disconnect: () => {
    if (socketInstance?.connected) {
      console.log('🔌 Disconnecting socket...');
      socketInstance.disconnect();
      socketInstance = null;
      connectionPromise = null;
      console.log('✅ Socket disconnected');
    } else {
      console.log('ℹ️ Socket already disconnected or not initialized');
    }
  },

  // Check if connected
  isConnected: () => {
    return socketInstance?.connected || false;
  },

  // Get current socket instance
  getInstance: () => {
    return socketInstance;
  },

  // Get socket ID
  getId: () => {
    return socketInstance?.id || null;
  },

  // Get socket URL
  getUrl: () => {
    return getSocketUrl();
  },

  // Get transport type
  getTransport: () => {
    return socketInstance?.io?.engine?.transport?.name || 'unknown';
  },

  // Get connection status details
  getStatus: () => {
    return {
      connected: socketInstance?.connected || false,
      id: socketInstance?.id || null,
      url: getSocketUrl(),
      transport: socketInstance?.io?.engine?.transport?.name || 'unknown',
      timestamp: new Date().toISOString()
    };
  }
};

export default socketInstance;