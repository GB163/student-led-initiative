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
import { router } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../shared/constants/config';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { 
          email,
          platform: 'mobile'
        },
        {
          headers: {
            'x-platform': 'mobile'
          }
        }
      );

      if (response.status === 200) {
        setSuccessMessage('Password reset link sent successfully! Check your email.');
        setLoading(false);
        
        Alert.alert(
          'Success',
          'Password reset link sent to your email! Please check your inbox and click the link to reset your password.',
          [
            {
              text: 'OK',
              onPress: () => {
                setTimeout(() => {
                  router.replace('/login');
                }, 1000);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error sending password reset email', error);
      const errorMessage =
        error.response?.data?.message ||
        'There was an issue sending the reset link. Please try again.';
      
      Alert.alert('Error', errorMessage);
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
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.appTitle}>Student-Led-Initiative</Text>
            <Text style={styles.tagline}>Supporting patients in their time of need</Text>
          </View>

          {/* Forgot Password Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={styles.formContainer}>
              {successMessage ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  selectionColor="#2196F3"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpIcon}>💡</Text>
            <Text style={styles.helpText}>
              Check your spam folder if you don't receive the email within a few minutes.
            </Text>
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
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successIcon: {
    fontSize: 24,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: '700',
  },
  successText: {
    flex: 1,
    color: '#2E7D32',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
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
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  helpIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  helpText: {
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