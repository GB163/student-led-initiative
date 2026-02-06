// routes/notificationRoutes.js
import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// =====================================================
// GET /api/notifications - Get all notifications for logged-in user
// =====================================================
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;      // From your auth middleware
    const userRole = req.user.role;   // From your auth middleware

    // Fetch user's notifications, newest first
    const notifications = await Notification.find({ 
      userId: userId,
      userRole: userRole 
    })
    .sort({ createdAt: -1 })  // Newest first
    .limit(50);  // Limit to last 50

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      userId: userId,
      read: false 
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications', 
      error: error.message 
    });
  }
});

// =====================================================
// PATCH /api/notifications/:id/read - Mark single notification as read
// =====================================================
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user._id  // Security: ensure user owns this notification
      },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }  // Return updated document
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark as read', 
      error: error.message 
    });
  }
});

// =====================================================
// PATCH /api/notifications/read-all - Mark all notifications as read
// =====================================================
router.patch('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        userId: req.user._id,
        read: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark all as read', 
      error: error.message 
    });
  }
});

// =====================================================
// DELETE /api/notifications/:id - Delete a notification
// =====================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id  // Security: ensure user owns this notification
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification', 
      error: error.message 
    });
  }
});

// =====================================================
// POST /api/notifications/create - Create a notification (for internal use)
// =====================================================
router.post('/create', protect, async (req, res) => {
  try {
    const { userId, userRole, title, message, type, link } = req.body;

    // Security: Only admins can create notifications for others
    if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Unauthorized to create notifications for others' 
      });
    }

    const notification = new Notification({
      userId: userId || req.user._id,
      userRole: userRole || req.user.role,
      title,
      message,
      type: type || 'info',
      link
    });

    await notification.save();
    
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      message: 'Failed to create notification', 
      error: error.message 
    });
  }
});

export default router;