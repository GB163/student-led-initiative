import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { UserProvider, useUser } from '../shared/contexts/UserContext';
import { NotificationProvider } from '../shared/contexts/NotificationContext';
import { logConfig } from '../shared/constants/config';
import { testAPIConnection } from '../shared/services/api';
import * as Linking from 'expo-linking';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface DeepLinkEvent {
  url: string;
}

function RootLayoutNav() {
  const { user, loading, initialized } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);

  // ✅ Initialize app (only once)
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 App Initializing...');
      logConfig();
      await testAPIConnection();
      setAppReady(true);
      console.log('✅ App Ready');
    };

    initializeApp();
  }, []);

  // ✅ Handle deep links
  useEffect(() => {
    const handleDeepLink = ({ url }: DeepLinkEvent) => {
      if (!url) return;

      console.log('🔗 Deep link received:', url);
      try {
        const { hostname, path, queryParams } = Linking.parse(url);
        console.log('📍 Parsed URL - hostname:', hostname, 'path:', path);
        
        if (hostname === 'reset-password' || path === 'reset-password') {
          const token = queryParams?.token as string | undefined;
          if (token) {
            console.log('✅ Password reset token found');
            setTimeout(() => {
              router.push({
                pathname: '/resetPassword' as any,
                params: { token }
              });
            }, 500);
          } else {
            console.warn('⚠️ Token missing in deep link');
          }
        }
      } catch (error) {
        console.error('❌ Error parsing deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [router]);

  // ✅ CRITICAL FIX: Handle authentication routing
  useEffect(() => {
    // ⚠️ WAIT FOR EVERYTHING: app ready, user context initialized, AND loading complete
    if (!initialized || !appReady || loading) {
      console.log('⏳ Waiting... initialized:', initialized, 'appReady:', appReady, 'loading:', loading);
      return; // 🔥 DON'T run navigation logic until loading is complete
    }

    const currentRoute = segments[0];
    const isRootRoute = !currentRoute;
    const publicRoutes = ['login', 'signup', 'forgotPassword', 'resetPassword', '(auth)'];
    const isPublicRoute = publicRoutes.includes(currentRoute || '');

    console.log('🔐 Auth Check:', {
      user: user ? `${user.name} (${user.email})` : 'Not logged in',
      currentRoute: currentRoute || 'root',
      isPublicRoute,
      isRootRoute,
    });

    // ✅ User NOT logged in
    if (!user) {
      if (!isPublicRoute && !isRootRoute) {
        console.log('❌ Protected route, redirecting to login');
        router.replace('/login');
      } else if (isRootRoute) {
        console.log('❌ Root route, redirecting to login');
        router.replace('/login');
      } else {
        console.log('ℹ️ Already on public route');
      }
    } 
    // ✅ User IS logged in
    else {
      if (['login', 'signup'].includes(currentRoute || '') || isRootRoute) {
        console.log('✅ User logged in, redirecting to user-home');
        router.replace('/user-home');
      } else {
        console.log('ℹ️ User on valid protected route:', currentRoute);
      }
    }
  }, [user, segments, initialized, appReady, loading, router]); // 🔥 Added 'loading' to dependencies

  // ✅ Show loading screen while initializing OR loading user
  if (!initialized || !appReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});