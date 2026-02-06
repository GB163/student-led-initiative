// ============================================
// Event.js Model - Updated with Cloudinary Support
// ============================================
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  // Keep 'image' for backward compatibility with existing data
  image: { 
    type: String,
    default: ''
  },
  // New fields for video support
  media: {
    type: String, // Cloudinary URL
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', ''],
    default: ''
  },
  // ✅ NEW: Cloudinary ID for deletion
  cloudinaryId: {
    type: String,
    default: null
  },
  // Optional: Event status
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', ''],
    default: 'upcoming'
  },
  // Optional: Track participants
  maxParticipants: {
    type: Number,
    default: null
  },
  registeredParticipants: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Virtual to get the correct media URL (prioritizes 'media' over 'image')
eventSchema.virtual('mediaUrl').get(function() {
  return this.media || this.image || '';
});

// Virtual to check if event has media
eventSchema.virtual('hasMedia').get(function() {
  return !!(this.media || this.image);
});

// Virtual to check if event is past
eventSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Virtual to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Include virtuals in JSON responses
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
eventSchema.index({ date: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ createdAt: -1 });

// Pre-save hook to auto-update status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  // Auto-update status if not manually set
  if (this.isNew || this.isModified('date')) {
    if (eventDate < now) {
      if (this.status === 'upcoming' || this.status === 'ongoing') {
        this.status = 'completed';
      }
    }
  }
  
  next();
});

const Event = mongoose.model("Event", eventSchema);
export default Event;