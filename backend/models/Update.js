import mongoose from "mongoose";

const updateSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String, // Cloudinary URL (or local path for backward compatibility)
    default: null,
  },
  cloudinaryId: {
    type: String, // Cloudinary public_id for deletion
    default: null,
  },
  mediaType: {
    type: String, // 'image' or 'video'
    enum: ['image', 'video'],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
updateSchema.index({ createdAt: -1 });

const Update = mongoose.model("Update", updateSchema);

export default Update;