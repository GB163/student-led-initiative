import express from "express";
import About from "../models/About.js";
import Update from "../models/Update.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Donation from "../models/DonateModel.js";
import multer from "multer";
import { notifyAllUsers, notifyAdmins } from "../utils/notificationHelper.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { deleteFromCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// ================= Cloudinary Storage for Updates =================
const updateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    
    return {
      folder: 'updates',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm', 'mkv'],
      resource_type: isVideo ? 'video' : 'image',
      public_id: `update-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      // Add transformation for images only
      transformation: !isVideo ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }] : undefined
    };
  },
});

// Multer configuration with Cloudinary
const upload = multer({
  storage: updateStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit (for videos)
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes = /mp4|webm|quicktime|x-msvideo|mov|avi|mkv/;
    
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimetype = file.mimetype;
    
    const isImage = allowedImageTypes.test(ext) && mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(ext) && mimetype.startsWith('video/');

    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"));
    }
  },
});

// Helper function to detect media type
const getMediaType = (mimeType) => {
  if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return null;
};

// ============ ABOUT CONTENT ROUTES ============

// GET about content
router.get("/about", async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = await About.create({
        content:
          "We are dedicated to providing comprehensive medical support and care to underprivileged children and families.",
      });
    }
    res.json(about);
  } catch (error) {
    console.error("Error fetching about content:", error);
    res.status(500).json({ error: "Failed to fetch about content" });
  }
});

// PUT/UPDATE about content (Admin only)
router.put("/about", async (req, res) => {
  try {
    const { content, adminName } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    let about = await About.findOne();

    if (about) {
      about.content = content;
      about.updatedAt = Date.now();
      await about.save();
    } else {
      about = await About.create({ content });
    }

    // Notify all users about the updated About page
    await notifyAllUsers({
      title: 'About Page Updated 📝',
      message: 'We have updated our About page. Check out what\'s new!',
      type: 'info',
      link: '/about'
    });

    res.json(about);
  } catch (error) {
    console.error("Error updating about content:", error);
    res.status(500).json({ error: "Failed to update about content" });
  }
});

// ============ STATS ROUTE ============

// GET statistics for About page
router.get("/about/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalDonations = await Donation.countDocuments();

    // Check for milestone achievements and notify admins
    if (totalUsers % 100 === 0 && totalUsers > 0) {
      await notifyAdmins({
        title: '🎉 User Milestone Reached!',
        message: `We've reached ${totalUsers} total users!`,
        type: 'success',
        link: '/admin/users'
      });
    }

    if (totalDonations % 50 === 0 && totalDonations > 0) {
      await notifyAdmins({
        title: '💰 Donation Milestone!',
        message: `We've received ${totalDonations} total donations!`,
        type: 'success',
        link: '/admin/donations'
      });
    }

    res.json({
      totalUsers,
      totalEvents,
      totalDonations,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ============ UPDATES ROUTES ============

// GET all updates
router.get("/about/updates", async (req, res) => {
  try {
    const updates = await Update.find().sort({ createdAt: -1 }).limit(50);
    res.json(updates);
  } catch (error) {
    console.error("Error fetching updates:", error);
    res.status(500).json({ error: "Failed to fetch updates" });
  }
});

// POST new update (handles both image and video)
router.post("/updates", upload.single("media"), async (req, res) => {
  try {
    const { message, postedBy } = req.body;

    if (!message) {
      // Delete uploaded file from Cloudinary if validation fails
      if (req.file?.path) {
        await deleteFromCloudinary(req.file.path);
      }
      return res.status(400).json({ error: "Message is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File (image or video) is required" });
    }

    // Get Cloudinary URL
    const filePath = req.file.path;
    const cloudinaryId = req.file.filename;
    const mediaType = getMediaType(req.file.mimetype);

    if (!mediaType) {
      // Delete uploaded file from Cloudinary if invalid type
      await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ error: "Invalid file type" });
    }

    const newUpdate = await Update.create({
      message,
      image: filePath, // Cloudinary URL
      cloudinaryId: cloudinaryId, // Store for deletion later
      mediaType,
    });

    console.log('✅ Update created with Cloudinary media:', cloudinaryId);

    // Notify all users about the new update
    const updatePreview = message.length > 60 
      ? message.substring(0, 60) + '...' 
      : message;

    await notifyAllUsers({
      title: 'New Update Posted! 🎉',
      message: `Check out our latest update: ${updatePreview}`,
      type: 'info',
      link: '/about'
    });

    // Also notify other admins about the new update
    if (postedBy) {
      await notifyAdmins({
        title: 'New Update Published',
        message: `${postedBy} just published a new ${mediaType} update.`,
        type: 'admin',
        link: '/about'
      });
    }

    res.status(201).json(newUpdate);
  } catch (error) {
    console.error("Error creating update:", error);
    
    // Delete uploaded file from Cloudinary on error
    if (req.file?.path) {
      await deleteFromCloudinary(req.file.path);
      console.log('🗑️ Cleaned up Cloudinary file due to error');
    }
    
    // Notify admins about critical errors
    await notifyAdmins({
      title: '⚠️ Error Creating Update',
      message: `Failed to create update: ${error.message}`,
      type: 'error',
      link: '/admin-dashboard'
    });
    
    res.status(500).json({ error: "Failed to create update" });
  }
});

// DELETE update by ID
router.delete("/updates/:id", async (req, res) => {
  try {
    const update = await Update.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ error: "Update not found" });
    }

    // Delete file from Cloudinary
    if (update.image) {
      await deleteFromCloudinary(update.image);
      console.log('✅ Deleted media from Cloudinary');
    }

    await Update.findByIdAndDelete(req.params.id);
    
    // Notify admins about deletion
    await notifyAdmins({
      title: 'Update Deleted',
      message: `An update was deleted from the About page.`,
      type: 'admin',
      link: '/admin/about'
    });
    
    res.json({ message: "Update deleted successfully" });
  } catch (error) {
    console.error("Error deleting update:", error);
    res.status(500).json({ error: "Failed to delete update" });
  }
});

export default router;