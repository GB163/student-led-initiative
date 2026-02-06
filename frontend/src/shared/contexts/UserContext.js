import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import { authAPI } from "../services/api.js";
import { socketEvents, initializeSocket } from "../services/socketService.js";

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}

// ✅ FIXED Storage helper functions - robust error handling
function getStorageItem(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const value = localStorage.getItem(key);
      if (value) {
        console.log('📖 Retrieved from localStorage:', key);
        return value;
      }
    }
  } catch (e) {
    console.warn("⚠️ localStorage read failed:", e.message);
  }
  
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const value = sessionStorage.getItem(key);
      if (value) {
        console.log('📖 Retrieved from sessionStorage:', key);
        return value;
      }
    }
  } catch (e) {
    console.warn("⚠️ sessionStorage read failed:", e.message);
  }
  
  return null;
}

function setStorageItem(key, value) {
  let stored = false;
  
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
      console.log('✅ Stored in localStorage:', key);
      stored = true;
    }
  } catch (e) {
    console.warn("⚠️ localStorage write failed:", e.message);
  }
  
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(key, value);
      console.log('✅ Stored in sessionStorage:', key);
      stored = true;
    }
  } catch (e) {
    console.warn("⚠️ sessionStorage write failed:", e.message);
  }
  
  if (!stored) {
    console.warn('⚠️ Could not store in any storage:', key);
  }
  
  return stored;
}

function removeStorageItem(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
      console.log('🗑️ Removed from localStorage:', key);
    }
  } catch (e) {
    console.warn("⚠️ localStorage remove failed:", e.message);
  }
  
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.removeItem(key);
      console.log('🗑️ Removed from sessionStorage:', key);
    }
  } catch (e) {
    console.warn("⚠️ sessionStorage remove failed:", e.message);
  }
}

export function UserProvider({ children }) {
  // Initialize user from storage
  const [user, setUser] = useState(() => {
    console.log('🔍 Web UserContext: Initializing user from storage...');
    
    const stored = getStorageItem("user");
    if (!stored) {
      console.log('ℹ️ No user in storage');
      return null;
    }
    
    try {
      const parsed = JSON.parse(stored);
      console.log('✅ User restored from storage:', parsed.email);
      
      // Ensure both id and _id are set for compatibility
      if (parsed && !parsed.id && parsed._id) {
        parsed.id = parsed._id;
      }
      if (parsed && !parsed._id && parsed.id) {
        parsed._id = parsed.id;
      }
      
      return parsed;
    } catch (e) {
      console.error("❌ Failed to parse stored user:", e);
      return null;
    }
  });

  // ✅ Validate token on mount
  useEffect(() => {
    let mounted = true;

    const validateToken = async () => {
      try {
        const token = getStorageItem('token');
        
        if (!mounted || !token) {
          console.log('ℹ️ No token to validate');
          return;
        }

        console.log('🔐 Validating token with server...');
        const response = await authAPI.validateToken(token);

        if (mounted && response && response.user) {
          // ✅ Get latest data from server
          const latestUser = response.user;
          const syncedUser = {
            ...user,
            ...latestUser,
            token,
            id: latestUser._id || latestUser.id,
            _id: latestUser._id || latestUser.id,
          };

          console.log('✅ Token validated, user synced with server:', syncedUser.email);
          setUser(syncedUser);

          // ✅ Save synced data
          setStorageItem("user", JSON.stringify(syncedUser));
        }
      } catch (error) {
        console.warn('⚠️ Token validation failed:', error.message);
        // Don't clear storage - user might be temporarily offline
      }
    };

    // Validate after a short delay
    const timer = setTimeout(validateToken, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // ✅ Initialize socket when user changes
  useEffect(() => {
    if (!user) return;
    
    try {
      console.log('🔧 Web: Initializing socket...');
      initializeSocket();
      
      const userId = user.id || user._id;
      console.log('📡 Web: Registering user role:', user.role, 'userId:', userId);
      
      socketEvents.registerRole(user.role, userId);
      
    } catch (error) {
      console.error("❌ Web: Socket initialization error:", error);
    }
  }, [user?.id, user?._id, user?.role]);

  // ✅ Update user function with persistence (enhanced)
  const updateUser = useCallback((updatedData) => {
    console.log('🔄 Web: Updating user with:', updatedData);
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const newUser = {
        ...prevUser,
        ...updatedData,
        token: updatedData.token || prevUser.token,
      };
      
      // Ensure both id and _id are always in sync
      const userId = newUser.id || newUser._id || prevUser.id || prevUser._id;
      newUser.id = userId;
      newUser._id = userId;
      
      console.log('💾 Web: Saving updated user:', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });
      
      // ✅ Update storage immediately
      setStorageItem("user", JSON.stringify(newUser));
      
      console.log('✅ Web: User updated and persisted');
      
      return newUser;
    });
  }, []);

  // ✅ Sign out user
  const signOut = useCallback(() => {
    console.log('🚪 Web: Signing out user...');
    setUser(null);
    removeStorageItem("user");
    removeStorageItem("token");
    removeStorageItem("userRole");
    
    try {
      socketEvents.disconnect();
    } catch (e) {
      console.warn("⚠️ Socket disconnect error:", e);
    }
    
    console.log('✅ Web: User signed out');
  }, []);

  // ✅ Sign in user
  const signIn = useCallback(async (email, password, role) => {
    try {
      console.log('🔐 Web: Starting login for:', email);
      
      // Call authAPI.signIn - token will be stored inside authAPI
      const data = await authAPI.signIn(email, password);
      
      console.log('✅ Web: Login response received:', {
        hasToken: !!data.token,
        hasUser: !!data.user,
        userRole: data.user?.role,
      });
      
      if (!data.user) {
        throw new Error('Invalid email or password');
      }

      if (role && role !== data.user.role) {
        console.error(`❌ Role mismatch. Expected ${role}, got ${data.user.role}`);
        throw new Error(`This account is registered as ${data.user.role}. Please use the correct login.`);
      }

      // Verify token is in storage
      const storedToken = getStorageItem('token');
      console.log('🔐 Token in storage:', !!storedToken);
      
      if (!storedToken && data.token) {
        console.log('💾 Storing token as backup...');
        setStorageItem("token", data.token);
      }

      // Get user ID - handle both _id and id
      const userId = data.user._id || data.user.id;
      
      const userData = {
        id: userId,
        _id: userId,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        address: data.user.address || '',
        profilePic: data.user.profilePic || '',
        role: data.user.role,
        token: data.token,
      };

      console.log('👤 Web: User data prepared:', userData.email, userData.role);

      setUser(userData);
      setStorageItem("user", JSON.stringify(userData));
      setStorageItem("userRole", userData.role);

      console.log('✅ Web: Login successful!');
      return true;
      
    } catch (error) {
      console.error("❌ Web: Login error:", error.message);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut, setUser, updateUser }),
    [user, signIn, signOut, updateUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};