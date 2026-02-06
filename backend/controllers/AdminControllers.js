// controllers/adminController.js
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";
import Donation from "../models/DonateModel.js";
import Event from "../models/Event.js";

// ------------------ Admin Controllers ------------------

// Get all non-admin users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["user", "staff"] } })
      .select("name email role blocked createdAt lastActiveAt")
      .sort({ createdAt: -1 });

    // Format the response with "time ago"
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      blocked: user.blocked || false,
      createdAt: user.createdAt,
      lastActive: user.lastActiveAt 
        ? getTimeAgo(user.lastActiveAt) 
        : "Never"
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get total non-admin users count
export const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: { $ne: "admin" } });
    res.json({ count });
  } catch (err) {
    console.error("❌ getUserCount error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Block user
export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { blocked: true },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User blocked successfully", user });
  } catch (err) {
    console.error("❌ blockUser error:", err);
    res.status(500).json({ message: "Failed to block user" });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { blocked: false },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User unblocked successfully", user });
  } catch (err) {
    console.error("❌ unblockUser error:", err);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Get staff join requests summary
export const getStaffJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ getStaffJoinRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get donations summary
export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error("❌ getDonations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active events
export const getActiveEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error("❌ getActiveEvents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function for "time ago"
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return "Just now";
}