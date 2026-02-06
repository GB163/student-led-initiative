import Event from "../models/Event.js";
import path from "path";
import { notifyEvent, notifyAdmins } from "../utils/notificationHelper.js"; // ✅ ADD notifyAdmins

// ✅ Create a new event (with image or video support)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, time, mediaType } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ message: "Title, description, and date are required" });
    }

    // Get uploaded file path (if any)
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : "";
    
    // Determine media type from file extension if not provided
    let finalMediaType = mediaType || '';
    if (req.file && !mediaType) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
      finalMediaType = videoExtensions.includes(ext) ? 'video' : 'image';
    }

    const newEvent = await Event.create({
      title,
      description,
      date,
      location: location || '',
      time: time || '',
      media: mediaPath,
      image: mediaPath, // Keep for backward compatibility
      mediaType: finalMediaType,
    });

    // 🔔 SEND NOTIFICATIONS
    try {
      const createdBy = req.user?.name || 'Admin'; // Get creator name from authenticated user
      
      // Notify all users about new event
      await notifyEvent.created(
        newEvent.title,
        newEvent._id,
        createdBy
      );
      
      // Also notify admins for tracking
      await notifyAdmins({
        title: 'New Event Published',
        message: `${createdBy} created event: "${newEvent.title}" scheduled for ${new Date(newEvent.date).toLocaleDateString()}`,
        type: 'admin',
        link: '/admin/events'
      });
      
      console.log('🔔 Event creation notifications sent successfully');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
      // Don't fail event creation if notification fails
    }

    // Emit the new event to all connected clients via Socket.io
    const io = req.app.get("io");
    if (io) io.emit("newEvent", newEvent);

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("❌ Error creating event:", err);
    
    // ✅ CRITICAL ERROR ALERT
    try {
      await notifyAdmins({
        title: '🚨 Error Creating Event',
        message: `Failed to create event: ${err.message}`,
        type: 'error',
        link: '/admin/events'
      });
    } catch (notifError) {
      console.error('⚠️ Error notification failed:', notifError.message);
    }
    
    res.status(500).json({ 
      message: "Failed to create event",
      error: err.message 
    });
  }
};

// ✅ Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// ✅ Get active/upcoming events (for dashboard)
export const getActiveEvents = async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
    
    // ✅ CHECK FOR EVENT MILESTONES
    const totalEvents = await Event.countDocuments();
    
    // Notify on milestone achievements (every 25 events)
    if (totalEvents % 25 === 0 && totalEvents > 0) {
      try {
        await notifyAdmins({
          title: `🎯 Event Milestone: ${totalEvents} Events!`,
          message: `Congratulations! We've organized ${totalEvents} total events!`,
          type: 'success',
          link: '/admin/events'
        });
      } catch (notifError) {
        console.error('⚠️ Milestone notification failed:', notifError.message);
      }
    }
    
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Error fetching active events:", err);
    res.status(500).json({ message: "Failed to fetch active events" });
  }
};

// ✅ Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, time, mediaType } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const oldTitle = event.title; // Store old title for notification

    // Get uploaded file path (if any)
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : event.media;
    
    // Determine media type
    let finalMediaType = mediaType || event.mediaType;
    if (req.file && !mediaType) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
      finalMediaType = videoExtensions.includes(ext) ? 'video' : 'image';
    }

    // Update event
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location !== undefined ? location : event.location;
    event.time = time !== undefined ? time : event.time;
    event.media = mediaPath;
    event.image = mediaPath;
    event.mediaType = finalMediaType;

    await event.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      const updatedBy = req.user?.name || 'Admin';
      
      // Notify all users about event update
      await notifyEvent.updated(
        event.title,
        event._id
      );
      
      // Notify admins about the update
      await notifyAdmins({
        title: 'Event Updated',
        message: `${updatedBy} updated event: "${oldTitle}"${oldTitle !== event.title ? ` → "${event.title}"` : ''}`,
        type: 'admin',
        link: '/admin/events'
      });
      
      console.log('🔔 Event update notifications sent successfully');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Emit update via Socket.io
    const io = req.app.get("io");
    if (io) io.emit("eventUpdated", event);

    res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (err) {
    console.error("❌ Error updating event:", err);
    res.status(500).json({ 
      message: "Failed to update event",
      error: err.message 
    });
  }
};

// ✅ Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventTitle = event.title; // Store for notification
    const eventDate = event.date;

    await Event.findByIdAndDelete(id);

    // 🔔 NOTIFY ADMINS ABOUT DELETION
    try {
      const deletedBy = req.user?.name || 'Admin';
      
      await notifyAdmins({
        title: 'Event Deleted',
        message: `${deletedBy} deleted event: "${eventTitle}" (scheduled for ${new Date(eventDate).toLocaleDateString()})`,
        type: 'warning',
        link: '/admin/events'
      });
      
      console.log('🔔 Event deletion notification sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Emit deletion via Socket.io
    const io = req.app.get("io");
    if (io) io.emit("eventDeleted", id);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ 
      message: "Failed to delete event",
      error: err.message 
    });
  }
};

export default {
  createEvent,
  getEvents,
  getActiveEvents,
  updateEvent,
  deleteEvent,
};