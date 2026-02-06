// utils/notificationHelper.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a notification for a specific user
 */
export const createNotification = async ({
  userId,
  userRole,
  title,
  message,
  type,
  link = null
}) => {
  try {
    const notification = new Notification({
      userId,
      userRole,
      title,
      message,
      type,
      link,
      read: false
    });

    await notification.save();
    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (notifications) => {
  try {
    const notifs = await Notification.insertMany(notifications);
    console.log(`✅ ${notifs.length} notifications created`);
    return notifs;
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Notify all users with a specific role
 */
export const notifyUsersByRole = async ({
  role,
  title,
  message,
  type,
  link = null
}) => {
  try {
    const users = await User.find({ role });
    
    const notifications = users.map(user => ({
      userId: user._id,
      userRole: user.role,
      title,
      message,
      type,
      link,
      read: false
    }));

    await createBulkNotifications(notifications);
    console.log(`✅ Notified ${users.length} ${role}s: ${title}`);
  } catch (error) {
    console.error('❌ Error notifying users by role:', error);
    throw error;
  }
};

/**
 * Notify all admins
 */
export const notifyAdmins = async ({ title, message, type, link = null }) => {
  return notifyUsersByRole({ role: 'admin', title, message, type, link });
};

/**
 * Notify all staff
 */
export const notifyStaff = async ({ title, message, type, link = null }) => {
  return notifyUsersByRole({ role: 'staff', title, message, type, link });
};

/**
 * Notify all regular users
 */
export const notifyAllUsers = async ({ title, message, type, link = null }) => {
  return notifyUsersByRole({ role: 'user', title, message, type, link });
};

// ============================================
// MEDICAL SUPPORT NOTIFICATIONS
// ============================================

export const notifyMedicalApplication = {
  // User applies for medical support
  applied: async (userId, userName, applicationId) => {
    // Notify the user
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Medical Support Application Submitted',
      message: 'Your medical support application has been submitted successfully. Our staff will verify it soon.',
      type: 'application',
      link: `/status/${applicationId}`
    });

    // Notify all staff members
    await notifyStaff({
      title: 'New Medical Application',
      message: `${userName} has submitted a new medical support application for verification.`,
      type: 'application',
      link: '/staff/verification'
    });
  },

  // Staff verifies application
  verified: async (userId, userName, applicationId, verifiedBy) => {
    // Notify the user
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Application Verified',
      message: 'Your medical support application has been verified by our staff. It will now be reviewed by admin.',
      type: 'success',
      link: `/status/${applicationId}`
    });

    // Notify all admins
    await notifyAdmins({
      title: 'Medical Application Ready for Review',
      message: `${userName}'s medical application has been verified by ${verifiedBy} and is ready for final approval.`,
      type: 'application',
      link: '/admin/medical-requests'
    });
  },

  // Admin approves application
  approved: async (userId, userName, applicationId) => {
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Medical Support Approved! 🎉',
      message: 'Congratulations! Your medical support application has been approved. We will contact you soon with next steps.',
      type: 'success',
      link: `/status/${applicationId}`
    });
  },

  // Admin rejects application
  rejected: async (userId, userName, applicationId, reason) => {
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Medical Support Application Status',
      message: `Your application has been reviewed. Reason: ${reason}. Please contact us if you have questions.`,
      type: 'warning',
      link: `/status/${applicationId}`
    });
  },

  // Support completed
  completed: async (userId, applicationId) => {
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Medical Support Completed',
      message: 'Your medical support has been successfully completed. Thank you for trusting us.',
      type: 'success',
      link: `/status/${applicationId}`
    });
  }
};

// ============================================
// JOIN US / VOLUNTEER NOTIFICATIONS
// ============================================

export const notifyJoinRequest = {
  // User applies to join as volunteer
  applied: async (userId, userName, requestId) => {
    // Notify the user
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Join Request Submitted',
      message: 'Your volunteer application has been submitted. Admin will review it soon.',
      type: 'application',
      link: '/joinus'
    });

    // Notify all admins
    await notifyAdmins({
      title: 'New Volunteer Application',
      message: `${userName} has applied to join as a volunteer.`,
      type: 'application',
      link: '/admin/join-requests'
    });
  },

  // Admin approves join request
  approved: async (userId, userName, newRole) => {
    await createNotification({
      userId,
      userRole: newRole, // Now they're staff
      title: 'Welcome to the Team! 🎉',
      message: `Congratulations! You've been accepted as ${newRole}. You now have access to the ${newRole} panel.`,
      type: 'success',
      link: newRole === 'staff' ? '/staff/dashboard' : '/admin-dashboard'
    });
  },

  // Admin rejects join request
  rejected: async (userId, userName, reason) => {
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Join Request Update',
      message: `Your volunteer application has been reviewed. ${reason ? 'Reason: ' + reason : 'Please try again later.'}`,
      type: 'warning',
      link: '/joinus'
    });
  }
};

// ============================================
// EVENT NOTIFICATIONS
// ============================================

