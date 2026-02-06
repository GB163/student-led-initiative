import express from "express";
import bcryptjs from "bcryptjs"; // ✅ Using bcryptjs consistently
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import { notifySystem } from "../utils/notificationHelper.js";
import { forgotPassword, resetPassword } from "../controllers/resetPassword.js";

const router = express.Router();

// ---------------- Sign Up ----------------
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password with bcryptjs (10 rounds)
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // ✅ Create user with hashed password
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword, // Already hashed - model won't hash again
      role: role || "user",
    });

    // ✅ Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔔 Send notification to admins
    try {
      await notifySystem.newUser(
        newUser.name,
        newUser.email,
        newUser._id
      );
      console.log('🔔 New user registration notification sent to admins');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
      // Don't fail the registration if notification fails
    }

    // ✅ Return success response with status 201
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePic: newUser.profilePic || null,
        profilePicUpdatedAt: newUser.profilePicUpdatedAt || null,
        updatedAt: newUser.updatedAt
      }
    });
    
    console.log('✅ User signup successful:', newUser.email);
    
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

// ---------------- Sign In ----------------
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({ message: "This account has been blocked." });
    }

    // ✅ Compare password using bcryptjs
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Return success response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || null,
        profilePicUpdatedAt: user.profilePicUpdatedAt || null,
        updatedAt: user.updatedAt,
        blocked: user.blocked || false
      }
    });
    
    console.log('✅ User signin successful:', user.email);
    
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

// ============ ✅ NEW: Validate Token Endpoint ============
router.get("/validate-token", protect, async (req, res) => {
  try {
    console.log('🔐 Token validation successful for user:', req.user._id);
    
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        address: req.user.address || '',
        profilePic: req.user.profilePic || '',
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('❌ Token validation error:', error);
    res.status(401).json({
      success: false,
      message: 'Token validation failed',
    });
  }
});

// ---------------- Password Reset Routes ----------------
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ---------------- Current User (/me) ----------------
router.get("/me", protect, async (req, res) => {
  try {
    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePic: req.user.profilePic,
      profilePicUpdatedAt: req.user.profilePicUpdatedAt,
    });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// ---------------- Example Admin Only Route ----------------
router.get(
  "/admin-only",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({ message: "You are an admin!", user: req.user });
  }
);

export default router;