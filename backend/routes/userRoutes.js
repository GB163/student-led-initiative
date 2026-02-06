// routes/userRoutes.js
import express from "express";
import User from "../models/User.js";
import {
  checkBlockedUser,
  getAllUsers,
  deleteUser,
  deleteUserCompletely,
  toggleBlockUser,
  getUserCount,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ✅ DEBUG ROUTE - Check if user exists (TEMPORARY - Remove after debugging)
router.get("/debug/check-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('🔍 Checking if user exists:', userId);
    
    const user = await User.findById(userId).select('-password -resetToken');
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('❌ User NOT found in database');
    }
    
    res.json({
      exists: !!user,
      userId: userId,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        blocked: user.blocked,
        createdAt: user.createdAt
      } : null,
      message: user ? 'User exists in database' : 'User does NOT exist in database'
    });
  } catch (error) {
    console.error('❌ Error checking user:', error);
    res.status(500).json({ 
      error: error.message,
      userId: req.params.id,
      exists: false
    });
  }
});

// ✅ Get all users (Admin only)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ✅ Admin routes
router.get("/", protect, authorizeRoles("admin"), getAllUsers);
router.get("/count", protect, authorizeRoles("admin"), getUserCount);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);
router.delete("/complete/:id", protect, authorizeRoles("admin"), deleteUserCompletely);
router.patch("/block/:id", protect, authorizeRoles("admin"), toggleBlockUser);

export default router;