export const notifyEvent = {
  // New event created
  created: async (eventTitle, eventId, createdBy) => {
    // Notify all users
    await notifyAllUsers({
      title: 'New Event Added! 🎉',
      message: `Check out our new event: ${eventTitle}`,
      type: 'event',
      link: '/events'
    });
  },

  // Event updated
  updated: async (eventTitle, eventId) => {
    // Notify all users
    await notifyAllUsers({
      title: 'Event Updated',
      message: `The event "${eventTitle}" has been updated. Check out the latest details.`,
      type: 'event',
      link: '/events'
    });
  },

  // Event reminder (1 day before)
  reminder: async (eventTitle, eventDate) => {
    await notifyAllUsers({
      title: 'Event Reminder 📅',
      message: `Don't forget! "${eventTitle}" is happening tomorrow on ${eventDate}.`,
      type: 'event',
      link: '/events'
    });
  }
};

// ============================================
// DONATION NOTIFICATIONS
// ============================================

export const notifyDonation = {
  // User makes a donation
  received: async (userId, userName, amount, donationId) => {
    // Notify the donor
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Thank You for Your Donation! ❤️',
      message: `Your generous donation of ₹${amount} has been received. Your support means the world to us!`,
      type: 'donation',
      link: '/home'
    });

    // Notify all admins
    await notifyAdmins({
      title: 'New Donation Received',
      message: `${userName} donated ₹${amount}. Total donations increased!`,
      type: 'donation',
      link: '/admin/donations'
    });
  }
};

// ============================================
// STORY NOTIFICATIONS
// ============================================

export const notifyStory = {
  // New story posted
  posted: async (storyTitle, storyId) => {
    await notifyAllUsers({
      title: 'New Story Posted! 📖',
      message: `Read our latest story: ${storyTitle}`,
      type: 'info',
      link: '/story'
    });
  }
};

// ============================================
// CONTACT / SUPPORT NOTIFICATIONS
// ============================================

export const notifyContact = {
  // User sends contact message
  submitted: async (userId, userName, userEmail) => {
    // Notify user
    await createNotification({
      userId,
      userRole: 'user',
      title: 'Message Received',
      message: 'Thank you for contacting us. Our team will respond to you soon.',
      type: 'info',
      link: '/contact'
    });

    // Notify all staff
    await notifyStaff({
      title: 'New Contact Message',
      message: `${userName} (${userEmail}) has sent a new message.`,
      type: 'info',
      link: '/staff/contact'
    });
  },

  // Staff replies to contact
  replied: async (userId, userName) => {
    await createNotification({
      userId,
      userRole: 'user',
      title: 'We Replied to Your Message',
      message: 'Our team has responded to your message. Check your email or contact page.',
      type: 'success',
      link: '/contact'
    });
  }
};

// ============================================
// ADMIN / SYSTEM NOTIFICATIONS
// ============================================

export const notifySystem = {
  // New user registered
  newUser: async (userName, userEmail, userId) => {
    await notifyAdmins({
      title: 'New User Registered',
      message: `${userName} (${userEmail}) has created an account.`,
      type: 'admin',
      link: '/admin/users'
    });
  },

  // Critical system alert
  alert: async (alertTitle, alertMessage) => {
    await notifyAdmins({
      title: alertTitle,
      message: alertMessage,
      type: 'error',
      link: '/admin-dashboard'
    });
  }
};

// ============================================
// EXAMPLE USAGE IN YOUR ROUTES
// ============================================

/*
// In your medical support route
import { notifyMedicalApplication } from '../utils/notificationHelper.js';

router.post('/apply', protect, async (req, res) => {
  // ... create application ...
  
  await notifyMedicalApplication.applied(
    req.user._id, 
    req.user.name, 
    newApplication._id
  );
  
  res.json({ message: 'Application submitted' });
});

// In your join us route
import { notifyJoinRequest } from '../utils/notificationHelper.js';

router.post('/join', protect, async (req, res) => {
  // ... create join request ...
  
  await notifyJoinRequest.applied(
    req.user._id,
    req.user.name,
    newRequest._id
  );
  
  res.json({ message: 'Request submitted' });
});

// In your event route
import { notifyEvent } from '../utils/notificationHelper.js';

router.post('/events', protect, async (req, res) => {
  // ... create event ...
  
  await notifyEvent.created(
    newEvent.title,
    newEvent._id,
    req.user.name
  );
  
  res.json({ message: 'Event created' });
});

// In your donation route
import { notifyDonation } from '../utils/notificationHelper.js';

router.post('/donate', protect, async (req, res) => {
  // ... process donation ...
  
  await notifyDonation.received(
    req.user._id,
    req.user.name,
    req.body.amount,
    newDonation._id
  );
  
  res.json({ message: 'Donation successful' });
});
*/

export default {
  createNotification,
  createBulkNotifications,
  notifyUsersByRole,
  notifyAdmins,
  notifyStaff,
  notifyAllUsers,
  notifyMedicalApplication,
  notifyJoinRequest,
  notifyEvent,
  notifyDonation,
  notifyStory,
  notifyContact,
  notifySystem
};