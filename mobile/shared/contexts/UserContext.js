// mobile/shared/contexts/UserContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from "../services/api.js";
import { socketEvents, initializeSocket } from "../services/socketService.js";

const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ✅ Load user from AsyncStorage on mount + validate token
  useEffect(() => {
    let mounted = true;

    const loadStoredUser = async () => {
      try {
        console.log('🔍 UserContext: Loading stored user...');
        
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("token")
        ]);
        
        console.log('📦 Stored user exists:', !!storedUser);
        console.log('🔑 Stored token exists:', !!storedToken);
        
        if (mounted && storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          console.log('✅ User restored from storage:', userData.name, userData.email);
          
          // ✅ IMPORTANT: Validate token is still valid
          try {
            console.log('🔐 Validating token with server...');
            const response = await authAPI.validateToken(storedToken);
            
            if (response && response.user) {
              // ✅ Update user with latest from server
              const latestUser = response.user;
              const syncedUser = {
                ...userData,
                ...latestUser,
                token: storedToken,
                id: latestUser._id || latestUser.id,
                _id: latestUser._id || latestUser.id,
              };
              
              console.log('✅ Token is valid, user authenticated and synced');
              setUser(syncedUser);
              
              // ✅ Save synced data back to storage
              await AsyncStorage.setItem("user", JSON.stringify(syncedUser));
            } else {
              console.warn('⚠️ Token validation failed');
              await AsyncStorage.multiRemove(['user', 'token']);
              setUser(null);
            }
          } catch (validationError) {
            console.warn('⚠️ Token expired or invalid:', validationError.message);
            // Clear invalid token/user
            await AsyncStorage.multiRemove(['user', 'token']);
            setUser(null);
          }
        } else {
          console.log('ℹ️ No stored user/token found');
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Failed to load user from storage:", error);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ UserContext initialized');
        }
      }
    };

    loadStoredUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Initialize socket when user changes
  useEffect(() => {
    if (!user || !initialized) return;
    
    try {
      initializeSocket();
      
      const userId = user.id || user._id;
      console.log('🔧 Mobile: Registering user role:', user.role, 'userId:', userId);
      socketEvents.registerRole(user.role, userId);
      
    } catch (error) {
      console.error("❌ Socket initialization error:", error);
    }
  }, [user?.id, user?._id, user?.role, initialized]);

  // ✅ Update user function for profile updates (with persistence)
  const updateUser = useCallback(async (updatedData) => {
    console.log('🔄 Mobile UserContext: Updating user with:', {
      name: updatedData.name,
      email: updatedData.email,
      phone: updatedData.phone,
      address: updatedData.address,
      profilePic: updatedData.profilePic,
    });
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const newUser = {
        ...prevUser,
        ...updatedData,
        // Ensure both id and _id are synced
        id: updatedData.id || updatedData._id || prevUser.id || prevUser._id,
        _id: updatedData._id || updatedData.id || prevUser._id || prevUser.id,
        // Preserve token
        token: updatedData.token || prevUser.token,
      };
      
      console.log('💾 Mobile: Saving updated user to AsyncStorage...');
      // ✅ IMPORTANT: Persist to AsyncStorage immediately
      AsyncStorage.setItem("user", JSON.stringify(newUser))
        .then(() => console.log('✅ Mobile: User persisted to AsyncStorage'))
        .catch(err => console.error('❌ Failed to persist user:', err));
      
      console.log('✅ Mobile: User updated in context');
      return newUser;
    });
  }, []);

  // ✅ Sign out user
  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...');
      await AsyncStorage.multiRemove(['user', 'token']);
      console.log('✅ Storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
    }
    
    setUser(null);
    
    try {
      socketEvents.disconnect();
    } catch (e) {
      console.warn("⚠️ Socket disconnect error:", e);
    }
  }, []);

  // ✅ Sign in user
  const signIn = useCallback(async (email, password, role) => {
    try {
      console.log('🔐 Signing in:', email);
      const data = await authAPI.signIn(email, password);
      
      if (!data.user) {
        throw new Error('Invalid email or password');
      }

      if (role !== data.user.role) {
        console.error(`Role mismatch. Expected ${role}, got ${data.user.role}`);
        throw new Error(`This account is registered as ${data.user.role}. Please use the correct login.`);
      }

      // ✅ Store token FIRST
      console.log('💾 Storing token...');
      await AsyncStorage.setItem("token", data.token);

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

      console.log('📱 User data prepared:', userData.name, userData.email);

      // ✅ Store user data BEFORE setting state
      console.log('💾 Storing user data...');
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      
      console.log('✅ Storage complete, setting state...');
      setUser(userData);
      
      console.log('✅ Sign in complete!');
      return true;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({ 
      user, 
      signIn, 
      signOut, 
      setUser, 
      updateUser,
      loading,
      initialized 
    }),
    [user, signIn, signOut, updateUser, loading, initialized]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};