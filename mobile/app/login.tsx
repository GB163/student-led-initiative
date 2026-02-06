import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../shared/contexts/UserContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useUser();

  const handleLogin = async () => {
    // Clear previous errors
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔵 Attempting login for:', email);
      
      const success = await signIn(email, password, 'user');
      
      if (!success) {
        console.log('❌ Login failed');
        setError('Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Login successful, checking user data...');
      
      const storedUserData = await AsyncStorage.getItem("user");
      if (!storedUserData) {
        setLoading(false);
        setError('Something went wrong. Please try again.');
        return;
      }

      const storedUser = JSON.parse(storedUserData);
      const userRole = storedUser?.role;

      console.log('✅ User role:', userRole);

      if (userRole === 'user') {
        setLoading(false);
        console.log('✅ Redirecting to user home...');
        return router.push('/user-home');
      }

      if (userRole === 'staff') {
        setError('Staff members should use the web application to access admin features.');
        setLoading(false);
        return;
      }

      if (userRole === 'admin') {
        setError('Administrators should use the web application to access admin features.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setError('Invalid account type.');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      
      // Handle specific error messages
      if (errorMessage.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (errorMessage.includes('blocked')) {
        setError('Your account has been blocked. Please contact support.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Login failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.appTitle}>Student-Led-Initiative</Text>
            <Text style={styles.tagline}>Supporting patients in their time of need</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your account</Text>

            <View style={styles.formContainer}>
              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(''); // Clear error when typing
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  selectionColor="#2196F3"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(''); // Clear error when typing
                    }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    selectionColor="#2196F3"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => router.push('/(auth)/forgotPassword')}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.signupSection}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/signup')}
                  disabled={loading}
                >
                  <Text style={styles.signupLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustText}>Secure & Encrypted</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>✓</Text>
              <Text style={styles.trustText}>HIPAA Compliant</Text>
            </View>
          </View>

          <Text style={styles.footer}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    gap: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustIcon: {
    fontSize: 16,
  },
  trustText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 40,
    lineHeight: 16,
  },
});