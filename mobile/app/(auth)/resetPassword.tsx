// app/(auth)/resetPassword.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../shared/constants/config';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('🔐 Reset Password Screen loaded');
    console.log('🎫 Token:', token ? 'Present' : 'Missing');
    console.log('📍 Full token:', token);
    
    if (!token) {
      Alert.alert(
        'Error',
        'Invalid reset link. Please request a new password reset.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  }, [token]);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return 'Weak';
    if (pwd.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/)) return 'Strong';
    return 'Medium';
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(getPasswordStrength(pwd));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 'Strong') return '#4CAF50';
    if (passwordStrength === 'Medium') return '#FF9800';
    return '#F44336';
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleResetPassword = async () => {
    console.log('🔐 Starting password reset process...');
    console.log('📍 Token:', token);
    console.log('📍 API Base URL:', API_BASE_URL);
    
    if (!token) {
      Alert.alert('Error', 'Invalid reset link');
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // ⭐ FIXED: Include token in URL path AND send newPassword in body
      const requestData = {
        newPassword: password  // Backend expects "newPassword"
      };

      // ⭐ CRITICAL FIX: Token must be in the URL path
      const url = `${API_BASE_URL}/api/auth/reset-password/${token}`;
      
      console.log('📤 Sending request to:', url);
      console.log('📦 Request data:', { newPassword: 'present' });

      const response = await axios.post(
        url,  // ⭐ Token is now in the URL
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('✅ Response received:', response.data);
      console.log('✅ Response status:', response.status);
      console.log('✅ Success flag:', response.data.success);

      if (response.data.success) {
        // ✅ Success! Clear form and show success message
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
        
        Alert.alert(
          '🎉 Success!',
          'Your password has been updated successfully! You can now login with your new password.',
          [
            {
              text: 'Login Now',
              onPress: () => {
                console.log('✅ Navigating to login screen...');
                router.replace('/login');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        setLoading(false);
        Alert.alert('Error', response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Error resetting password:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }

      Alert.alert('Error', errorMessage);
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
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.appTitle}>Student-Led-Initiative</Text>
            <Text style={styles.tagline}>Supporting patients in their time of need</Text>
          </View>

          {/* Reset Password Card */}
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>
            <Text style={styles.welcomeText}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below. Make sure it's strong and secure.
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    autoCapitalize="none"
                    autoCorrect={false}
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
                {password ? (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthBarFill, 
                          { 
                            width: passwordStrength === 'Strong' ? '100%' : passwordStrength === 'Medium' ? '60%' : '30%',
                            backgroundColor: getPasswordStrengthColor()
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                      {passwordStrength}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#2196F3"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {confirmPassword && password !== confirmPassword ? (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                ) : null}
                {confirmPassword && password === confirmPassword ? (
                  <Text style={styles.successText}>✓ Passwords match</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.buttonText, { marginLeft: 10 }]}>Resetting Password...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace('/login')}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>At least 6 characters long</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>Mix of uppercase & lowercase letters (recommended)</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>Include numbers & special characters (recommended)</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 48,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
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
  passwordStrengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: '600',
  },
  requirementsSection: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementBullet: {
    fontSize: 16,
    color: '#2196F3',
    marginRight: 8,
    marginTop: -2,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
});