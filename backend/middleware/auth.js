// ==================== FIXED: middleware/auth.js ====================
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect middleware to verify JWT and attach user to req
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ FIX: Use decoded.userId (not decoded.id)
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is blocked
      if (user.blocked) {
        return res.status(403).json({ message: "Your account has been blocked" });
      }

      req.user = user; // attach full user object to request
      return next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If no token at all
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Optional: restrict to roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};