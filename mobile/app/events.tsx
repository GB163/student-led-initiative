import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { eventAPI } from '../shared/services/api';
import { API_BASE_URL } from '../shared/constants/config';
import { Stack } from 'expo-router';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = filter === 'upcoming' 
        ? await eventAPI.getUpcoming()
        : await eventAPI.getAll();
      
      let eventData = response.data.events || response.data;
      
      if (filter === 'past') {
        const now = new Date();
        eventData = eventData.filter((event: any) => new Date(event.date) < now);
      }
      
      setEvents(eventData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleRegister = async (eventId: string) => {
    try {
      await eventAPI.register(eventId);
      Alert.alert('Success', 'You have successfully registered for this event!');
      fetchEvents();
    } catch (error: any) {
      console.error('Registration failed:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to register');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderEvent = ({ item }: any) => {
    const eventDate = new Date(item.date);
    const isPast = eventDate < new Date();
    const imageUri = item.image 
      ? `${API_BASE_URL}${item.image}` 
      : null;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => Alert.alert(item.title || item.name, item.description)}
      >
        {imageUri && (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.eventImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.eventContent}>
          <View style={[styles.dateBadge, isPast && styles.pastDateBadge]}>
            <Text style={styles.dateDay}>
              {eventDate.getDate()}
            </Text>
            <Text style={styles.dateMonth}>
              {eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </Text>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title || item.name}
            </Text>
            
            <View style={styles.eventMeta}>
              <Text style={styles.metaText}>
                📅 {formatDate(item.date)}
              </Text>
              {item.time && (
                <Text style={styles.metaText}>
                  🕐 {formatTime(item.date)}
                </Text>
              )}
              {item.location && (
                <Text style={styles.metaText} numberOfLines={1}>
                  📍 {item.location}
                </Text>
              )}
            </View>

            {item.description && (
              <Text style={styles.eventDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.eventFooter}>
              {item.registeredUsers?.length > 0 && (
                <Text style={styles.registrationCount}>
                  👥 {item.registeredUsers.length} registered
                </Text>
              )}
              
              {!isPast && (
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    item.isRegistered && styles.registeredButton
                  ]}
                  onPress={() => !item.isRegistered && handleRegister(item._id)}
                  disabled={item.isRegistered}
                >
                  <Text style={[
                    styles.registerButtonText,
                    item.isRegistered && styles.registeredButtonText
                  ]}>
                    {item.isRegistered ? '✓ Registered' : 'Register'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {isPast && (
                <View style={styles.pastBadge}>
                  <Text style={styles.pastBadgeText}>Past Event</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Events' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Events' }} />
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          {['upcoming', 'all', 'past'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.activeFilterButton
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.activeFilterText
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item: any) => item._id || item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>
                No {filter} events found
              </Text>
              <Text style={styles.emptySubtext}>
                Check back later for new events
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    flexDirection: 'row',
    padding: 16,
  },
  dateBadge: {
    width: 60,
    height: 60,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pastDateBadge: {
    backgroundColor: '#999',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventMeta: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registrationCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  registeredButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  registeredButtonText: {
    color: '#4CAF50',
  },
  pastBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pastBadgeText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});