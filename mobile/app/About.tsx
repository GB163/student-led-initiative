import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import axios from "axios";
import { X, Users, Calendar, Mail, Heart, HandHeart, BookOpen, DollarSign } from "lucide-react-native";
import { useRouter } from "expo-router";
import { API_BASE_URL } from '../shared/constants/config';

const { width } = Dimensions.get('window');

// Type definitions
interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalDonations: number;
}

interface Update {
  _id?: string;
  image?: string;
  mediaType?: string;
  message: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  image?: string;
}

interface Donation {
  _id: string;
  name: string;
  email?: string;
  collegeName?: string;
  amount?: number;
  role?: string;
  createdAt: string;
}

function About() {
  const router = useRouter();
  
  const [aboutContent, setAboutContent] = useState<string>("");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    totalDonations: 0,
  });
  
  // Modal states
  const [showUsersModal, setShowUsersModal] = useState<boolean>(false);
  const [showEventsModal, setShowEventsModal] = useState<boolean>(false);
  const [showDonationsModal, setShowDonationsModal] = useState<boolean>(false);
  const [showDonateInfoModal, setShowDonateInfoModal] = useState<boolean>(false);
  const [showVolunteerInfoModal, setShowVolunteerInfoModal] = useState<boolean>(false);
  
  // Data states
  const [usersData, setUsersData] = useState<User[]>([]);
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [donationsData, setDonationsData] = useState<Donation[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch about content
    axios.get(`${API_BASE_URL}/api/about`)
      .then(res => setAboutContent(res.data.content || ""))
      .catch(err => console.error("Failed to fetch about content:", err));

    // Fetch stats
    axios.get(`${API_BASE_URL}/api/about/stats`)
      .then(res => setStats({
        totalUsers: res.data.totalUsers || 0,
        totalEvents: res.data.totalEvents || 0,
        totalDonations: res.data.totalDonations || 0,
      }))
      .catch(err => console.error("Failed to fetch stats:", err));

    // Fetch updates
    axios.get(`${API_BASE_URL}/api/about/updates`)
      .then(res => setUpdates(res.data || []))
      .catch(err => console.error("Failed to fetch updates:", err));
  }, []);

  const fetchUsersDetails = async (): Promise<void> => {
    setModalLoading(true);
    try {
      const response = await axios.get<User[]>(`${API_BASE_URL}/api/user/all`);
      setUsersData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsersData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchEventsDetails = async (): Promise<void> => {
    setModalLoading(true);
    try {
      const response = await axios.get<Event[]>(`${API_BASE_URL}/api/events`);
      setEventsData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEventsData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchDonationsDetails = async (): Promise<void> => {
    setModalLoading(true);
    try {
      const response = await axios.get<Donation[]>(`${API_BASE_URL}/api/donations`);
      setDonationsData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      setDonationsData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUsersClick = (): void => {
    setShowUsersModal(true);
    fetchUsersDetails();
  };

  const handleEventsClick = (): void => {
    setShowEventsModal(true);
    fetchEventsDetails();
  };

  const handleDonationsClick = (): void => {
    setShowDonationsModal(true);
    fetchDonationsDetails();
  };

  const handleDonateClick = (): void => {
    setShowDonateInfoModal(true);
  };

  const handleVolunteerClick = (): void => {
    setShowVolunteerInfoModal(true);
  };

  const handleFeedbackClick = (): void => {
    Linking.openURL("https://docs.google.com/forms/d/e/1FAIpQLSeeqZ_LpDmol0BS20klQ6UOP6Kiip-PJf3YEAT_tiHF2La7lw/viewform?usp=dialog");
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Transforming Lives Through Compassion</Text>
        <Text style={styles.heroSubtitle}>Empowering communities, one child at a time</Text>
        <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedbackClick}>
          <Text style={styles.feedbackButtonText}>Share Your Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statCard} onPress={handleUsersClick}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statNumber}>{stats.totalUsers.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.clickHint}>Tap for details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={handleEventsClick}>
          <Text style={styles.statIcon}>🎫</Text>
          <Text style={styles.statNumber}>{stats.totalEvents.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Events Hosted</Text>
          <Text style={styles.clickHint}>Tap for details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={handleDonationsClick}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statNumber}>{stats.totalDonations.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Donations</Text>
          <Text style={styles.clickHint}>Tap for details</Text>
        </TouchableOpacity>
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          {aboutContent || "We are dedicated to providing comprehensive medical support and care to underprivileged children and families. Through community support and transparent processes, we ensure every child receives the healthcare they deserve."}
        </Text>

        <View style={styles.valuesContainer}>
          <View style={styles.valueCard}>
            <Text style={styles.valueIcon}>🤝</Text>
            <Text style={styles.valueTitle}>Transparency</Text>
            <Text style={styles.valueText}>Every donation and application is tracked with full accountability</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueIcon}>💙</Text>
            <Text style={styles.valueTitle}>Compassion</Text>
            <Text style={styles.valueText}>Treating every family with dignity and care</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueIcon}>⚡</Text>
            <Text style={styles.valueTitle}>Efficiency</Text>
            <Text style={styles.valueText}>Quick response and streamlined approval process</Text>
          </View>
        </View>
      </View>

      {/* Impact Section */}
      <View style={[styles.section, styles.impactSection]}>
        <Text style={styles.sectionTitle}>How We're Making an Impact</Text>
        <Text style={styles.sectionSubtitle}>Real stories of hope and healing</Text>

        {updates.length > 0 ? (
          <View style={styles.updatesGrid}>
            {updates.map((update, index) => (
              <View key={index} style={styles.updateCard}>
                {update.image && (
                  <Image
                    source={{ uri: `${API_BASE_URL}/${update.image}` }}
                    style={styles.updateImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>{update.message}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noUpdates}>
            <Text style={styles.noUpdatesIcon}>📸</Text>
            <Text style={styles.noUpdatesText}>Our journey is just beginning. Check back soon for inspiring stories!</Text>
          </View>
        )}
      </View>

      {/* Process Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Process</Text>
        <Text style={styles.sectionSubtitle}>Simple, transparent, and effective</Text>

        <View style={styles.processContainer}>
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.processTitle}>Application</Text>
            <Text style={styles.processText}>Families submit medical support applications with required documents</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.processTitle}>Verification</Text>
            <Text style={styles.processText}>Staff verifies all documents and medical information</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.processTitle}>Approval</Text>
            <Text style={styles.processText}>Admin reviews and approves eligible cases for support</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.processTitle}>Support</Text>
            <Text style={styles.processText}>Medical cards issued and families receive care they need</Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Join Us in Making a Difference</Text>
        <Text style={styles.ctaSubtitle}>Your support can change a child's life forever</Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDonateClick}>
            <Text style={styles.primaryButtonText}>Learn About Donations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleVolunteerClick}>
            <Text style={styles.secondaryButtonText}>Learn About Volunteering</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users Modal */}
      <Modal
        visible={showUsersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUsersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Users size={24} color="#667eea" />
                <Text style={styles.modalTitle}>All Registered Users</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUsersModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalLoading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
              ) : usersData.length === 0 ? (
                <Text style={styles.emptyText}>No users found</Text>
              ) : (
                usersData.map((userData) => (
                  <View key={userData._id} style={styles.listItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{userData.name}</Text>
                      <View style={styles.itemRow}>
                        <Mail size={14} color="#666" />
                        <Text style={styles.itemText}>{userData.email}</Text>
                      </View>
                      <Text style={styles.itemText}>Role: {userData.role}</Text>
                    </View>
                    <View style={styles.itemMeta}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{userData.role}</Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Calendar size={14} color="#999" />
                        <Text style={styles.dateText}>{formatDate(userData.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Events Modal */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎫 All Events</Text>
              <TouchableOpacity onPress={() => setShowEventsModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalLoading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
              ) : eventsData.length === 0 ? (
                <Text style={styles.emptyText}>No events found</Text>
              ) : (
                eventsData.map((event) => (
                  <View key={event._id} style={styles.listItem}>
                    {event.image && (
                      <Image
                        source={{ uri: `${API_BASE_URL}/${event.image}` }}
                        style={styles.eventImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.eventInfo}>
                      <Text style={styles.itemTitle}>{event.title}</Text>
                      <Text style={styles.itemText}>{event.description}</Text>
                      <View style={styles.itemRow}>
                        <Calendar size={14} color="#667eea" />
                        <Text style={[styles.itemText, styles.eventDate]}>{formatDate(event.date)}</Text>
                      </View>
                      {event.location && (
                        <Text style={styles.itemText}>Location: {event.location}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Donations Modal */}
      <Modal
        visible={showDonationsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDonationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💰 All Donations</Text>
              <TouchableOpacity onPress={() => setShowDonationsModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalLoading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
              ) : donationsData.length === 0 ? (
                <Text style={styles.emptyText}>No donations found</Text>
              ) : (
                donationsData.map((donation) => (
                  <View key={donation._id} style={styles.listItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{donation.name}</Text>
                      {donation.email && (
                        <View style={styles.itemRow}>
                          <Mail size={14} color="#666" />
                          <Text style={styles.itemText}>{donation.email}</Text>
                        </View>
                      )}
                      {donation.collegeName && (
                        <Text style={styles.itemText}>College: {donation.collegeName}</Text>
                      )}
                      <View style={styles.itemRow}>
                        <Calendar size={14} color="#999" />
                        <Text style={styles.dateText}>{formatDate(donation.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.donationAmount}>
                      <Text style={styles.amountText}>₹{donation.amount?.toLocaleString()}</Text>
                      {donation.role && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{donation.role}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Donate Information Modal */}
      <Modal
        visible={showDonateInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDonateInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <DollarSign size={24} color="#667eea" />
                <Text style={styles.modalTitle}>About Donations</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDonateInfoModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>💝 How Your Donation Helps</Text>
                <Text style={styles.infoText}>
                  Every contribution directly supports medical treatment for underprivileged children. 
                  Your donations fund surgeries, medications, hospital stays, and follow-up care.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>🎯 What We Fund</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Emergency medical treatments</Text>
                  <Text style={styles.bulletPoint}>• Surgical procedures</Text>
                  <Text style={styles.bulletPoint}>• Medications and therapy</Text>
                  <Text style={styles.bulletPoint}>• Medical equipment</Text>
                  <Text style={styles.bulletPoint}>• Post-treatment care</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>✨ Transparency Promise</Text>
                <Text style={styles.infoText}>
                  We maintain complete transparency. Every donation is tracked, and donors receive 
                  updates on how their contribution made an impact. You can view all donations in 
                  our public records.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>📞 Contact Us</Text>
                <Text style={styles.infoText}>
                  For donation inquiries or to learn more about our financial transparency, 
                  please reach out to our team through the feedback form or contact us directly.
                </Text>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Volunteer Information Modal */}
      <Modal
        visible={showVolunteerInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVolunteerInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Heart size={24} color="#667eea" />
                <Text style={styles.modalTitle}>About Volunteering</Text>
              </View>
              <TouchableOpacity onPress={() => setShowVolunteerInfoModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>🤝 Join Our Mission</Text>
                <Text style={styles.infoText}>
                  Volunteers are the heart of our organization. Whether you can dedicate a few hours 
                  a week or join us for special events, your time and skills make a real difference 
                  in children's lives.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>🎯 Volunteer Opportunities</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Event coordination and support</Text>
                  <Text style={styles.bulletPoint}>• Hospital visits and patient interaction</Text>
                  <Text style={styles.bulletPoint}>• Fundraising campaigns</Text>
                  <Text style={styles.bulletPoint}>• Documentation and administration</Text>
                  <Text style={styles.bulletPoint}>• Social media and outreach</Text>
                  <Text style={styles.bulletPoint}>• Educational programs</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>📋 Requirements</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Commitment and reliability</Text>
                  <Text style={styles.bulletPoint}>• Compassion for children and families</Text>
                  <Text style={styles.bulletPoint}>• Good communication skills</Text>
                  <Text style={styles.bulletPoint}>• Background verification (for certain roles)</Text>
                  <Text style={styles.bulletPoint}>• Attend orientation session</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>🌟 What You Gain</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Make a meaningful impact</Text>
                  <Text style={styles.bulletPoint}>• Develop new skills</Text>
                  <Text style={styles.bulletPoint}>• Meet like-minded people</Text>
                  <Text style={styles.bulletPoint}>• Volunteer certificates</Text>
                  <Text style={styles.bulletPoint}>• Personal fulfillment</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>📞 Get Started</Text>
                <Text style={styles.infoText}>
                  Ready to volunteer? Contact us through the feedback form or reach out directly 
                  to discuss how you can contribute. We'd love to have you on our team!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroSection: {
    backgroundColor: '#667eea',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  feedbackButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  feedbackButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  clickHint: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  missionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  valuesContainer: {
    gap: 16,
  },
  valueCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  valueIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  impactSection: {
    backgroundColor: '#f8f9fa',
  },
  updatesGrid: {
    gap: 16,
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateImage: {
    width: '100%',
    height: 200,
  },
  updateContent: {
    padding: 16,
  },
  updateText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noUpdates: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noUpdatesIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noUpdatesText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  processContainer: {
    gap: 24,
  },
  processStep: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 60,
    height: 60,
    backgroundColor: '#667eea',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  processTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  processText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#667eea',
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  ctaButtons: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    marginVertical: 40,
  },
  listItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
  },
  itemMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    backgroundColor: '#667eea',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  eventImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventDate: {
    color: '#667eea',
  },
  donationAmount: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  bulletList: {
    gap: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    paddingLeft: 8,
  },
  infoButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default About;