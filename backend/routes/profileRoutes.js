// ============================================
// routes/profileRoutes.js - WITH COMPREHENSIVE DEBUGGING
// ============================================

import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  uploadProfilePicture,
  deleteProfilePicture
} from '../controllers/profilecontroller.js';
import { uploadProfilePic, handleMulterError } from '../config/multer.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ✅ DEBUG MIDDLEWARE - See exactly what's coming in
const debugRequest = (req, res, next) => {
  console.log('\n' + '🔍'.repeat(35));
  console.log('📥 RAW REQUEST (BEFORE MULTER)');
  console.log('🔍'.repeat(35));
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:');
  console.log('  - Content-Type:', req.headers['content-type']);
  console.log('  - Content-Length:', req.headers['content-length']);
  console.log('  - Authorization:', req.headers['authorization'] ? 'Present ✅' : 'Missing ❌');
  console.log('Body Keys:', Object.keys(req.body || {}));
  console.log('Files:', req.files ? 'Present' : 'None');
  console.log('File:', req.file ? 'Present' : 'None');
  console.log('🔍'.repeat(35) + '\n');
  next();
};

// ✅ Get user profile
router.get('/profile/:id', protect, getUserProfile);

// ✅ Update user profile (text fields only)
router.put('/profile/:id', protect, updateUserProfile);

// ✅ Upload profile picture with extensive debugging
router.post(
  '/profile/:id/upload',
  protect, // Auth first
  debugRequest, // Debug raw request
  (req, res, next) => {
    console.log('📤 Passing to Multer...');
    
    uploadProfilePic.single('profilePic')(req, res, (err) => {
      console.log('\n' + '📋'.repeat(35));
      console.log('📤 AFTER MULTER');
      console.log('📋'.repeat(35));
      console.log('Error:', err ? err.message : 'None ✅');
      console.log('File:', req.file ? 'Present ✅' : 'Missing ❌');
      
      if (req.file) {
        console.log('File Details:');
        console.log('  - Fieldname:', req.file.fieldname);
        console.log('  - Original name:', req.file.originalname);
        console.log('  - MIME type:', req.file.mimetype);
        console.log('  - Size:', req.file.size, 'bytes');
        console.log('  - Cloudinary URL:', req.file.path);
      }
      console.log('📋'.repeat(35) + '\n');
      
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  uploadProfilePicture
);

// ✅ Delete profile picture
router.delete('/profile/:id/picture', protect, deleteProfilePicture);

export default router;