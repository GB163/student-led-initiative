import express from "express";
import multer from "multer";
import { createEvent, getEvents, getActiveEvents } from "../controllers/eventController.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ================= Cloudinary Storage for Events =================
const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    
    return {
      folder: 'events',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm', 'mkv'],
      resource_type: isVideo ? 'video' : 'image',
      public_id: `event-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      // Add transformation for images only
      transformation: !isVideo 
        ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }] 
        : undefined,
      // Optional: Add tags for organization
      tags: ['event', req.body?.title || 'untitled']
    };
  },
});

// Configure multer with Cloudinary storage
const upload = multer({ 
  storage: eventStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mkv/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimetype = file.mimetype;
    
    const isImage = /jpeg|jpg|png|gif/.test(ext) && mimetype.startsWith('image/');
    const isVideo = /mp4|mov|avi|webm|mkv/.test(ext) && mimetype.startsWith('video/');

    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'));
    }
  }
});

// Create new event (with image or video)
router.post("/", upload.single("media"), createEvent);

// Get all events
router.get("/", getEvents);

// Get active/upcoming events
router.get("/active", getActiveEvents);

export default router;