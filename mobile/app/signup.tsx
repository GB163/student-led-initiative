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
import { authAPI } from '../shared/services/api'; // ✅ Use API service

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength checker
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return 'Weak';
    if (pwd.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/)) return 'Strong';
    return 'Medium';
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(getPasswordStrength(pwd));
  };

  // ✅ FIXED: Better error handling and using authAPI
  const handleSubmit = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength === 'Weak') {
      setError('Please use a stronger password (at least 6 characters).');
      return;
    }

    setLoading(true);

    try {
      console.log('🔵 Attempting signup for:', email);
      
      // ✅ Use authAPI instead of fetch
      const data = await authAPI.signUp({
        name,
        email,
        password,
        role: 'user',
      });

      console.log('✅ Signup successful:', data);
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPasswordStrength('');
      
      // Show success message
      setSuccess('✅ Account created successfully! Redirecting to login...');
      setLoading(false);
      
      // Show Alert
      Alert.alert(
        '✅ Success!',
        'Your account has been created successfully. Please sign in with your credentials.',
        [
          {
            text: 'Sign In Now',
            onPress: () => {
              console.log('✅ Navigating to login');
              router.replace('/login');
            },
          },
        ],
        { cancelable: false }
      );
      
      // Auto redirect after 2 seconds if Alert is dismissed
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Sign up error:', err);
      
      // ✅ Extract proper error message
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Handle specific error messages
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else if (errorMessage.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage.includes('Password')) {
        setError('Password must be at least 6 characters long.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(errorMessage || 'Registration failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 'Strong') return '#4CAF50';
    if (passwordStrength === 'Medium') return '#FF9800';
    return '#F44336';
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

          {/* Sign Up Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to access medical support</Text>

            <View style={styles.formContainer}>
              {/* Success Message */}
              {success ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError(''); // Clear error when typing
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                  selectionColor="#2196F3"
                />
              </View>

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
                <Text style={styles.label}>Create Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => {
                      handlePasswordChange(text);
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
                    placeholder="Re-enter your password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError(''); // Clear error when typing
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
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
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.signinSection}>
                <Text style={styles.signinText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  disabled={loading}
                >
                  <Text style={styles.signinLink}>Sign In</Text>
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
            By creating an account, you agree to our Terms of Service and Privacy Policy
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
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
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
  signinSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    color: '#666',
  },
  signinLink: {
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