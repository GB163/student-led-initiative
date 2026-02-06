import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { contactAPI, callRequestAPI } from '../shared/services/api';
import { useUser } from '../shared/contexts/UserContext';
import io from 'socket.io-client';
import { SOCKET_URL } from '../shared/constants/config';
import { Stack } from 'expo-router';

export default function ContactSupportScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');
  
  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);

  // Quick topics
  const quickTopics = [
    'Payment Issues',
    'Technical Support',
    'Account Help',
    'Medical Support',
    'Other Queries',
  ];

  // Call request states
  const [callForm, setCallForm] = useState({
    phone: '',
    language: 'English',
    bestTime: 'As soon as possible',
    notes: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: '',
    suggestion: '',
  });
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [callSuccess, setCallSuccess] = useState('');
  const [callRequestId, setCallRequestId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchMessages();
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('💬 Socket connected for chat');
      socketRef.current.emit('registerRole', 'user');
    });

    socketRef.current.on('staffReply', (reply: any) => {
      setMessages(prev => [...prev, {
        ...reply,
        role: 'staff',
        id: Date.now(),
      }]);
      scrollToBottom();
    });

    socketRef.current.on('callDeleted', ({ id }: any) => {
      if (id === callRequestId) {
        console.log('⚠️ Call deleted from server — clearing feedback form');
        setCallRequestId(null);
        setShowFeedback(false);
        setCallSuccess('');
        setFeedbackSubmitted(false);
      }
    });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Messages will be received via socket, but we can fetch history if needed
      setMessages([]);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now() + '-u',
      role: 'user',
      text: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    
    if (socketRef.current) {
      socketRef.current.emit('userMessage', { text: text.trim() });
    }
    
    setInputText('');
    setTimeout(scrollToBottom, 100);
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleTopicClick = (topic: string) => {
    sendMessage(topic);
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Call request handlers
  const handleCallChange = (field: string, value: string) => {
    setCallSuccess('');
    setCallForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFeedbackChange = (field: string, value: string) => {
    setFeedbackForm(prev => ({ ...prev, [field]: value }));
  };

  const submitCallRequest = async () => {
    if (!callForm.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setCallSubmitting(true);
    setCallSuccess('');

    try {
      if (socketRef.current) {
        socketRef.current.emit(
          'callRequest',
          { ...callForm, name: user?.name || 'User', status: 'pending' },
          (newRequest: any) => {
            setCallRequestId(newRequest._id);
            setShowFeedback(true);
            setCallSuccess("✅ Request submitted. You'll receive a callback shortly.");
            setCallForm({
              phone: '',
              language: 'English',
              bestTime: 'As soon as possible',
              notes: '',
            });
          }
        );
      }
    } catch (error) {
      setCallSuccess('❌ Something went wrong. Please try again.');
    } finally {
      setCallSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.rating || !feedbackForm.suggestion.trim()) {
      Alert.alert('Error', 'Please fill in all feedback fields');
      return;
    }

    setFeedbackSubmitting(true);

    try {
      if (socketRef.current) {
        socketRef.current.emit('feedbackSubmit', {
          ...feedbackForm,
          callId: callRequestId,
        });
      }

      setFeedbackForm({ rating: '', suggestion: '' });
      setFeedbackSubmitted(true);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setCallRequestId(null);
        setCallSuccess('');
      }, 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.staffMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.staffBubble,
          ]}
        >
          {!isUser && (
            <Text style={styles.senderName}>Support Team</Text>
          )}
          
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.staffText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
          <Text style={styles.chatTitle}>💬 Chat with Staff</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              A staff member will reply here as soon as possible
            </Text>
          </View>
        }
      />

      <View style={styles.quickTopicsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickTopics.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={styles.topicChip}
              onPress={() => handleTopicClick(topic)}
            >
              <Text style={styles.topicChipText}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCallTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.callContent}>
      <View style={styles.callHeader}>
        <Text style={styles.callTitle}>📞 Request a Call</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>2–5 min</Text>
        </View>
      </View>

      {!showFeedback && !feedbackSubmitted && (
        <View style={styles.form}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. 98765 43210"
            keyboardType="phone-pad"
            value={callForm.phone}
            onChangeText={(text) => handleCallChange('phone', text)}
          />

          <Text style={styles.label}>Preferred language</Text>
          <View style={styles.pickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil', 'Marathi'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    callForm.language === lang && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleCallChange('language', lang)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      callForm.language === lang && styles.languageOptionTextSelected,
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.label}>Preferred time</Text>
          <View style={styles.pickerContainer}>
            {['As soon as possible', 'Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  callForm.bestTime === time && styles.timeOptionSelected,
                ]}
                onPress={() => handleCallChange('bestTime', time)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    callForm.bestTime === time && styles.timeOptionTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="Briefly describe your issue..."
            multiline
            numberOfLines={3}
            value={callForm.notes}
            onChangeText={(text) => handleCallChange('notes', text)}
          />

          <TouchableOpacity
            style={[styles.primaryButton, callSubmitting && styles.primaryButtonDisabled]}
            onPress={submitCallRequest}
            disabled={callSubmitting}
          >
            {callSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Request a Callback</Text>
            )}
          </TouchableOpacity>

          {callSuccess && (
            <Text style={styles.successMessage}>{callSuccess}</Text>
          )}
        </View>
      )}

      {showFeedback && !feedbackSubmitted && (
        <View style={styles.form}>
          <Text style={styles.feedbackTitle}>Feedback</Text>

          <Text style={styles.label}>Rating: How staff helped you</Text>
          <View style={styles.pickerContainer}>
            {['Excellent', 'Good', 'Average', 'Poor'].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  feedbackForm.rating === rating && styles.ratingOptionSelected,
                ]}
                onPress={() => handleFeedbackChange('rating', rating)}
              >
                <Text
                  style={[
                    styles.ratingOptionText,
                    feedbackForm.rating === rating && styles.ratingOptionTextSelected,
                  ]}
                >
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Suggestions for betterment</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="Your suggestions..."
            multiline
            numberOfLines={3}
            value={feedbackForm.suggestion}
            onChangeText={(text) => handleFeedbackChange('suggestion', text)}
          />

          <TouchableOpacity
            style={[styles.primaryButton, feedbackSubmitting && styles.primaryButtonDisabled]}
            onPress={submitFeedback}
            disabled={feedbackSubmitting}
          >
            {feedbackSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {feedbackSubmitted && (
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouIcon}>✅</Text>
          <Text style={styles.thankYouText}>Thank you for your feedback!</Text>
        </View>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Help Center' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Help Center' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>
            We're here to help—chat with us or request a callback
          </Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              💬 Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'call' && styles.tabActive]}
            onPress={() => setActiveTab('call')}
          >
            <Text style={[styles.tabText, activeTab === 'call' && styles.tabTextActive]}>
              📞 Call Request
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'chat' ? renderChatTab() : renderCallTab()}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  tabContent: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  staffMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  staffBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFF',
  },
  staffText: {
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  quickTopicsContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  topicChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicChipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  callContent: {
    padding: 20,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  callTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  timeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  languageOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  languageOptionTextSelected: {
    color: '#FFF',
  },
  timeOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#FFF',
  },
  ratingOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ratingOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  ratingOptionTextSelected: {
    color: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 16,
  },
  thankYouContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thankYouIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
});