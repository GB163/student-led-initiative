// ============================================
// Hospital.js Model - Updated with Cloudinary Support
// ============================================
import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  specialties: {
    type: [String],
    required: [true, 'At least one specialty is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one specialty is required'
    }
  },
  // ✅ NEW: Image support with Cloudinary
  image: {
    type: String, // Cloudinary URL
    default: null
  },
  cloudinaryId: {
    type: String, // Cloudinary public_id for deletion
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

// Update the updatedAt field before saving
hospitalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
hospitalSchema.index({ location: 1, status: 1 });
hospitalSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if hospital has image
hospitalSchema.virtual('hasImage').get(function() {
  return !!this.image;
});

// Enable virtuals in JSON
hospitalSchema.set('toJSON', { virtuals: true });
hospitalSchema.set('toObject', { virtuals: true });

export default mongoose.model('Hospital', hospitalSchema);