// app/medical-application-form.tsx
// Unified page: Shows form OR status based on user's application state
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { API_BASE_URL } from '../shared/constants/config';
import { medicalAPI } from '../shared/services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface Application {
  _id: string;
  status: string;
  patientName: string;
  applicantName?: string;
  staffName?: string;
  relation: string;
  hospital: string;
  totalCost: string | number;
  diagnosis: string;
  note?: string;
  declaration?: string;
  applicantId?: string;
  staffId?: string;
  incomeProof?: string;
  photo?: string;
  hospitalBill?: string;
  reports?: string[];
}

interface FormData {
  applicantName: string;
  email: string;
  patientName: string;
  age: string;
  relation: string;
  bloodGroup: string;
  phone: string;
  adharCard: string;
  diagnosis: string;
  hospital: string;
  doctorName: string;
  totalCost: string;
}

interface DocumentFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface Documents {
  declaration: DocumentFile | null;
  applicantId: DocumentFile | null;
  incomeProof: DocumentFile | null;
  photo: ImagePicker.ImagePickerAsset | null;
  hospitalBill: DocumentFile | null;
  reports: DocumentFile[];
}

interface Errors {
  [key: string]: string | null;
}

export default function MedicalApplicationForm() {
  const [pageMode, setPageMode] = useState<'loading' | 'education' | 'form' | 'status'>('loading');
  const [application, setApplication] = useState<Application | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    applicantName: '',
    email: '',
    patientName: '',
    age: '',
    relation: '',
    bloodGroup: '',
    phone: '',
    adharCard: '',
    diagnosis: '',
    hospital: '',
    doctorName: '',
    totalCost: '',
  });

  const [documents, setDocuments] = useState<Documents>({
    declaration: null,
    applicantId: null,
    incomeProof: null,
    photo: null,
    hospitalBill: null,
    reports: [],
  });

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      console.log('🔍 Checking for existing application...');
      const response = await medicalAPI.getMyApplications();
      
      if (response.data.hasApplication && response.data.application) {
        const app = response.data.application;
        console.log('✅ Found active application:', app._id, '- Status:', app.status);
        setApplication(app);
        setPageMode('status');
      } else {
        console.log('ℹ️ No active application - showing education');
        setPageMode('education');
      }
    } catch (error: any) {
      console.error('❌ Error checking application:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.push('/login' as any);
      } else {
        setPageMode('education');
      }
    }
  };

  useEffect(() => {
    if (pageMode === 'status' && application) {
      const interval = setInterval(async () => {
        try {
          const response = await medicalAPI.getMyApplications();
          if (response.data.hasApplication && response.data.application) {
            setApplication(response.data.application);
            console.log('🔄 Status refreshed:', response.data.application.status);
          }
        } catch (error) {
          console.error('Error refreshing status:', error);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [pageMode, application]);

  useEffect(() => {
    if (application && ['approved', 'rejected'].includes(application.status.toLowerCase())) {
      console.log('⏱️ Final status - starting countdown');
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setApplication(null);
            setPageMode('education');
            setCountdown(10);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [application?.status]);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const pickDocument = async (type: keyof Omit<Documents, 'photo' | 'reports'> | 'reports') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert('Error', 'File size exceeds 10MB limit');
        return;
      }
      if (type === 'reports') {
        setDocuments(prev => ({ ...prev, reports: [...prev.reports, file as DocumentFile] }));
      } else {
        setDocuments(prev => ({ ...prev, [type]: file as DocumentFile }));
      }
      setErrors(prev => ({ ...prev, [type]: null }));
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled) {
        setDocuments(prev => ({ ...prev, photo: result.assets[0] }));
        setErrors(prev => ({ ...prev, photo: null }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeReport = (index: number) => {
    setDocuments(prev => ({ ...prev, reports: prev.reports.filter((_, i) => i !== index) }));
  };

  const downloadDeclarationForm = async () => {
    try {
      Alert.alert('Preparing', 'Please wait...');
      const asset = Asset.fromModule(require('../assets/declaration_form.pdf'));
      await asset.downloadAsync();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && asset.localUri) {
        await Sharing.shareAsync(asset.localUri, { mimeType: 'application/pdf', dialogTitle: 'Declaration Form' });
        Alert.alert('Success', 'Declaration form is ready!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access declaration form');
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    const fields: (keyof FormData)[] = ['applicantName', 'email', 'patientName', 'age', 'relation', 'bloodGroup', 'phone', 'adharCard', 'diagnosis', 'hospital', 'doctorName', 'totalCost'];
    fields.forEach(f => { if (!formData[f]?.trim()) newErrors[f] = 'Required'; });
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!documents.declaration) newErrors.declaration = 'Required';
    if (!documents.applicantId) newErrors.applicantId = 'Required';
    if (!documents.incomeProof) newErrors.incomeProof = 'Required';
    if (!documents.photo) newErrors.photo = 'Required';
    if (!documents.hospitalBill) newErrors.hospitalBill = 'Required';
    if (!confirmChecked) newErrors.confirm = 'You must confirm';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
      formDataToSend.append('role', 'user');
      if (documents.declaration) formDataToSend.append('declaration', { uri: documents.declaration.uri, type: 'application/pdf', name: documents.declaration.name } as any);
      if (documents.applicantId) formDataToSend.append('applicantId', { uri: documents.applicantId.uri, type: 'application/pdf', name: documents.applicantId.name } as any);
      if (documents.incomeProof) formDataToSend.append('incomeProof', { uri: documents.incomeProof.uri, type: 'application/pdf', name: documents.incomeProof.name } as any);
      if (documents.photo) formDataToSend.append('photo', { uri: documents.photo.uri, type: 'image/jpeg', name: 'patient_photo.jpg' } as any);
      if (documents.hospitalBill) formDataToSend.append('hospitalBill', { uri: documents.hospitalBill.uri, type: 'application/pdf', name: documents.hospitalBill.name } as any);
      documents.reports.forEach((r, i) => formDataToSend.append('reports', { uri: r.uri, type: 'application/pdf', name: r.name || `report_${i + 1}.pdf` } as any));
      
      await medicalAPI.applyForSupport(formDataToSend);
      Alert.alert('Success! 🎉', 'Your application has been submitted!', [{ text: 'OK' }]);
      await checkExistingApplication();
    } catch (error: any) {
      let msg = 'Failed to submit application';
      if (error.response?.status === 401) {
        msg = 'Please login again';
        setTimeout(() => router.push('/login' as any), 2000);
      }
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = async (url?: string) => {
    if (!url) return Alert.alert('Error', 'No document available');
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      const ok = await Linking.canOpenURL(fullUrl);
      if (ok) await Linking.openURL(fullUrl);
      else Alert.alert('Error', 'Cannot open document');
    } catch (err) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const getStatusColor = (s: string) => {
    const status = s.toLowerCase();
    if (status === 'pending') return '#f59e0b';
    if (status === 'verified' || status === 'under review') return '#3b82f6';
    if (status === 'approved') return '#10b981';
    if (status === 'rejected') return '#ef4444';
    return '#6b7280';
  };

  const getStatusIcon = (s: string) => {
    const status = s.toLowerCase();
    if (status === 'pending') return '⏳';
    if (status === 'verified') return '✓';
    if (status === 'under review') return '🔍';
    if (status === 'approved') return '✅';
    if (status === 'rejected') return '❌';
    return '📋';
  };

  if (pageMode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Checking application status...</Text>
      </View>
    );
  }

  if (pageMode === 'status' && application) {
    const isFinal = ['approved', 'rejected'].includes(application.status.toLowerCase());
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Medical Support Application</Text>
          <Text style={styles.subtitle}>ID: {application._id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <Text style={styles.statusText}>{getStatusIcon(application.status)} {application.status.toUpperCase()}</Text>
          </View>
          {isFinal && (
            <View style={styles.redirectNotice}>
              <Text style={styles.redirectText}>⏱️ Redirecting in {countdown} seconds...</Text>
              <TouchableOpacity style={styles.cancelRedirectButton} onPress={() => { setApplication(null); setPageMode('education'); setCountdown(10); }}>
                <Text style={styles.cancelRedirectText}>Apply Again Now</Text>
              </TouchableOpacity>
            </View>
          )}
          {application.status.toLowerCase() === 'pending' && (
            <View style={styles.infoBox}><Text style={styles.infoText}>ℹ️ Your application is being reviewed.</Text></View>
          )}
          {application.status.toLowerCase() === 'verified' && (
            <View style={styles.successBox}><Text style={styles.successText}>✓ Verified! Awaiting admin approval.</Text></View>
          )}
          {application.status.toLowerCase() === 'approved' && (
            <View style={styles.successBox}><Text style={styles.successText}>🎉 Approved! Check your email for the medical card.</Text></View>
          )}
          {application.status.toLowerCase() === 'rejected' && (
            <View style={styles.errorBox}><Text style={styles.errorBoxText}>❌ Application not approved. Check note below.</Text></View>
          )}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Application Details</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Patient:</Text><Text style={styles.detailValue}>{application.patientName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Applied by:</Text><Text style={styles.detailValue}>{application.applicantName || application.staffName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Relation:</Text><Text style={styles.detailValue}>{application.relation}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Hospital:</Text><Text style={styles.detailValue}>{application.hospital}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Cost:</Text><Text style={styles.detailValue}>₹{application.totalCost}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Diagnosis:</Text><Text style={styles.detailValue}>{application.diagnosis}</Text></View>
            {application.note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>📝 Note:</Text>
                <Text style={styles.noteText}>{application.note}</Text>
              </View>
            )}
          </View>
          <View style={styles.documentsCard}>
            <Text style={styles.sectionTitle}>Documents</Text>
            {application.declaration && <TouchableOpacity style={styles.documentButton} onPress={() => openDocument(application.declaration)}><Text style={styles.documentButtonText}>📄 Declaration Form</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>}
            {application.applicantId && <TouchableOpacity style={styles.documentButton} onPress={() => openDocument(application.applicantId)}><Text style={styles.documentButtonText}>📄 Applicant ID</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>}
            {application.incomeProof && <TouchableOpacity style={styles.documentButton} onPress={() => openDocument(application.incomeProof)}><Text style={styles.documentButtonText}>📄 Income Proof</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>}
            {application.photo && <TouchableOpacity style={styles.documentButton} onPress={() => openDocument(application.photo)}><Text style={styles.documentButtonText}>🖼️ Patient Photo</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>}
            {application.hospitalBill && <TouchableOpacity style={styles.documentButton} onPress={() => openDocument(application.hospitalBill)}><Text style={styles.documentButtonText}>📄 Hospital Bill</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>}
            {application.reports?.map((r, i) => <TouchableOpacity key={i} style={styles.documentButton} onPress={() => openDocument(r)}><Text style={styles.documentButtonText}>📄 Report {i + 1}</Text><Text style={styles.documentArrow}>→</Text></TouchableOpacity>)}
          </View>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/user-home' as any)}><Text style={styles.homeButtonText}>← Back to Home</Text></TouchableOpacity>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    );
  }

  if (pageMode === 'education') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>📋 Before You Apply</Text>
          <Text style={styles.subtitle}>Please read carefully and prepare required documents</Text>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitleEdu}>✅ What You'll Need</Text>
            <View style={styles.requirementCard}>
              <Text style={styles.requirementTitle}>📄 Personal Documents</Text>
              <Text style={styles.requirementItem}>• Full name and contact details</Text>
              <Text style={styles.requirementItem}>• Valid email and phone</Text>
              <Text style={styles.requirementItem}>• Aadhar card number</Text>
              <Text style={styles.requirementItem}>• ID proof (PDF)</Text>
              <Text style={styles.requirementItem}>• Income proof (PDF)</Text>
            </View>
            <View style={styles.requirementCard}>
              <Text style={styles.requirementTitle}>🏥 Patient Information</Text>
              <Text style={styles.requirementItem}>• Patient name, age, blood group</Text>
              <Text style={styles.requirementItem}>• Your relation to patient</Text>
              <Text style={styles.requirementItem}>• Recent photograph</Text>
              <Text style={styles.requirementItem}>• Medical diagnosis</Text>
            </View>
            <View style={styles.requirementCard}>
              <Text style={styles.requirementTitle}>🏨 Medical Documents</Text>
              <Text style={styles.requirementItem}>• Hospital name and doctor</Text>
              <Text style={styles.requirementItem}>• Hospital bills (PDF)</Text>
              <Text style={styles.requirementItem}>• Medical reports (PDF)</Text>
              <Text style={styles.requirementItem}>• Treatment cost estimate</Text>
            </View>
            <View style={styles.requirementCard}>
              <Text style={styles.requirementTitle}>📝 Declaration Form</Text>
              <Text style={styles.requirementItem}>• Download, fill, and sign</Text>
              <Text style={styles.requirementItem}>• Upload as PDF</Text>
            </View>
          </View>
          <View style={styles.importantSection}>
            <Text style={styles.importantTitle}>⚠️ Important</Text>
            <View style={styles.guidelineCard}>
              <Text style={styles.guidelineItem}>✓ All docs in PDF (except photo)</Text>
              <Text style={styles.guidelineItem}>✓ Max 10MB per file</Text>
              <Text style={styles.guidelineItem}>✓ Ensure accuracy</Text>
            </View>
          </View>
          <View style={styles.timeSection}>
            <Text style={styles.timeTitle}>⏱️ Time Needed</Text>
            <Text style={styles.timeText}>15-20 minutes</Text>
            <Text style={styles.timeSubtext}>Have all documents ready</Text>
          </View>
          <TouchableOpacity style={styles.proceedButton} onPress={() => setPageMode('form')}>
            <Text style={styles.proceedButtonText}>✓ I'm Ready - Proceed</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => setPageMode('education')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apply for Medical Support</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Applicant Name *</Text>
            <TextInput style={[styles.input, errors.applicantName && styles.inputError]} value={formData.applicantName} onChangeText={(v) => handleInputChange('applicantName', v)} placeholder="Your full name" />
            {errors.applicantName && <Text style={styles.errorText}>{errors.applicantName}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput style={[styles.input, errors.email && styles.inputError]} value={formData.email} onChangeText={(v) => handleInputChange('email', v)} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput style={[styles.input, errors.phone && styles.inputError]} value={formData.phone} onChangeText={(v) => handleInputChange('phone', v)} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aadhar *</Text>
            <TextInput style={[styles.input, errors.adharCard && styles.inputError]} value={formData.adharCard} onChangeText={(v) => handleInputChange('adharCard', v)} placeholder="XXXX XXXX XXXX" keyboardType="number-pad" maxLength={12} />
            {errors.adharCard && <Text style={styles.errorText}>{errors.adharCard}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Name *</Text>
            <TextInput style={[styles.input, errors.patientName && styles.inputError]} value={formData.patientName} onChangeText={(v) => handleInputChange('patientName', v)} placeholder="Patient full name" />
            {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput style={[styles.input, errors.age && styles.inputError]} value={formData.age} onChangeText={(v) => handleInputChange('age', v)} placeholder="Age" keyboardType="number-pad" />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relation *</Text>
            <TextInput style={[styles.input, errors.relation && styles.inputError]} value={formData.relation} onChangeText={(v) => handleInputChange('relation', v)} placeholder="e.g., Father, Mother" />
            {errors.relation && <Text style={styles.errorText}>{errors.relation}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group *</Text>
            <TouchableOpacity style={[styles.input, styles.dropdownButton, errors.bloodGroup && styles.inputError]} onPress={() => setShowBloodGroupPicker(true)}>
              <Text style={formData.bloodGroup ? styles.dropdownText : styles.dropdownPlaceholder}>{formData.bloodGroup || 'Select'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
          </View>
        </View>

        <Modal visible={showBloodGroupPicker} transparent animationType="slide" onRequestClose={() => setShowBloodGroupPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Blood Group</Text>
                <TouchableOpacity onPress={() => setShowBloodGroupPicker(false)}><Text style={styles.pickerClose}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView>
                {BLOOD_GROUPS.map((g) => (
                  <TouchableOpacity key={g} style={[styles.pickerOption, formData.bloodGroup === g && styles.pickerOptionSelected]} onPress={() => { handleInputChange('bloodGroup', g); setShowBloodGroupPicker(false); }}>
                    <Text style={[styles.pickerOptionText, formData.bloodGroup === g && styles.pickerOptionTextSelected]}>{g}</Text>
                    {formData.bloodGroup === g && <Text style={styles.pickerCheckmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Info</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diagnosis *</Text>
            <TextInput style={[styles.input, errors.diagnosis && styles.inputError]} value={formData.diagnosis} onChangeText={(v) => handleInputChange('diagnosis', v)} placeholder="Diagnosis" multiline />
            {errors.diagnosis && <Text style={styles.errorText}>{errors.diagnosis}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hospital *</Text>
            <TextInput style={[styles.input, errors.hospital && styles.inputError]} value={formData.hospital} onChangeText={(v) => handleInputChange('hospital', v)} placeholder="Hospital name" />
            {errors.hospital && <Text style={styles.errorText}>{errors.hospital}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doctor *</Text>
            <TextInput style={[styles.input, errors.doctorName && styles.inputError]} value={formData.doctorName} onChangeText={(v) => handleInputChange('doctorName', v)} placeholder="Doctor name" />
            {errors.doctorName && <Text style={styles.errorText}>{errors.doctorName}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cost (₹) *</Text>
            <TextInput style={[styles.input, errors.totalCost && styles.inputError]} value={formData.totalCost} onChangeText={(v) => handleInputChange('totalCost', v)} placeholder="Total cost" keyboardType="number-pad" />
            {errors.totalCost && <Text style={styles.errorText}>{errors.totalCost}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.inputGroup}>
            <View style={styles.declarationHeader}>
              <Text style={styles.label}>Declaration (PDF) *</Text>
              <TouchableOpacity style={styles.downloadButton} onPress={downloadDeclarationForm}><Text style={styles.downloadButtonText}>📥 Download</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument('declaration')}>
              <Text style={styles.fileButtonText}>{documents.declaration ? '✓ ' + documents.declaration.name : 'Choose File'}</Text>
            </TouchableOpacity>
            {errors.declaration && <Text style={styles.errorText}>{errors.declaration}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Applicant ID (PDF) *</Text>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument('applicantId')}>
              <Text style={styles.fileButtonText}>{documents.applicantId ? '✓ ' + documents.applicantId.name : 'Choose File'}</Text>
            </TouchableOpacity>
            {errors.applicantId && <Text style={styles.errorText}>{errors.applicantId}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Income Proof (PDF) *</Text>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument('incomeProof')}>
              <Text style={styles.fileButtonText}>{documents.incomeProof ? '✓ ' + documents.incomeProof.name : 'Choose File'}</Text>
            </TouchableOpacity>
            {errors.incomeProof && <Text style={styles.errorText}>{errors.incomeProof}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Photo *</Text>
            <TouchableOpacity style={styles.fileButton} onPress={pickImage}>
              <Text style={styles.fileButtonText}>{documents.photo ? '✓ Photo Selected' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hospital Bill (PDF) *</Text>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument('hospitalBill')}>
              <Text style={styles.fileButtonText}>{documents.hospitalBill ? '✓ ' + documents.hospitalBill.name : 'Choose File'}</Text>
            </TouchableOpacity>
            {errors.hospitalBill && <Text style={styles.errorText}>{errors.hospitalBill}</Text>}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical Reports (Multiple PDFs)</Text>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument('reports')}>
              <Text style={styles.fileButtonText}>+ Add Report</Text>
            </TouchableOpacity>
            {documents.reports.map((report, index) => (
              <View key={index} style={styles.reportItem}>
                <Text style={styles.reportName}>{report.name}</Text>
                <TouchableOpacity onPress={() => removeReport(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setConfirmChecked(!confirmChecked)}>
            <View style={[styles.checkbox, confirmChecked && styles.checkboxChecked]}>
              {confirmChecked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>I confirm all details are genuine and accurate.</Text>
          </TouchableOpacity>
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </View>

        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Application</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a202c', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4a5568', marginBottom: 24 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  statusText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  redirectNotice: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 16 },
  redirectText: { color: '#92400e', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  cancelRedirectButton: { alignSelf: 'center', paddingVertical: 4 },
  cancelRedirectText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  infoBox: { backgroundColor: '#dbeafe', padding: 12, borderRadius: 8, marginBottom: 16 },
  infoText: { color: '#1e40af', fontSize: 14 },
  successBox: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 8, marginBottom: 16 },
  successText: { color: '#065f46', fontSize: 14 },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBoxText: { color: '#991b1b', fontSize: 14 },
  detailsCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap' },
  detailLabel: { fontSize: 15, fontWeight: '500', color: '#6b7280', flex: 1 },
  detailValue: { fontSize: 15, color: '#111827', flex: 1, textAlign: 'right' },
  noteContainer: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  noteLabel: { fontWeight: '600', color: '#92400e', marginBottom: 4 },
  noteText: { color: '#78350f' },
  documentsCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  documentButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  documentButtonText: { color: '#3b82f6', fontSize: 16 },
  documentArrow: { color: '#9ca3af', fontSize: 18 },
  homeButton: { backgroundColor: '#6b7280', padding: 16, borderRadius: 8, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoSection: { marginBottom: 20 },
  sectionTitleEdu: { fontSize: 20, fontWeight: '600', color: '#1a202c', marginBottom: 16 },
  requirementCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#667eea' },
  requirementTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 12 },
  requirementItem: { fontSize: 14, color: '#4a5568', marginBottom: 6, lineHeight: 20 },
  importantSection: { backgroundColor: '#fff3cd', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ffc107' },
  importantTitle: { fontSize: 16, fontWeight: '600', color: '#856404', marginBottom: 12 },
  guidelineCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  guidelineItem: { fontSize: 14, color: '#4a5568', marginBottom: 8, lineHeight: 20 },
  timeSection: { backgroundColor: '#e7f3ff', borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'center' },
  timeTitle: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 8 },
  timeText: { fontSize: 18, fontWeight: 'bold', color: '#667eea', marginBottom: 4 },
  timeSubtext: { fontSize: 14, color: '#4a5568', textAlign: 'center' },
  proceedButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  proceedButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backButton: { marginBottom: 16, padding: 8 },
  backButtonText: { color: '#667eea', fontSize: 16, fontWeight: '500' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2d3748', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#4a5568', marginBottom: 8 },
  input: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#1a202c' },
  inputError: { borderColor: '#fc8181' },
  errorText: { color: '#fc8181', fontSize: 12, marginTop: 4 },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 16, color: '#1a202c' },
  dropdownPlaceholder: { fontSize: 16, color: '#a0aec0' },
  dropdownArrow: { fontSize: 12, color: '#4a5568' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 12, width: '85%', maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#667eea', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  pickerClose: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f7fafc' },
  pickerOptionSelected: { backgroundColor: '#edf2f7' },
  pickerOptionText: { fontSize: 18, color: '#2d3748' },
  pickerOptionTextSelected: { color: '#667eea', fontWeight: '600' },
  pickerCheckmark: { fontSize: 20, color: '#667eea', fontWeight: 'bold' },
  fileButton: { backgroundColor: '#667eea', padding: 12, borderRadius: 8, alignItems: 'center' },
  fileButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  reportItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7fafc', padding: 12, borderRadius: 8, marginTop: 8 },
  reportName: { flex: 1, fontSize: 14, color: '#2d3748' },
  removeButton: { color: '#fc8181', fontSize: 18, fontWeight: 'bold', paddingLeft: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#cbd5e0', borderRadius: 4, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#667eea', borderColor: '#667eea' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#4a5568', lineHeight: 20 },
  submitButton: { backgroundColor: '#667eea', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  declarationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  downloadButton: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  downloadButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});