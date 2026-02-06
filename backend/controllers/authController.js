import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs"; // ✅ Changed from bcrypt to bcryptjs

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password with bcryptjs (10 rounds - matching authRoutes.js)
    const hashedPassword = await bcryptjs.hash(password, 10);

    // ✅ Create user with hashed password
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || "user" 
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    // ✅ Return user with all required fields
    res.status(201).json({ 
      message: "User registered successfully",
      token, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || null,
        profilePicUpdatedAt: user.profilePicUpdatedAt || null,
        updatedAt: user.updatedAt
      }
    });
    
    console.log('✅ User signup successful:', user.email);
    
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

// Signin
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({ message: "This account has been blocked. Please contact support." });
    }

    // ✅ Compare password using bcryptjs
    const match = await bcryptjs.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    // ✅ Return user with all required fields
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
};

// Protect middleware - Verify JWT and attach user to request
export const protect = async (req, res, next) => {
  let token;
  
  // Extract token from Authorization header
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "Not logged in. Please provide a valid token." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID from token
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    
    // ✅ Check if user is blocked
    if (currentUser.blocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked. Please contact support." 
      });
    }
    
    // Attach user to request object
    req.user = currentUser;
    next();
    
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Restrict access to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "You do not have permission to perform this action." 
      });
    }
    next();
  };
};

// ✅ Additional helper function - Get current user
export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePic: req.user.profilePic,
        profilePicUpdatedAt: req.user.profilePicUpdatedAt,
        blocked: req.user.blocked || false,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user data" 
    });
  }
};

export default {
  signup,
  signin,
  protect,
  restrictTo,
  getCurrentUser
};