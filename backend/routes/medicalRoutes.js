// backend/routes/medicalRoutes.js
import express from 'express';
import multer from 'multer';
import { protect, authorizeRoles } from '../middleware/auth.js';
import {
  applyMedical,
  getPendingApplications,
  verifyApplication,
  getApplicationById,
  getAllApplications,
  approveApplication,
  rejectApplication,
  getMyApplication,
  getStats,
} from '../controllers/MedicalController.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// ================= Cloudinary Storage Setup for Medical Documents =================
const medicalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file type
    const isPDF = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');
    
    // Organize by document type in subfolders
    let subfolder = 'other';
    if (file.fieldname === 'declaration') subfolder = 'declarations';
    else if (file.fieldname === 'applicantId' || file.fieldname === 'staffId') subfolder = 'id-proofs';
    else if (file.fieldname === 'incomeProof') subfolder = 'income-proofs';
    else if (file.fieldname === 'photo') subfolder = 'photos';
    else if (file.fieldname === 'hospitalBill') subfolder = 'hospital-bills';
    else if (file.fieldname === 'reports') subfolder = 'medical-reports';
    
    return {
      folder: `medical-applications/${subfolder}`,
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      resource_type: isPDF ? 'raw' : 'image',
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      // Add transformation for images (not PDFs)
      transformation: isImage && file.fieldname === 'photo' 
        ? [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
        : undefined,
      // Add tags for better organization
      tags: [file.fieldname, 'medical-application', req.user?.email || 'unknown']
    };
  },
});

// ================= Multer Configuration with Cloudinary =================
const upload = multer({
  storage: medicalStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, JPG, PNG) are allowed'));
    }
  },
});

// =================== PUBLIC ROUTES (MUST BE FIRST) ===================
// ✅ Public stats endpoint (no auth required)
router.get('/stats', getStats);

// ✅ Public endpoint for approved applications (for HeroSection)
router.get('/public/approved', async (req, res) => {
  try {
    // Import the model
    const MedicalApplication = (await import('../models/MedicalApplication.js')).default;
    
    // Fetch only APPROVED medical applications (public data)
    const approvedApplications = await MedicalApplication.find({ 
      status: 'approved' 
    })
    .select('patientName diagnosis hospital age totalCost createdAt status') // Only public fields
    .sort({ createdAt: -1 });
    
    console.log(`✅ Public approved endpoint hit - returning ${approvedApplications.length} approved applications`);
    
    res.status(200).json(approvedApplications);
  } catch (error) {
    console.error('❌ Error fetching approved applications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching approved applications',
      error: error.message 
    });
  }
});

// =================== SPECIFIC ROUTES (MUST COME BEFORE /:id) ===================
// Check if user has active application - MOVED UP!
router.get('/my-application', protect, getMyApplication);

// Staff routes - specific paths
router.get('/pending', protect, authorizeRoles('staff', 'admin'), getPendingApplications);
router.patch('/verify/:id', protect, authorizeRoles('staff', 'admin'), verifyApplication);

// Admin routes - specific paths
router.get('/admin/medical', protect, authorizeRoles('admin'), getAllApplications);
router.patch('/admin/medical/:id/approve', protect, authorizeRoles('admin'), approveApplication);
router.patch('/admin/medical/:id/reject', protect, authorizeRoles('admin'), rejectApplication);

// =================== USER & STAFF ROUTES ===================
// Apply for medical assistance with multiple file uploads
router.post(
  '/apply',
  protect,
  upload.fields([
    { name: 'declaration', maxCount: 1 },      // PDF/Image - Declaration form
    { name: 'applicantId', maxCount: 1 },      // PDF/Image - Applicant ID proof
    { name: 'staffId', maxCount: 1 },          // PDF/Image - Staff ID (if applicable)
    { name: 'incomeProof', maxCount: 1 },      // PDF/Image - Income certificate
    { name: 'photo', maxCount: 1 },            // Image - Patient photo
    { name: 'hospitalBill', maxCount: 1 },     // PDF/Image - Hospital bill
    { name: 'reports', maxCount: 10 },         // PDF/Images - Medical reports (up to 10 files)
  ]),
  applyMedical
);

// =================== GENERIC ROUTES (MUST COME LAST) ===================
// Get single application by ID - MOVED TO BOTTOM!
router.get('/:id', protect, getApplicationById);

// =================== CLOUDINARY CLEANUP ROUTE (OPTIONAL) ===================
// Delete a file from Cloudinary (admin only)
router.delete('/cloudinary/:publicId', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query; // 'image' or 'raw' (for PDFs)
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image'
    });
    
    console.log('🗑️ Cloudinary deletion result:', result);
    
    res.status(200).json({
      success: true,
      message: 'File deleted from Cloudinary',
      result
    });
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file from Cloudinary',
      error: error.message
    });
  }
});

// =================== HEALTH CHECK ===================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Medical routes operational',
    storage: 'Cloudinary',
    timestamp: new Date().toISOString()
  });
});

export default router;