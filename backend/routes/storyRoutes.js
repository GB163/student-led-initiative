// backend/routes/storyRoutes.js
import express from 'express';
import multer from 'multer';
import {
  getStory,
  updateStatistics,
  updateMissionVision,
  updateMilestones,
  updateValues,
  updateStoryText
} from '../controllers/storyController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import StoryMedia from '../models/StoryMedia.js';
import { storyStorage, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// ============================================
// MULTER CONFIGURATION WITH CLOUDINARY
// ============================================

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storyStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    // Allowed file types: images, videos, and PDFs
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mov|avi|webm|mkv/;
    const allowedDocTypes = /pdf/;
    
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimetype = file.mimetype;
    
    const isImage = allowedImageTypes.test(ext) && mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(ext) && mimetype.startsWith('video/');
    const isPDF = allowedDocTypes.test(ext) && mimetype === 'application/pdf';

    if (isImage || isVideo || isPDF) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed!'));
    }
  }
});

// ============ STORY DATA ROUTES ============

// Public route - Get story data (accessible to all users)
router.get('/', getStory);

// Admin routes - Update story data (admin only)
router.put('/statistics', protect, authorizeRoles('admin'), updateStatistics);
router.put('/mission-vision', protect, authorizeRoles('admin'), updateMissionVision);
router.put('/milestones', protect, authorizeRoles('admin'), updateMilestones);
router.put('/values', protect, authorizeRoles('admin'), updateValues);
router.put('/story-text', protect, authorizeRoles('admin'), updateStoryText);

// ============ STORY MEDIA ROUTES ============

