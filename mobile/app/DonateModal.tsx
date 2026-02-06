import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Import colleges from your colleges data file
import { colleges as collegesList } from '../shared/constants/colleges';

type Step = 'select' | 'student' | 'professional';

export default function DonateModal() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [colleges, setColleges] = useState<string[]>([]);
  
  // New states for searchable college dropdown
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [filteredColleges, setFilteredColleges] = useState<string[]>([]);

  const studentAmount = 600;
  const professionalQuickAmounts = [500, 1000, 2500, 5000];

  useEffect(() => {
    const sortedColleges = [...collegesList].sort((a, b) => a.localeCompare(b));
    setColleges([...sortedColleges, 'Other (Not Listed)']);
    setFilteredColleges([...sortedColleges, 'Other (Not Listed)']);
  }, []);

  // Filter colleges based on search
  useEffect(() => {
    if (collegeSearch.trim() === '') {
      const sortedColleges = [...collegesList].sort((a, b) => a.localeCompare(b));
      setFilteredColleges([...sortedColleges, 'Other (Not Listed)']);
    } else {
      const filtered = colleges.filter((college) =>
        college.toLowerCase().includes(collegeSearch.toLowerCase())
      );
      setFilteredColleges(filtered);
    }
  }, [collegeSearch, colleges]);

  const handleQuickAmount = (amt: number) => {
    setSelectedAmount(amt);
    setAmount(amt.toString());
  };

  const handleCustomAmount = (value: string) => {
    setAmount(value);
    setSelectedAmount(null);
  };

  const handleStudentSelect = () => {
    setStep('student');
    setAmount(studentAmount.toString());
    setSelectedAmount(studentAmount);
  };

  const handleCollegeSelect = (college: string) => {
    setCollegeName(college);
    setShowCollegeModal(false);
    setCollegeSearch('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || name.trim() === '') {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }

    if (!email || email.trim() === '' || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (step === 'student') {
      if (!collegeName || collegeName === 'Select your college') {
        Alert.alert('Missing Information', 'Please select your college');
        return;
      }
      if (!rollNumber || rollNumber.trim() === '') {
        Alert.alert('Missing Information', 'Please enter your roll number');
        return;
      }
      if (parseFloat(amount) !== studentAmount) {
        Alert.alert('Invalid Amount', `Student donation must be ₹${studentAmount} (Yearly)`);
        return;
      }
    }

    if (step === 'professional') {
      if (!amount || parseFloat(amount) < 500) {
        Alert.alert('Invalid Amount', 'Professional donation must be at least ₹500');
        return;
      }
    }

    setLoading(true);

    try {
      const donationData: {
        name: string;
        email: string;
        phone: string;
        amount: string;
        role: string;
        donationType: string;
        collegeName?: string;
        rollNumber?: string;
      } = {
        name,
        email,
        phone: phone || '9999999999',
        amount,
        role: step === 'student' ? 'student' : 'professional',
        donationType: step === 'student' ? 'yearly' : 'one-time',
      };

      if (step === 'student') {
        donationData.collegeName = collegeName;
        donationData.rollNumber = rollNumber;
      }

      // Create PayU order
      const orderRes = await axios.post(
        'http://localhost:5000/api/donations/create-order',
        donationData
      );

      const payuData = orderRes.data;

      if (!payuData.success) {
        Alert.alert('Payment Error', payuData.message || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      // TODO: Integrate React Native payment gateway (PayU SDK or WebView)
      Alert.alert(
        'Payment Gateway',
        'Payment gateway integration pending. In production, this would redirect to PayU.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      setLoading(false);
    } catch (err) {
      console.error('PayU order creation failed:', err);
      const error = err as { response?: { data?: { message?: string } } };
      Alert.alert(
        'Payment Error',
        error.response?.data?.message || 'Failed to initialize payment. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make a Donation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Selection Screen */}
        {step === 'select' && (
          <View style={styles.selectionScreen}>
            <View style={styles.hero}>
              <Text style={styles.heroIcon}>💜</Text>
              <Text style={styles.heroTitle}>Make a Donation</Text>
              <Text style={styles.heroSubtitle}>Choose your category to continue</Text>
            </View>

            <View style={styles.selectionCards}>
              <TouchableOpacity
                style={styles.selectionCard}
                onPress={handleStudentSelect}
                activeOpacity={0.8}
              >
                <Text style={styles.cardIcon}>🎓</Text>
                <Text style={styles.cardTitle}>I'm a Student</Text>
                <Text style={styles.cardDescription}>₹600 yearly contribution</Text>
                <View style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Select</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectionCard}
                onPress={() => setStep('professional')}
                activeOpacity={0.8}
              >
                <Text style={styles.cardIcon}>💼</Text>
                <Text style={styles.cardTitle}>I'm a Working Professional</Text>
                <Text style={styles.cardDescription}>
                  Starting from ₹500 (One-time)
                </Text>
                <View style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Select</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Student Form */}
        {step === 'student' && (
          <View style={styles.formScreen}>
            <View style={styles.formHeader}>
              <Text style={styles.formIcon}>🎓</Text>
              <Text style={styles.formTitle}>Student Yearly Donation</Text>
              <Text style={styles.formSubtitle}>
                ₹600 yearly contribution - Making a lasting impact together
              </Text>
            </View>

            <View style={styles.form}>
              {/* Fixed Amount Display */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Donation Amount (Fixed for Students)</Text>
                <View style={styles.studentAmountBox}>
                  <Text style={styles.studentAmountText}>
                    ₹600 <Text style={styles.perYearText}>per year</Text>
                  </Text>
                </View>
                <Text style={styles.helpText}>
                  This yearly contribution helps us plan sustainable support for children in need
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8A92A0"
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#8A92A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#8A92A0"
                  keyboardType="phone-pad"
                />
              </View>

              {/* College - Now with searchable dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>College Name</Text>
                <TouchableOpacity
                  style={styles.collegeSelectButton}
                  onPress={() => setShowCollegeModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.collegeSelectText,
                    !collegeName && styles.collegePlaceholder
                  ]}>
                    {collegeName || 'Select your college'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Roll Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Roll Number / Student ID</Text>
                <TextInput
                  style={styles.input}
                  value={rollNumber}
                  onChangeText={setRollNumber}
                  placeholder="Enter your roll number"
                  placeholderTextColor="#8A92A0"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Donate ₹600</Text>
                )}
              </TouchableOpacity>

              <View style={styles.securityNote}>
                <Text style={styles.securityIcon}>🔒</Text>
                <Text style={styles.securityText}>Secure payment powered by PayU</Text>
              </View>
            </View>
          </View>
        )}

        {/* Professional Form */}
        {step === 'professional' && (
          <View style={styles.formScreen}>
            <View style={styles.formHeader}>
              <Text style={styles.formIcon}>💼</Text>
              <Text style={styles.formTitle}>Make a Donation</Text>
              <Text style={styles.formSubtitle}>
                One-time contribution starting from ₹500
              </Text>
            </View>

            <View style={styles.form}>
              {/* Amount Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Amount (Minimum ₹500)</Text>
                <View style={styles.amountGrid}>
                  {professionalQuickAmounts.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.amountButton,
                        selectedAmount === amt && styles.amountButtonActive,
                      ]}
                      onPress={() => handleQuickAmount(amt)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.amountButtonText,
                          selectedAmount === amt && styles.amountButtonTextActive,
                        ]}
                      >
                        ₹{amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Or Enter Custom Amount</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.inputWithSymbol}
                    value={amount}
                    onChangeText={handleCustomAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#8A92A0"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8A92A0"
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#8A92A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#8A92A0"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Complete Donation</Text>
                )}
              </TouchableOpacity>

              <View style={styles.securityNote}>
                <Text style={styles.securityIcon}>🔒</Text>
                <Text style={styles.securityText}>Secure payment powered by PayU</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* College Search Modal */}
      <Modal
        visible={showCollegeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCollegeModal(false)}
      >
        <View style={styles.collegeModalOverlay}>
          <View style={styles.collegeModalContent}>
            {/* Header */}
            <View style={styles.collegeModalHeader}>
              <Text style={styles.collegeModalTitle}>Select College</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCollegeModal(false);
                  setCollegeSearch('');
                }}
                style={styles.collegeCloseButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.collegeSearchContainer}>
              <Text style={styles.searchIconText}>🔍</Text>
              <TextInput
                style={styles.collegeSearchInput}
                placeholder="Type to search colleges..."
                placeholderTextColor="#8A92A0"
                value={collegeSearch}
                onChangeText={setCollegeSearch}
                autoFocus={true}
              />
              {collegeSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCollegeSearch('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* College List */}
            <ScrollView style={styles.collegeListScroll}>
              {filteredColleges.map((college, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.collegeListItem,
                    collegeName === college && styles.selectedCollegeItem
                  ]}
                  onPress={() => handleCollegeSelect(college)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.collegeListItemText,
                    collegeName === college && styles.selectedCollegeText
                  ]}>
                    {college}
                  </Text>
                  {collegeName === college && (
                    <Text style={styles.checkmarkText}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              {filteredColleges.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No colleges found matching "{collegeSearch}"
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#5A6270',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Selection Screen
  selectionScreen: {
    paddingTop: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#5A6270',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectionCards: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  selectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E8ECEF',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#5A6270',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Form Screen
  formScreen: {
    paddingTop: 20,
  },
  formHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  formIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#5A6270',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F36',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E8ECEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1F36',
  },
  studentAmountBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF3B30',
    paddingVertical: 16,
    alignItems: 'center',
  },
  studentAmountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF3B30',
  },
  perYearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6270',
  },
  helpText: {
    fontSize: 12,
    color: '#8A92A0',
    marginTop: 8,
    lineHeight: 18,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8ECEF',
    alignItems: 'center',
  },
  amountButtonActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  amountButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A6270',
  },
  amountButtonTextActive: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E8ECEF',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
    marginRight: 8,
  },
  inputWithSymbol: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1F36',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 13,
    color: '#8A92A0',
    fontWeight: '500',
  },
  footer: {
    height: 40,
  },

  // College Searchable Dropdown Styles
  collegeSelectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E8ECEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collegeSelectText: {
    fontSize: 15,
    color: '#1A1F36',
    flex: 1,
  },
  collegePlaceholder: {
    color: '#8A92A0',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#5A6270',
  },
  collegeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  collegeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  collegeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  collegeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  collegeCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E8ECEF',
  },
  searchIconText: {
    fontSize: 16,
    marginRight: 8,
  },
  collegeSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1F36',
  },
  clearSearchText: {
    fontSize: 16,
    color: '#8A92A0',
    paddingHorizontal: 8,
  },
  collegeListScroll: {
    maxHeight: 400,
  },
  collegeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  selectedCollegeItem: {
    backgroundColor: '#FFF5F5',
  },
  collegeListItemText: {
    fontSize: 15,
    color: '#1A1F36',
    flex: 1,
  },
  selectedCollegeText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  checkmarkText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '700',
    marginLeft: 8,
  },
  noResultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#8A92A0',
    textAlign: 'center',
  },
});