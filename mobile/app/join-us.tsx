import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ✅ USE YOUR EXISTING API CLIENT (instead of axios directly)
import { joinRequestAPI } from '@/shared/services/api';

// Import colleges from shared constants
import { colleges } from '@/shared/constants/colleges';

export default function JoinUs() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [nonTechOption, setNonTechOption] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [roll, setRoll] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [collegesList, setCollegesList] = useState<string[]>([]);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [filteredColleges, setFilteredColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showCollegePicker, setShowCollegePicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showJobRolePicker, setShowJobRolePicker] = useState(false);

  const departments = ['Technical', 'Non-Technical'];
  const technicalRoles = [
    'Web Developer',
    'App Developer',
    'UI/UX Designer',
    'Data Handler',
    'Tech Support',
  ];
  const nonTechnicalRoles = [
    'Event Management',
    'Social Media Handle',
    'Content Creator',
  ];
  const jobRoles = [
    'Mentor',
    'Event Volunteer',
    'Fundraiser',
    'Sponsor Outreach',
    'Medical Outreach',
    'Technical Support',
    'Creative Support',
    'Community Outreach',
  ];

  useEffect(() => {
    const sortedColleges = [...colleges].sort((a, b) => a.localeCompare(b));
    setCollegesList([...sortedColleges, 'Other (Not Listed)']);
    setFilteredColleges([...sortedColleges, 'Other (Not Listed)']);
  }, []);

  useEffect(() => {
    if (collegeSearchQuery.trim() === '') {
      setFilteredColleges(collegesList);
    } else {
      const filtered = collegesList.filter(college =>
        college.toLowerCase().includes(collegeSearchQuery.toLowerCase())
      );
      setFilteredColleges(filtered);
    }
  }, [collegeSearchQuery, collegesList]);

  const handleClose = () => {
    router.back();
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setStep(2);
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ UPDATED: Use existing API client
  const handleSubmit = async () => {
    // Validation
    if (role === 'Student') {
      if (!name || !email || !department || !college || !roll || !nonTechOption) {
        Alert.alert('Error', 'Please fill all the required fields');
        return;
      }
    } else if (role === 'Job') {
      if (!name || !email || !jobRole) {
        Alert.alert('Error', 'Please fill all the required fields');
        return;
      }
    }

    // Email validation
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const formData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: role === 'Student' ? department : 'N/A',
        college: role === 'Student' ? college : 'N/A',
        rollNumber: role === 'Student' ? roll.trim() : 'N/A',
        specificRole: role === 'Student' ? nonTechOption : jobRole,
      };

      console.log('📤 Submitting join request:', formData);

      // ✅ USE YOUR EXISTING API CLIENT (handles all the config automatically)
      const response = await joinRequestAPI.create(formData);

      console.log('✅ Response:', response.data);

      setLoading(false);

      Alert.alert(
        'Success! 🎉',
        response.data?.message || 'Your application has been submitted successfully. Check your email for confirmation!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setName('');
              setEmail('');
              setDepartment('');
              setCollege('');
              setRoll('');
              setJobRole('');
              setNonTechOption('');
              setStep(1);
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Error submitting join request:', error);

      let errorMessage = 'Failed to submit application. Please try again.';

      if (error.response?.data?.message) {
        // Use server's error message
        errorMessage = error.response.data.message;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your internet connection and ensure the server is running.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const PickerModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    onSelect,
    showSearch = false,
    searchQuery = '',
    onSearchChange
  }: { 
    visible: boolean; 
    onClose: () => void; 
    title: string; 
    options: string[]; 
    onSelect: (value: string) => void;
    showSearch?: boolean;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
  }) => (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.pickerCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          {showSearch && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder="Search colleges..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => onSearchChange?.('')}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <ScrollView style={styles.pickerScrollView}>
            {options.length > 0 ? (
              options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.pickerItem}
                  onPress={() => {
                    onSelect(option);
                    if (showSearch) {
                      onSearchChange?.('');
                    }
                    onClose();
                  }}
                >
                  <Text style={styles.pickerItemText}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No colleges found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {step === 1 && (
            <View style={styles.selectionScreen}>
              <View style={styles.iconContainer}>
                <Text style={styles.mainIcon}>❤️</Text>
              </View>

              <Text style={styles.mainTitle}>Join Our Mission</Text>
              <View style={styles.divider} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Choose your category to continue</Text>
              </View>

              <View style={styles.roleCards}>
                <TouchableOpacity
                  style={styles.roleCard}
                  onPress={() => handleRoleSelect('Student')}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleIconContainer}>
                    <Text style={styles.roleIcon}>🎓</Text>
                  </View>
                  <Text style={styles.roleTitle}>I'm a Student</Text>
                  <Text style={styles.roleDescription}>
                    Currently enrolled in a college or university
                  </Text>
                  <View style={styles.roleButton}>
                    <Text style={styles.roleButtonText}>Select</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roleCard}
                  onPress={() => handleRoleSelect('Job')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconContainer, styles.roleIconProfessional]}>
                    <Text style={styles.roleIcon}>💼</Text>
                  </View>
                  <Text style={styles.roleTitle}>I'm a Working Professional</Text>
                  <Text style={styles.roleDescription}>
                    Working professional or other donor
                  </Text>
                  <View style={[styles.roleButton, styles.roleButtonProfessional]}>
                    <Text style={styles.roleButtonText}>Select</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.formScreen}>
              <Text style={styles.formTitle}>
                {role === 'Student' ? 'Student Details' : 'Professional Details'}
              </Text>

              {role === 'Student' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Department *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowDepartmentPicker(true)}
                      disabled={loading}
                    >
                      <Text style={department ? styles.selectorTextSelected : styles.selectorText}>
                        {department || 'Select Department'}
                      </Text>
                      <Text style={styles.selectorArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {department && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        {department === 'Technical' ? 'Technical Role *' : 'Non-Technical Role *'}
                      </Text>
                      <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowRolePicker(true)}
                        disabled={loading}
                      >
                        <Text style={nonTechOption ? styles.selectorTextSelected : styles.selectorText}>
                          {nonTechOption || 
                            (department === 'Technical' ? 'Select Technical Role' : 'Select Non-Technical Role')
                          }
                        </Text>
                        <Text style={styles.selectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Your Full Name"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Your Email Address"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>College Name *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowCollegePicker(true)}
                      disabled={loading}
                    >
                      <Text style={college ? styles.selectorTextSelected : styles.selectorText}>
                        {college || 'Select your college'}
                      </Text>
                      <Text style={styles.selectorArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Roll Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={roll}
                      onChangeText={setRoll}
                      placeholder="College Roll Number"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                  </View>
                </>
              )}

              {role === 'Job' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Your Full Name"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Your Email Address"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Your Role *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowJobRolePicker(true)}
                      disabled={loading}
                    >
                      <Text style={jobRole ? styles.selectorTextSelected : styles.selectorText}>
                        {jobRole || 'Select Your Role'}
                      </Text>
                      <Text style={styles.selectorArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>♥ SUBMIT APPLICATION</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <PickerModal
        visible={showCollegePicker}
        onClose={() => {
          setShowCollegePicker(false);
          setCollegeSearchQuery('');
        }}
        title="Select Your College"
        options={filteredColleges}
        onSelect={setCollege}
        showSearch={true}
        searchQuery={collegeSearchQuery}
        onSearchChange={setCollegeSearchQuery}
      />
      
      <PickerModal
        visible={showDepartmentPicker}
        onClose={() => setShowDepartmentPicker(false)}
        title="Select Department"
        options={departments}
        onSelect={setDepartment}
      />

      <PickerModal
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title={department === 'Technical' ? 'Select Technical Role' : 'Select Non-Technical Role'}
        options={department === 'Technical' ? technicalRoles : nonTechnicalRoles}
        onSelect={setNonTechOption}
      />

      <PickerModal
        visible={showJobRolePicker}
        onClose={() => setShowJobRolePicker(false)}
        title="Select Your Role"
        options={jobRoles}
        onSelect={setJobRole}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a5f',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    minHeight: 600,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#666',
  },
  selectionScreen: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#667eea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainIcon: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#667eea',
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 3,
    backgroundColor: '#667eea',
    marginVertical: 16,
    opacity: 0.3,
  },
  badge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 30,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  roleCards: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#667eea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIconProfessional: {
    backgroundColor: '#f093fb',
  },
  roleIcon: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleButton: {
    width: '100%',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonProfessional: {
    backgroundColor: '#f093fb',
  },
  roleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formScreen: {
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  selector: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectorTextSelected: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pickerCloseText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#666',
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});