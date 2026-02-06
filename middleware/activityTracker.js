// middleware/activityTracker.js
import User from "../models/User.js";

/**
 * Middleware to track user activity on every API request
 * Updates the user's lastActiveAt field in the database
 * 
 * This middleware runs on every API call, so we don't wait for the database
 * update to complete - we just fire it and move on to avoid slowing down requests
 */
export const trackUserActivity = async (req, res, next) => {
  try {
    // Check if user is authenticated and has an ID
    // req.user is set by your auth middleware (JWT verification)
    if (req.user && req.user.id) {
      // Update lastActiveAt without waiting for response
      // Using .exec() makes it non-blocking - won't slow down the request
      User.findByIdAndUpdate(
        req.user.id,
        { lastActiveAt: new Date() },
        { new: false } // We don't need the updated document back
      ).exec();
      
      // Optional: Log activity for debugging (remove in production)
      // console.log(`📊 Activity tracked for user: ${req.user.id}`);
    }
    
    // Continue to the next middleware/route handler
    next();
  } catch (err) {
    // If tracking fails, don't block the request
    // Just log the error and continue
    console.error("❌ Activity tracking error:", err.message);
    next();
  }
};

/**
 * Optional: Middleware to track only specific routes
 * Use this if you don't want to track ALL API requests
 */
export const trackSpecificActivity = (routeType) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        await User.findByIdAndUpdate(
          req.user.id,
          { 
            lastActiveAt: new Date(),
            lastActivity: routeType // Optional: track what they did
          }
        ).exec();
      }
      next();
    } catch (err) {
      console.error("❌ Activity tracking error:", err.message);
      next();
    }
  };
};

/**
 * Optional: Function to manually track activity from anywhere in your code
 * Useful for socket events or other non-HTTP actions
 */
export const trackManualActivity = async (userId) => {
  try {
    if (!userId) return;
    
    await User.findByIdAndUpdate(
      userId,
      { lastActiveAt: new Date() }
    ).exec();
    
    return true;
  } catch (err) {
    console.error("❌ Manual activity tracking error:", err.message);
    return false;
  }
};

// Export all functions
export default {
  trackUserActivity,
  trackSpecificActivity,
  trackManualActivity
};