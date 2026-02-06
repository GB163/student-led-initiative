import express from 'express';
import Hospital from '../models/Hospital.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// ================= Cloudinary Storage for Hospitals =================
const hospitalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hospitals',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
    public_id: (req, file) => {
      return `hospital-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    },
  },
});

// Multer configuration with Cloudinary
const upload = multer({
  storage: hospitalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for hospital images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimetype = file.mimetype;

    if (allowedTypes.test(ext) && mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed'));
    }
  }
});

// GET - Get all hospitals
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'active' })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals',
      error: error.message
    });
  }
});

// GET - Get hospital count only (faster for stats)
router.get('/hospitals/count', async (req, res) => {
  try {
    const count = await Hospital.countDocuments({ status: 'active' });
    
    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital count',
      error: error.message
    });
  }
});

// GET - Get hospitals by city (for stats modal)
router.get('/hospitals/by-city', async (req, res) => {
  try {
    const hospitals = await Hospital.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          hospitals: {
            $push: {
              id: '$_id',
              name: '$name',
              phone: '$phone',
              email: '$email',
              address: '$address',
              specialties: '$specialties',
              image: '$image'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals by city',
      error: error.message
    });
  }
});

// GET - Get single hospital by ID
router.get('/hospitals/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital',
      error: error.message
    });
  }
});

// POST - Create new hospital (with optional image)
router.post('/hospitals', upload.single('image'), async (req, res) => {
  try {
    const { name, location, address, phone, email, specialties } = req.body;
    
    // Validation
    if (!name || !location || !address || !phone || !email || !specialties) {
      // Cleanup Cloudinary file if validation fails
      if (req.file?.path) {
        await deleteFromCloudinary(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const hospitalData = {
      name,
      location,
      address,
      phone,
      email,
      specialties: Array.isArray(specialties) ? specialties : specialties.split(',').map(s => s.trim())
    };
    
    // Add Cloudinary image if uploaded
    if (req.file) {
      hospitalData.image = req.file.path; // Cloudinary URL
      hospitalData.cloudinaryId = req.file.filename; // For deletion
    }
    
    const hospital = await Hospital.create(hospitalData);
    
    console.log('✅ Hospital created with Cloudinary image:', req.file?.filename);
    
    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital
    });
  } catch (error) {
    // Cleanup Cloudinary file on error
    if (req.file?.path) {
      await deleteFromCloudinary(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating hospital',
      error: error.message
    });
  }
});

// PUT - Update hospital (with optional image update)
router.put('/hospitals/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, location, address, phone, email, specialties } = req.body;
    
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      // Cleanup uploaded file if hospital not found
      if (req.file?.path) {
        await deleteFromCloudinary(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    const updateData = {
      name,
      location,
      address,
      phone,
      email,
      specialties: Array.isArray(specialties) ? specialties : specialties.split(',').map(s => s.trim()),
      updatedAt: Date.now()
    };
    
    // Handle image update
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (hospital.image) {
        await deleteFromCloudinary(hospital.image);
        console.log('✅ Deleted old hospital image from Cloudinary');
      }
      
      // Add new image
      updateData.image = req.file.path;
      updateData.cloudinaryId = req.file.filename;
    }
    
    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: updatedHospital
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file?.path) {
      await deleteFromCloudinary(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating hospital',
      error: error.message
    });
  }
});

// DELETE - Delete hospital (soft delete by setting status to inactive)
router.delete('/hospitals/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    // Delete image from Cloudinary if exists
    if (hospital.image) {
      await deleteFromCloudinary(hospital.image);
      console.log('✅ Deleted hospital image from Cloudinary');
    }
    
    // Soft delete
    await Hospital.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive', updatedAt: Date.now() },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital',
      error: error.message
    });
  }
});

// DELETE - Hard delete hospital (permanently remove)
router.delete('/hospitals/:id/permanent', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    // Delete image from Cloudinary if exists
    if (hospital.image) {
      await deleteFromCloudinary(hospital.image);
      console.log('✅ Deleted hospital image from Cloudinary');
    }
    
    // Hard delete
    await Hospital.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Hospital permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital permanently',
      error: error.message
    });
  }
});

export default router;