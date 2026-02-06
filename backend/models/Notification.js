// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Who receives this notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // What role is this user (user/staff/admin)
  userRole: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    required: true,
    index: true
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Type of notification (for styling/icons)
  type: {
    type: String,
    enum: [
      // General
      'success', 
      'error', 
      'warning', 
      'info',
      
      // Medical Support
      'medical',
      'medical_applied',
      'medical_verified',
      'medical_approved',
      'medical_rejected',
      'medical_completed',
      
      // Join Us / Volunteer
      'volunteer',
      'join_applied',
      'join_approved',
      'join_rejected',
      
      // Events
      'event',
      'event_created',
      'event_updated',
      'event_reminder',
      
      // Story / About
      'story',
      'story_posted',
      'about',
      
      // Contact / Support
      'contact',
      'support',
      'contact_replied',
      
      // Donation
      'donation',
      'donation_received',
      
      // System / Admin
      'system',
      'admin',
      'user',
      'staff',
      'application'
    ],
    default: 'info'
  },

  // Optional link to navigate when clicked
  link: {
    type: String,
    default: null
  },

  // Read status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// Compound index for faster queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userRole: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days (optional)
notificationSchema.index({ readAt: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60,  // 30 days
  partialFilterExpression: { read: true }
});

export default mongoose.model('Notification', notificationSchema);