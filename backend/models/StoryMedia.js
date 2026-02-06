// backend/models/StoryMedia.js
import mongoose from 'mongoose';

const storyMediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  media: {
    type: String,
    required: [true, 'Media URL is required']
  },
  // Cloudinary public_id for deletion
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required']
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'pdf'],
    required: true,
    default: 'image'
  },
  // Additional metadata
  fileSize: {
    type: Number, // Size in bytes
  },
  originalName: {
    type: String
  },
  // Optional: Category for organizing media
  category: {
    type: String,
    enum: ['milestone', 'event', 'general', 'testimonial', 'achievement'],
    default: 'general'
  },
  // Optional: Tags for better search and filtering
  tags: [{
    type: String,
    trim: true
  }],
  // Track who uploaded (optional)
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // View statistics (optional)
  views: {
    type: Number,
    default: 0
  },
  // Status for approval workflow (optional)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
storyMediaSchema.index({ mediaType: 1, createdAt: -1 });
storyMediaSchema.index({ category: 1 });
storyMediaSchema.index({ status: 1 });

// Virtual for formatted file size
storyMediaSchema.virtual('formattedSize').get(function() {
  if (!this.fileSize) return 'Unknown';
  
  const kb = this.fileSize / 1024;
  const mb = kb / 1024;
  
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${kb.toFixed(2)} KB`;
});

// Enable virtuals in JSON output
storyMediaSchema.set('toJSON', { virtuals: true });
storyMediaSchema.set('toObject', { virtuals: true });

// Method to increment views
storyMediaSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

// Static method to get media by type
storyMediaSchema.statics.getByType = async function(mediaType) {
  return await this.find({ mediaType, status: 'approved' })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email');
};

// Static method to get media by category
storyMediaSchema.statics.getByCategory = async function(category) {
  return await this.find({ category, status: 'approved' })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email');
};

// Static method to get recent media
storyMediaSchema.statics.getRecent = async function(limit = 10) {
  return await this.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'name email');
};

const StoryMedia = mongoose.model('StoryMedia', storyMediaSchema);

export default StoryMedia;