// Get all story media (public route)
router.get('/media', async (req, res) => {
  console.log('📸 GET /api/story/media called');
  
  try {
    if (!StoryMedia) {
      console.error('❌ StoryMedia model not found');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error',
        error: 'StoryMedia model not initialized'
      });
    }

    const media = await StoryMedia.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${media.length} story media items`);
    
    res.status(200).json({
      success: true,
      count: media.length,
      data: media
    });
  } catch (error) {
    console.error('❌ Error fetching story media:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching story media', 
      error: error.message 
    });
  }
});

// Get single story media by ID (public route)
router.get('/media/:id', async (req, res) => {
  console.log(`📸 GET /api/story/media/${req.params.id} called`);
  
  try {
    const media = await StoryMedia.findById(req.params.id);
    
    if (!media) {
      console.log('❌ Media not found');
      return res.status(404).json({ 
        success: false,
        message: 'Media not found' 
      });
    }

    console.log('✅ Media found:', media.title);
    res.status(200).json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('❌ Error fetching story media:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid media ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Upload new story media (admin only) - Supports images, videos, and PDFs
router.post('/media', protect, authorizeRoles('admin'), upload.single('media'), async (req, res) => {
  console.log('📤 POST /api/story/media called');
  console.log('Body:', req.body);
  console.log('File:', req.file ? {
    filename: req.file.filename,
    path: req.file.path,
    mimetype: req.file.mimetype
  } : 'No file');
  
  try {
    const { title, description } = req.body;

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'Please upload a file' 
      });
    }

    if (!title || title.trim() === '') {
      console.log('❌ No title provided');
      
      // Delete from Cloudinary if validation fails
      if (req.file.path) {
        await deleteFromCloudinary(req.file.path);
        console.log('🗑️ Deleted file from Cloudinary due to validation error');
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Title is required' 
      });
    }

    // Determine media type based on file mimetype
    let mediaType = 'image';
    if (req.file.mimetype.startsWith('video')) {
      mediaType = 'video';
    } else if (req.file.mimetype === 'application/pdf') {
      mediaType = 'pdf';
    }

    // Create new media document with Cloudinary URL
    const newMedia = new StoryMedia({
      title: title.trim(),
      description: description ? description.trim() : '',
      media: req.file.path, // Cloudinary URL
      cloudinaryId: req.file.filename, // Cloudinary public_id
      mediaType: mediaType,
      fileSize: req.file.size,
      originalName: req.file.originalname
    });

    await newMedia.save();
    console.log('✅ Story media saved to Cloudinary and DB:', newMedia.title);
    
    res.status(201).json({
      success: true,
      message: `${mediaType.toUpperCase()} uploaded successfully to Cloudinary`,
      data: newMedia
    });
  } catch (error) {
    console.error('❌ Error uploading story media:', error);
    
    // Delete from Cloudinary if database save fails
    if (req.file && req.file.path) {
      await deleteFromCloudinary(req.file.path);
      console.log('🗑️ Deleted file from Cloudinary due to error:', req.file.filename);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while uploading media', 
      error: error.message 
    });
  }
});

// Update story media details (admin only)
router.put('/media/:id', protect, authorizeRoles('admin'), async (req, res) => {
  console.log(`✏️ PUT /api/story/media/${req.params.id} called`);
  
  try {
    const { title, description } = req.body;
    
    const media = await StoryMedia.findById(req.params.id);
    
    if (!media) {
      console.log('❌ Media not found');
      return res.status(404).json({ 
        success: false,
        message: 'Media not found' 
      });
    }

    // Update fields
    if (title !== undefined && title.trim() !== '') {
      media.title = title.trim();
    }
    if (description !== undefined) {
      media.description = description.trim();
    }

    await media.save();
    console.log('✅ Media updated:', media.title);
    
    res.status(200).json({
      success: true,
      message: 'Media updated successfully',
      data: media
    });
  } catch (error) {
    console.error('❌ Error updating story media:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid media ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating media', 
      error: error.message 
    });
  }
});

// Delete story media (admin only)
router.delete('/media/:id', protect, authorizeRoles('admin'), async (req, res) => {
  console.log(`🗑️ DELETE /api/story/media/${req.params.id} called`);
  
  try {
    const media = await StoryMedia.findById(req.params.id);
    
    if (!media) {
      console.log('❌ Media not found');
      return res.status(404).json({ 
        success: false,
        message: 'Media not found' 
      });
    }

    // Delete file from Cloudinary
    if (media.media) {
      const deleteResult = await deleteFromCloudinary(media.media);
      if (deleteResult) {
        console.log('✅ File deleted from Cloudinary:', deleteResult);
      } else {
        console.log('⚠️ Could not delete from Cloudinary (may not exist)');
      }
    }

    // Delete from database
    await StoryMedia.findByIdAndDelete(req.params.id);
    console.log('✅ Media deleted from database');
    
    res.status(200).json({ 
      success: true,
      message: 'Media deleted successfully from Cloudinary and database' 
    });
  } catch (error) {
    console.error('❌ Error deleting story media:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid media ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting media', 
      error: error.message 
    });
  }
});

// Upload multiple media files at once (admin only)
router.post('/media/bulk', protect, authorizeRoles('admin'), upload.array('media', 10), async (req, res) => {
  console.log('📤 POST /api/story/media/bulk called');
  console.log('Files:', req.files ? req.files.length : 0);
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload at least one file' 
      });
    }

    const uploadedMedia = [];
    const errors = [];

    // Process each file
    for (const file of req.files) {
      try {
        // Determine media type
        let mediaType = 'image';
        if (file.mimetype.startsWith('video')) {
          mediaType = 'video';
        } else if (file.mimetype === 'application/pdf') {
          mediaType = 'pdf';
        }

        const newMedia = new StoryMedia({
          title: file.originalname.split('.')[0], // Use filename as title
          description: '',
          media: file.path,
          cloudinaryId: file.filename,
          mediaType: mediaType,
          fileSize: file.size,
          originalName: file.originalname
        });

        await newMedia.save();
        uploadedMedia.push(newMedia);
        console.log('✅ Uploaded:', file.originalname);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        // Delete from Cloudinary if save failed
        await deleteFromCloudinary(file.path);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedMedia.length} files`,
      data: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    
    // Cleanup: delete all uploaded files from Cloudinary
    if (req.files) {
      for (const file of req.files) {
        await deleteFromCloudinary(file.path);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during bulk upload', 
      error: error.message 
    });
  }
});

// Health check route for debugging
router.get('/health', (req, res) => {
  console.log('💚 Health check called');
  res.status(200).json({
    success: true,
    message: 'Story routes are working with Cloudinary',
    timestamp: new Date().toISOString(),
    storage: 'Cloudinary',
    routes: {
      'GET /api/story': 'Get story data',
      'GET /api/story/media': 'Get all media',
      'GET /api/story/media/:id': 'Get single media',
      'POST /api/story/media': 'Upload media (admin) - images/videos/PDFs',
      'POST /api/story/media/bulk': 'Upload multiple media (admin)',
      'PUT /api/story/media/:id': 'Update media (admin)',
      'DELETE /api/story/media/:id': 'Delete media (admin)'
    }
  });
});

export default router